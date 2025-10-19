import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Card, SummaryContent } from '../../types';
import { useCanvasStore } from '../../stores/canvasStore';

interface SummaryCardProps {
  card: Card;
  onTextHighlight: (text: string, position: { x: number; y: number }, cardId: string) => void;
  onToggleExpansion?: (cardId: string) => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  card,
  onTextHighlight,
  onToggleExpansion,
}) => {
  const [selectedText, setSelectedText] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const setHighlightedText = useCanvasStore((state) => state.setHighlightedText);

  const content = card.content as SummaryContent;

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 3) {
      setSelectedText('');
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



    setSelectedText(selectedText);
    
    // Update the canvas store with highlighted text
    setHighlightedText({
      text: selectedText,
      cardId: card.id,
      position,
    });

    // Call the parent handler
    onTextHighlight(selectedText, position, card.id);
  }, [card.id, onTextHighlight, setHighlightedText]);

  const handleMouseUp = useCallback(() => {
    // Small delay to ensure selection is complete
    setTimeout(handleTextSelection, 10);
  }, [handleTextSelection]);

  const handleClickOutside = useCallback((e: React.MouseEvent) => {
    // Clear selection if clicking outside the content area
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
      setSelectedText('');
      setHighlightedText(null);
    }
  }, [setHighlightedText]);

  const isExpanded = content.isExpanded;
  const currentMarkdown = isExpanded ? content.detailedMarkdown : content.markdown;

  return (
    <motion.div
      className="bg-white rounded-lg shadow-lg border border-gray-200 w-[48rem] flex flex-col"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        height: isExpanded ? 'auto' : 'auto'
      }}
      transition={{ duration: 0.3 }}
      onClick={handleClickOutside}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          {isExpanded ? 'Detailed Notes' : 'Summary'}
        </h3>
        <div className="flex items-center space-x-2">
          {onToggleExpansion && (
            <motion.button
              onClick={() => onToggleExpansion(card.id)}
              className="w-8 h-8 rounded-lg transition-colors flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
              title={isExpanded ? "Show summary" : "Show detailed notes"}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isExpanded ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 15l7-7 7 7" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                )}
              </motion.svg>
            </motion.button>
          )}
          <div className="text-xs text-gray-500" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            {isExpanded ? 'Full Analysis' : 'Notes'}
          </div>
        </div>
      </div>

      {/* Markdown Content */}
      <motion.div 
        ref={contentRef}
        className={`p-4 cursor-text nopan selectable-text ${isExpanded ? 'overflow-y-auto' : ''}`}
        onMouseUp={handleMouseUp}
        style={{ 
          maxHeight: isExpanded ? '40rem' : 'none'
        }}
        animate={{ 
          height: isExpanded ? 'auto' : 'auto'
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="prose prose-sm max-w-none cursor-text nopan markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom styling for markdown elements - responsive to expanded state
              h1: ({ children }) => (
                <h1 className={`font-medium text-gray-900 mb-2 leading-tight cursor-text selectable-text ${isExpanded ? 'text-lg mb-3' : 'text-sm'}`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className={`font-medium text-gray-800 mb-2 leading-tight cursor-text selectable-text ${isExpanded ? 'text-base mb-3' : 'text-sm'}`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className={`font-medium text-gray-800 mb-1 leading-tight cursor-text selectable-text ${isExpanded ? 'text-sm mb-2' : 'text-xs'}`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className={`text-gray-700 leading-relaxed cursor-text selectable-text ${isExpanded ? 'text-sm mb-3' : 'text-xs mb-2'}`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className={`text-gray-700 cursor-text selectable-text ${isExpanded ? 'text-sm mb-3 pl-4 space-y-2' : 'text-xs mb-2 pl-3 space-y-1'}`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className={`text-gray-700 cursor-text selectable-text ${isExpanded ? 'text-sm mb-3 pl-4 space-y-2' : 'text-xs mb-2 pl-3 space-y-1'}`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed cursor-text" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', userSelect: 'text' }}>
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className={`border-l-4 border-blue-200 bg-blue-50 text-gray-700 italic cursor-text ${isExpanded ? 'pl-4 py-2 mb-3 text-sm' : 'pl-3 py-1 mb-2 text-xs'}`} style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', userSelect: 'text' }}>
                  {children}
                </blockquote>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className={`bg-gray-100 text-gray-800 rounded font-mono ${isExpanded ? 'px-2 py-1 text-sm' : 'px-1 py-0.5 text-xs'}`}>
                      {children}
                    </code>
                  );
                }
                return (
                  <code className={`block bg-gray-100 text-gray-800 rounded font-mono overflow-x-auto ${isExpanded ? 'p-4 text-sm' : 'p-3 text-xs'}`}>
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className={`bg-gray-100 rounded overflow-x-auto ${isExpanded ? 'p-4 mb-4' : 'p-3 mb-3'}`}>
                  {children}
                </pre>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900 cursor-text" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', userSelect: 'text' }}>
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-gray-800 cursor-text" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', userSelect: 'text' }}>
                  {children}
                </em>
              ),
              a: ({ children, href }) => (
                <a 
                  href={href} 
                  className="text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className={`overflow-x-auto ${isExpanded ? 'mb-4' : 'mb-3'}`}>
                  <table className={`min-w-full border-collapse border border-gray-300 ${isExpanded ? 'text-sm' : 'text-xs'}`}>
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className={`border border-gray-300 bg-gray-100 font-medium text-left ${isExpanded ? 'px-3 py-2' : 'px-2 py-1'}`}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className={`border border-gray-300 ${isExpanded ? 'px-3 py-2' : 'px-2 py-1'}`}>
                  {children}
                </td>
              ),
            }}
          >
            {currentMarkdown}
          </ReactMarkdown>
        </div>
      </motion.div>

      {/* Selection Indicator */}
      {selectedText && (
        <motion.div
          className="px-4 py-2 bg-blue-50 border-t border-blue-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <p className="text-xs text-blue-700" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            Selected: "{selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}"
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};