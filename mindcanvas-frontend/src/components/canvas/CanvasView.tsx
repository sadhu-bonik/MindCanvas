import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Enhanced controls styling
const controlsStyle = `
  .react-flow-controls-enhanced button {
    background-color: #1f2937 !important;
    border: none !important;
    color: white !important;
    border-radius: 8px !important;
    margin: 2px !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.2s ease !important;
  }
  .react-flow-controls-enhanced button:hover {
    background-color: #374151 !important;
    transform: scale(1.05) !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = controlsStyle;
  document.head.appendChild(styleElement);
}
import { motion } from 'framer-motion';
import { useCanvasStore } from '../../stores/canvasStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { ConversationCard } from '../cards/ConversationCard';
import { SummaryCard } from '../cards/SummaryCard';
import { FloatingInputManager } from '../common/FloatingInputManager';
import { Toast } from '../common/Toast';
import Sidebar from '../sidebar/Sidebar';
import { useAI } from '../../hooks/useAI';
import type { Card, ConversationContent, SummaryContent, DetailedNotesContent } from '../../types';

// Custom Node Components for React Flow
const ConversationNode: React.FC<{ data: { card: Card } }> = ({ data }) => {
  const { card } = data;
  const updateCard = useCanvasStore((state) => state.updateCard);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Import AI service hook
  const { generateNotes, finalizeBlock } = useAI();

  const handleGenerateNotes = async (cardId: string) => {
    const allCards = useCanvasStore.getState().cards;
    const targetCard = allCards.find((c: Card) => c.id === cardId);
    if (!targetCard) return;
    
    const content = targetCard.content as ConversationContent;
    
    // Check if this is an initial conversation (created from HomePage)
    const isInitialCard = targetCard.position.x === 200 && targetCard.position.y === 200;
    
    // Set generating state immediately for UI feedback
    updateCard(cardId, {
      content: {
        ...content,
        isGeneratingNotes: true,
      },
    });
    
    try {
      setIsTransitioning(true);
      
      let aiGeneratedNotes: string;
      let summaryContent: string = '';
      
      if (targetCard.backendId) {
        // Use backend finalization for cards with backend IDs
        console.log('🔄 Finalizing backend block:', targetCard.backendId);
        const { summary, reformattedContent } = await finalizeBlock(targetCard.backendId);
        summaryContent = summary;
        aiGeneratedNotes = reformattedContent;
        console.log('✅ Backend finalization complete');
      } else {
        // Fallback to legacy generateNotes for mock cards
        console.log('🔄 Generating notes with mock service');
        aiGeneratedNotes = await generateNotes(cardId, content.messages);
        summaryContent = createSummaryFromDetailed(aiGeneratedNotes);
        console.log('✅ Mock note generation complete');
      }
      
      // Add a brief transition delay for smooth animation
      setTimeout(() => {
        if (isInitialCard) {
          // Initial conversations generate detailed notes directly
          updateCard(cardId, {
            type: 'detailed-notes',
            content: {
              markdown: aiGeneratedNotes,
              originalConversationId: cardId,
              isVisible: true,
            } as DetailedNotesContent,
          });
        } else {
          // Linked conversations generate summary cards with both summary and detailed content
          updateCard(cardId, {
            type: 'summary',
            content: {
              markdown: summaryContent || createSummaryFromDetailed(aiGeneratedNotes),
              detailedMarkdown: aiGeneratedNotes,
              originalConversationId: cardId,
              isExpanded: false,
            } as SummaryContent,
          });
        }
        
        // Update the current note in navigation store to reflect the change
        const navStore = useNavigationStore.getState();
        if (navStore.currentNote) {
          navStore.updateNoteTimestamp(navStore.currentNote);
        }

        // Note generation completed successfully
        console.log(`Generated ${isInitialCard ? 'detailed notes' : 'summary'} for card ${cardId}`);
        
        setIsTransitioning(false);
      }, 500); // Brief delay for transition effect
      
    } catch (error) {
      console.warn('AI note generation failed, using fallback:', error);
      
      // Fallback to mock generation if AI service fails
      setTimeout(() => {
        if (isInitialCard) {
          const mockMarkdown = generateMockDetailedMarkdown(content.messages);
          updateCard(cardId, {
            type: 'detailed-notes',
            content: {
              markdown: mockMarkdown,
              originalConversationId: cardId,
              isVisible: true,
            } as DetailedNotesContent,
          });
        } else {
          const summaryMarkdown = generateMockSummaryMarkdown(content.messages);
          const detailedMarkdown = generateMockDetailedMarkdown(content.messages);
          updateCard(cardId, {
            type: 'summary',
            content: {
              markdown: summaryMarkdown,
              detailedMarkdown: detailedMarkdown,
              originalConversationId: cardId,
              isExpanded: false,
            } as SummaryContent,
          });
        }
        
        const navStore = useNavigationStore.getState();
        if (navStore.currentNote) {
          navStore.updateNoteTimestamp(navStore.currentNote);
        }

        console.log(`Generated ${isInitialCard ? 'detailed notes' : 'summary'} for card ${cardId} using fallback`);
        setIsTransitioning(false);
      }, 500);
    }
  };

  return (
    <motion.div 
      className="conversation-node" 
      style={{ pointerEvents: 'auto' }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: isHovered ? 1.02 : 1,
        boxShadow: isHovered 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        filter: isTransitioning ? 'blur(2px)' : 'blur(0px)'
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        opacity: { duration: 0.3 },
        scale: { duration: 0.2 },
        filter: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileDrag={{ 
        scale: 1.05,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}
    >
      {/* Connection handles for React Flow */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#3b82f6',
          width: 12,
          height: 12,
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#3b82f6',
          width: 12,
          height: 12,
          border: '2px solid white',
        }}
      />
      
      <ConversationCard card={card} onGenerateNotes={handleGenerateNotes} />
    </motion.div>
  );
};

const SummaryNode: React.FC<{ data: { card: Card } }> = ({ data }) => {
  const { card } = data;
  const setHighlightedText = useCanvasStore((state) => state.setHighlightedText);
  const updateCard = useCanvasStore((state) => state.updateCard);
  const [isHovered, setIsHovered] = useState(false);

  const handleTextHighlight = (text: string, position: { x: number; y: number }, cardId: string) => {
    setHighlightedText({
      text,
      cardId,
      position,
    });
  };

  const handleToggleExpansion = (cardId: string) => {
    const content = card.content as SummaryContent;
    
    // Toggle the expansion state with smooth animation
    updateCard(cardId, {
      content: {
        ...content,
        isExpanded: !content.isExpanded,
      } as SummaryContent,
    });
  };

  // Check if this is a newly created summary card (just transitioned from conversation)
  const isNewSummary = card.type === 'summary' && card.createdAt && 
    (Date.now() - card.createdAt.getTime()) < 5000; // Within last 5 seconds

  return (
    <motion.div 
      className="summary-node"
      initial={{ 
        opacity: isNewSummary ? 0 : 1, 
        scale: isNewSummary ? 0.8 : 1,
        rotateY: isNewSummary ? 180 : 0
      }}
      animate={{ 
        opacity: 1, 
        scale: isHovered ? 1.02 : 1,
        rotateY: 0,
        boxShadow: isHovered 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        opacity: { duration: isNewSummary ? 0.6 : 0.3 },
        scale: { duration: 0.2 },
        rotateY: { duration: isNewSummary ? 0.8 : 0 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileDrag={{ 
        scale: 1.05,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}
    >
      {/* Connection handles for React Flow */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#3b82f6',
          width: 12,
          height: 12,
          border: '2px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#3b82f6',
          width: 12,
          height: 12,
          border: '2px solid white',
        }}
      />
      
      <SummaryCard 
        card={card} 
        onTextHighlight={handleTextHighlight}
        onToggleExpansion={handleToggleExpansion}
      />
    </motion.div>
  );
};

// Define custom node types
const nodeTypes: NodeTypes = {
  conversation: ConversationNode,
  summary: SummaryNode,
  'detailed-notes': SummaryNode, // Use SummaryNode for detailed-notes as well (they're the same now)
};

interface CanvasContentProps {
  isConnectionMode: boolean;
  setIsConnectionMode: (mode: boolean) => void;
  cards: any[];
}

const CanvasContent: React.FC<CanvasContentProps> = ({ 
  isConnectionMode, 
  setIsConnectionMode, 
  cards 
}) => {
  const reactFlowInstance = useReactFlow();

  // Handle centering the view on the initial conversation card
  const handleCenterView = useCallback(() => {
    if (reactFlowInstance && cards.length > 0) {
      // Find the initial conversation card (first card)
      const initialCard = cards[0];
      if (initialCard) {
        // Center on the initial card with some padding
        const cardWidth = 768; // 48rem in pixels
        const cardHeight = 768; // 48rem in pixels
        
        // Smooth transition to center
        reactFlowInstance.setCenter(
          initialCard.position.x + cardWidth / 2,
          initialCard.position.y + cardHeight / 2,
          { 
            zoom: 1,
            duration: 800 // Smooth 800ms transition
          }
        );
      }
    }
  }, [reactFlowInstance, cards]);

  return (
    <>
      {/* Connection mode toggle button */}
      <motion.button 
        className={`fixed top-4 right-16 z-10 w-10 h-10 ${
          isConnectionMode 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-gray-900 hover:bg-gray-700'
        } text-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors duration-200`}
        onClick={() => setIsConnectionMode(!isConnectionMode)}
        title={isConnectionMode ? "Exit connection mode" : "Enter connection mode"}
        whileHover={{ 
          scale: 1.1,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)'
        }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 25,
          delay: 0.1
        }}
      >
        <motion.svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          animate={{ rotate: isConnectionMode ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" 
          />
        </motion.svg>
      </motion.button>

      {/* Connection mode indicator */}
      {isConnectionMode && (
        <motion.div
          className="fixed top-16 right-4 z-10 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          Drag from blue handles to connect nodes
        </motion.div>
      )}

      {/* Center button */}
      <motion.button 
        className="fixed top-4 right-4 z-10 w-10 h-10 bg-gray-900 hover:bg-gray-700 text-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-colors duration-200"
        onClick={handleCenterView}
        title="Center view"
        whileHover={{ 
          scale: 1.1,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)'
        }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 25,
          delay: 0.2
        }}
      >
        <motion.svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 3v18m9-9H3" 
          />
        </motion.svg>
      </motion.button>

      <Controls 
        position="bottom-right"
        showInteractive={false}
        className="react-flow-controls-enhanced"
      />
    </>
  );
};

const CanvasView: React.FC = () => {
  const { highlightedText, clearHighlight, cards, connections } = useCanvasStore();
  const { currentNote, notes, createNote } = useNavigationStore();
  const { createBlock } = useAI(); // Move useAI hook to top level
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isConnectionMode, setIsConnectionMode] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  // Convert cards to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return cards.map((card) => {
      const isInitialCard = card.position.x === 200 && card.position.y === 200;
      return {
        id: card.id,
        type: card.type,
        position: card.position,
        data: { card },
        draggable: !isInitialCard,
      };
    });
  }, [cards]);

  // Create edges from connections for visual linking
  const initialEdges: Edge[] = useMemo(() => {
    console.log('Converting connections to edges:', connections);
    const edges = connections.map((connection) => ({
      id: connection.id,
      source: connection.sourceCardId,
      target: connection.targetCardId,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDasharray: '5,5',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#3b82f6',
      },
    }));
    console.log('Generated edges:', edges);
    return edges;
  }, [connections]);

  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(initialNodes);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when cards change
  React.useEffect(() => {
    console.log('🔄 Cards changed, updating React Flow nodes. Card count:', cards.length);
    console.log('📋 Current cards:', cards.map(c => ({ id: c.id, type: c.type, position: c.position })));
    
    const newNodes = cards.map((card) => {
      const isInitialCard = card.position.x === 200 && card.position.y === 200;
      return {
        id: card.id,
        type: card.type,
        position: card.position,
        data: { card },
        draggable: !isInitialCard,
      };
    });
    
    console.log('🎯 Setting React Flow nodes:', newNodes.length, 'nodes');
    console.log('🎯 Node details:', newNodes.map(n => ({ id: n.id, type: n.type, position: n.position })));
    setReactFlowNodes(newNodes);
  }, [cards, setReactFlowNodes]);

  // Update edges when connections change
  React.useEffect(() => {
    console.log('Updating edges from connections:', connections);
    const newEdges: Edge[] = connections.map((connection) => ({
      id: connection.id,
      source: connection.sourceCardId,
      target: connection.targetCardId,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDasharray: '5,5',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#3b82f6',
      },
    }));
    console.log('Setting new edges:', newEdges);
    setReactFlowEdges(newEdges);
  }, [connections, setReactFlowEdges]);

  // Sync canvas cards with current note
  React.useEffect(() => {
    if (currentNote) {
      const { notes } = useNavigationStore.getState();
      const note = notes.find(n => n.id === currentNote);
      if (note) {
        // Load the note's cards into the canvas
        // For now, we'll keep the existing cards as the stores are separate
        // In a full implementation, we'd sync the canvas store with the note's cards
      }
    }
  }, [currentNote]);

  // Handle node position changes
  const handleNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    const updateCard = useCanvasStore.getState().updateCard;
    updateCard(node.id, { position: node.position });
  }, []);

  // Handle new connections created by user dragging between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        // Create connection in canvas store
        const { addConnection } = useCanvasStore.getState();
        
        addConnection({
          sourceCardId: params.source,
          targetCardId: params.target,
          highlightedText: 'Manual connection', // Default text for manual connections
          sourcePosition: { x: 0, y: 0 }, // Will be updated when rendering
        });
        
        console.log('Manual connection created:', params.source, '->', params.target);
      }
    },
    []
  );

  const handleFloatingInputSubmit = useCallback(async (query: string) => {
    console.log('🔗 FloatingInput submit handler called with query:', query);
    console.log('🔗 Current highlightedText:', highlightedText);
    
    if (!highlightedText) {
      console.log('❌ No highlighted text, aborting');
      return;
    }

    const { addCard, addConnection, cards } = useCanvasStore.getState();
    
    console.log('🔗 Starting linked conversation creation...');

    // Find a good position that doesn't overlap with existing cards
    const findAvailablePosition = (baseX: number, baseY: number) => {
      const cardWidth = 768; // 48rem in pixels
      const cardHeight = 768; // 48rem in pixels
      const margin = 50;
      
      // Try the preferred position first (to the right and slightly down)
      let x = Math.max(50, baseX + 200);
      let y = Math.max(50, baseY + 50);
      
      // Check if this position overlaps with any existing card
      const overlaps = cards.some(existingCard => {
        const dx = Math.abs(existingCard.position.x - x);
        const dy = Math.abs(existingCard.position.y - y);
        return dx < cardWidth + margin && dy < cardHeight + margin;
      });
      
      if (!overlaps) {
        return { x, y };
      }
      
      // If it overlaps, try positions in a spiral pattern
      for (let attempt = 1; attempt <= 20; attempt++) {
        const angle = attempt * 0.8;
        const radius = 150 + attempt * 75;
        x = baseX + Math.cos(angle) * radius;
        y = baseY + Math.sin(angle) * radius;
        
        // Keep within reasonable bounds
        x = Math.max(50, x);
        y = Math.max(50, y);
        
        const overlapsNow = cards.some(existingCard => {
          const dx = Math.abs(existingCard.position.x - x);
          const dy = Math.abs(existingCard.position.y - y);
          return dx < cardWidth + margin && dy < cardHeight + margin;
        });
        
        if (!overlapsNow) {
          return { x, y };
        }
      }
      
      // Fallback: position to the right of all existing cards
      const maxX = Math.max(...cards.map(card => card.position.x), 0);
      return { x: maxX + cardWidth + margin, y: Math.max(50, baseY) };
    };

    const position = findAvailablePosition(highlightedText.position.x, highlightedText.position.y);

    try {
      // Find the source card to get backend info
      const sourceCard = cards.find(c => c.id === highlightedText.cardId);
      
      // STEP 1: Create the card immediately with just the user message
      console.log('🎨 Creating child conversation card immediately...');
      
      const userMessage = {
        id: Math.random().toString(36).substring(2, 11),
        role: 'user' as const,
        content: query,
        timestamp: new Date(),
      };

      const newCard: Omit<Card, 'id' | 'createdAt' | 'updatedAt'> = {
        backendId: undefined, // Will be set after backend call
        mapId: sourceCard?.mapId,
        type: 'conversation',
        position,
        content: {
          messages: [userMessage],
          isGeneratingNotes: false,
        } as ConversationContent,
        connections: [highlightedText.cardId],
      };

      // Add the card to canvas immediately
      console.log('🎨 About to call addCard with:', newCard);
      const addedCard = addCard(newCard);
      const actualNewCardId = addedCard.id;
      console.log('✅ Child card created immediately:', actualNewCardId);
      console.log('📊 Card details:', { id: actualNewCardId, position: addedCard.position, type: addedCard.type });

      // Create connection immediately
      const connectionData = {
        sourceCardId: highlightedText.cardId,
        targetCardId: actualNewCardId,
        highlightedText: highlightedText.text,
        sourcePosition: highlightedText.position,
      };
      
      console.log('🔗 Creating connection...');
      addConnection(connectionData);
      console.log('✅ Connection created');

      // Clear the highlight immediately
      console.log('🧹 Clearing highlight...');
      clearHighlight();

      // Show toast notification
      setToast({
        message: 'Created linked conversation card',
        type: 'success',
        isVisible: true,
      });

      // Update note timestamp
      if (currentNote) {
        const navStore = useNavigationStore.getState();
        navStore.updateNoteTimestamp(currentNote);
        console.log('📝 Updated note timestamp');
      }

      // STEP 2: Now make the API call to get the AI response
      console.log('📡 Making API call for AI response...');
      
      if (sourceCard?.mapId && sourceCard?.backendId) {
        // Backend API call
        console.log('🔗 Calling backend createBlock...');
        try {
          const { blockId, response } = await createBlock(
            sourceCard.mapId,
            query,
            sourceCard.backendId,
            highlightedText.text
          );
          
          console.log('✅ Backend response received:', response.substring(0, 100) + '...');
          
          // Update the card with backend ID and AI response
          const aiMessage = {
            id: Math.random().toString(36).substring(2, 11),
            role: 'assistant' as const,
            content: response,
            timestamp: new Date(),
          };

          useCanvasStore.getState().updateCard(actualNewCardId, {
            backendId: blockId,
            content: {
              messages: [userMessage, aiMessage],
              isGeneratingNotes: false,
            } as ConversationContent,
          });
          
          console.log('✅ Card updated with backend response and ID:', blockId);
          
        } catch (backendError) {
          console.warn('❌ Backend call failed, using mock response:', backendError);
          
          // Fallback to mock response
          const aiMessage = {
            id: Math.random().toString(36).substring(2, 11),
            role: 'assistant' as const,
            content: generateMockAIResponse(query, highlightedText.text),
            timestamp: new Date(),
          };

          useCanvasStore.getState().updateCard(actualNewCardId, {
            content: {
              messages: [userMessage, aiMessage],
              isGeneratingNotes: false,
            } as ConversationContent,
          });
          
          console.log('✅ Card updated with mock response');
        }
      } else {
        // Mock API call with delay
        console.log('🤖 Using mock service...');
        setTimeout(() => {
          const aiMessage = {
            id: Math.random().toString(36).substring(2, 11),
            role: 'assistant' as const,
            content: generateMockAIResponse(query, highlightedText.text),
            timestamp: new Date(),
          };

          useCanvasStore.getState().updateCard(actualNewCardId, {
            content: {
              messages: [userMessage, aiMessage],
              isGeneratingNotes: false,
            } as ConversationContent,
          });
          
          console.log('✅ Card updated with mock response');
        }, 1000 + Math.random() * 1000); // 1-2 second delay
      }

      console.log('🎉 Linked conversation flow completed!');
    } catch (error) {
      console.error('Failed to create linked conversation:', error);
      // Clear highlight and show error
      clearHighlight();
      setToast({
        message: 'Failed to create linked conversation',
        type: 'error',
        isVisible: true,
      });
    }
  }, [highlightedText, clearHighlight, currentNote, createBlock]);

  return (
    <motion.div 
      className="h-screen w-screen bg-gradient-to-br from-gray-50 to-white relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        backgroundImage: `
          radial-gradient(circle at 25px 25px, rgba(156, 163, 175, 0.1) 2px, transparent 0),
          radial-gradient(circle at 75px 75px, rgba(156, 163, 175, 0.05) 1px, transparent 0)
        `,
        backgroundSize: '100px 100px'
      }}
    >
      {/* Sidebar */}
      <Sidebar onCollapseChange={setSidebarCollapsed} />
      {/* Minimal floating add button */}
      <motion.button 
        className="fixed top-4 left-4 z-10 w-10 h-10 bg-gray-900 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-lg font-light shadow-lg backdrop-blur-sm transition-colors duration-200"
        onClick={() => {
          setIsCreatingCard(true);
          
          // Create a new note using the navigation store
          const noteTitle = `Note ${notes.length + 1}`;
          
          // Add slight delay for visual feedback
          setTimeout(() => {
            createNote(noteTitle);
            setIsCreatingCard(false);
          }, 200);
        }}
        title="Add new note"
        whileHover={{ 
          scale: 1.1,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)'
        }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 25,
          delay: 0.1
        }}
      >
        <motion.span
          whileHover={{ rotate: 90 }}
          animate={{ rotate: isCreatingCard ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          +
        </motion.span>
      </motion.button>

      <div className={`h-full transition-all duration-300 ${sidebarCollapsed ? 'ml-10' : 'ml-80'}`}>
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{
            padding: 0.1,
            includeHiddenNodes: false,
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.1}
          maxZoom={2}
          className={`w-full h-full ${isConnectionMode ? 'connecting' : ''}`}
          proOptions={{ hideAttribution: true }}
        >
          <CanvasContent 
            isConnectionMode={isConnectionMode}
            setIsConnectionMode={setIsConnectionMode}
            cards={cards}
          />
        </ReactFlow>
      </div>

      {/* Floating Input Manager */}
      <FloatingInputManager
        highlightedText={highlightedText}
        onSubmit={handleFloatingInputSubmit}
        onClose={clearHighlight}
      />

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </motion.div>
  );
};

// Mock AI Response Generator
const generateMockAIResponse = (userMessage: string, highlightedText?: string): string => {
  const responses = highlightedText ? [
    `That's an interesting follow-up about "${highlightedText}". Regarding your question "${userMessage}", let me elaborate...`,
    `Great question about "${highlightedText}". When you ask "${userMessage}", this connects to several important concepts...`,
    `I see you want to explore "${highlightedText}" further with "${userMessage}". Here's a deeper dive...`,
    `Thanks for highlighting "${highlightedText}". Your question "${userMessage}" is particularly relevant because...`,
    `Let me expand on "${highlightedText}" in the context of "${userMessage}" with additional details...`,
  ] : [
    `That's an interesting question about "${userMessage}". Let me break this down for you...`,
    `Great point! Regarding "${userMessage}", here's what I think...`,
    `I understand you're asking about "${userMessage}". Here's a comprehensive explanation...`,
    `Thanks for bringing up "${userMessage}". This is actually quite fascinating because...`,
    `Let me help you understand "${userMessage}" better. The key concepts are...`,
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  const additionalContent = [
    "This aspect involves several layers of complexity that are worth understanding.",
    "There are some nuanced details here that can help clarify the broader picture.",
    "This connects to other concepts we've discussed and opens up new areas to explore.",
    "The implications of this extend beyond what we might initially consider.",
    "Understanding this piece helps build a more complete mental model of the topic.",
  ];

  const randomAdditional = additionalContent[Math.floor(Math.random() * additionalContent.length)];
  
  return `${randomResponse}\n\n${randomAdditional}`;
};

