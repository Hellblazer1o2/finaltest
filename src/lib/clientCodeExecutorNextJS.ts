import { getQuickJS } from 'quickjs-emscripten';

export interface ClientExecutionResult {
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  output: string;
  error: string;
  executionTime: number;
}

// Global types for the loaded libraries
declare global {
  interface Window {
    loadPyodide?: any;
    JSCPP?: any;
  }
}

export class ClientCodeExecutorNextJS {
  private pyodide: any = null;
  private quickJS: any = null;
  private jscpp: any = null;
  private isInitialized: { [key: string]: boolean } = {
    python: false,
    cpp: false,
    nodejs: false
  };

  constructor() {
    // Initialize will be done lazily when needed
  }

  /**
   * Sanitize Python code by removing invalid syntax
   */
  private sanitizePythonCode(code: string): string {
    // Remove JavaScript-style comments
    let sanitized = code.replace(/\/\/.*$/gm, '');
    
    // Remove template placeholders
    sanitized = sanitized.replace(/\/\/Code Here:/g, '');
    sanitized = sanitized.replace(/\/\/.*Code Here.*/g, '');
    
    // Remove empty lines and trim
    sanitized = sanitized.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
    
    return sanitized;
  }

  /**
   * Sanitize C++ code by removing invalid syntax
   */
  private sanitizeCppCode(code: string): string {
    // Remove JavaScript-style comments
    let sanitized = code.replace(/\/\/.*$/gm, '');
    
    // Remove template placeholders
    sanitized = sanitized.replace(/\/\/Code Here:/g, '');
    sanitized = sanitized.replace(/\/\/.*Code Here.*/g, '');
    
    // Remove empty lines and trim
    sanitized = sanitized.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
    
    return sanitized;
  }

  /**
   * Sanitize Node.js code by removing invalid syntax
   */
  private sanitizeNodejsCode(code: string): string {
    // Remove template placeholders (JavaScript comments are valid, so we only remove specific placeholders)
    let sanitized = code.replace(/\/\/Code Here:/g, '');
    sanitized = sanitized.replace(/\/\/.*Code Here.*/g, '');
    
    // Remove empty lines and trim
    sanitized = sanitized.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
    
    return sanitized;
  }

