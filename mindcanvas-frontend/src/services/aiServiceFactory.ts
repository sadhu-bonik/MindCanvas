import type { AIService } from './api';
import { mockAIService } from './mockAIService';
import { backendAIService } from './backendAIService';
import { config } from '../config/environment';



// Service factory configuration
interface ServiceConfig {
  useMockService: boolean;
  apiUrl?: string;
}

class AIServiceFactory {
  private static instance: AIServiceFactory;
  private config: ServiceConfig;
  private aiService: AIService | null = null;
  private backendAvailable: boolean | null = null;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  private constructor() {
    // Use environment configuration
    this.config = {
      useMockService: config.ai.useMockService,
      apiUrl: config.api.baseUrl,
    };
  }

  static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    return AIServiceFactory.instance;
  }

  configure(config: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...config };
    // Reset service instance to force recreation with new config
    this.aiService = null;
    this.backendAvailable = null;
  }

  private async checkBackendHealth(): Promise<boolean> {
    const now = Date.now();
    
    // Use cached result if recent
    if (this.backendAvailable !== null && (now - this.lastHealthCheck) < this.healthCheckInterval) {
      return this.backendAvailable;
    }

    try {
      const healthCheck = await backendAIService.healthCheck();
      this.backendAvailable = healthCheck;
      this.lastHealthCheck = now;
      return healthCheck;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      this.backendAvailable = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  async getAIService(): Promise<AIService> {
    if (!this.aiService) {
      if (this.config.useMockService) {
        console.log('🤖 Using Mock AI Service (configured)');
        this.aiService = mockAIService;
      } else {
        // Check if backend is available
        const backendHealthy = await this.checkBackendHealth();
        
        if (backendHealthy) {
          console.log('🌐 Using Backend AI Service');
          this.aiService = backendAIService;
        } else {
          console.warn('⚠️ Backend unavailable, falling back to Mock AI Service');
          this.aiService = mockAIService;
        }
      }
    }
    return this.aiService;
  }

  // Synchronous version for backward compatibility
  getAIServiceSync(): AIService {
    if (this.config.useMockService || this.backendAvailable === false) {
      return mockAIService;
    }
    return backendAIService;
  }

  async isMockService(): Promise<boolean> {
    const service = await this.getAIService();
    return service === mockAIService;
  }

  isBackendAvailable(): boolean | null {
    return this.backendAvailable;
  }

  switchToMockService(): void {
    this.configure({ useMockService: true });
  }

  switchToBackendService(apiUrl?: string): void {
    this.configure({ 
      useMockService: false,
      ...(apiUrl && { apiUrl })
    });
  }

  // Force refresh backend availability
  async refreshBackendStatus(): Promise<boolean> {
    this.backendAvailable = null;
    this.lastHealthCheck = 0;
    return this.checkBackendHealth();
  }
}

// Export singleton instance and convenience functions
export const aiServiceFactory = AIServiceFactory.getInstance();
export const getAIService = () => aiServiceFactory.getAIService();
export const getAIServiceSync = () => aiServiceFactory.getAIServiceSync();

// Development helper functions
export const useMockAI = () => aiServiceFactory.switchToMockService();
export const useBackendAI = (apiUrl?: string) => aiServiceFactory.switchToBackendService(apiUrl);
export const isMockAI = () => aiServiceFactory.isMockService();
export const isBackendAvailable = () => aiServiceFactory.isBackendAvailable();
export const refreshBackendStatus = () => aiServiceFactory.refreshBackendStatus();