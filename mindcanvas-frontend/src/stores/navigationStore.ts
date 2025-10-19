import { create } from 'zustand';
import type { NavigationStore, Note } from '../types';

// Utility function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  // State
  currentView: 'home',
  currentNote: null,
  notes: [],

  // Actions
  navigateToHome: () => {
    set({ currentView: 'home' });
  },

  navigateToCanvas: (noteId) => {
    set((state) => ({
      currentView: 'canvas',
      currentNote: noteId || state.currentNote,
    }));
  },

  createNote: (title) => {
    const newNote: Note = {
      id: generateId(),
      title,
      cards: [],
      connections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      notes: [...state.notes, newNote],
      currentNote: newNote.id,
      currentView: 'canvas',
    }));
  },

  selectNote: (noteId) => {
    const note = get().notes.find((n) => n.id === noteId);
    if (note) {
      // Update the note's updatedAt timestamp when selected
      set((state) => ({
        currentNote: noteId,
        currentView: 'canvas',
        notes: state.notes.map((n) =>
          n.id === noteId
            ? { ...n, updatedAt: new Date() }
            : n
        ),
      }));
    }
  },

  // New method to update a note's timestamp (called when cards are modified)
  updateNoteTimestamp: (noteId: string) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId
          ? { ...note, updatedAt: new Date() }
          : note
      ),
    }));
  },
}));