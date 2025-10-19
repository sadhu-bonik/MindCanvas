# FloatingInput Component

The FloatingInput component provides a floating text input interface that appears near highlighted text, allowing users to ask questions about specific content and create linked conversations.

## Components

### FloatingInput
The core floating input component with auto-positioning and animations.

**Props:**
- `position: { x: number; y: number }` - Initial position for the floating input
- `highlightedText: string` - The text that was highlighted by the user
- `cardId: string` - ID of the card containing the highlighted text
- `onSubmit: (query: string, highlightedText: string, cardId: string) => void` - Callback when user submits a question
- `onClose: () => void` - Callback when user closes the input
- `isVisible: boolean` - Controls visibility of the component

**Features:**
- Auto-positioning to avoid screen edges
- Smooth show/hide animations with Framer Motion
- Keyboard navigation (Enter to submit, Escape to close)
- Click outside to close
- Responsive design

### FloatingInputManager
A manager component that integrates with the canvas store to handle highlighted text state.

**Props:**
- `onCreateLinkedConversation: (query: string, highlightedText: string, sourceCardId: string) => void` - Callback to create linked conversations

**Features:**
- Automatically shows/hides based on canvas store highlighted text state
- Manages the lifecycle of the floating input
- Integrates with Zustand store

## Usage

### Basic Usage
```tsx
import { FloatingInput } from './components/common/FloatingInput';

<FloatingInput
  position={{ x: 300, y: 200 }}
  highlightedText="Selected text content"
  cardId="card-123"
  onSubmit={(query, text, cardId) => {
    // Handle the submitted question
    console.log('Question:', query, 'About:', text, 'From:', cardId);
  }}
  onClose={() => {
    // Handle close
  }}
  isVisible={true}
/>
```

### With Store Integration
```tsx
import { FloatingInputManager } from './components/common/FloatingInputManager';

<FloatingInputManager
  onCreateLinkedConversation={(query, highlightedText, sourceCardId) => {
    // Create a new conversation card linked to the source
    createLinkedConversation(query, highlightedText, sourceCardId);
  }}
/>
```

### Integration with SummaryCard
The FloatingInput is designed to work with the SummaryCard component's text highlighting functionality:

```tsx
import { SummaryCard } from './components/cards/SummaryCard';
import { FloatingInputManager } from './components/common/FloatingInputManager';

// In your canvas or main component
<div>
  <SummaryCard
    card={summaryCard}
    onTextHighlight={(text, position, cardId) => {
      // This will update the canvas store with highlighted text
      // FloatingInputManager will automatically show the input
    }}
  />
  
  <FloatingInputManager
    onCreateLinkedConversation={handleCreateLinkedConversation}
  />
</div>
```

## Requirements Fulfilled

This implementation fulfills the following requirements from the spec:

- **Requirement 3.1**: ✅ Displays a small floating text input bar near highlighted text
- **Requirement 3.2**: ✅ Handles form submission for creating linked conversations  
- **Requirement 3.3**: ✅ Creates new conversation cards when questions are submitted

## Demo Components

- `FloatingInputDemo` - Standalone demo showing basic functionality
- `FloatingInputIntegrationDemo` - Full integration demo with SummaryCard

## Styling

The component uses Tailwind CSS for styling and follows the application's design system:
- Clean, minimal design
- Consistent with other card components
- Smooth animations and transitions
- Responsive layout
- Proper focus states and accessibility

## Accessibility

- Keyboard navigation support
- Focus management
- ARIA labels for screen readers
- High contrast support
- Proper tab order