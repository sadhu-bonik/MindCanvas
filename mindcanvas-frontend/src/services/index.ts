// Export all service-related types and functions
export type { 
  AIService, 
  APIConfig, 
  APIResponse, 
  ConversationResponse, 
  NotesResponse,
  BackendMap,
  BackendBlock,
  BackendMessage
} from './api';

export { 
  defaultAPIConfig, 
  APIError, 
  NetworkError, 
  TimeoutError 
} from './api';

export { MockAIService, mockAIService } from './mockAIService';
export { BackendAIService, backendAIService } from './backendAIService';
export { DataSyncService, dataSyncService } from './dataSyncService';

export { 
  aiServiceFactory, 
  getAIService,
  getAIServiceSync,
  useMockAI, 
  useBackendAI, 
  isMockAI,
  isBackendAvailable,
  refreshBackendStatus
} from './aiServiceFactory';