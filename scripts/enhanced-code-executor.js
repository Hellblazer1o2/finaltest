const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

class EnhancedCodeExecutor {
  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'idearpit-executions');
    this.supportedLanguages = ['javascript', 'python', 'java', 'cpp'];
  }

  async ensureTempDir() {
    try {
      await fs.promises.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  async cleanup(filePath, executablePath, inputFile) {
    try {
      // Clean up main file
      if (filePath && await this.fileExists(filePath)) {
        await fs.promises.unlink(filePath);
      }
      
      // Clean up executable if different
      if (executablePath && executablePath !== filePath && await this.fileExists(executablePath)) {
        await fs.promises.unlink(executablePath);
      }
      
      // Clean up input file
      if (inputFile && await this.fileExists(inputFile)) {
        await fs.promises.unlink(inputFile);
      }
      
      // Clean up related files
      if (filePath) {
        const basePath = filePath.replace(/\.[^/.]+$/, '');
        const extensions = ['.java', '.cpp', '.exe', '.class', '.input', '.o'];
        
        for (const ext of extensions) {
          const fileToDelete = basePath + ext;
          if (await this.fileExists(fileToDelete)) {
            await fs.promises.unlink(fileToDelete).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  wrapPythonCode(code) {
    // Check if the code already has input handling
    if (code.includes('input()') || code.includes('sys.stdin') || code.includes('raw_input()')) {
      return code;
    }
    
    // Simple wrapper that just executes the user's code
    // The input will be handled by the shell redirection
    return code;
  }

  analyzeComplexity(code, language) {
    const codeLower = code.toLowerCase();
    
    // Time complexity analysis
    let timeComplexity = 'O(1)';
    if (codeLower.includes('for') || codeLower.includes('while') || codeLower.includes('foreach')) {
      if (codeLower.includes('for') && codeLower.includes('for')) {
        timeComplexity = 'O(n²)';
      } else if (codeLower.includes('sort') || codeLower.includes('merge') || codeLower.includes('heap')) {
        timeComplexity = 'O(n log n)';
      } else {
        timeComplexity = 'O(n)';
      }
    }
    
    // Space complexity analysis
    let spaceComplexity = 'O(1)';
    if (codeLower.includes('array') || codeLower.includes('list') || codeLower.includes('vector') || codeLower.includes('[]')) {
      if (codeLower.includes('for') && codeLower.includes('for')) {
        spaceComplexity = 'O(n²)';
      } else {
        spaceComplexity = 'O(n)';
      }
    }
    
    return { timeComplexity, spaceComplexity };
  }

  async executeCode(code, language, input = '', timeLimit = 2000, memoryLimit = 128) {
    const startTime = Date.now();
    
    let filePath = '';
    let executablePath = '';
    let inputFile = null;
    
    try {
      await this.ensureTempDir();
      
      const fileName = `solution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      filePath = path.join(this.tempDir, fileName);
      
      // Write code to file
      await fs.promises.writeFile(filePath, code);
      
      // Write input to file if provided
      if (input) {
        inputFile = filePath + '.input';
        await fs.promises.writeFile(inputFile, input);
      }
      
      let command = '';
      executablePath = filePath;
      
      switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
          command = inputFile ? `node "${filePath}" < "${inputFile}"` : `node "${filePath}"`;
          break;
          
        case 'python':
        case 'py':
          // Wrap Python code to handle input properly
          if (inputFile) {
            const wrappedCode = this.wrapPythonCode(code);
            await fs.promises.writeFile(filePath, wrappedCode);
          }
          command = inputFile ? `python "${filePath}" < "${inputFile}"` : `python "${filePath}"`;
          break;
          
        case 'java':
          await this.compileJava(filePath);
          const className = 'Solution';
          command = inputFile ? `java -cp "${this.tempDir}" ${className} < "${inputFile}"` : `java -cp "${this.tempDir}" ${className}`;
          executablePath = path.join(this.tempDir, 'Solution.class');
          break;
          
        case 'cpp':
        case 'c++':
          executablePath = await this.compileCpp(filePath);
          command = inputFile ? `"${executablePath}" < "${inputFile}"` : `"${executablePath}"`;
          break;
          
        default:
          throw new Error(`Unsupported language: ${language}`);
      }
      
      // Execute with timeout
      const { stdout, stderr } = await execAsync(command, {
        timeout: timeLimit,
        maxBuffer: 1024 * 1024, // 1MB buffer
        windowsHide: true, // Hide console window on Windows
      });
      
      const executionTime = Date.now() - startTime;
      const { timeComplexity, spaceComplexity } = this.analyzeComplexity(code, language);
      
      // Clean up files
      await this.cleanup(filePath, executablePath, inputFile);
      
      return {
        status: 'SUCCESS',
        output: stdout.trim() || '(no output)',
        error: stderr.trim(),
        executionTime,
        memoryUsage: 0, // TODO: Implement memory usage tracking
        timeComplexity,
        spaceComplexity,
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Clean up files
      if (filePath) {
        await this.cleanup(filePath, executablePath, inputFile);
      }
      
      if (error && typeof error === 'object' && 'code' in error && error.code === 'TIMEOUT') {
        return {
          status: 'TIMEOUT',
          output: '',
          error: 'Time limit exceeded',
          executionTime,
          memoryUsage: 0,
          timeComplexity: 'N/A',
          spaceComplexity: 'N/A',
        };
      }
      
      // Enhanced error handling for Python
      let errorMessage = 'Execution failed';
      if (error instanceof Error) {
        errorMessage = error.message;
        // Check for common Python errors
        if (errorMessage.includes('Command failed: python')) {
          errorMessage = 'Python execution failed. Check your code syntax and logic.';
        } else if (errorMessage.includes('python: can\'t open file')) {
          errorMessage = 'Python file not found or inaccessible.';
        } else if (errorMessage.includes('SyntaxError')) {
          errorMessage = 'Python syntax error in your code.';
        } else if (errorMessage.includes('IndentationError')) {
          errorMessage = 'Python indentation error. Check your code formatting.';
        } else if (errorMessage.includes('NameError')) {
          errorMessage = 'Python name error. Check variable names and imports.';
        } else if (errorMessage.includes('TypeError')) {
          errorMessage = 'Python type error. Check data types and operations.';
        }
      }
      
      return {
        status: 'ERROR',
        output: '',
        error: errorMessage,
        executionTime,
        memoryUsage: 0,
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A',
      };
    }
  }

  async compileJava(filePath) {
    const javaPath = filePath + '.java';
    await fs.promises.writeFile(javaPath, this.wrapJavaCode(await fs.promises.readFile(filePath, 'utf8')));
    
    try {
      await execAsync(`javac -cp "${this.tempDir}" "${javaPath}"`);
    } catch (error) {
      throw new Error(`Java compilation failed: ${error.message}`);
    }
  }

  async compileCpp(filePath) {
    const cppPath = filePath + '.cpp';
    await fs.promises.writeFile(cppPath, this.wrapCppCode(await fs.promises.readFile(filePath, 'utf8')));
    
    const exePath = filePath + '.exe';
    
    try {
      await execAsync(`g++ -o "${exePath}" "${cppPath}"`);
    } catch (error) {
      throw new Error(`C++ compilation failed: ${error.message}`);
    }
    
    return exePath;
  }

  wrapJavaCode(code) {
    // If code doesn't contain a class definition, wrap it
    if (!code.includes('public class') && !code.includes('class ')) {
      return `public class Solution {
    public static void main(String[] args) {
        ${code}
    }
}`;
    }
    return code;
  }

  wrapCppCode(code) {
    // If code doesn't contain main function, wrap it
    if (!code.includes('int main') && !code.includes('void main')) {
      return `#include <iostream>
#include <string>
using namespace std;

int main() {
    ${code}
    return 0;
}`;
    }
    return code;
  }
}

module.exports = EnhancedCodeExecutor;