// Mock Summary Markdown Generator (for summary cards)
const generateMockSummaryMarkdown = (_messages: any[]): string => {
  const keyPoints = [
    "Main discussion focused on core concepts and their applications",
    "Several important insights emerged from the conversation",
    "Key relationships between different ideas were explored"
  ];

  return `## Key Points

${keyPoints.map(point => `- ${point}`).join('\n')}

## Quick Takeaways

**Primary Focus**: Core concepts and practical applications  
**Key Insight**: Important relationships between ideas  
**Next Steps**: Areas identified for deeper exploration

---
*Summary generated on ${new Date().toLocaleDateString()}*`;
};

// Mock Detailed Markdown Generator (for detailed notes cards)
const generateMockDetailedMarkdown = (messages: any[]): string => {
  const conversationSummary = messages.length > 0 
    ? messages
        .filter(m => m.role === 'assistant')
        .map(m => m.content)
        .join('\n\n')
    : "";

  return `# Comprehensive Analysis

## Executive Summary

This detailed analysis provides an in-depth exploration of the key concepts, methodologies, and insights that emerged from our conversation. The discussion covered multiple interconnected topics that form a comprehensive understanding of the subject matter.

## Detailed Breakdown

### Core Concepts Explored

${conversationSummary || "The conversation covered fundamental principles and their practical applications, with particular emphasis on understanding the underlying mechanisms and their broader implications."}

### Key Insights and Analysis

1. **Foundational Understanding**
   - Primary concepts were thoroughly examined
   - Relationships between different elements were established
   - Practical applications were identified and discussed

2. **Advanced Considerations**
   - Complex interactions between various components
   - Potential challenges and their mitigation strategies
   - Long-term implications and considerations

3. **Practical Applications**
   - Real-world implementation strategies
   - Best practices and recommended approaches
   - Common pitfalls and how to avoid them

### Methodological Approach

The analysis employed a systematic approach to understanding:

- **Analytical Framework**: Structured examination of core principles
- **Contextual Analysis**: Understanding within broader ecosystem
- **Practical Validation**: Real-world application scenarios

## Synthesis and Conclusions

### Primary Findings

> The investigation revealed several critical insights that form the foundation for deeper understanding and practical application.

### Strategic Recommendations

1. **Immediate Actions**
   - Focus on fundamental concept mastery
   - Establish clear implementation framework
   - Develop practical application strategies

2. **Medium-term Objectives**
   - Build comprehensive understanding
   - Integrate with existing knowledge base
   - Validate through practical application

3. **Long-term Vision**
   - Achieve mastery of advanced concepts
   - Contribute to broader knowledge development
   - Mentor others in similar learning journeys

## Areas for Further Investigation

### Priority Research Areas

- **Advanced Applications**: Exploring complex implementation scenarios
- **Integration Strategies**: Connecting with related domains
- **Innovation Opportunities**: Identifying novel applications

### Recommended Resources

- Academic literature on foundational concepts
- Industry best practices and case studies
- Expert perspectives and thought leadership

## Conclusion

This comprehensive analysis provides a solid foundation for continued learning and practical application. The insights gained form a robust framework for understanding complex concepts and their real-world implications.

---

*Detailed analysis completed on ${new Date().toLocaleDateString()}*  
*Analysis depth: Comprehensive*  
*Confidence level: High*`;
};

