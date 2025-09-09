/**
 * Simple C++ executor that provides basic functionality without external dependencies
 * This is a fallback when JSCPP fails to load
 */

export interface SimpleCppResult {
  status: 'SUCCESS' | 'ERROR';
  output: string;
  error: string;
  executionTime: number;
}

export class SimpleCppExecutor {
  /**
   * Simple C++ code parser and executor
   * This is a very basic implementation that handles simple C++ constructs
   */
  async executeSimpleCpp(code: string): Promise<SimpleCppResult> {
    const startTime = Date.now();
    
    try {
      // Remove comments and clean up code
      const cleanCode = this.cleanCppCode(code);
      
      // Check for basic C++ constructs
      if (!cleanCode.includes('#include') && !cleanCode.includes('int main()')) {
        return {
          status: 'ERROR',
          output: '',
          error: 'C++ code must include at least #include <iostream> and int main() function',
          executionTime: Date.now() - startTime
        };
      }
      
      // Simple pattern matching for basic C++ output
      const output = this.extractCppOutput(cleanCode);
      
      return {
        status: 'SUCCESS',
        output: output || 'C++ code parsed successfully (simplified execution)',
        error: '',
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        status: 'ERROR',
        output: '',
        error: error instanceof Error ? error.message : 'C++ execution failed',
        executionTime: Date.now() - startTime
      };
    }
  }
  
  private cleanCppCode(code: string): string {
    // Remove JavaScript-style comments
    let cleaned = code.replace(/\/\/.*$/gm, '');
    
    // Remove template placeholders
    cleaned = cleaned.replace(/\/\/Code Here:/g, '');
    cleaned = cleaned.replace(/\/\/.*Code Here.*/g, '');
    
    // Remove empty lines and trim
    cleaned = cleaned.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
    
    return cleaned;
  }
  
  private extractCppOutput(code: string): string {
    const output: string[] = [];
    
    // Look for cout statements
    const coutMatches = code.match(/cout\s*<<\s*[^;]+;/g);
    if (coutMatches) {
      coutMatches.forEach(match => {
        // Extract the string literals
        const stringMatches = match.match(/"([^"]*)"/g);
        if (stringMatches) {
          stringMatches.forEach(str => {
            output.push(str.replace(/"/g, ''));
          });
        }
        
        // Extract variables and expressions
        const exprMatches = match.match(/<<\s*([^;]+)/g);
        if (exprMatches) {
          exprMatches.forEach(expr => {
            const cleanExpr = expr.replace(/<<\s*/, '').trim();
            if (cleanExpr && !cleanExpr.includes('"')) {
              // Try to evaluate simple expressions
              try {
                const result = this.evaluateSimpleExpression(cleanExpr);
                if (result !== null) {
                  output.push(result.toString());
                }
              } catch {
                // Ignore evaluation errors
              }
            }
          });
        }
      });
    }
    
    return output.join('\n');
  }
  
  private evaluateSimpleExpression(expr: string): number | string | null {
    try {
      // Remove C++ specific syntax
      let cleanExpr = expr.replace(/endl/g, '');
      cleanExpr = cleanExpr.replace(/<<\s*/g, '');
      cleanExpr = cleanExpr.replace(/\s+/g, ' ').trim();
      
      // Handle simple arithmetic
      if (/^\d+\s*[\+\-\*\/]\s*\d+$/.test(cleanExpr)) {
        // Simple arithmetic evaluation
        const match = cleanExpr.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
        if (match) {
          const [, a, op, b] = match;
          const numA = parseInt(a);
          const numB = parseInt(b);
          
          switch (op) {
            case '+': return numA + numB;
            case '-': return numA - numB;
            case '*': return numA * numB;
            case '/': return numB !== 0 ? Math.floor(numA / numB) : 0;
          }
        }
      }
      
      // Handle simple variable assignments (very basic)
      if (/^\d+$/.test(cleanExpr)) {
        return parseInt(cleanExpr);
      }
      
      return null;
    } catch {
      return null;
    }
  }
}

export const simpleCppExecutor = new SimpleCppExecutor();
