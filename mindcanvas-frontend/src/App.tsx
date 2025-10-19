import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary, HomePage, CanvasView, AIServiceDemo } from './components';
import { BackendDebug } from './components/common/BackendDebug';
import { SimpleBackendTest } from './components/common/SimpleBackendTest';
import { NavigationTest } from './components/common/NavigationTest';
import { CardCreationTest } from './components/common/CardCreationTest';
import { FloatingInputTest } from './components/common/FloatingInputTest';
import { config } from './config/environment';
import { initializeBrowserBehavior, cleanupBrowserBehavior } from './utils';

function App() {
  // Initialize browser behavior overrides on mount
  useEffect(() => {
    initializeBrowserBehavior();
    
    // Cleanup on unmount
    return () => {
      cleanupBrowserBehavior();
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/canvas" element={<CanvasView />} />
            <Route path="/canvas/:noteId" element={<CanvasView />} />
            {/* Development-only AI service demo route */}
            {config.features.enableAIServiceDemo && (
              <Route path="/ai-demo" element={<AIServiceDemo />} />
            )}
            {/* Backend debug route */}
            {config.features.enableAIServiceDemo && (
              <Route path="/debug" element={<BackendDebug />} />
            )}
            {/* Simple backend test route */}
            {config.features.enableAIServiceDemo && (
              <Route path="/test" element={<SimpleBackendTest />} />
            )}
            {/* Navigation test route */}
            {config.features.enableAIServiceDemo && (
              <Route path="/nav-test" element={<NavigationTest />} />
            )}
            {/* Card creation test route */}
            {config.features.enableAIServiceDemo && (
              <Route path="/card-test" element={<CardCreationTest />} />
            )}
            {/* Floating input test route */}
            {config.features.enableAIServiceDemo && (
              <Route path="/floating-test" element={<FloatingInputTest />} />
            )}
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