// Helper function to create a summary from detailed AI-generated notes
const createSummaryFromDetailed = (detailedMarkdown: string): string => {
  // Extract the first few sections from the detailed markdown to create a summary
  const lines = detailedMarkdown.split('\n');
  const summaryLines: string[] = [];
  let inSummarySection = false;
  let sectionCount = 0;
  
  for (const line of lines) {
    // Look for main headings (# or ##)
    if (line.startsWith('# ') || line.startsWith('## ')) {
      sectionCount++;
      if (sectionCount <= 3) { // Include first 3 main sections
        summaryLines.push(line);
        inSummarySection = true;
      } else {
        break;
      }
    } else if (inSummarySection && line.trim()) {
      // Include content under the main headings, but limit it
      if (summaryLines.length < 15) { // Limit total lines
        summaryLines.push(line);
      }
    }
  }
  
  // If we couldn't extract a good summary, create a basic one
  if (summaryLines.length < 5) {
    return `## Key Points

- Main discussion focused on core concepts and their applications
- Several important insights emerged from the conversation  
- Key relationships between different ideas were explored

## Quick Takeaways

**Primary Focus**: Core concepts and practical applications
**Key Insight**: Important relationships between ideas
**Next Steps**: Areas identified for deeper exploration

---
*Summary generated on ${new Date().toLocaleDateString()}*`;
  }
  
  return summaryLines.join('\n') + `\n\n---\n*Summary generated on ${new Date().toLocaleDateString()}*`;
};

export default CanvasView;