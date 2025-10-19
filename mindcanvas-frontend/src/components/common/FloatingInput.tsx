import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingInputProps {
  position: { x: number; y: number };
  highlightedText: string;
  cardId: string;
  onSubmit: (query: string, highlightedText: string, cardId: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  position,
  highlightedText,
  cardId,
  onSubmit,
  onClose,
  isVisible,
}) => {
  const [query, setQuery] = useState('');
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-positioning to avoid screen edges
  const calculatePosition = useCallback(() => {
    if (!containerRef.current) return position;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let { x, y } = position;
    
    // Adjust horizontal position to avoid right edge
    if (x + containerRect.width > viewportWidth - 20) {
      x = viewportWidth - containerRect.width - 20;
    }
    
    // Adjust horizontal position to avoid left edge
    if (x < 20) {
      x = 20;
    }
    
    // Adjust vertical position to avoid bottom edge
    if (y + containerRect.height > viewportHeight - 20) {
      y = position.y - containerRect.height - 20; // Position above the selection
    }
    
    // Adjust vertical position to avoid top edge
    if (y < 20) {
      y = 20;
    }
    
    return { x, y };
  }, [position]);

  // Update position when component mounts or position changes
  useEffect(() => {
    if (isVisible && containerRef.current) {
      // Small delay to ensure container is rendered
      setTimeout(() => {
        setAdjustedPosition(calculatePosition());
      }, 10);
    }
  }, [isVisible, position, calculatePosition]);

  // Focus input when component becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query.trim(), highlightedText, cardId);
      setQuery('');
      onClose();
    }
  };

  // Handle escape key to close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef}
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-80 max-w-96"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
          }}
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ 
            duration: 0.2, 
            ease: [0.4, 0.0, 0.2, 1] // Custom easing for smooth animation
          }}
        >
          {/* Header with highlighted text preview */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Ask about:</p>
            <p className="text-xs text-gray-700 bg-blue-50 px-2 py-1 rounded border-l-2 border-blue-300 italic" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              "{highlightedText.length > 60 ? highlightedText.substring(0, 60) + '...' : highlightedText}"
            </p>
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What would you like to know about this?"
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            />
            
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              >
                Cancel (Esc)
              </button>
              
              <button
                type="submit"
                disabled={!query.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              >
                Ask Question
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};