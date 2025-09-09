import { getQuickJS } from 'quickjs-emscripten';
import { simpleCppExecutor } from './simpleCppExecutor';

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

export class ClientCodeExecutorRobust {
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
   * Load Pyodide using multiple CDN sources
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

    // Try multiple CDN sources
    const pyodideSources = [
      'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js',
      'https://unpkg.com/pyodide@0.24.1/pyodide.js',
      'https://cdn.skypack.dev/pyodide@0.24.1'
    ];

    for (const src of pyodideSources) {
      try {
        const pyodide = await this.loadScript(src, 'loadPyodide');
        if (pyodide) {
          return pyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
            fullStdLib: false
          });
        }
      } catch (error) {
        console.warn(`Failed to load Pyodide from ${src}:`, error);
        continue;
      }
    }

    throw new Error('Failed to load Pyodide from any CDN source');
  }

  /**
   * Load JSCPP using multiple CDN sources
   */
  private async loadJSCPP(): Promise<any> {
    if (typeof window === 'undefined') {
      throw new Error('JSCPP can only be loaded in the browser');
    }

    // Check if already loaded
    if (window.JSCPP) {
      return window.JSCPP;
    }

    // Try multiple CDN sources for JSCPP
    const jscppSources = [
      'https://cdn.jsdelivr.net/npm/jscpp@latest/dist/jscpp.min.js',
      'https://unpkg.com/jscpp@latest/dist/jscpp.min.js',
      'https://cdn.skypack.dev/jscpp@latest'
    ];

    for (const src of jscppSources) {
      try {
        const jscpp = await this.loadScript(src, 'JSCPP');
        if (jscpp) {
          return jscpp;
        }
      } catch (error) {
        console.warn(`Failed to load JSCPP from ${src}:`, error);
        continue;
      }
    }

    throw new Error('Failed to load JSCPP from any CDN source');
  }

  /**
   * Generic script loader with retry logic
   */
  private async loadScript(src: string, globalVar: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.async = true;
      
      let resolved = false;
      
      script.onload = () => {
        if (resolved) return;
        resolved = true;
        
        // Wait for the script to fully initialize
        setTimeout(() => {
          if (window[globalVar as keyof Window]) {
            resolve(window[globalVar as keyof Window]);
          } else {
            reject(new Error(`${globalVar} not found after script load`));
          }
        }, 1000);
      };

      script.onerror = () => {
        if (resolved) return;
        resolved = true;
        reject(new Error(`Failed to load script from ${src}`));
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (resolved) return;
        resolved = true;
        reject(new Error(`Timeout loading script from ${src}`));
      }, 10000);

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
   * Initialize QuickJS for Node.js execution with better memory management
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
   * Execute C++ code using JSCPP with fallback to simple executor
   */
  private async executeCpp(code: string): Promise<ClientExecutionResult> {
    const startTime = Date.now();
    
    try {
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
      
      // Try to use JSCPP first
      try {
        await this.initializeCpp();
        
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
      } catch (jscppError) {
        console.warn('JSCPP failed, using simple C++ executor:', jscppError);
        
        // Fallback to simple C++ executor
        const simpleResult = await simpleCppExecutor.executeSimpleCpp(sanitizedCode);
        
        return {
          status: simpleResult.status,
          output: simpleResult.output,
          error: simpleResult.error,
          executionTime: simpleResult.executionTime
        };
      }
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
   * Execute Node.js code using QuickJS with better memory management
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
      
      // Use a more careful approach to avoid memory issues
      let vm: any = null;
      let consoleLog: any = null;
      let console: any = null;
      let result: any = null;
      
      try {
        // Create a new QuickJS context
        vm = this.quickJS.newContext();
        
        // Set up console.log to capture output
        let output = '';
        consoleLog = vm.newFunction('log', (...args: any[]) => {
          const message = args.map(arg => vm.dump(arg)).join(' ');
          output += message + '\n';
        });
        
        console = vm.newObject();
        vm.setProp(console, 'log', consoleLog);
        vm.setProp(vm.global, 'console', console);
        
        // Execute the code
        result = vm.evalCode(sanitizedCode);
        
        if (result.error) {
          const error = vm.dump(result.error);
          result.error.dispose();
          
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
        
        const executionTime = Date.now() - startTime;

        return {
          status: 'SUCCESS',
          output: output || returnValue || '(no output)',
          error: '',
          executionTime
        };
        
      } catch (execError) {
        const executionTime = Date.now() - startTime;
        return {
          status: 'ERROR',
          output: '',
          error: execError instanceof Error ? execError.message : 'JavaScript execution failed',
          executionTime
        };
      } finally {
        // Clean up resources in the correct order
        try {
          if (result && result.value) {
            result.value.dispose();
          }
          if (result && result.error) {
            result.error.dispose();
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        
        try {
          if (consoleLog) {
            consoleLog.dispose();
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        
        try {
          if (console) {
            console.dispose();
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        
        try {
          if (vm) {
            vm.dispose();
          }
        } catch (e) {
          // Ignore cleanup errors - this is where the error was occurring
          console.warn('QuickJS context disposal warning (this is usually safe to ignore)');
        }
      }
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
export const clientCodeExecutorRobust = new ClientCodeExecutorRobust();

// Export the main function for convenience
export const runCodeRobust = (language: string, code: string): Promise<ClientExecutionResult> => {
  return clientCodeExecutorRobust.runCode(language, code);
};
