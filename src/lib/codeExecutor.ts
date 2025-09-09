import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { OnlineCodeExecutor } from './onlineCodeExecutor'

const execAsync = promisify(exec)

export interface ExecutionResult {
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT' | 'MEMORY_LIMIT_EXCEEDED'
  output: string
  error: string
  executionTime: number
  memoryUsage: number
  timeComplexity?: string
  spaceComplexity?: string
}

export class CodeExecutor {
  private tempDir: string
  private onlineExecutor: OnlineCodeExecutor

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'idearpit-executions')
    this.onlineExecutor = new OnlineCodeExecutor()
  }

  private wrapPythonCode(code: string): string {
    // Check if the code already has input handling
    if (code.includes('input()') || code.includes('sys.stdin') || code.includes('raw_input()')) {
      return code
    }
    
    // Simple wrapper that just executes the user's code
    // The input will be handled by the shell redirection
    return code
  }

  private analyzeComplexity(code: string, language: string): { timeComplexity: string; spaceComplexity: string } {
    // Simple heuristic-based complexity analysis
    const codeLower = code.toLowerCase()
    
    // Time complexity analysis
    let timeComplexity = 'O(1)'
    if (codeLower.includes('for') || codeLower.includes('while') || codeLower.includes('foreach')) {
      if (codeLower.includes('for') && codeLower.includes('for')) {
        timeComplexity = 'O(n²)'
      } else if (codeLower.includes('sort') || codeLower.includes('merge') || codeLower.includes('heap')) {
        timeComplexity = 'O(n log n)'
      } else {
        timeComplexity = 'O(n)'
      }
    }
    
    // Space complexity analysis
    let spaceComplexity = 'O(1)'
    if (codeLower.includes('array') || codeLower.includes('list') || codeLower.includes('vector') || codeLower.includes('[]')) {
      if (codeLower.includes('for') && codeLower.includes('for')) {
        spaceComplexity = 'O(n²)'
      } else {
        spaceComplexity = 'O(n)'
      }
    }
    
    return { timeComplexity, spaceComplexity }
  }

  async executeCode(
    code: string,
    language: string,
    input: string = '',
    timeLimit: number = 2000,
    memoryLimit: number = 128 // Currently not used but kept for future implementation
  ): Promise<ExecutionResult> {
    const startTime = Date.now()
    
    // Declare variables outside try block for cleanup in catch
    let filePath: string = ''
    let executablePath: string = ''
    let inputFile: string | null = null
    
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true })
      
      const fileName = `solution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      filePath = path.join(this.tempDir, fileName)
      
      // Write code to file
      await fs.writeFile(filePath, code)
      
      // Write input to file if provided
      if (input) {
        inputFile = filePath + '.input'
        await fs.writeFile(inputFile, input)
      }
      
      // Execute based on language
      let command: string
      executablePath = filePath
      
      switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
          command = inputFile ? `node "${filePath}" < "${inputFile}"` : `node "${filePath}"`
          break
        case 'python':
        case 'py':
          // Wrap Python code to handle input properly
          if (inputFile) {
            const wrappedCode = this.wrapPythonCode(code)
            await fs.writeFile(filePath, wrappedCode)
          }
          command = inputFile ? `python "${filePath}" < "${inputFile}"` : `python "${filePath}"`
          break
        case 'java':
          // Compile Java first
          const className = 'Solution'
          const javaPath = filePath + '.java'
          await fs.writeFile(javaPath, code)
          await execAsync(`javac "${javaPath}"`)
          command = inputFile ? `java -cp "${this.tempDir}" ${className} < "${inputFile}"` : `java -cp "${this.tempDir}" ${className}`
          executablePath = javaPath
          break
        case 'cpp':
        case 'c++':
          // Compile C++ first
          const cppPath = filePath + '.cpp'
          const exePath = filePath + '.exe'
          await fs.writeFile(cppPath, code)
          await execAsync(`g++ -o "${exePath}" "${cppPath}"`)
          command = inputFile ? `"${exePath}" < "${inputFile}"` : `"${exePath}"`
          executablePath = exePath
          break
        default:
          throw new Error(`Unsupported language: ${language}`)
      }
      
      // Execute with timeout
      const { stdout, stderr } = await execAsync(command, {
        timeout: timeLimit,
        maxBuffer: 1024 * 1024, // 1MB buffer
        windowsHide: true, // Hide console window on Windows
      })
      
      const executionTime = Date.now() - startTime
      
      // Analyze complexity
      const { timeComplexity, spaceComplexity } = this.analyzeComplexity(code, language)
      
      // Clean up files
      await this.cleanup(filePath, executablePath, inputFile)
      
      return {
        status: 'SUCCESS',
        output: stdout.trim() || '(no output)',
        error: stderr.trim(),
        executionTime,
        memoryUsage: 0, // TODO: Implement memory usage tracking
        timeComplexity,
        spaceComplexity,
      }
      
    } catch (error: unknown) {
      const executionTime = Date.now() - startTime
      
      // Clean up files
      if (filePath) {
        await this.cleanup(filePath, executablePath, inputFile)
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
        }
      }
      
      // Enhanced error handling for Python
      let errorMessage = 'Execution failed'
      if (error instanceof Error) {
        errorMessage = error.message
        // Check for common Python errors
        if (errorMessage.includes('Command failed: python')) {
          errorMessage = 'Python execution failed. Check your code syntax and logic.'
        } else if (errorMessage.includes('python: can\'t open file')) {
          errorMessage = 'Python file not found or inaccessible.'
        } else if (errorMessage.includes('SyntaxError')) {
          errorMessage = 'Python syntax error in your code.'
        } else if (errorMessage.includes('IndentationError')) {
          errorMessage = 'Python indentation error. Check your code formatting.'
        } else if (errorMessage.includes('NameError')) {
          errorMessage = 'Python name error. Check variable names and imports.'
        } else if (errorMessage.includes('TypeError')) {
          errorMessage = 'Python type error. Check data types and operations.'
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
      }
    }
  }
  
  private async cleanup(filePath: string, executablePath?: string, inputFile?: string | null) {
    try {
      // Clean up main file
      await fs.unlink(filePath).catch(() => {})
      
      // Clean up executable if different
      if (executablePath && executablePath !== filePath) {
        await fs.unlink(executablePath).catch(() => {})
      }
      
      // Clean up input file
      if (inputFile) {
        await fs.unlink(inputFile).catch(() => {})
      }
      
      // Clean up related files
      const basePath = filePath.replace(/\.[^/.]+$/, '')
      const extensions = ['.java', '.cpp', '.exe', '.class', '.input']
      
      for (const ext of extensions) {
        await fs.unlink(basePath + ext).catch(() => {})
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

export const codeExecutor = new CodeExecutor()
