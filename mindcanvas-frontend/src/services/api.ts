// Base AI service interface
export interface AIService {
  // Backend methods (optional for backward compatibility)
  createMap?(message: string): Promise<{ mapId: string; title: string }>;
  getUserMaps?(): Promise<{ maps: Array<{ mapId: string; title: string; createdAt: string }> }>;
  getMap?(mapId: string): Promise<{ mapId: string; title: string; blocks: BackendBlock[] }>;
  createBlock?(mapId: string, message: string, parentBlockId?: string, highlightedText?: string): Promise<{ blockId: string; title: string; response: string }>;
  finalizeBlock?(blockId: string): Promise<{ summary: string; reformattedContent: string }>;
  
  // Unified sendMessage method that works for both backend and mock
  sendMessage(idOrConversationId: string, message: string): Promise<string | { response: string }>;
  
  // Legacy method for mock service
  generateNotes?(conversationId: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string>;
}

// Backend data types
export interface BackendMap {
  mapId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  blocks: BackendBlock[];
}

export interface BackendBlock {
  blockId: string;
  title: string;
  parentBlockId?: string;
  isFinalized: boolean;
  summary?: string;
  reformattedContent?: string;
  createdAt: string;
  updatedAt: string;
  messages?: BackendMessage[];
}

export interface BackendMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Configuration for API endpoints
export interface APIConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

// Default configuration
export const defaultAPIConfig: APIConfig = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 30000, // 30 seconds
  retries: 3,
};

// API response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ConversationResponse {
  message: string;
  conversationId: string;
}

export interface NotesResponse {
  markdown: string;
  conversationId: string;
}

// Error types for API handling
export class APIError extends Error {
  public statusCode?: number;
  public response?: any;
  
  constructor(
    message: string,
    statusCode?: number,
    response?: any
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}