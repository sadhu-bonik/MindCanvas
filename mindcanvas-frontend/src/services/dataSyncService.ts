import type { Note, Card, Message, Connection } from '../types';
import type { BackendMap, BackendBlock, BackendMessage } from './api';

export class DataSyncService {
  /**
   * Convert backend map to frontend note
   */
  static mapToNote(backendMap: BackendMap): Note {
    const cards = backendMap.blocks.map(block => this.blockToCard(block, backendMap.mapId));
    const connections = this.extractConnections(backendMap.blocks);

    return {
      id: backendMap.mapId,
      backendId: backendMap.mapId,
      title: backendMap.title,
      cards,
      connections,
      createdAt: new Date(backendMap.createdAt),
      updatedAt: new Date(backendMap.updatedAt),
    };
  }

  /**
   * Convert backend block to frontend card
   */
  static blockToCard(backendBlock: BackendBlock, mapId: string): Card {
    // Determine card position (simple grid layout for now)
    const position = this.calculateCardPosition(backendBlock);

    if (backendBlock.isFinalized) {
      // Create summary or detailed notes card
      const cardType = backendBlock.parentBlockId ? 'summary' : 'detailed-notes';
      
      return {
        id: backendBlock.blockId,
        backendId: backendBlock.blockId,
        mapId,
        type: cardType,
        position,
        content: {
          markdown: backendBlock.summary || '',
          detailedMarkdown: backendBlock.reformattedContent || '',
          originalConversationId: backendBlock.blockId,
          isExpanded: false,
        },
        connections: [], // Will be populated by extractConnections
        createdAt: new Date(backendBlock.createdAt),
        updatedAt: new Date(backendBlock.updatedAt),
      };
    } else {
      // Create conversation card
      const messages = backendBlock.messages ? 
        backendBlock.messages.map(msg => this.backendMessageToMessage(msg)) : [];

      return {
        id: backendBlock.blockId,
        backendId: backendBlock.blockId,
        mapId,
        type: 'conversation',
        position,
        content: {
          messages,
          isGeneratingNotes: false,
        },
        connections: [], // Will be populated by extractConnections
        createdAt: new Date(backendBlock.createdAt),
        updatedAt: new Date(backendBlock.updatedAt),
      };
    }
  }

  /**
   * Convert backend message to frontend message
   */
  static backendMessageToMessage(backendMessage: BackendMessage): Message {
    return {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: backendMessage.role,
      content: backendMessage.content,
      timestamp: new Date(backendMessage.timestamp),
    };
  }

  /**
   * Extract connections from backend blocks (parent-child relationships)
   */
  static extractConnections(blocks: BackendBlock[]): Connection[] {
    const connections: Connection[] = [];
    
    blocks.forEach(block => {
      if (block.parentBlockId) {
        connections.push({
          id: `${block.parentBlockId}_${block.blockId}`,
          sourceCardId: block.parentBlockId,
          targetCardId: block.blockId,
          highlightedText: 'Connected from parent', // Backend doesn't store this yet
          sourcePosition: { x: 0, y: 0 }, // Will be updated when rendering
        });
      }
    });

    return connections;
  }

  /**
   * Calculate card position based on block metadata
   */
  static calculateCardPosition(block: BackendBlock): { x: number; y: number } {
    // Simple positioning algorithm - can be enhanced later
    const hash = this.hashString(block.blockId);
    const baseX = 200;
    const baseY = 200;
    const spacing = 300;
    
    // Create a grid-like layout with some randomness
    const gridX = (hash % 3) * spacing;
    const gridY = Math.floor(hash / 3) * spacing;
    
    return {
      x: baseX + gridX,
      y: baseY + gridY,
    };
  }

  /**
   * Simple hash function for consistent positioning
   */
  static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Convert frontend note to backend map format (for saving)
   */
  static noteToMap(note: Note): Partial<BackendMap> {
    return {
      mapId: note.backendId || note.id,
      title: note.title,
      // Note: blocks would need to be converted separately
      // This is mainly for metadata updates
    };
  }

  /**
   * Convert frontend card to backend block format (for saving)
   */
  static cardToBlock(card: Card): Partial<BackendBlock> {
    return {
      blockId: card.backendId || card.id,
      title: this.generateBlockTitle(card),
      isFinalized: card.type !== 'conversation',
      // Add other fields as needed
    };
  }

  /**
   * Generate a title for a block based on its content
   */
  static generateBlockTitle(card: Card): string {
    if (card.type === 'conversation' && 'messages' in card.content) {
      const messages = card.content.messages;
      if (messages && messages.length > 0) {
        const firstUserMessage = messages.find(msg => msg.role === 'user');
        if (firstUserMessage) {
          return firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
        }
      }
    }
    
    return `${card.type} - ${new Date().toLocaleDateString()}`;
  }

  /**
   * Merge backend data with existing frontend data
   */
  static mergeNoteData(existingNote: Note, backendMap: BackendMap): Note {
    const backendNote = this.mapToNote(backendMap);
    
    // Preserve frontend-specific data while updating with backend data
    return {
      ...existingNote,
      title: backendNote.title,
      backendId: backendNote.backendId,
      cards: this.mergeCards(existingNote.cards, backendNote.cards),
      connections: backendNote.connections,
      updatedAt: backendNote.updatedAt,
    };
  }

  /**
   * Merge card arrays, preserving frontend positions when possible
   */
  static mergeCards(existingCards: Card[], backendCards: Card[]): Card[] {
    const mergedCards: Card[] = [];
    
    backendCards.forEach(backendCard => {
      const existingCard = existingCards.find(card => 
        card.backendId === backendCard.backendId || card.id === backendCard.id
      );
      
      if (existingCard) {
        // Merge existing card with backend data, preserving position
        mergedCards.push({
          ...backendCard,
          position: existingCard.position, // Preserve frontend position
        });
      } else {
        // New card from backend
        mergedCards.push(backendCard);
      }
    });
    
    return mergedCards;
  }
}

// Export singleton instance
export const dataSyncService = DataSyncService;