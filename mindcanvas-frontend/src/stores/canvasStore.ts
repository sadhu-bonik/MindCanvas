import { create } from 'zustand';
import type { CanvasStore, Card, Connection } from '../types';

// Utility function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const useCanvasStore = create<CanvasStore>((set) => ({
  // State
  cards: [],
  connections: [],
  selectedCard: null,
  highlightedText: null,

  // Actions
  addCard: (cardData) => {
    console.log('🎨 CanvasStore.addCard called with:', cardData);
    
    const newCard: Card = {
      ...cardData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('✅ Created new card:', newCard.id, 'Type:', newCard.type, 'Position:', newCard.position);

    set((state) => {
      const newCards = [...state.cards, newCard];
      console.log('📊 Updated cards array. Old count:', state.cards.length, 'New count:', newCards.length);
      return { cards: newCards };
    });

    console.log('🎉 Card added to store successfully:', newCard.id);
    return newCard; // Return the created card so we can get its ID
  },

  updateCard: (cardId, updates) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId
          ? { ...card, ...updates, updatedAt: new Date() }
          : card
      ),
    }));
  },

  deleteCard: (cardId) => {
    set((state) => ({
      cards: state.cards.filter((card) => card.id !== cardId),
      connections: state.connections.filter(
        (connection) =>
          connection.sourceCardId !== cardId &&
          connection.targetCardId !== cardId
      ),
      selectedCard: state.selectedCard === cardId ? null : state.selectedCard,
    }));
  },

  addConnection: (connectionData) => {
    const newConnection: Connection = {
      ...connectionData,
      id: generateId(),
    };

    set((state) => ({
      connections: [...state.connections, newConnection],
    }));
  },

  setHighlightedText: (highlight) => {
    set({ highlightedText: highlight });
  },

  clearHighlight: () => {
    set({ highlightedText: null });
  },
}));