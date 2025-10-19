// Utility functions to control browser behavior for app-like experience

/**
 * Prevents the default context menu from appearing
 */
export const preventContextMenu = (event: Event) => {
  // Always prevent context menu, regardless of target
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  return false;
};

/**
 * Enhanced context menu prevention for text selections
 */
export const preventContextMenuOnSelection = (event: MouseEvent) => {
  // Prevent context menu specifically on right-click
  if (event.button === 2) { // Right mouse button
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }
  return true;
};

/**
 * Prevents default drag behavior
 */
export const preventDrag = (event: Event) => {
  event.preventDefault();
  return false;
};

/**
 * Prevents text selection for non-selectable elements
 */
export const preventSelection = (event: Event) => {
  const target = event.target as HTMLElement;
  
  // Allow selection for specific elements
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.contentEditable === 'true' ||
    target.closest('.selectable-text') ||
    target.closest('.message-content') ||
    target.closest('.markdown-content')
  ) {
    return true;
  }
  
  event.preventDefault();
  return false;
};

/**
 * Prevents keyboard shortcuts that might interfere with the app
 */
export const preventKeyboardShortcuts = (event: KeyboardEvent) => {
  // Prevent F12 (DevTools)
  if (event.key === 'F12') {
    event.preventDefault();
    return false;
  }
  
  // Prevent Ctrl+Shift+I (DevTools)
  if (event.ctrlKey && event.shiftKey && event.key === 'I') {
    event.preventDefault();
    return false;
  }
  
  // Prevent Ctrl+U (View Source)
  if (event.ctrlKey && event.key === 'u') {
    event.preventDefault();
    return false;
  }
  
  // Prevent Ctrl+S (Save Page)
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    return false;
  }
  
  // Allow other shortcuts
  return true;
};

/**
 * Initialize browser behavior overrides
 */
export const initializeBrowserBehavior = () => {
  // Prevent context menu on all events
  document.addEventListener('contextmenu', preventContextMenu, { passive: false, capture: true });
  
  // Additional context menu prevention on mouse events
  document.addEventListener('mousedown', preventContextMenuOnSelection, { passive: false, capture: true });
  document.addEventListener('mouseup', preventContextMenuOnSelection, { passive: false, capture: true });
  
  // Prevent context menu on touch devices
  document.addEventListener('touchstart', (event) => {
    // Prevent long press context menu on mobile
    if (event.touches.length === 1) {
      setTimeout(() => {
        event.preventDefault();
      }, 500);
    }
  }, { passive: false });
  
  // Prevent drag and drop
  document.addEventListener('dragstart', preventDrag, { passive: false });
  document.addEventListener('drop', preventDrag, { passive: false });
  document.addEventListener('dragover', preventDrag, { passive: false });
  
  // Prevent text selection on non-selectable elements
  document.addEventListener('selectstart', preventSelection, { passive: false });
  
  // Prevent certain keyboard shortcuts
  document.addEventListener('keydown', preventKeyboardShortcuts, { passive: false });
  
  // Prevent image dragging
  document.addEventListener('dragstart', (event) => {
    if (event.target instanceof HTMLImageElement && !event.target.classList.contains('interactive')) {
      event.preventDefault();
      return false;
    }
  }, { passive: false });
  
  // Disable text selection on double click for non-selectable elements
  document.addEventListener('mousedown', (event) => {
    if (event.detail > 1) { // Multiple clicks
      const target = event.target as HTMLElement;
      if (
        !target.closest('.selectable-text') &&
        !target.closest('.message-content') &&
        !target.closest('.markdown-content') &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA' &&
        target.contentEditable !== 'true'
      ) {
        event.preventDefault();
      }
    }
  }, { passive: false });
  
  // Additional prevention for browser-specific context menus
  document.addEventListener('auxclick', (event) => {
    // Prevent middle-click and right-click actions
    if (event.button === 1 || event.button === 2) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, { passive: false, capture: true });
  
  // Prevent selection context menu on text
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      // Clear any pending context menu timeouts
      setTimeout(() => {
        // Additional prevention after selection
        document.addEventListener('contextmenu', preventContextMenu, { 
          passive: false, 
          capture: true, 
          once: true 
        });
      }, 10);
    }
  });
};

/**
 * Clean up browser behavior overrides
 */
export const cleanupBrowserBehavior = () => {
  document.removeEventListener('contextmenu', preventContextMenu);
  document.removeEventListener('mousedown', preventContextMenuOnSelection);
  document.removeEventListener('mouseup', preventContextMenuOnSelection);
  document.removeEventListener('dragstart', preventDrag);
  document.removeEventListener('drop', preventDrag);
  document.removeEventListener('dragover', preventDrag);
  document.removeEventListener('selectstart', preventSelection);
  document.removeEventListener('keydown', preventKeyboardShortcuts);
};