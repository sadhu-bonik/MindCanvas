import React, { useState } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import type { Card, ConversationContent } from '../../types';

export const FloatingInputTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const addCard = useCanvasStore((state) => state.addCard);
  const addConnection = useCanvasStore((state) => state.addConnection);
  const setHighlightedText = useCanvasStore((state) => state.setHighlightedText);
  const clearHighlight = useCanvasStore((state) => state.clearHighlight);
  const cards = useCanvasStore((state) => state.cards);
  const connections = useCanvasStore((state) => state.connections);
  const highlightedText = useCanvasStore((state) => state.highlightedText);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(message);
  };

  const createParentCard = () => {
    setLogs([]);
    addLog('🎨 Creating parent conversation card...');
    
    const parentCard: Omit<Card, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'conversation',
      position: { x: 200, y: 200 },
      content: {
        messages: [
          {
            id: Math.random().toString(36).substring(2, 11),
            role: 'user',
            content: 'What is quantum computing?',
            timestamp: new Date(),
          },
          {
            id: Math.random().toString(36).substring(2, 11),
            role: 'assistant',
            content: 'Quantum computing is a revolutionary technology that uses quantum mechanics principles to process information. It leverages quantum bits (qubits) that can exist in multiple states simultaneously, enabling parallel processing capabilities far beyond classical computers.',
            timestamp: new Date(),
          },
        ],
        isGeneratingNotes: false,
      } as ConversationContent,
      connections: [],
    };

    const addedCard = addCard(parentCard);
    addLog(`✅ Parent card created: ${addedCard.id}`);
  };

  const simulateTextSelection = () => {
    if (cards.length === 0) {
      addLog('❌ No parent card exists. Create one first.');
      return;
    }

    const parentCard = cards[0];
    addLog(`🎯 Simulating text selection on card: ${parentCard.id}`);

    const highlightData = {
      text: 'quantum mechanics principles',
      cardId: parentCard.id,
      position: { x: 400, y: 300 },
    };

    setHighlightedText(highlightData);
    addLog('✅ Text highlighted: ' + highlightData.text);
  };

  const simulateFloatingInputSubmit = () => {
    if (!highlightedText) {
      addLog('❌ No highlighted text. Select text first.');
      return;
    }

    const query = 'Can you explain this in more detail?';
    addLog(`🚀 Simulating floating input submit: "${query}"`);

    try {
      // Find source card
      const sourceCard = cards.find(c => c.id === highlightedText.cardId);
      if (!sourceCard) {
        addLog('❌ Source card not found');
        return;
      }

      // Calculate position
      const position = {
        x: sourceCard.position.x + 400,
        y: sourceCard.position.y + 100,
      };

      addLog(`📍 Calculated position: x=${position.x}, y=${position.y}`);

      // Create child card
      const userMessage = {
        id: Math.random().toString(36).substring(2, 11),
        role: 'user' as const,
        content: query,
        timestamp: new Date(),
      };

      const childCard: Omit<Card, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'conversation',
        position,
        content: {
          messages: [userMessage],
          isGeneratingNotes: false,
        } as ConversationContent,
        connections: [highlightedText.cardId],
      };

      addLog('🎨 Creating child card...');
      const addedCard = addCard(childCard);
      addLog(`✅ Child card created: ${addedCard.id}`);

      // Create connection
      addLog('🔗 Creating connection...');
      addConnection({
        sourceCardId: highlightedText.cardId,
        targetCardId: addedCard.id,
        highlightedText: highlightedText.text,
        sourcePosition: highlightedText.position,
      });
      addLog('✅ Connection created');

      // Clear highlight
      clearHighlight();
      addLog('🧹 Highlight cleared');

      // Simulate AI response after delay
      setTimeout(() => {
        addLog('🤖 Adding AI response...');
        const aiMessage = {
          id: Math.random().toString(36).substring(2, 11),
          role: 'assistant' as const,
          content: 'Quantum mechanics principles form the foundation of quantum computing. These include superposition (qubits existing in multiple states), entanglement (qubits being correlated), and interference (manipulating probability amplitudes).',
          timestamp: new Date(),
        };

        useCanvasStore.getState().updateCard(addedCard.id, {
          content: {
            messages: [userMessage, aiMessage],
            isGeneratingNotes: false,
          } as ConversationContent,
        });
        addLog('✅ AI response added');
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Error: ${errorMessage}`);
    }
  };

  const clearAll = () => {
    const { deleteCard } = useCanvasStore.getState();
    cards.forEach(card => deleteCard(card.id));
    clearHighlight();
    setLogs([]);
    addLog('🧹 Everything cleared');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Floating Input Test</h2>
        
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={createParentCard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            1. Create Parent Card
          </button>
          
          <button
            onClick={simulateTextSelection}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            2. Simulate Text Selection
          </button>
          
          <button
            onClick={simulateFloatingInputSubmit}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            3. Simulate Submit
          </button>
          
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All
          </button>
        </div>
        
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Cards: {cards.length}</h3>
            {cards.map((card, index) => (
              <div key={card.id} className="p-2 bg-blue-100 rounded text-sm mb-1">
                <div><strong>Card {index + 1}:</strong> {card.id.substring(0, 8)}</div>
                <div><strong>Position:</strong> x={card.position.x}, y={card.position.y}</div>
                <div><strong>Messages:</strong> {(card.content as ConversationContent).messages?.length || 0}</div>
              </div>
            ))}
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Connections: {connections.length}</h3>
            {connections.map((conn, index) => (
              <div key={conn.id} className="p-2 bg-green-100 rounded text-sm mb-1">
                <div><strong>Conn {index + 1}:</strong> {conn.id.substring(0, 8)}</div>
                <div><strong>From:</strong> {conn.sourceCardId.substring(0, 8)}</div>
                <div><strong>To:</strong> {conn.targetCardId.substring(0, 8)}</div>
              </div>
            ))}
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Highlighted Text</h3>
            {highlightedText ? (
              <div className="p-2 bg-yellow-100 rounded text-sm">
                <div><strong>Text:</strong> {highlightedText.text}</div>
                <div><strong>Card:</strong> {highlightedText.cardId.substring(0, 8)}</div>
                <div><strong>Position:</strong> x={highlightedText.position.x}, y={highlightedText.position.y}</div>
              </div>
            ) : (
              <div className="p-2 bg-gray-100 rounded text-sm">No text highlighted</div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4 h-64 overflow-y-auto">
          <h3 className="font-semibold mb-2">Test Logs:</h3>
          {logs.length === 0 ? (
            <p className="text-gray-500">Click buttons to run the test flow</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Instructions:</h4>
          <ol className="text-sm space-y-1">
            <li>1. Click "Create Parent Card" to create a conversation card</li>
            <li>2. Click "Simulate Text Selection" to highlight text</li>
            <li>3. Click "Simulate Submit" to create child card</li>
            <li>4. Go to /canvas to see if cards appear visually</li>
          </ol>
        </div>
      </div>
    </div>
  );
};