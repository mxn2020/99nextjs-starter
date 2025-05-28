// Basic Text Generation Example
// This example shows how to use the AI SDK Integration package for simple text generation

'use client';

import { useState } from 'react';
import { generateTextAction, streamTextAction } from '@99packages/ai-sdk-integration';
import type { GenerateTextParams } from '@99packages/ai-sdk-integration';

interface TextGenerationDemoProps {
  accountId: string; // Pass this from your authentication context
}

export function TextGenerationDemo({ accountId }: TextGenerationDemoProps) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Basic text generation (non-streaming)
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult('');

    try {
      const params: GenerateTextParams = {
        prompt: prompt.trim(),
        accountId,
        modelId: 'gpt-4o', // or 'gpt-4o-mini', 'claude-3-opus', etc.
      };

      const response = await generateTextAction(params);

      if (response.error) {
        setError(response.error);
      } else {
        setResult(response.data?.text || 'No text generated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Streaming text generation
  const handleStreamGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    setResult('');

    try {
      const params: GenerateTextParams = {
        prompt: prompt.trim(),
        accountId,
        modelId: 'gpt-4o',
      };

      const response = await streamTextAction(params);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (!response.data?.stream) {
        setError('No stream received');
        return;
      }

      // Read the stream
      const reader = response.data.stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setResult(prev => prev + chunk);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // Conversation with history
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);

  const handleConversation = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const params: GenerateTextParams = {
        prompt: prompt.trim(),
        accountId,
        modelId: 'gpt-4o',
        history: conversationHistory, // Include conversation context
      };

      const response = await generateTextAction(params);

      if (response.error) {
        setError(response.error);
      } else {
        const assistantResponse = response.data?.text || 'No response';
        
        // Update conversation history
        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: prompt.trim() },
          { role: 'assistant', content: assistantResponse },
        ]);
        
        setPrompt(''); // Clear input for next message
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Text Generation Demo</h1>
      
      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your prompt:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like me to help you with?"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            disabled={isLoading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && !isStreaming ? 'Generating...' : 'Generate Text'}
          </button>
          
          <button
            onClick={handleStreamGenerate}
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? 'Streaming...' : 'Stream Text'}
          </button>
          
          <button
            onClick={handleConversation}
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Thinking...' : 'Continue Conversation'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Generated Text:</h3>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="whitespace-pre-wrap text-gray-800">{result}</p>
          </div>
        </div>
      )}

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Conversation History:</h3>
            <button
              onClick={() => setConversationHistory([])}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear History
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {conversationHistory.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-50 border-l-4 border-blue-400'
                    : 'bg-green-50 border-l-4 border-green-400'
                }`}
              >
                <div className="text-sm font-medium text-gray-600 mb-1">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <p className="whitespace-pre-wrap text-gray-800">{message.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Tips */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Usage Tips:</h4>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• <strong>Generate Text:</strong> Creates complete response at once</li>
          <li>• <strong>Stream Text:</strong> Shows response as it's being generated</li>
          <li>• <strong>Continue Conversation:</strong> Maintains context across messages</li>
          <li>• Try different prompts to see various AI capabilities</li>
          <li>• All generations are automatically saved to your database</li>
        </ul>
      </div>
    </div>
  );
}

// Usage in a Next.js page:
// 
// import { TextGenerationDemo } from './components/TextGenerationDemo';
// import { getCurrentUser } from '@/lib/auth';
//
// export default async function TextGenerationPage() {
//   const user = await getCurrentUser();
//   
//   if (!user) {
//     redirect('/login');
//   }
//
//   return <TextGenerationDemo accountId={user.accountId} />;
// }
