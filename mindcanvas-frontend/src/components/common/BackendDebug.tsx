import React, { useState } from 'react';
import { useAI } from '../../hooks/useAI';
import { isBackendAvailable, refreshBackendStatus } from '../../services';

export const BackendDebug: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { createMap, createBlock, sendBlockMessage, finalizeBlock } = useAI();

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBackendConnection = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('🔍 Testing backend connection...');
      
      // Test 1: Check backend availability
      const available = isBackendAvailable();
      addResult(`Backend available (cached): ${available}`);
      
      // Test 2: Refresh backend status
      const refreshed = await refreshBackendStatus();
      addResult(`Backend available (fresh): ${refreshed}`);
      
      if (!refreshed) {
        addResult('❌ Backend not available - stopping tests');
        return;
      }
      
      // Test 3: Create map
      addResult('🗺️ Creating test map...');
      const { mapId, title } = await createMap('Test integration query');
      addResult(`✅ Map created: ${mapId} - "${title}"`);
      
      // Test 4: Create block
      addResult('🧱 Creating test block...');
      const { blockId, response } = await createBlock(mapId, 'Hello, can you hear me?');
      addResult(`✅ Block created: ${blockId}`);
      addResult(`📝 AI Response: ${response.substring(0, 100)}...`);
      
      // Test 5: Send follow-up message
      addResult('💬 Sending follow-up message...');
      const followUp = await sendBlockMessage(blockId, 'Can you tell me more?');
      addResult(`✅ Follow-up response: ${followUp.response.substring(0, 100)}...`);
      
      // Test 6: Finalize block
      addResult('🔄 Finalizing block...');
      const { summary, reformattedContent } = await finalizeBlock(blockId);
      addResult(`✅ Summary: ${summary.substring(0, 100)}...`);
      addResult(`✅ Reformatted: ${reformattedContent.substring(0, 100)}...`);
      
      addResult('🎉 All tests passed!');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Test failed: ${errorMessage}`);
      console.error('Backend test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Backend Integration Debug</h2>
        
        <div className="mb-4">
          <button
            onClick={testBackendConnection}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Testing...' : 'Test Backend Integration'}
          </button>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4 h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500">Click "Test Backend Integration" to run tests</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};