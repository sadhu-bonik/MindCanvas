import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationStore } from '../../stores/navigationStore';

interface SidebarProps {
  className?: string;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '', onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { notes, currentNote, createNote, selectNote } = useNavigationStore();

  const handleCollapseToggle = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapseChange?.(collapsed);
  };

  const handleCreateNote = () => {
    const noteTitle = `Note ${notes.length + 1}`;
    createNote(noteTitle);
  };

  const handleNoteSelect = (noteId: string) => {
    selectNote(noteId);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <motion.div
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-20 ${className}`}
      initial={{ x: -320 }}
      animate={{ x: isCollapsed ? -280 : 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }}
    >
      {/* Sidebar Content */}
      <div className="w-80 h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Notes
            </h2>
            <button
              onClick={() => handleCollapseToggle(!isCollapsed)}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors duration-200"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <motion.svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </motion.svg>
            </button>
          </div>

          {/* Create Note Button */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.button
                onClick={handleCreateNote}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors duration-200 font-medium"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Note
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                className="p-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                {notes.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm">No notes yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Create your first note to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notes.map((note, index) => (
                      <motion.button
                        key={note.id}
                        onClick={() => handleNoteSelect(note.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                          currentNote === note.id
                            ? 'bg-gray-100 border border-gray-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: index * 0.05 
                        }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium text-sm truncate ${
                              currentNote === note.id
                                ? 'text-gray-900'
                                : 'text-gray-700 group-hover:text-gray-900'
                            }`}>
                              {note.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatDate(note.updatedAt)}
                              </span>
                              {note.cards.length > 0 && (
                                <span className="text-xs text-gray-400">
                                  • {note.cards.length} card{note.cards.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          {currentNote === note.id && (
                            <motion.div
                              className="w-2 h-2 bg-gray-900 rounded-full ml-2 mt-1"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.2 }}
                            />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="p-4 border-t border-gray-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-xs text-gray-500 text-center">
                {notes.length} note{notes.length !== 1 ? 's' : ''} total
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapsed State Indicator */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.div
            className="absolute left-0 top-0 w-10 h-full flex flex-col items-center justify-start pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <button
              onClick={() => handleCollapseToggle(false)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 mb-4"
              title="Expand sidebar"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            
            {/* Collapsed note indicators */}
            <div className="space-y-2">
              {notes.slice(0, 5).map((note, index) => (
                <motion.button
                  key={note.id}
                  onClick={() => {
                    handleCollapseToggle(false);
                    handleNoteSelect(note.id);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                    currentNote === note.id
                      ? 'bg-gray-900 border-gray-900'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                  title={note.title}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    duration: 0.2, 
                    delay: 0.2 + index * 0.05 
                  }}
                  whileHover={{ scale: 1.1 }}
                />
              ))}
              {notes.length > 5 && (
                <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-500 font-medium">
                    +{notes.length - 5}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Sidebar;