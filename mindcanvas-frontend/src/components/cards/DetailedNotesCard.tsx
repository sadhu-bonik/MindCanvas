import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Card, DetailedNotesContent } from '../../types';
import { useCanvasStore } from '../../stores/canvasStore';

interface DetailedNotesCardProps {
  card: Card;
  onTextHighlight: (text: string, position: { x: number; y: number }, cardId: string) => void;
}

export const DetailedNotesCard: React.FC<DetailedNotesCardProps> = ({
  card,
  onTextHighlight,
}) => {
  const [selectedText, setSelectedText] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const setHighlightedText = useCanvasStore((state) => state.setHighlightedText);

  const content = card.content as DetailedNotesContent;

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

  return (
    <motion.div
      className="bg-white rounded-lg shadow-lg border border-gray-200 w-[48rem] flex flex-col"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      onClick={handleClickOutside}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Detailed Notes</h3>
        <div className="text-xs text-gray-500" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          Full Analysis
        </div>
      </div>

      {/* Markdown Content */}
      <div 
        ref={contentRef}
        className="p-4 cursor-text nopan overflow-y-auto selectable-text"
        onMouseUp={handleMouseUp}
        style={{ maxHeight: '40rem' }}
      >
        <div className="prose prose-sm max-w-none cursor-text nopan markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom styling for markdown elements
              h1: ({ children }) => (
                <h1 className="text-lg font-semibold text-gray-900 mb-3 leading-tight cursor-text selectable-text" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-medium text-gray-800 mb-3 leading-tight cursor-text selectable-text" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-medium text-gray-800 mb-2 leading-tight cursor-text selectable-text" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-sm text-gray-700 mb-3 leading-relaxed cursor-text selectable-text" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="text-sm text-gray-700 mb-3 pl-4 space-y-2 cursor-text selectable-text" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="text-sm text-gray-700 mb-3 pl-4 space-y-2 cursor-text selectable-text" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed cursor-text selectable-text" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-200 pl-4 py-2 mb-3 bg-blue-50 text-sm text-gray-700 italic cursor-text" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', userSelect: 'text' }}>
                  {children}
                </blockquote>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
                      {children}
                    </code>
                  );
                }
                return (
                  <code className="block bg-gray-100 text-gray-800 p-4 rounded text-sm font-mono overflow-x-auto">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="bg-gray-100 rounded p-4 mb-4 overflow-x-auto">
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
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full text-sm border-collapse border border-gray-300">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-medium text-left">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-300 px-3 py-2">
                  {children}
                </td>
              ),
            }}
          >
            {content.markdown}
          </ReactMarkdown>
        </div>
      </div>

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