# AI Services

This directory contains the AI service implementation for MindCanvas, including both mock and real API service interfaces.

## Overview

The AI service architecture is designed to support frontend independence during development while providing a clear interface for future backend integration.

## Components

### 1. API Interface (`api.ts`)
- Defines the `AIService` interface that both mock and real services implement
- Contains type definitions for API responses and error handling
- Provides configuration options for API endpoints and timeouts

### 2. Mock AI Service (`mockAIService.ts`)
- Implements realistic AI responses for development
- Simulates network delays and occasional errors
- Categorizes queries (science, technology, history, general) for appropriate responses
- Generates structured markdown notes from conversations

### 3. Service Factory (`aiServiceFactory.ts`)
- Manages switching between mock and real AI services
- Provides singleton pattern for consistent service access
- Supports runtime configuration changes
- Includes development helper functions

### 4. React Hook (`../hooks/useAI.ts`)
- Provides React integration for AI services
- Handles loading states and error management
- Offers convenient methods for sending messages and generating notes

## Usage

### Basic Usage
```typescript
import { useAI } from '../hooks/useAI';

const MyComponent = () => {
  const { sendMessage, generateNotes, isLoading, error } = useAI();
  
  const handleSendMessage = async () => {
    try {
      const response = await sendMessage('conversation-id', 'Hello AI!');
      console.log(response);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };
};
```

### Service Configuration
```typescript
import { useMockAI, useRealAI, isMockAI } from '../services';

// Switch to mock service (for development)
useMockAI();

// Switch to real service (for production)
useRealAI('https://api.mindcanvas.com');

// Check current service type
if (isMockAI()) {
  console.log('Using mock AI service');
}
```

## Mock Service Features

### Realistic Responses
The mock service provides contextually appropriate responses based on query categorization:
- **Greetings**: Welcome messages and conversation starters
- **Science**: Scientific explanations with technical depth
- **Technology**: Tech-focused responses with practical applications
- **History**: Historical context and analysis
- **General**: Comprehensive explanations for other topics

### Simulated Delays
- Message responses: 1-3 seconds (configurable)
- Note generation: 2-5 seconds (configurable)
- Realistic timing for better development experience

### Error Simulation
- 5% chance of network timeout errors (configurable)
- 3% chance of note generation failures (configurable)
- Helps test error handling in the UI

### Note Generation
Generates structured markdown notes with:
- Topic-appropriate templates
- Conversation context integration
- Timestamp and metadata
- Hierarchical organization

## Environment Configuration

Configure the AI service behavior through environment variables:

```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=30000
VITE_API_RETRIES=3

# AI Service Configuration
VITE_USE_MOCK_AI=true
VITE_MOCK_DELAY_MIN=1000
VITE_MOCK_DELAY_MAX=3000
VITE_MOCK_ERROR_RATE=0.05

# Development Features
VITE_ENABLE_AI_DEMO=true
VITE_SHOW_SERVICE_STATUS=true
```

## Development Demo

Access the AI service demo at `/ai-demo` (development only) to:
- Test mock AI responses with different query types
- Observe simulated delays and error handling
- Switch between mock and real services
- Generate notes from conversations
- Validate the complete AI integration flow

## Future Backend Integration

When connecting to a real backend:

1. Update the `RealAIService` class in `aiServiceFactory.ts`
2. Set `VITE_USE_MOCK_AI=false`
3. Configure `VITE_API_URL` to point to your backend
4. The existing interface ensures seamless transition

The mock service will remain available for development and testing purposes.

## Testing

Run the service tests:
```bash
npm test src/services/__tests__/
```

The tests cover:
- Response generation for different query types
- Note generation with proper formatting
- Error handling and edge cases
- Service configuration and switching