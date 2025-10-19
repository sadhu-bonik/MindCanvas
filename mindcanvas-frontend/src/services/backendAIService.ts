import type { AIService, BackendBlock } from './api';
import { APIError, NetworkError, TimeoutError } from './api';

export class BackendAIService implements AIService {
  private baseUrl: string;
  private userId: string;
  private timeout: number;
  private retries: number;

  constructor(
    baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:8000',
    userId: string = import.meta.env.VITE_USER_ID || 'frontend_user'
  ) {
    this.baseUrl = baseUrl;
    this.userId = userId;
    this.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');
    this.retries = parseInt(import.meta.env.VITE_API_RETRIES || '3');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.userId,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof APIError) {
        throw error;
      }

      if ((error as any)?.name === 'AbortError') {
        if (retryCount < this.retries) {
          console.warn(`Request timeout, retrying... (${retryCount + 1}/${this.retries})`);
          return this.request(endpoint, options, retryCount + 1);
        }
        throw new TimeoutError(`Request timed out after ${this.timeout}ms`);
      }

      if (retryCount < this.retries && this.isRetryableError(error)) {
        console.warn(`Network error, retrying... (${retryCount + 1}/${this.retries})`);
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        return this.request(endpoint, options, retryCount + 1);
      }

      throw new NetworkError(`Network request failed: ${(error as any)?.message || 'Unknown error'}`);
    }
  }

  private isRetryableError(error: any): boolean {
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.name === 'TypeError' // Often indicates network issues
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Map operations
  async createMap(message: string): Promise<{ mapId: string; title: string }> {
    console.log('🗺️ Creating new map with message:', message);
    
    const response = await this.request<{ mapId: string; title: string }>('/api/map/create', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });

    return response;
  }

  async getUserMaps(): Promise<{ maps: Array<{ mapId: string; title: string; createdAt: string }> }> {
    console.log('📋 Loading user maps');
    
    const response = await this.request<{ maps: Array<{ mapId: string; title: string; createdAt: string }> }>('/api/user/maps');
    return response;
  }

  async getMap(mapId: string): Promise<{ mapId: string; title: string; blocks: BackendBlock[] }> {
    console.log('🗺️ Loading map:', mapId);
    
    const response = await this.request<{ mapId: string; title: string; blocks: BackendBlock[] }>(`/api/map/${mapId}`);
    return response;
  }

  // Block operations
  async createBlock(
    mapId: string, 
    message: string, 
    parentBlockId?: string, 
    highlightedText?: string
  ): Promise<{ blockId: string; title: string; response: string }> {
    console.log('🧱 Creating new block:', { mapId, message, parentBlockId, highlightedText });
    
    const response = await this.request<{ blockId: string; title: string; response: string }>('/api/block/create', {
      method: 'POST',
      body: JSON.stringify({
        mapId,
        message,
        parentBlockId,
        highlightedText,
      }),
    });

    return response;
  }

  async sendMessage(blockId: string, message: string): Promise<{ response: string }> {
    console.log('💬 Sending message to block:', blockId, message);
    
    const response = await this.request<{ response: string }>(`/api/block/${blockId}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });

    return response;
  }

  async finalizeBlock(blockId: string): Promise<{ summary: string; reformattedContent: string }> {
    console.log('✅ Finalizing block:', blockId);
    
    const response = await this.request<{ summary: string; reformattedContent: string }>(`/api/block/${blockId}/finalize`, {
      method: 'POST',
    });

    return response;
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/api/user/maps');
      return true;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const backendAIService = new BackendAIService();