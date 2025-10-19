import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Card, ConversationContent, Message } from '../../types';
import { useCanvasStore } from '../../stores/canvasStore';
import { useAI } from '../../hooks/useAI';

interface ConversationCardProps {
  card: Card;
  onGenerateNotes: (cardId: string) => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  card,
  onGenerateNotes,
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const updateCard = useCanvasStore((state) => state.updateCard);
  const setHighlightedText = useCanvasStore((state) => state.setHighlightedText);
  
  // Use the AI service hook
  const { sendMessage, sendBlockMessage, clearError } = useAI();

  const content = card.content as ConversationContent;
  const messages = content.messages;
  const hasMessages = messages.length > 0;

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle text selection
  const handleTextSelection = React.useCallback(() => {
    const selection = window.getSelection();
    console.log('🔍 Text selection triggered, selection:', selection);
    
    if (!selection || selection.rangeCount === 0) {
      console.log('❌ No selection or no ranges');
      return;
    }

    const selectedText = selection.toString().trim();
    console.log('📝 Selected text:', selectedText, 'Length:', selectedText.length);
    
    if (!selectedText || selectedText.length < 3) {
      console.log('❌ Text too short or empty');
      return;
    }

    // Get the position of the selection relative to the viewport
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Calculate position for the floating input
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10, // Position below the selection
    };

    console.log('📍 Calculated position:', position);

    // Update the canvas store with highlighted text
    const highlightData = {
      text: selectedText,
      cardId: card.id,
      position,
    };
    
    console.log('✅ Setting highlighted text:', highlightData);
    setHighlightedText(highlightData);
  }, [card.id, setHighlightedText]);



  const handleMouseUp = React.useCallback(() => {
    // Small delay to ensure selection is complete
    setTimeout(handleTextSelection, 10);
  }, [handleTextSelection]);

  const handleClickOutside = React.useCallback((e: React.MouseEvent) => {
    // Clear selection if clicking outside the messages area
    if (messagesContainerRef.current && !messagesContainerRef.current.contains(e.target as Node)) {
      setHighlightedText(null);
    }
  }, [setHighlightedText]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 11),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    const updatedMessages = [...messages, userMessage];
    updateCard(card.id, {
      content: {
        ...content,
        messages: updatedMessages,
      },
    });

    setInputMessage('');
    setIsLoading(true);
    clearError(); // Clear any previous errors

    try {
      let aiResponse: string;
      
      // Use backend block ID if available, otherwise use card ID
      const messageId = card.backendId || card.id;
      console.log('💬 Sending message to:', messageId, 'Backend ID:', card.backendId);
      
      if (card.backendId) {
        // Use backend service for cards with backend IDs
        console.log('🔄 Using backend service for block:', card.backendId);
        const response = await sendBlockMessage(card.backendId, userMessage.content);
        aiResponse = response.response;
        console.log('✅ Backend response received:', aiResponse.substring(0, 100) + '...');
      } else {
        // Fallback to legacy sendMessage for mock cards
        console.log('🔄 Using mock service for card:', messageId);
        aiResponse = await sendMessage(messageId, userMessage.content);
        console.log('✅ Mock response received:', aiResponse.substring(0, 100) + '...');
      }
      
      const aiMessage: Message = {
        id: Math.random().toString(36).substring(2, 11),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      updateCard(card.id, {
        content: {
          ...content,
          messages: [...updatedMessages, aiMessage],
        },
      });
    } catch (error) {
      // If AI service fails, fall back to mock response
      console.warn('AI service failed, using fallback response:', error);
      
      const aiMessage: Message = {
        id: Math.random().toString(36).substring(2, 11),
        role: 'assistant',
        content: generateMockAIResponse(userMessage.content),
        timestamp: new Date(),
      };

      updateCard(card.id, {
        content: {
          ...content,
          messages: [...updatedMessages, aiMessage],
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNotes = () => {
    // Don't allow multiple generations at once
    if (content.isGeneratingNotes) return;
    
    updateCard(card.id, {
      content: {
        ...content,
        isGeneratingNotes: true,
      },
    });
    onGenerateNotes(card.id);
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-lg border border-gray-200 w-[48rem] h-[48rem] flex flex-col relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Loading overlay when generating notes */}
      {content.isGeneratingNotes && (
        <motion.div
          className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg flex items-center justify-center z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center">
            <motion.div
              className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-sm text-gray-600 font-medium">Generating detailed notes...</p>
            <p className="text-xs text-gray-500 mt-1">This may take a moment</p>
          </div>
        </motion.div>
      )}
      {/* Card Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Conversation</h3>
        {hasMessages && (
          <motion.button
            onClick={handleGenerateNotes}
            disabled={content.isGeneratingNotes}
            className={`w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center ${
              content.isGeneratingNotes
                ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800'
            }`}
            title={content.isGeneratingNotes ? "Generating notes..." : "Generate detailed notes"}
            whileHover={!content.isGeneratingNotes ? { scale: 1.05 } : {}}
            whileTap={!content.isGeneratingNotes ? { scale: 0.95 } : {}}
          >
            {content.isGeneratingNotes ? (
              <motion.svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </motion.svg>
            ) : (
              <svg 
                className="w-4 h-4" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            )}
          </motion.button>
        )}
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 nopan"
        onMouseUp={handleMouseUp}
        onClick={handleClickOutside}
        style={{ userSelect: 'text' }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Start a conversation...</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <LoadingMessage />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 nopan">
        <div className="flex space-x-2 nopan">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm nopan"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-xs nopan"
            style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            Send
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// Message Bubble Component
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  const isAI = message.role === 'assistant';
  
  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`max-w-2xl px-4 py-2 rounded-lg ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-800'
        } ${isAI ? 'cursor-text selectable-text' : ''}`}
      >
        <p 
          className={`text-xs ${isAI ? 'message-content' : ''}`}
          style={{ 
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          {message.content}
        </p>
        <p 
          className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`} 
          style={{ 
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </motion.div>
  );
};

// Loading Message Component
const LoadingMessage: React.FC = () => {
  return (
    <motion.div
      className="flex justify-start"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-gray-100 text-gray-800 max-w-2xl px-4 py-2 rounded-lg">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </motion.div>
  );
};

// Mock AI Response Generator
const generateMockAIResponse = (userMessage: string): string => {
  const responses = [
    `That's an interesting question about "${userMessage}". Let me break this down for you...`,
    `Great point! Regarding "${userMessage}", here's what I think...`,
    `I understand you're asking about "${userMessage}". Here's a comprehensive explanation...`,
    `Thanks for bringing up "${userMessage}". This is actually quite fascinating because...`,
    `Let me help you understand "${userMessage}" better. The key concepts are...`,
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  // Add some additional content to make it more realistic
  const additionalContent = [
    "This involves several important factors that we should consider.",
    "There are multiple perspectives on this topic that are worth exploring.",
    "The research shows some interesting patterns in this area.",
    "This connects to broader themes that might be relevant to your learning.",
    "Let me know if you'd like me to elaborate on any specific aspect.",
  ];

  const randomAdditional = additionalContent[Math.floor(Math.random() * additionalContent.length)];
  
  return `${randomResponse}\n\n${randomAdditional}`;
};