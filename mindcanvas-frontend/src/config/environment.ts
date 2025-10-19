// Environment configuration for the application
export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    retries: parseInt(import.meta.env.VITE_API_RETRIES || '3'),
  },
  
  // Authentication Configuration
  auth: {
    userId: import.meta.env.VITE_USER_ID || 'frontend_user',
  },
  
  // AI Service Configuration
  ai: {
    useMockService: import.meta.env.VITE_USE_MOCK_AI === 'true' || 
                   (import.meta.env.MODE === 'development' && 
                    import.meta.env.VITE_USE_MOCK_AI !== 'false'),
    mockDelayMin: parseInt(import.meta.env.VITE_MOCK_DELAY_MIN || '1000'),
    mockDelayMax: parseInt(import.meta.env.VITE_MOCK_DELAY_MAX || '3000'),
    mockErrorRate: parseFloat(import.meta.env.VITE_MOCK_ERROR_RATE || '0.05'),
  },
  
  // Backend Integration
  backend: {
    enableSync: import.meta.env.VITE_ENABLE_BACKEND_SYNC === 'true',
    syncInterval: parseInt(import.meta.env.VITE_SYNC_INTERVAL || '30000'),
    healthCheckInterval: parseInt(import.meta.env.VITE_HEALTH_CHECK_INTERVAL || '30000'),
  },
  
  // Development Configuration
  development: {
    enableDebugLogs: import.meta.env.MODE === 'development',
    showServiceStatus: import.meta.env.VITE_SHOW_SERVICE_STATUS === 'true',
  },
  
  // Feature Flags
  features: {
    enableAIServiceDemo: import.meta.env.VITE_ENABLE_AI_DEMO === 'true' || 
                        import.meta.env.MODE === 'development',
    enableBackendIntegration: import.meta.env.VITE_ENABLE_BACKEND === 'true' ||
                             import.meta.env.MODE === 'development',
  }
};

// Helper functions for environment checks
export const isDevelopment = () => import.meta.env.MODE === 'development';
export const isProduction = () => import.meta.env.MODE === 'production';
export const shouldUseMockAI = () => config.ai.useMockService;
export const shouldShowServiceStatus = () => config.development.showServiceStatus;