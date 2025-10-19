import { useState, useCallback } from 'react';
import { getAIService, getAIServiceSync } from '../services';
import type { Message } from '../types';

interface UseAIReturn {
  // Legacy methods (for backward compatibility)
  sendMessage: (conversationId: string, message: string) => Promise<string>;
  generateNotes: (conversationId: string, messages: Message[]) => Promise<string>;
  
  // New backend methods
  createMap: (message: string) => Promise<{ mapId: string; title: string }>;
  getUserMaps: () => Promise<{ maps: Array<{ mapId: string; title: string; createdAt: string }> }>;
  getMap: (mapId: string) => Promise<any>;
  createBlock: (mapId: string, message: string, parentBlockId?: string, highlightedText?: string) => Promise<{ blockId: string; title: string; response: string }>;
  sendBlockMessage: (blockId: string, message: string) => Promise<{ response: string }>;
  finalizeBlock: (blockId: string) => Promise<{ summary: string; reformattedContent: string }>;
  
  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useAI = (): UseAIReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Legacy method - for backward compatibility with mock service
  const sendMessage = useCallback(async (conversationId: string, message: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const aiService = getAIServiceSync();
      
      const response = await aiService.sendMessage(conversationId, message);
      return typeof response === 'string' ? response : response.response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Legacy method - for backward compatibility
  const generateNotes = useCallback(async (conversationId: string, messages: Message[]): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const aiService = getAIServiceSync();
      
      // Check if this is the new backend service
      if (aiService.finalizeBlock) {
        const result = await aiService.finalizeBlock(conversationId);
        return result.summary + '\n\n' + result.reformattedContent;
      } else if (aiService.generateNotes) {
        // Fallback to mock service
        const formattedMessages = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        return await aiService.generateNotes(conversationId, formattedMessages);
      } else {
        throw new Error('Service does not support note generation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate notes';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // New backend methods
  const createMap = useCallback(async (message: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const aiService = await getAIService();
      if (aiService.createMap) {
        return await aiService.createMap(message);
      } else {
        throw new Error('Backend service not available');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create map';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserMaps = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const aiService = await getAIService();
      if (aiService.getUserMaps) {
        return await aiService.getUserMaps();
      } else {
        // Return empty maps for mock service
        return { maps: [] };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user maps';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMap = useCallback(async (mapId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const aiService = await getAIService();
      if (aiService.getMap) {
        return await aiService.getMap(mapId);
      } else {
        throw new Error('Backend service not available');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get map';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBlock = useCallback(async (mapId: string, message: string, parentBlockId?: string, highlightedText?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const aiService = await getAIService();
      if (aiService.createBlock) {
        return await aiService.createBlock(mapId, message, parentBlockId, highlightedText);
      } else {
        throw new Error('Backend service not available');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create block';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendBlockMessage = useCallback(async (blockId: string, message: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const aiService = await getAIService();
      const response = await aiService.sendMessage(blockId, message);
      return typeof response === 'string' ? { response } : response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const finalizeBlock = useCallback(async (blockId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const aiService = await getAIService();
      if (aiService.finalizeBlock) {
        return await aiService.finalizeBlock(blockId);
      } else {
        throw new Error('Backend service not available');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to finalize block';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Legacy methods
    sendMessage,
    generateNotes,
    
    // New backend methods
    createMap,
    getUserMaps,
    getMap,
    createBlock,
    sendBlockMessage,
    finalizeBlock,
    
    // State
    isLoading,
    error,
    clearError,
  };
};