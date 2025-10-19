
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCanvasStore } from '../../stores/canvasStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { useAI } from '../../hooks/useAI';

import type { Card, ConversationContent } from '../../types';

const HomePage = () => {
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const addCard = useCanvasStore((state) => state.addCard);
  const createNote = useNavigationStore((state) => state.createNote);
  const navigateToCanvas = useNavigationStore((state) => state.navigateToCanvas);
  const { createMap, createBlock } = useAI();

  const generateLongAIResponse = (userQuery: string): string => {
    const responses = [
      `That's a fascinating question about "${userQuery}". Let me break this down comprehensively for you.

First, it's important to understand the foundational concepts that underpin this topic. The subject you're asking about has multiple layers of complexity, each building upon the previous one. When we examine this from a theoretical perspective, we can see how various principles interconnect to form a cohesive understanding.

From a practical standpoint, there are several key considerations to keep in mind. The real-world applications of this concept extend far beyond what might initially be apparent. Many experts in the field have spent years researching these nuances, and their findings reveal some truly interesting patterns.

What makes this particularly intriguing is how it connects to broader themes in the discipline. The implications stretch across multiple domains, influencing everything from basic principles to advanced applications. This interconnectedness is what makes the topic so rich and worthy of deeper exploration.

I'd be happy to dive deeper into any specific aspect that interests you most. There are many fascinating rabbit holes we could explore together, each offering unique insights and perspectives that could enhance your understanding of the subject.`,

      `Excellent question about "${userQuery}"! This is actually one of those topics that becomes more interesting the deeper you dig into it.

Let me start by giving you some context. The origins of this concept can be traced back through history, where early thinkers began to notice patterns and relationships that weren't immediately obvious. Over time, these observations evolved into more sophisticated frameworks that we use today.

What's particularly compelling is how this subject intersects with so many other areas of knowledge. It's not just an isolated concept – it's part of a larger web of interconnected ideas that influence each other in subtle but important ways. This is why understanding it properly requires looking at it from multiple angles.

The practical implications are quite significant too. In real-world scenarios, this knowledge can be applied in ways that might surprise you. Many professionals working in related fields rely on these principles daily, often without even realizing the theoretical foundations that support their work.

There are also some common misconceptions that are worth addressing. Many people think they understand this topic based on surface-level exposure, but the reality is much more nuanced. The devil, as they say, is in the details – and those details can completely change how we interpret and apply these concepts.

Would you like me to explore any particular aspect in more detail? There's so much we could unpack here.`,

      `Great question about "${userQuery}"! This is one of those subjects that really benefits from a thorough exploration.

To begin with, let's establish the fundamental framework. The core principles that govern this area have been developed and refined over many years of research and practical application. What we know today represents the culmination of countless experiments, observations, and theoretical developments.

One of the most interesting aspects is how this topic challenges our intuitive understanding. Often, what seems obvious at first glance turns out to be much more complex when we examine it closely. This is why experts in the field spend so much time studying the subtle interactions and dependencies that aren't immediately apparent.

The methodology for approaching this subject has evolved significantly over time. Early approaches were often limited by the tools and techniques available, but modern methods allow us to explore dimensions that were previously inaccessible. This has led to some remarkable discoveries and insights that have fundamentally changed how we think about the topic.

From an applied perspective, the implications are far-reaching. The principles we're discussing don't exist in isolation – they have practical consequences that affect everything from daily decision-making to long-term strategic planning. Understanding these connections can provide valuable insights for both personal and professional contexts.

There are also some fascinating edge cases and exceptions that highlight the complexity of the subject. These outliers often provide the most valuable learning opportunities, as they force us to refine our understanding and develop more sophisticated models.

What specific angle would you like to explore further?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsSubmitting(true);
    console.log('🚀 Starting form submission for query:', query);
    
    try {
      // Try to use backend first
      console.log('🔍 Attempting to create backend map for query:', query);
      
      try {
        // Create map in backend
        console.log('📡 Calling createMap...');
        const { mapId, title } = await createMap(query);
        console.log('✅ Map created:', { mapId, title });
        
        // Create initial block with the query
        console.log('📡 Calling createBlock...');
        const { blockId, response } = await createBlock(mapId, query);
        console.log('✅ Block created:', { blockId, responseLength: response.length });
        
        // Create note with backend IDs
        console.log('📝 Creating note in navigation store...');
        createNote(title);
        console.log('✅ Note created in navigation store');
        
        // Create conversation card with just user message first
        const userMessage = {
          id: Math.random().toString(36).substring(2, 11),
          role: 'user' as const,
          content: query.trim(),
          timestamp: new Date(),
        };

        const newCard: Omit<Card, 'id' | 'createdAt' | 'updatedAt'> = {
          backendId: blockId,
          mapId: mapId,
          type: 'conversation',
          position: { x: 200, y: 200 },
          content: {
            messages: [userMessage],
            isGeneratingNotes: false,
          } as ConversationContent,
          connections: [],
        };

        // Add the card to the store
        console.log('🎨 Adding card to canvas store...');
        const addedCard = addCard(newCard);
        console.log('✅ Card added to store:', addedCard.id, 'Backend ID:', addedCard.backendId);
        
        // Navigate to canvas
        console.log('🧭 Navigating to canvas...');
        navigateToCanvas();
        navigate('/canvas');
        console.log('✅ Navigation completed');
        
        // Add AI response immediately (no delay needed since we have the response)
        const aiMessage = {
          id: Math.random().toString(36).substring(2, 11),
          role: 'assistant' as const,
          content: response,
          timestamp: new Date(),
        };

        // Update the card with the AI response
        console.log('🤖 Adding AI response to card...');
        useCanvasStore.getState().updateCard(addedCard.id, {
          content: {
            messages: [userMessage, aiMessage],
            isGeneratingNotes: false,
          } as ConversationContent,
        });
        console.log('✅ AI response added to card:', addedCard.id);
        
      } catch (backendError) {
        console.warn('🤖 Backend unavailable, falling back to mock service:', backendError);
        
        // Fallback to mock behavior - but still navigate!
        console.log('📝 Creating mock note...');
        createNote(`Discussion: ${query.slice(0, 30)}${query.length > 30 ? '...' : ''}`);
        
        const userMessage = {
          id: Math.random().toString(36).substring(2, 11),
          role: 'user' as const,
          content: query.trim(),
          timestamp: new Date(),
        };

        const newCard: Omit<Card, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'conversation',
          position: { x: 200, y: 200 },
          content: {
            messages: [userMessage],
            isGeneratingNotes: false,
          } as ConversationContent,
          connections: [],
        };

        // Add the card to the store
        console.log('🎨 Adding mock card to canvas store...');
        const addedCard = addCard(newCard);
        console.log('✅ Mock card added to store:', addedCard.id);

        // Navigate to canvas
        console.log('🧭 Navigating to canvas (mock)...');
        navigate('/canvas');
        console.log('✅ Navigation completed (mock)');

        // Add AI response with delay
        setTimeout(() => {
          console.log('🤖 Adding mock AI response...');
          const aiMessage = {
            id: Math.random().toString(36).substring(2, 11),
            role: 'assistant' as const,
            content: generateLongAIResponse(query.trim()),
            timestamp: new Date(),
          };

          const currentCards = useCanvasStore.getState().cards;
          const mostRecentCard = currentCards.find(c => c.id === addedCard.id);
          
          if (mostRecentCard && mostRecentCard.type === 'conversation') {
            const content = mostRecentCard.content as ConversationContent;
            useCanvasStore.getState().updateCard(addedCard.id, {
              content: {
                ...content,
                messages: [...content.messages, aiMessage],
              },
            });
            console.log('✅ Mock AI response added to card:', addedCard.id);
          } else {
            console.warn('⚠️ Could not find card to update:', addedCard.id);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Critical error in form submission:', error);
      // Even if there's an error, try to navigate to canvas with a basic card
      try {
        console.log('🆘 Creating emergency fallback card...');
        createNote(`Error: ${query.slice(0, 30)}${query.length > 30 ? '...' : ''}`);
        
        const emergencyCard: Omit<Card, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'conversation',
          position: { x: 200, y: 200 },
          content: {
            messages: [{
              id: Math.random().toString(36).substring(2, 11),
              role: 'user',
              content: query.trim(),
              timestamp: new Date(),
            }],
            isGeneratingNotes: false,
          } as ConversationContent,
          connections: [],
        };
        
        addCard(emergencyCard);
        navigate('/canvas');
        console.log('✅ Emergency navigation completed');
      } catch (emergencyError) {
        console.error('❌ Emergency fallback failed:', emergencyError);
        alert('Failed to create note. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Form submission completed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <motion.div 
        className="max-w-2xl w-full px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <h1 className="text-2xl font-medium text-gray-900 mb-3" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            MindCanvas
          </h1>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            Start learning about anything with AI-powered conversations
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          whileHover={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
        >
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything to start learning..."
              className="flex-1 px-4 py-2.5 border-0 bg-transparent focus:outline-none text-gray-900 placeholder-gray-500 text-sm"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              disabled={isSubmitting}
            />
            <motion.button
              type="submit"
              disabled={!query.trim() || isSubmitting}
              className="w-10 h-10 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
              whileHover={{ scale: query.trim() && !isSubmitting ? 1.05 : 1 }}
              whileTap={{ scale: query.trim() && !isSubmitting ? 0.95 : 1 }}
            >
              {isSubmitting ? (
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 10l7-7m0 0l7 7m-7-7v18" 
                  />
                </svg>
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomePage;