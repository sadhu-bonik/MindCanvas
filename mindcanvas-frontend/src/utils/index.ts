// Utility functions for ID generation and common operations
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Export browser behavior utilities
export {
  initializeBrowserBehavior,
  cleanupBrowserBehavior,
  preventContextMenu,
  preventContextMenuOnSelection,
  preventDrag,
  preventSelection,
  preventKeyboardShortcuts
} from './browserBehavior';

