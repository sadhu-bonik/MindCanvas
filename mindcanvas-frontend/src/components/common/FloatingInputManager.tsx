import React from 'react';
import { FloatingInput } from './FloatingInput';
import type { CanvasStore } from '../../types';

interface FloatingInputManagerProps {
  highlightedText: CanvasStore['highlightedText'];
  onSubmit: (query: string) => void;
  onClose: () => void;
}

export const FloatingInputManager: React.FC<FloatingInputManagerProps> = ({
  highlightedText,
  onSubmit,
  onClose,
}) => {
  const handleSubmit = (query: string, _highlightedText: string, _cardId: string) => {
    console.log('🚀 FloatingInput submitted:', { query, highlightedText: _highlightedText, cardId: _cardId });
    onSubmit(query);
  };

  console.log('🎯 FloatingInputManager render, highlightedText:', highlightedText);

  if (!highlightedText) {
    console.log('❌ No highlighted text, not rendering FloatingInput');
    return null;
  }

  console.log('✅ Rendering FloatingInput with:', {
    position: highlightedText.position,
    text: highlightedText.text,
    cardId: highlightedText.cardId
  });

  return (
    <FloatingInput
      position={highlightedText.position}
      highlightedText={highlightedText.text}
      cardId={highlightedText.cardId}
      onSubmit={handleSubmit}
      onClose={onClose}
      isVisible={true}
    />
  );
};