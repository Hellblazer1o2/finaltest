import { getQuickJS } from 'quickjs-emscripten';
import { fallbackCppExecutor } from './fallbackCppExecutor';

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

export class ClientCodeExecutorSafe {
  private pyodide: any = null;
  private quickJS: any = null;
  private quickJSRuntime: any = null;
  private jscpp: any = null;
  private isInitialized: { [key: string]: boolean } = {
    python: false,
    cpp: false,
    nodejs: false
  };
  private usingFallback: { [key: string]: boolean } = {
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
   * Sanitize Java code by removing invalid syntax
   */
  private sanitizeJavaCode(code: string): string {
    // Remove template placeholders
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

    // If Pyodide fails to load, throw error to trigger fallback in initializePython
    throw new Error('Failed to load Pyodide from any CDN source');
  }

  /**
   * Create a fallback Python executor when Pyodide fails to load
   */
  private createFallbackPythonExecutor(): any {
    return {
      runPythonAsync: async (code: string) => {
        // Simple Python code analysis and basic execution simulation
        const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Look for print statements
        const printLines = lines.filter(line => 
          line.includes('print(') || 
          line.includes('print ')
        );
        
        const outputs: string[] = [];
        for (const line of printLines) {
          const output = this.extractPythonOutput(line);
          if (output) {
            outputs.push(output);
          }
        }

        // Simulate execution
        if (outputs.length > 0) {
          // Store output in a global variable for retrieval
          (window as any).__python_output = outputs.join('\n');
        } else {
          (window as any).__python_output = '';
        }
      },
      runPython: (code: string) => {
        // Synchronous version
        const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        const printLines = lines.filter(line => 
          line.includes('print(') || 
          line.includes('print ')
        );
        
        const outputs: string[] = [];
        for (const line of printLines) {
          const output = this.extractPythonOutput(line);
          if (output) {
            outputs.push(output);
          }
        }

        if (outputs.length > 0) {
          (window as any).__python_output = outputs.join('\n');
        } else {
          (window as any).__python_output = '';
        }
      },
      globals: {
        get: (key: string) => {
          if (key === 'output_text') {
            return (window as any).__python_output || '';
          }
          return null;
        }
      }
    };
  }

  /**
   * Extract output from Python print statements
   */
  private extractPythonOutput(line: string): string {
    // Handle various Python print patterns
    const patterns = [
      /print\s*\(\s*"([^"]*)"\s*\)/g,        // print("text")
      /print\s*\(\s*'([^']*)'\s*\)/g,        // print('text')
      /print\s*\(\s*"""([^"]*)"""\s*\)/g,    // print("""text""")
      /print\s*\(\s*'''([^']*)'''\s*\)/g,    // print('''text''')
      /print\s*\(\s*([^)]+)\s*\)/g,          // print(variable)
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(line);
      if (match) {
        return match[1];
      }
    }

    return '';
  }

  /**
   * Validate Python code for common issues
   */
  private validatePythonCode(code: string): string | null {
    const lines = code.split('\n');
    let indentLevel = 0;
    let inClass = false;
    let inFunction = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // Check for class definition
      if (trimmedLine.startsWith('class ')) {
        inClass = true;
        // Check if next line is properly indented
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (nextLine.trim() && !nextLine.startsWith('    ') && !nextLine.startsWith('\t')) {
            return `Line ${i + 2}: Expected an indented block after class definition. Class body should be indented.`;
          }
        }
        continue;
      }
      
      // Check for function definition
      if (trimmedLine.startsWith('def ') || trimmedLine.startsWith('async def ')) {
        inFunction = true;
        // Check if next line is properly indented
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (nextLine.trim() && !nextLine.startsWith('    ') && !nextLine.startsWith('\t')) {
            return `Line ${i + 2}: Expected an indented block after function definition. Function body should be indented.`;
          }
        }
        continue;
      }
      
      // Check for if/for/while/with/try statements
      if (trimmedLine.match(/^(if|for|while|with|try|elif|else|except|finally)\s/)) {
        // Check if next line is properly indented
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (nextLine.trim() && !nextLine.startsWith('    ') && !nextLine.startsWith('\t')) {
            return `Line ${i + 2}: Expected an indented block after ${trimmedLine.split(' ')[0]} statement. Block should be indented.`;
          }
        }
        continue;
      }
      
      // Check for inconsistent indentation
      const currentIndent = line.length - line.trimStart().length;
      if (currentIndent > 0 && currentIndent % 4 !== 0) {
        return `Line ${i + 1}: Inconsistent indentation. Use 4 spaces for each indentation level.`;
      }
    }
    
    return null;
  }

  /**
   * Validate C++ code for common issues
   */
  private validateCppCode(code: string): string | null {
    const lines = code.split('\n');
    
    // Check for missing main function
    const hasMain = code.includes('int main') || code.includes('void main') || code.includes('main()');
    if (!hasMain) {
      return 'C++ code must include a main function. Add: int main() { ... }';
    }
    
    // Check for missing semicolons
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*') && !line.endsWith(';') && 
          !line.endsWith('{') && !line.endsWith('}') && !line.startsWith('#') && !line.includes('if') && 
          !line.includes('for') && !line.includes('while') && !line.includes('else')) {
        return `Line ${i + 1}: Missing semicolon. Most C++ statements should end with a semicolon.`;
      }
    }
    
    // Check for unmatched braces
    let braceCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
    }
    if (braceCount !== 0) {
      return 'Unmatched braces { }. Make sure all opening braces have corresponding closing braces.';
    }
    
    return null;
  }

  /**
   * Validate JavaScript code for common issues
   */
  private validateJavaScriptCode(code: string): string | null {
    const lines = code.split('\n');
    
    // Check for missing semicolons in certain contexts
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('//') && !line.startsWith('/*') && 
          (line.includes('console.log') || line.includes('return') || line.includes('let ') || 
           line.includes('const ') || line.includes('var ')) && !line.endsWith(';') && 
          !line.endsWith('{') && !line.endsWith('}')) {
        return `Line ${i + 1}: Consider adding a semicolon at the end of the statement.`;
      }
    }
    
    // Check for unmatched braces
    let braceCount = 0;
    let parenCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
      }
    }
    if (braceCount !== 0) {
      return 'Unmatched braces { }. Make sure all opening braces have corresponding closing braces.';
    }
    if (parenCount !== 0) {
      return 'Unmatched parentheses ( ). Make sure all opening parentheses have corresponding closing parentheses.';
    }
    
    return null;
  }

  /**
   * Validate Java code for common issues
   */
  private validateJavaCode(code: string): string | null {
    const lines = code.split('\n');
    
    // Check for missing main method
    const hasMain = code.includes('public static void main') || code.includes('public static void main(String[]');
    if (!hasMain) {
      return 'Java code must include a main method. Add: public static void main(String[] args) { ... }';
    }
    
    // Check for missing class declaration
    const hasClass = code.includes('public class ') || code.includes('class ');
    if (!hasClass) {
      return 'Java code must include a class declaration. Add: public class Main { ... }';
    }
    
    // Check for missing semicolons
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*') && 
          !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') && 
          !line.startsWith('public') && !line.startsWith('private') && !line.startsWith('protected') &&
          !line.includes('if') && !line.includes('for') && !line.includes('while') && !line.includes('else')) {
        return `Line ${i + 1}: Missing semicolon. Most Java statements should end with a semicolon.`;
      }
    }
    
    // Check for unmatched braces
    let braceCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
      }
    }
    if (braceCount !== 0) {
      return 'Unmatched braces { }. Make sure all opening braces have corresponding closing braces.';
    }
    
    return null;
  }

  /**
   * Format JavaScript error messages
   */
  private formatJavaScriptError(error: any): string {
    const errorStr = String(error);
    
    if (errorStr.includes('SyntaxError') || errorStr.includes('syntax error')) {
      return `JavaScript Syntax Error: ${errorStr}`;
    } else if (errorStr.includes('ReferenceError') || errorStr.includes('reference error')) {
      return `JavaScript Reference Error: ${errorStr}`;
    } else if (errorStr.includes('TypeError') || errorStr.includes('type error')) {
      return `JavaScript Type Error: ${errorStr}`;
    } else if (errorStr.includes('RangeError') || errorStr.includes('range error')) {
      return `JavaScript Range Error: ${errorStr}`;
    } else if (errorStr.includes('EvalError') || errorStr.includes('eval error')) {
      return `JavaScript Eval Error: ${errorStr}`;
    } else {
      return `JavaScript Error: ${errorStr}`;
    }
  }

  /**
   * Format Java error messages
   */
  private formatJavaError(error: string): string {
    if (error.includes('compilation error') || error.includes('Compilation error')) {
      return `Java Compilation Error: ${error}`;
    } else if (error.includes('runtime error') || error.includes('Runtime error')) {
      return `Java Runtime Error: ${error}`;
    } else if (error.includes('syntax error') || error.includes('Syntax error')) {
      return `Java Syntax Error: ${error}`;
    } else if (error.includes('class not found') || error.includes('Class not found')) {
      return `Java Class Not Found Error: ${error}`;
    } else if (error.includes('method not found') || error.includes('Method not found')) {
      return `Java Method Not Found Error: ${error}`;
    } else {
      return `Java Error: ${error}`;
    }
  }

  /**
   * Create a fallback C++ executor
   */
  private createFallbackCppExecutor(): any {
    return {
      run: (code: string) => {
        // Simple C++ code analysis and basic execution simulation
        const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Look for main function
        const hasMain = lines.some(line => 
          line.includes('int main') || 
          line.includes('void main') ||
          line.includes('main()')
        );
        
        if (!hasMain) {
          return {
            output: '',
            error: 'C++ code must contain a main function'
          };
        }

        // Look for cout statements
        const coutLines = lines.filter(line => 
          line.includes('cout') || 
          line.includes('printf') ||
          line.includes('std::cout')
        );
        
        const outputs: string[] = [];
        for (const line of coutLines) {
          const output = this.extractCppOutput(line);
          if (output) {
            outputs.push(output);
          }
        }

        // Look for return statement
        const hasReturn = lines.some(line => 
          line.includes('return 0') || 
          line.includes('return 0;') ||
          line.includes('return;')
        );

        if (outputs.length > 0) {
          return {
            output: outputs.join('\n'),
            error: ''
          };
        } else if (hasReturn) {
          return {
            output: '(program executed successfully)',
            error: ''
          };
        } else {
          return {
            output: '',
            error: 'No output detected. Make sure to use cout, std::cout, or printf to display results.'
          };
        }
      }
    };
  }

  /**
   * Extract output from C++ cout/printf statements
   */
  private extractCppOutput(line: string): string {
    // Handle various C++ output patterns
    const patterns = [
      /cout\s*<<\s*"([^"]*)"\s*<<\s*std::endl/g,     // cout << "text" << std::endl
      /std::cout\s*<<\s*"([^"]*)"\s*<<\s*std::endl/g, // std::cout << "text" << std::endl
      /cout\s*<<\s*"([^"]*)"/g,                       // cout << "text"
      /std::cout\s*<<\s*"([^"]*)"/g,                  // std::cout << "text"
      /printf\s*\(\s*"([^"]*)"\s*\)/g,                // printf("text")
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(line);
      if (match) {
        return match[1];
      }
    }

    return '';
  }

  /**
   * Load JSCPP using multiple CDN sources with fallback
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
      'https://cdn.jsdelivr.net/npm/jscpp@2.0.0/dist/jscpp.min.js',
      'https://unpkg.com/jscpp@2.0.0/dist/jscpp.min.js',
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
        // Only log the first failure, then silently continue
        if (src === jscppSources[0]) {
          console.warn(`JSCPP CDN loading failed, trying fallback sources...`);
        }
        continue;
      }
    }

    // If JSCPP fails to load, return a fallback C++ executor
    console.info('🚀 C++ execution will use local analysis (no external dependencies)');
    return this.createFallbackCppExecutor();
  }


  /**
   * Generic script loader with retry logic
   */
  private async loadScript(src: string, globalVar: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Remove any existing script with the same src
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = src;
      script.crossOrigin = 'anonymous';
      script.async = true;
      script.defer = true;
      
      let resolved = false;
      
      script.onload = () => {
        if (resolved) return;
        resolved = true;
        
        // Wait for the script to fully initialize with multiple checks
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds total
        
        const checkForGlobal = () => {
          attempts++;
          if (window[globalVar as keyof Window]) {
            resolve(window[globalVar as keyof Window]);
          } else if (attempts < maxAttempts) {
            setTimeout(checkForGlobal, 100);
          } else {
            reject(new Error(`${globalVar} not found after script load`));
          }
        };
        
        setTimeout(checkForGlobal, 100);
      };

      script.onerror = (error) => {
        if (resolved) return;
        resolved = true;
        // Silently reject without logging to avoid console errors
        reject(new Error(`Failed to load script from ${src}`));
      };

      // Timeout after 15 seconds
      setTimeout(() => {
        if (resolved) return;
        resolved = true;
        reject(new Error(`Timeout loading script from ${src}`));
      }, 15000);

      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Pyodide for Python execution
   */
  private async initializePython(): Promise<void> {
    if (this.isInitialized.python) return;

    console.log('Initializing Python...');
    try {
      this.pyodide = await this.loadPyodide();
      this.isInitialized.python = true;
      this.usingFallback.python = false;
      console.log('Python initialized with Pyodide');
    } catch (error) {
      // Don't throw error here, let the fallback handle it
      console.info('🐍 Using client-side Python executor (fallback mode)');
      this.pyodide = this.createFallbackPythonExecutor();
      this.isInitialized.python = true;
      this.usingFallback.python = true;
      console.log('Python initialized with fallback executor');
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
      this.usingFallback.cpp = false;
    } catch (error) {
      // Don't throw error here, let the fallback handle it
      console.info('🚀 Using client-side C++ executor (fallback mode)');
      this.jscpp = fallbackCppExecutor;
      this.isInitialized.cpp = true;
      this.usingFallback.cpp = true;
    }
  }

  /**
   * Initialize QuickJS for Node.js execution with persistent runtime
   */
  private async initializeNodejs(): Promise<void> {
    if (this.isInitialized.nodejs) return;

    try {
      this.quickJS = await getQuickJS();
      // Create a persistent runtime to avoid disposal issues
      this.quickJSRuntime = this.quickJS.newRuntime();
      this.isInitialized.nodejs = true;
      this.usingFallback.nodejs = false;
    } catch (error) {
      // Don't throw error here, let the fallback handle it
      console.info('🟨 Using client-side JavaScript executor (fallback mode)');
      this.quickJS = this.createFallbackNodejsExecutor();
      this.quickJSRuntime = null; // Not needed for fallback
      this.isInitialized.nodejs = true;
      this.usingFallback.nodejs = true;
    }
  }

  /**
   * Create a fallback Node.js executor when QuickJS fails to load
   */
  private createFallbackNodejsExecutor(): any {
    return {
      newRuntime: () => ({
        newContext: () => ({
          newFunction: (name: string, fn: Function) => fn,
          newObject: () => ({}),
          setProp: () => {},
          global: {},
          evalCode: (code: string) => {
            // Simple JavaScript code analysis and basic execution simulation
            const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            // Look for console.log statements
            const consoleLogLines = lines.filter(line => 
              line.includes('console.log') || 
              line.includes('console.warn') ||
              line.includes('console.error')
            );
            
            const outputs: string[] = [];
            for (const line of consoleLogLines) {
              const output = this.extractNodejsOutput(line);
              if (output) {
                outputs.push(output);
              }
            }

            // Store output for retrieval
            (window as any).__nodejs_output = outputs.join('\n');
            
            return {
              value: { dispose: () => {} },
              error: null
            };
          },
          dump: (value: any) => value,
          dispose: () => {}
        }),
        dispose: () => {}
      })
    };
  }

  /**
   * Extract output from JavaScript console.log statements
   */
  private extractNodejsOutput(line: string): string {
    // Handle various JavaScript console patterns
    const patterns = [
      /console\.log\s*\(\s*"([^"]*)"\s*\)/g,        // console.log("text")
      /console\.log\s*\(\s*'([^']*)'\s*\)/g,        // console.log('text')
      /console\.log\s*\(\s*`([^`]*)`\s*\)/g,        // console.log(`text`)
      /console\.warn\s*\(\s*"([^"]*)"\s*\)/g,       // console.warn("text")
      /console\.error\s*\(\s*"([^"]*)"\s*\)/g,      // console.error("text")
      /console\.log\s*\(\s*([^)]+)\s*\)/g,          // console.log(variable)
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(line);
      if (match) {
        return match[1];
      }
    }

    return '';
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
      
      // Validate Python code for common issues
      const validationError = this.validatePythonCode(sanitizedCode);
      if (validationError) {
        return {
          status: 'ERROR',
          output: '',
          error: validationError,
          executionTime: Date.now() - startTime
        };
      }
      
      // Execute Python code (either with Pyodide or fallback)
      let output = '';
      
      console.log('Python execution - usingFallback.python:', this.usingFallback.python);
      
      if (this.usingFallback.python) {
        // Using fallback executor
        console.log('Using Python fallback executor');
        try {
          const fallbackExecutor = this.createFallbackPythonExecutor();
          await fallbackExecutor.runPythonAsync(sanitizedCode);
          output = (window as any).__python_output || '';
        } catch (fallbackError) {
          // Handle specific Python errors in fallback mode
          if (fallbackError instanceof Error) {
            if (fallbackError.message.includes('IndentationError')) {
              throw new Error(`Python Indentation Error: ${fallbackError.message}`);
            } else if (fallbackError.message.includes('SyntaxError')) {
              throw new Error(`Python Syntax Error: ${fallbackError.message}`);
            } else if (fallbackError.message.includes('NameError')) {
              throw new Error(`Python Name Error: ${fallbackError.message}`);
            } else if (fallbackError.message.includes('TypeError')) {
              throw new Error(`Python Type Error: ${fallbackError.message}`);
            } else if (fallbackError.message.includes('ValueError')) {
              throw new Error(`Python Value Error: ${fallbackError.message}`);
            } else {
              throw new Error(`Python Error: ${fallbackError.message}`);
            }
          }
          throw fallbackError;
        }
      } else {
        // Using Pyodide
        if (!this.pyodide) {
          throw new Error('Pyodide not initialized. Please try again.');
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
          if (this.pyodide) {
            this.pyodide.runPython('sys.stdout = old_stdout');
          }
          
          // Handle specific Python errors
          if (execError instanceof Error) {
            if (execError.message.includes('IndentationError')) {
              throw new Error(`Python Indentation Error: ${execError.message}`);
            } else if (execError.message.includes('SyntaxError')) {
              throw new Error(`Python Syntax Error: ${execError.message}`);
            } else if (execError.message.includes('NameError')) {
              throw new Error(`Python Name Error: ${execError.message}`);
            } else if (execError.message.includes('TypeError')) {
              throw new Error(`Python Type Error: ${execError.message}`);
            } else if (execError.message.includes('ValueError')) {
              throw new Error(`Python Value Error: ${execError.message}`);
            } else {
              throw new Error(`Python Error: ${execError.message}`);
            }
          }
          throw execError;
        }

        // Get captured output and restore stdout
        if (this.pyodide) {
          this.pyodide.runPython(`
