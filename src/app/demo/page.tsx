'use client';

import React, { useState } from 'react';
import { ClientCodeRunner } from '@/components/ClientCodeRunner';
import { ClientExecutionResult } from '@/lib/clientCodeExecutor';

export default function DemoPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'cpp' | 'nodejs'>('python');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ClientExecutionResult | null>(null);

  const sampleCodes = {
    python: `# Python sample code
print("Hello from Python!")
print("2 + 3 =", 2 + 3)

# Test a simple function
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print("Fibonacci(10) =", fibonacci(10))

# Test list operations
numbers = [1, 2, 3, 4, 5]
print("Numbers:", numbers)
print("Sum:", sum(numbers))`,

    cpp: `#include <iostream>
#include <vector>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    cout << "Hello from C++!" << endl;
    cout << "2 + 3 = " << (2 + 3) << endl;
    
    cout << "Fibonacci(10) = " << fibonacci(10) << endl;
    
    // Test vector operations
    vector<int> numbers = {1, 2, 3, 4, 5};
    cout << "Numbers: ";
    for (int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    int sum = 0;
    for (int num : numbers) {
        sum += num;
    }
    cout << "Sum: " << sum << endl;
    
    return 0;
}`,

    nodejs: `// Node.js sample code
console.log("Hello from Node.js!");
console.log("2 + 3 =", 2 + 3);

// Test a simple function
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

console.log("Fibonacci(10) =", fibonacci(10));

// Test array operations
const numbers = [1, 2, 3, 4, 5];
console.log("Numbers:", numbers);
console.log("Sum:", numbers.reduce((a, b) => a + b, 0));

// Test object operations
const person = {
    name: "John",
    age: 30,
    greet: function() {
        return "Hello, I'm " + this.name + " and I'm " + this.age + " years old.";
    }
};

console.log(person.greet());`
  };

  const handleLanguageChange = (lang: 'python' | 'cpp' | 'nodejs') => {
    setSelectedLanguage(lang);
    setCode(sampleCodes[lang]);
    setResult(null);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setResult(null);
  };

  const handleResult = (executionResult: ClientExecutionResult) => {
    setResult(executionResult);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Client-Side Code Executor Demo
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              This demo showcases client-side code execution for Python, C++, and Node.js 
              running entirely in your browser without any backend or external API calls.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Code Editor Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Code Editor</h2>
                
                {/* Language Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Programming Language:
                  </label>
                  <div className="flex space-x-2">
                    {(['python', 'cpp', 'nodejs'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          selectedLanguage === lang
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your code:
                  </label>
                  <textarea
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Enter your ${selectedLanguage} code here...`}
                  />
                </div>

                {/* Run Button */}
                <ClientCodeRunner
                  language={selectedLanguage}
                  code={code}
                  onResult={handleResult}
                />
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Execution Results</h2>
              
              {result ? (
                <div className="space-y-4">
                  {/* Status */}
                  <div className={`p-4 rounded-md border ${
                    result.status === 'SUCCESS' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        result.status === 'SUCCESS' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.status === 'SUCCESS' ? '✅ Execution Successful' : '❌ Execution Failed'}
                      </span>
                      <span className={`text-sm ${
                        result.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.executionTime}ms
                      </span>
                    </div>
                  </div>

                  {/* Output */}
                  {result.output && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Output:</h3>
                      <pre className="bg-gray-100 p-3 rounded border text-sm overflow-x-auto whitespace-pre-wrap">
                        {result.output}
                      </pre>
                    </div>
                  )}

                  {/* Error */}
                  {result.error && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-700 mb-2">Error:</h3>
                      <pre className="bg-red-50 p-3 rounded border border-red-200 text-sm text-red-800 overflow-x-auto whitespace-pre-wrap">
                        {result.error}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">🚀</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to Execute Code
                  </h3>
                  <p className="text-gray-500">
                    Write some code and click &quot;Run&quot; to see the results here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">🐍</div>
                <h3 className="font-semibold text-gray-900 mb-2">Python (Pyodide)</h3>
                <p className="text-sm text-gray-600">
                  Full Python 3.11 support with standard library. Runs in WebAssembly for fast execution.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold text-gray-900 mb-2">C++ (JSCPP)</h3>
                <p className="text-sm text-gray-600">
                  C++ interpreter with support for basic language features and standard library functions.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🟨</div>
                <h3 className="font-semibold text-gray-900 mb-2">Node.js (QuickJS)</h3>
                <p className="text-sm text-gray-600">
                  JavaScript engine with ES2020 support. Fast and lightweight execution environment.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Technical Implementation</h2>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• <strong>Python:</strong> Uses Pyodide (Python compiled to WebAssembly) loaded from CDN</p>
              <p>• <strong>C++:</strong> Uses JSCPP (JavaScript-based C++ interpreter) loaded from CDN</p>
              <p>• <strong>Node.js:</strong> Uses QuickJS compiled to WebAssembly via quickjs-emscripten</p>
              <p>• <strong>Security:</strong> All execution happens in browser sandbox with no network requests</p>
              <p>• <strong>Performance:</strong> Optimized for educational and testing purposes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