  /**
   * Load Pyodide using a more reliable method
   */
  private async loadPyodide(): Promise<any> {
    if (typeof window === 'undefined') {
      throw new Error('Pyodide can only be loaded in the browser');
    }

    // Check if already loaded
    if (window.loadPyodide) {
      return window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        fullStdLib: false
      });
    }

    // Load Pyodide script
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
      script.crossOrigin = 'anonymous';
      script.async = true;
      
      script.onload = async () => {
        try {
          // Wait for the script to fully initialize
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (!window.loadPyodide) {
            reject(new Error('loadPyodide function not found after script load'));
            return;
          }

          const pyodide = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
            fullStdLib: false
          });
          
          resolve(pyodide);
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        reject(new Error('Failed to load Pyodide script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Load JSCPP using a more reliable method
   */
  private async loadJSCPP(): Promise<any> {
    if (typeof window === 'undefined') {
      throw new Error('JSCPP can only be loaded in the browser');
    }

    // Check if already loaded
    if (window.JSCPP) {
      return window.JSCPP;
    }

    // Load JSCPP script
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jscpp@latest/dist/jscpp.min.js';
      script.crossOrigin = 'anonymous';
      script.async = true;
      
      script.onload = () => {
        setTimeout(() => {
          if (!window.JSCPP) {
            reject(new Error('JSCPP not found after script load'));
            return;
          }
          resolve(window.JSCPP);
        }, 500);
      };

      script.onerror = () => {
        reject(new Error('Failed to load JSCPP script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Pyodide for Python execution
   */
  private async initializePython(): Promise<void> {
    if (this.isInitialized.python) return;

    try {
      this.pyodide = await this.loadPyodide();
      this.isInitialized.python = true;
    } catch (error) {
      throw new Error(`Failed to initialize Python: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize JSCPP for C++ execution
   */
  private async initializeCpp(): Promise<void> {
    if (this.isInitialized.cpp) return;

    try {
      this.jscpp = await this.loadJSCPP();
      this.isInitialized.cpp = true;
    } catch (error) {
      throw new Error(`Failed to initialize C++: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize QuickJS for Node.js execution
   */
  private async initializeNodejs(): Promise<void> {
    if (this.isInitialized.nodejs) return;

    try {
      this.quickJS = await getQuickJS();
      this.isInitialized.nodejs = true;
    } catch (error) {
      throw new Error(`Failed to initialize Node.js: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute Python code using Pyodide
   */
  private async executePython(code: string): Promise<ClientExecutionResult> {
    const startTime = Date.now();
    
    try {
      await this.initializePython();
      
      // Sanitize the code first
      const sanitizedCode = this.sanitizePythonCode(code);
      
      if (!sanitizedCode.trim()) {
        return {
          status: 'ERROR',
          output: '',
          error: 'No valid Python code found after sanitization',
          executionTime: Date.now() - startTime
        };
      }
      
      // Set up stdout capture
      this.pyodide.runPython(`
import sys
from io import StringIO

# Create a new StringIO object for capturing output
captured_output = StringIO()
old_stdout = sys.stdout
sys.stdout = captured_output
      `);

      // Execute user code
      try {
        await this.pyodide.runPythonAsync(sanitizedCode);
      } catch (execError) {
        // Restore stdout before handling error
        this.pyodide.runPython('sys.stdout = old_stdout');
        throw execError;
      }

      // Get captured output and restore stdout
      this.pyodide.runPython(`
sys.stdout = old_stdout
output_text = captured_output.getvalue()
      `);

      const output = this.pyodide.globals.get('output_text') || '';

      const executionTime = Date.now() - startTime;

      return {
        status: 'SUCCESS',
        output: output || '(no output)',
        error: '',
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Try to get any partial output
      let partialOutput = '';
      try {
        if (this.pyodide) {
          this.pyodide.runPython('sys.stdout = old_stdout');
          partialOutput = this.pyodide.globals.get('output_text') || '';
        }
      } catch {
        // Ignore errors when trying to get partial output
      }
      
      return {
        status: 'ERROR',
        output: partialOutput,
        error: error instanceof Error ? error.message : 'Python execution failed',
        executionTime
      };
    }
  }

  /**
   * Execute C++ code using JSCPP
   */
  private async executeCpp(code: string): Promise<ClientExecutionResult> {
    const startTime = Date.now();
    
    try {
      await this.initializeCpp();
      
      // Sanitize the code first
      const sanitizedCode = this.sanitizeCppCode(code);
      
      if (!sanitizedCode.trim()) {
        return {
          status: 'ERROR',
          output: '',
          error: 'No valid C++ code found after sanitization',
          executionTime: Date.now() - startTime
        };
      }
      
      // Create JSCPP instance
      const cppInstance = new this.jscpp();
      
      // Execute C++ code
      const result = cppInstance.run(sanitizedCode);
      
      const executionTime = Date.now() - startTime;

      return {
        status: 'SUCCESS',
        output: result.output || '(no output)',
        error: result.error || '',
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        status: 'ERROR',
        output: '',
        error: error instanceof Error ? error.message : 'C++ execution failed',
        executionTime
      };
    }
  }

  /**
   * Execute Node.js code using QuickJS
   */
  private async executeNodejs(code: string): Promise<ClientExecutionResult> {
    const startTime = Date.now();
    
    try {
      await this.initializeNodejs();
      
      // Sanitize the code first
      const sanitizedCode = this.sanitizeNodejsCode(code);
      
      if (!sanitizedCode.trim()) {
        return {
          status: 'ERROR',
          output: '',
          error: 'No valid JavaScript code found after sanitization',
          executionTime: Date.now() - startTime
        };
      }
      
      // Create a new QuickJS context
      const vm = this.quickJS.newContext();
      
      // Set up console.log to capture output
      let output = '';
      const consoleLog = vm.newFunction('log', (...args: any[]) => {
        const message = args.map(arg => vm.dump(arg)).join(' ');
        output += message + '\n';
      });
      
      const console = vm.newObject();
      vm.setProp(console, 'log', consoleLog);
      vm.setProp(vm.global, 'console', console);
      
      // Execute the code
      const result = vm.evalCode(sanitizedCode);
      
      if (result.error) {
        const error = vm.dump(result.error);
        result.error.dispose();
        vm.dispose();
        consoleLog.dispose();
        console.dispose();
        
        const executionTime = Date.now() - startTime;
        return {
          status: 'ERROR',
          output: '',
          error: error,
          executionTime
        };
      }
      
      const returnValue = vm.dump(result.value);
      result.value.dispose();
      vm.dispose();
      consoleLog.dispose();
      console.dispose();
      
      const executionTime = Date.now() - startTime;

      return {
        status: 'SUCCESS',
        output: output || returnValue || '(no output)',
        error: '',
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        status: 'ERROR',
        output: '',
        error: error instanceof Error ? error.message : 'Node.js execution failed',
        executionTime
      };
    }
  }

  /**
   * Main function to execute code in the specified language
   * @param language - The programming language ('python', 'cpp', 'nodejs')
   * @param code - The code to execute
   * @returns Promise<ClientExecutionResult> - The execution result
   */
  async runCode(language: string, code: string): Promise<ClientExecutionResult> {
    const normalizedLanguage = language.toLowerCase().trim();
    
    switch (normalizedLanguage) {
      case 'python':
      case 'py':
        return this.executePython(code);
      
      case 'cpp':
      case 'c++':
      case 'cplusplus':
        return this.executeCpp(code);
      
      case 'nodejs':
      case 'node.js':
      case 'javascript':
      case 'js':
        return this.executeNodejs(code);
      
      default:
        return {
          status: 'ERROR',
          output: '',
          error: `Unsupported language: ${language}. Supported languages are: python, cpp, nodejs`,
          executionTime: 0
        };
    }
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    const normalizedLanguage = language.toLowerCase().trim();
    return ['python', 'py', 'cpp', 'c++', 'cplusplus', 'nodejs', 'node.js', 'javascript', 'js'].includes(normalizedLanguage);
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): string[] {
    return ['python', 'cpp', 'nodejs'];
  }
}

// Create and export a singleton instance
export const clientCodeExecutorNextJS = new ClientCodeExecutorNextJS();

// Export the main function for convenience
export const runCodeNextJS = (language: string, code: string): Promise<ClientExecutionResult> => {
  return clientCodeExecutorNextJS.runCode(language, code);
};
