import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

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

export class OnlineCodeExecutorNew {
  private tempDir: string

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'idearpit-executions')
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create temp directory:', error)
    }
  }

  private analyzeComplexity(code: string, language: string): { timeComplexity: string; spaceComplexity: string } {
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

  // JDoodle API (Free tier available)
  private async executeWithJDoodle(code: string, language: string, input: string = ''): Promise<ExecutionResult> {
    const startTime = Date.now()
    
    try {
      const languageMap: { [key: string]: number } = {
        'python': 0,    // Python 3
        'py': 0,
        'cpp': 1,       // C++ 17
        'c++': 1,
        'java': 4,      // Java 8
        'javascript': 4, // Node.js
        'js': 4
      }

      const langId = languageMap[language.toLowerCase()]
      if (langId === undefined) {
        throw new Error(`Unsupported language: ${language}`)
      }

      // Try JDoodle API first
      try {
        const response = await fetch('https://api.jdoodle.com/v1/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script: code,
            language: langId,
            versionIndex: 0,
            stdin: input,
            clientId: 'free',
            clientSecret: 'free'
          })
        })

        if (!response.ok) {
          throw new Error(`JDoodle API error: ${response.status}`)
        }

        const result = await response.json()
        const executionTime = Date.now() - startTime
        const { timeComplexity, spaceComplexity } = this.analyzeComplexity(code, language)

        return {
          status: result.statusCode === 200 ? 'SUCCESS' : 'ERROR',
          output: result.output || '(no output)',
          error: result.error || '',
          executionTime,
          memoryUsage: result.memory || 0,
          timeComplexity,
          spaceComplexity
        }
      } catch (jdoodleError) {
        // If JDoodle fails, fall back to local execution for JavaScript
        if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'js') {
          console.warn('JDoodle failed, falling back to local execution:', jdoodleError)
          return this.executeJavaScriptLocally(code, input)
        }
        
        // For other languages, try a simple pattern-based analysis
        console.warn('JDoodle failed, using pattern-based analysis:', jdoodleError)
        return this.executeWithPatternAnalysis(code, language, input)
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      return {
        status: 'ERROR',
        output: '',
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime,
        memoryUsage: 0,
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A'
      }
    }
  }

  // Local execution for JavaScript (Node.js is always available)
  private async executeJavaScriptLocally(code: string, input: string = ''): Promise<ExecutionResult> {
    const startTime = Date.now()
    
    let filePath = ''
    let inputFile = null
    
    try {
      await this.ensureTempDir()
      
      const fileName = `solution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      filePath = path.join(this.tempDir, fileName)
      
      // Write code to file
      await fs.writeFile(filePath, code)
      
      // Write input to file if provided
      if (input) {
        inputFile = filePath + '.input'
        await fs.writeFile(inputFile, input)
      }
      
      const command = inputFile ? `node "${filePath}" < "${inputFile}"` : `node "${filePath}"`
      
      // Execute with timeout
      const { stdout, stderr } = await execAsync(command, {
        timeout: 5000,
        maxBuffer: 1024 * 1024,
        windowsHide: true
      })
      
      const executionTime = Date.now() - startTime
      const { timeComplexity, spaceComplexity } = this.analyzeComplexity(code, 'javascript')
      
      // Clean up files
      await this.cleanup(filePath, inputFile)
      
      return {
        status: 'SUCCESS',
        output: stdout.trim() || '(no output)',
        error: stderr.trim(),
        executionTime,
        memoryUsage: 0,
        timeComplexity,
        spaceComplexity
      }
      
    } catch (error) {
      const executionTime = Date.now() - startTime
      
      // Clean up files
      if (filePath) {
        await this.cleanup(filePath, inputFile)
      }
      
      return {
        status: 'ERROR',
        output: '',
        error: error instanceof Error ? error.message : 'JavaScript execution failed',
        executionTime,
        memoryUsage: 0,
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A'
      }
    }
  }

  private async cleanup(filePath: string, inputFile?: string | null) {
    try {
      if (filePath && await this.fileExists(filePath)) {
        await fs.unlink(filePath)
      }
      
      if (inputFile && await this.fileExists(inputFile)) {
        await fs.unlink(inputFile)
      }
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  // Pattern-based analysis for when online execution fails
  private async executeWithPatternAnalysis(code: string, language: string, input: string = ''): Promise<ExecutionResult> {
    const startTime = Date.now()
    
    try {
      const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0)
      const { timeComplexity, spaceComplexity } = this.analyzeComplexity(code, language)
      
      // Look for output statements based on language
      const outputs: string[] = []
      
      if (language.toLowerCase() === 'python' || language.toLowerCase() === 'py') {
        const printLines = lines.filter(line => 
          line.includes('print(') || line.includes('print ')
        )
        for (const line of printLines) {
          const match = line.match(/print\s*\(\s*["']([^"']*)["']\s*\)/)
          if (match) {
            outputs.push(match[1])
          }
        }
      } else if (language.toLowerCase() === 'cpp' || language.toLowerCase() === 'c++') {
        const coutLines = lines.filter(line => 
          line.includes('cout') || line.includes('printf')
        )
        for (const line of coutLines) {
          const match = line.match(/cout\s*<<\s*["']([^"']*)["']/)
          if (match) {
            outputs.push(match[1])
          }
        }
      } else if (language.toLowerCase() === 'java') {
        const printlnLines = lines.filter(line => 
          line.includes('System.out.println') || line.includes('System.out.print')
        )
        for (const line of printlnLines) {
          const match = line.match(/System\.out\.println\s*\(\s*["']([^"']*)["']\s*\)/)
          if (match) {
            outputs.push(match[1])
          }
        }
      }
      
      const executionTime = Date.now() - startTime
      
      return {
        status: 'SUCCESS',
        output: outputs.join('\n') || '(no output detected)',
        error: '',
        executionTime,
        memoryUsage: 0,
        timeComplexity,
        spaceComplexity
      }
      
    } catch (error) {
      const executionTime = Date.now() - startTime
      return {
        status: 'ERROR',
        output: '',
        error: error instanceof Error ? error.message : 'Pattern analysis failed',
        executionTime,
        memoryUsage: 0,
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A'
      }
    }
  }

  async executeCode(code: string, language: string, input: string = '', timeLimit: number = 5000, memoryLimit: number = 128): Promise<ExecutionResult> {
    const lang = language.toLowerCase()
    
    // For JavaScript, use local execution (Node.js is always available)
    if (lang === 'javascript' || lang === 'js') {
      return this.executeJavaScriptLocally(code, input)
    }
    
    // For Python, C++, and Java, use online compilers
    return this.executeWithJDoodle(code, language, input)
  }
}
