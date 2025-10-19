// Core data models
export interface Card {
  id: string;
  backendId?: string;   // Backend block ID
  mapId?: string;       // Backend map ID
  type: 'conversation' | 'summary' | 'detailed-notes';
  position: { x: number; y: number };
  content: ConversationContent | SummaryContent | DetailedNotesContent;
  connections: string[]; // IDs of connected cards
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationContent {
  messages: Message[];
  isGeneratingNotes: boolean;
}

export interface SummaryContent {
  markdown: string;
  detailedMarkdown: string; // The detailed notes content
  originalConversationId: string;
  isExpanded: boolean; // Whether the card is showing detailed notes
}

export interface DetailedNotesContent {
  markdown: string;
  originalConversationId: string;
  isVisible: boolean; // Whether the detailed notes are currently shown
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Connection {
  id: string;
  sourceCardId: string;
  targetCardId: string;
  highlightedText: string;
  sourcePosition: { x: number; y: number };
}

export interface Note {
  id: string;
  backendId?: string;   // Backend map ID
  title: string;
  cards: Card[];
  connections: Connection[];
  createdAt: Date;
  updatedAt: Date;
}

// Store interfaces
export interface CanvasStore {
  // State
  cards: Card[];
  connections: Connection[];
  selectedCard: string | null;
  highlightedText: { 
    text: string; 
    cardId: string; 
    position: { x: number; y: number } 
  } | null;
  
  // Actions
  addCard: (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => Card;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  deleteCard: (cardId: string) => void;
  addConnection: (connection: Omit<Connection, 'id'>) => void;
  setHighlightedText: (highlight: CanvasStore['highlightedText']) => void;
  clearHighlight: () => void;
}

export interface NavigationStore {
  currentView: 'home' | 'canvas';
  currentNote: string | null;
  notes: Note[];
  
  navigateToHome: () => void;
  navigateToCanvas: (noteId?: string) => void;
  createNote: (title: string) => void;
  selectNote: (noteId: string) => void;
  updateNoteTimestamp: (noteId: string) => void;
}