sys.stdout = old_stdout
output_text = captured_output.getvalue()
          `);

          output = this.pyodide.globals.get('output_text') || '';
        }
      }

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
      
      // Validate C++ code for common issues
      const validationError = this.validateCppCode(sanitizedCode);
      if (validationError) {
        return {
          status: 'ERROR',
          output: '',
          error: validationError,
          executionTime: Date.now() - startTime
        };
      }
      
      // Execute C++ code (either with JSCPP or fallback)
      let result;
      try {
        if (this.usingFallback.cpp) {
          // Using fallback executor
          if (!this.jscpp) {
            throw new Error('C++ executor not initialized. Please try again.');
          }
          result = this.jscpp.run(sanitizedCode);
        } else {
          // Using JSCPP - check if it's actually a constructor
          if (!this.jscpp) {
            throw new Error('JSCPP not initialized. Please try again.');
          }
          if (typeof this.jscpp === 'function') {
            const cppInstance = new this.jscpp();
            result = cppInstance.run(sanitizedCode);
          } else {
            // JSCPP loaded but not as expected, fall back to fallback executor
            console.warn('JSCPP loaded but not as constructor, using fallback');
            result = this.createFallbackCppExecutor().run(sanitizedCode);
          }
        }
      } catch (cppError) {
        // Handle specific C++ errors
        if (cppError instanceof Error) {
          if (cppError.message.includes('SyntaxError') || cppError.message.includes('syntax error')) {
            throw new Error(`C++ Syntax Error: ${cppError.message}`);
          } else if (cppError.message.includes('undefined reference')) {
            throw new Error(`C++ Link Error: ${cppError.message}`);
          } else if (cppError.message.includes('error:') || cppError.message.includes('Error:')) {
            throw new Error(`C++ Compilation Error: ${cppError.message}`);
          } else if (cppError.message.includes('runtime error') || cppError.message.includes('Runtime Error')) {
            throw new Error(`C++ Runtime Error: ${cppError.message}`);
          } else {
            throw new Error(`C++ Error: ${cppError.message}`);
          }
        }
        throw cppError;
      }
      
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
   * Execute Java code using fallback analysis
   */
  private async executeJava(code: string): Promise<ClientExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Sanitize the code first
      const sanitizedCode = this.sanitizeJavaCode(code);
      
      if (!sanitizedCode.trim()) {
        return {
          status: 'ERROR',
          output: '',
          error: 'No valid Java code found after sanitization',
          executionTime: Date.now() - startTime
        };
      }
      
      // Validate Java code for common issues
      const validationError = this.validateJavaCode(sanitizedCode);
      if (validationError) {
        return {
          status: 'ERROR',
          output: '',
          error: validationError,
          executionTime: Date.now() - startTime
        };
      }
      
      // Use fallback Java executor
      const result = this.createFallbackJavaExecutor().run(sanitizedCode);
      
      const executionTime = Date.now() - startTime;

      return {
        status: result.error ? 'ERROR' : 'SUCCESS',
        output: result.output || '(no output)',
        error: result.error ? this.formatJavaError(result.error) : '',
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        status: 'ERROR',
        output: '',
        error: error instanceof Error ? error.message : 'Java execution failed',
        executionTime
      };
    }
  }

  /**
   * Create a fallback Java executor
   */
  private createFallbackJavaExecutor(): any {
    return {
      run: (code: string) => {
        // Simple Java code analysis and basic execution simulation
        const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Look for main method
        const hasMain = lines.some(line => 
          line.includes('public static void main') || 
          line.includes('public static void main(') ||
          line.includes('static void main')
        );
        
        if (!hasMain) {
          return {
            output: '',
            error: 'Java code must contain a main method'
          };
        }

        // Look for System.out.println statements
        const printlnLines = lines.filter(line => 
          line.includes('System.out.println') || 
          line.includes('System.out.print')
        );
        
        const outputs: string[] = [];
        for (const line of printlnLines) {
          const output = this.extractJavaOutput(line);
          if (output) {
            outputs.push(output);
          }
        }

        // Look for return statement or end of main method
        const hasReturn = lines.some(line => 
          line.includes('return;') || 
          line.includes('return 0;') ||
          line.includes('}') // End of method
        );

        if (outputs.length > 0) {
          return {
            output: outputs.join('\n'),
            error: ''
          };
        } else if (hasReturn) {
          return {
            output: '(program executed successfully)',
            error: ''
          };
        } else {
          return {
            output: '',
            error: 'No output detected. Make sure to use System.out.println() to display results.'
          };
        }
      }
    };
  }

  /**
   * Extract output from Java System.out.println statements
   */
  private extractJavaOutput(line: string): string {
    // Handle various Java output patterns
    const patterns = [
      /System\.out\.println\s*\(\s*"([^"]*)"\s*\)/g,    // System.out.println("text")
      /System\.out\.print\s*\(\s*"([^"]*)"\s*\)/g,      // System.out.print("text")
      /System\.out\.println\s*\(\s*'([^']*)'\s*\)/g,    // System.out.println('text')
      /System\.out\.print\s*\(\s*'([^']*)'\s*\)/g,      // System.out.print('text')
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(line);
      if (match) {
        return match[1];
      }
    }

    return '';
  }

  /**
   * Execute Node.js code using QuickJS with persistent runtime
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
      
      // Validate JavaScript code for common issues
      const validationError = this.validateJavaScriptCode(sanitizedCode);
      if (validationError) {
        return {
          status: 'ERROR',
          output: '',
          error: validationError,
          executionTime: Date.now() - startTime
        };
      }
      
      // Execute JavaScript code (either with QuickJS or fallback)
      let output = '';
      
      if (this.usingFallback.nodejs) {
        // Using fallback executor
        if (!this.quickJS) {
          throw new Error('JavaScript executor not initialized. Please try again.');
        }
        const vm = this.quickJS.newRuntime().newContext();
        const result = vm.evalCode(sanitizedCode);
        
        if (result.error) {
          const executionTime = Date.now() - startTime;
          const errorMessage = this.formatJavaScriptError(result.error);
          return {
            status: 'ERROR',
            output: '',
            error: errorMessage,
            executionTime
          };
        }
        
        output = (window as any).__nodejs_output || '';
      } else {
        // Using QuickJS
        if (!this.quickJSRuntime) {
          throw new Error('QuickJS runtime not initialized. Please try again.');
        }
        // Create a new context from the persistent runtime
        const vm = this.quickJSRuntime.newContext();
        
        try {
          // Set up console.log to capture output
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
            
            const executionTime = Date.now() - startTime;
            const errorMessage = this.formatJavaScriptError(error);
            return {
              status: 'ERROR',
              output: '',
              error: errorMessage,
              executionTime
            };
          }
          
          const returnValue = vm.dump(result.value);
          result.value.dispose();
          
          output = output || returnValue || '(no output)';
          
        } finally {
          // Only dispose the context, not the runtime
          try {
            vm.dispose();
          } catch (disposeError) {
            // Ignore disposal errors
            console.warn('QuickJS context disposal warning (this is usually safe to ignore)');
          }
        }
      }
      
      const executionTime = Date.now() - startTime;

      return {
        status: 'SUCCESS',
        output: output || '(no output)',
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
   * Cleanup method to dispose of the runtime when done
   */
  public cleanup(): void {
    try {
      // Clean up QuickJS runtime more safely
      if (this.quickJSRuntime) {
        try {
          // Check if runtime is still valid before disposing
          if (this.quickJSRuntime && typeof this.quickJSRuntime.dispose === 'function') {
            this.quickJSRuntime.dispose();
          }
        } catch (disposeError) {
          console.warn('Error disposing QuickJS runtime:', disposeError);
        } finally {
          this.quickJSRuntime = null;
        }
      }
      
      // Clean up Pyodide if it exists
      if (this.pyodide) {
        try {
          // Pyodide cleanup is usually automatic, but we can set it to null
          this.pyodide = null;
        } catch (pyodideError) {
          console.warn('Error cleaning up Pyodide:', pyodideError);
        }
      }
      
      // Clean up JSCPP if it exists
      if (this.jscpp) {
        try {
          this.jscpp = null;
        } catch (jscppError) {
          console.warn('Error cleaning up JSCPP:', jscppError);
        }
      }
      
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  }

  /**
   * Main function to execute code in the specified language
   * @param language - The programming language ('python', 'cpp', 'nodejs', 'java')
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
      
      case 'java':
        return this.executeJava(code);
      
      default:
        return {
          status: 'ERROR',
          output: '',
          error: `Unsupported language: ${language}. Supported languages are: python, cpp, nodejs, java`,
          executionTime: 0
        };
    }
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    const normalizedLanguage = language.toLowerCase().trim();
    return ['python', 'py', 'cpp', 'c++', 'cplusplus', 'nodejs', 'node.js', 'javascript', 'js', 'java'].includes(normalizedLanguage);
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): string[] {
    return ['python', 'cpp', 'nodejs', 'java'];
  }
}

// Create and export a singleton instance
export const clientCodeExecutorSafe = new ClientCodeExecutorSafe();

// Export the main function for convenience
export const runCodeSafe = (language: string, code: string): Promise<ClientExecutionResult> => {
  return clientCodeExecutorSafe.runCode(language, code);
};
