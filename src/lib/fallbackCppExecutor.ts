/**
 * Fallback C++ executor for when JSCPP fails to load
 * This provides basic C++ code analysis and execution simulation
 */

export interface CppExecutionResult {
  output: string;
  error: string;
}

export class FallbackCppExecutor {
  /**
   * Execute C++ code using basic analysis
   */
  run(code: string): CppExecutionResult {
    try {
      const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Check for basic C++ structure
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

      // Extract output from various C++ output statements
      const outputs: string[] = [];
      
      // Handle cout statements
      const coutLines = lines.filter(line => line.includes('cout'));
      for (const line of coutLines) {
        const output = this.extractCoutOutput(line);
        if (output) {
          outputs.push(output);
        }
      }
      
      // Handle printf statements
      const printfLines = lines.filter(line => line.includes('printf'));
      for (const line of printfLines) {
        const output = this.extractPrintfOutput(line);
        if (output) {
          outputs.push(output);
        }
      }
      
      // Handle std::cout statements
      const stdCoutLines = lines.filter(line => line.includes('std::cout'));
      for (const line of stdCoutLines) {
        const output = this.extractCoutOutput(line);
        if (output) {
          outputs.push(output);
        }
      }

      // Check for return statement
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
    } catch (error) {
      return {
        output: '',
        error: `C++ analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Extract output from cout statements
   */
  private extractCoutOutput(line: string): string {
    // Handle various cout patterns
    const patterns = [
      /cout\s*<<\s*"([^"]*)"\s*<<\s*std::endl/g,     // cout << "text" << std::endl
      /std::cout\s*<<\s*"([^"]*)"\s*<<\s*std::endl/g, // std::cout << "text" << std::endl
      /cout\s*<<\s*"([^"]*)"/g,                       // cout << "text"
      /cout\s*<<\s*'([^']*)'/g,                       // cout << 'text'
      /std::cout\s*<<\s*"([^"]*)"/g,                  // std::cout << "text"
      /std::cout\s*<<\s*'([^']*)'/g,                  // std::cout << 'text'
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
   * Extract output from printf statements
   */
  private extractPrintfOutput(line: string): string {
    // Handle printf patterns
    const patterns = [
      /printf\s*\(\s*"([^"]*)"\s*\)/g,    // printf("text")
      /printf\s*\(\s*'([^']*)'\s*\)/g,    // printf('text')
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
   * Check if the code looks like valid C++
   */
  isValidCpp(code: string): boolean {
    const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Check for basic C++ keywords and structures
    const hasInclude = lines.some(line => line.startsWith('#include'));
    const hasMain = lines.some(line => 
      line.includes('int main') || 
      line.includes('void main') ||
      line.includes('main()')
    );
    const hasCppKeywords = lines.some(line => 
      line.includes('cout') || 
      line.includes('printf') || 
      line.includes('std::') ||
      line.includes('using namespace')
    );

    return hasMain && (hasInclude || hasCppKeywords);
  }
}

// Export a singleton instance
export const fallbackCppExecutor = new FallbackCppExecutor();
