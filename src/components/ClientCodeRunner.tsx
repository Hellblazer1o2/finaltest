'use client';

import React, { useState } from 'react';
import { runCode, ClientExecutionResult } from '../lib/clientCodeExecutor';

interface CodeRunnerProps {
  language: 'python' | 'cpp' | 'nodejs';
  code: string;
  onResult?: (result: ClientExecutionResult) => void;
  className?: string;
}

export const ClientCodeRunner: React.FC<CodeRunnerProps> = ({ 
  language, 
  code, 
  onResult,
  className = ''
}) => {
  const [result, setResult] = useState<ClientExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunCode = async () => {
    if (!code.trim()) {
      setResult({
        status: 'ERROR',
        output: '',
        error: 'No code provided',
        executionTime: 0
      });
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      const executionResult = await runCode(language, code);
      setResult(executionResult);
      onResult?.(executionResult);
    } catch (error) {
      const errorResult: ClientExecutionResult = {
        status: 'ERROR',
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: 0
      };
      setResult(errorResult);
      onResult?.(errorResult);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className={`client-code-runner ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? 'Running...' : `Run ${language.toUpperCase()}`}
        </button>
        
        {result && (
          <span className={`text-sm font-medium ${
            result.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
          }`}>
            {result.status === 'SUCCESS' ? '✅ Success' : '❌ Error'} 
            ({result.executionTime}ms)
          </span>
        )}
      </div>

      {result && (
        <div className="mt-4">
          {result.status === 'SUCCESS' && result.output && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Output:</h4>
              <pre className="bg-gray-100 p-3 rounded border text-sm overflow-x-auto whitespace-pre-wrap">
                {result.output}
              </pre>
            </div>
          )}
          
          {result.error && (
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2">Error:</h4>
              <pre className="bg-red-50 p-3 rounded border border-red-200 text-sm text-red-800 overflow-x-auto whitespace-pre-wrap">
                {result.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientCodeRunner;