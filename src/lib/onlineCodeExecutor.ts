import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

export interface ExecutionResult {
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT'
  output: string
  error: string
  executionTime: number
  memoryUsage: number
  timeComplexity?: string
  spaceComplexity?: string
}

export class OnlineCodeExecutor {
  private tempDir: string

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'idearpit-executions')
  }

  private async ensureTempDir() {
    try {
      await fs.promises.mkdir(this.tempDir, { recursive: true })
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
          clientId: process.env.JDOODLE_CLIENT_ID || 'free',
          clientSecret: process.env.JDOODLE_CLIENT_SECRET || 'free'
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

    } catch (error) {
      const executionTime = Date.now() - startTime
      return {
        status: 'ERROR',
        output: '',
        error: error instanceof Error ? error.message : 'JDoodle execution failed',
        executionTime,
        memoryUsage: 0,
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A'
      }
    }
  }

  // Judge0 API (Free tier available)
  private async executeWithJudge0(code: string, language: string, input: string = ''): Promise<ExecutionResult> {
    const startTime = Date.now()
    
    try {
      const languageMap: { [key: string]: number } = {
        'python': 71,   // Python 3
        'py': 71,
        'cpp': 54,      // C++ 17
        'c++': 54,
        'java': 62,     // Java 8
        'javascript': 63, // Node.js
        'js': 63
      }

      const langId = languageMap[language.toLowerCase()]
      if (langId === undefined) {
        throw new Error(`Unsupported language: ${language}`)
      }

      // Submit code for execution
      const submitResponse = await fetch('https://judge0-ce.p.rapidapi.com/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          language_id: langId,
          source_code: code,
          stdin: input
        })
      })

      if (!submitResponse.ok) {
        throw new Error(`Judge0 submission error: ${submitResponse.status}`)
      }

      const submission = await submitResponse.json()
      const token = submission.token

      // Poll for result
      let attempts = 0
      const maxAttempts = 30
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        
        const resultResponse = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}`, {
          headers: {
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          }
        })

        if (!resultResponse.ok) {
          throw new Error(`Judge0 result error: ${resultResponse.status}`)
        }

        const result = await resultResponse.json()
        
        if (result.status.id <= 2) { // Still processing
          attempts++
          continue
        }

        const executionTime = Date.now() - startTime
        const { timeComplexity, spaceComplexity } = this.analyzeComplexity(code, language)

        return {
          status: result.status.id === 3 ? 'SUCCESS' : 'ERROR',
          output: result.stdout || '(no output)',
          error: result.stderr || result.compile_output || '',
          executionTime,
          memoryUsage: result.memory || 0,
          timeComplexity,
          spaceComplexity
        }
      }

      throw new Error('Judge0 execution timeout')

    } catch (error) {
      const executionTime = Date.now() - startTime
      return {
        status: 'ERROR',
        output: '',
        error: error instanceof Error ? error.message : 'Judge0 execution failed',
        executionTime,
        memoryUsage: 0,
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A'
      }
    }
  }

  // Fallback to local execution for JavaScript
  private async executeJavaScriptLocally(code: string, input: string = ''): Promise<ExecutionResult> {
    const startTime = Date.now()
    
    let filePath = ''
    let inputFile = null
    
    try {
      await this.ensureTempDir()
      
      const fileName = `solution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      filePath = path.join(this.tempDir, fileName)
      
      // Write code to file
      await fs.promises.writeFile(filePath, code)
      
      // Write input to file if provided
      if (input) {
        inputFile = filePath + '.input'
        await fs.promises.writeFile(inputFile, input)
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
        await fs.promises.unlink(filePath)
      }
      
      if (inputFile && await this.fileExists(inputFile)) {
        await fs.promises.unlink(inputFile)
      }
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath)
      return true
    } catch {
      return false
    }
  }

  async executeCode(code: string, language: string, input: string = '', timeLimit: number = 5000, memoryLimit: number = 128): Promise<ExecutionResult> {
    const lang = language.toLowerCase()
    
    // For JavaScript, use local execution (Node.js is always available)
    if (lang === 'javascript' || lang === 'js') {
      return this.executeJavaScriptLocally(code, input)
    }
    
    // For Python, C++, and Java, try online compilers
    try {
      // Try JDoodle first (free tier)
      const jdoodleResult = await this.executeWithJDoodle(code, language, input)
      if (jdoodleResult.status === 'SUCCESS' || !jdoodleResult.error.includes('API')) {
        return jdoodleResult
      }
      
      // Fallback to Judge0 if JDoodle fails
      if (process.env.RAPIDAPI_KEY) {
        return await this.executeWithJudge0(code, language, input)
      }
      
      // If both online services fail, return the JDoodle result
      return jdoodleResult
      
    } catch (error) {
      return {
        status: 'ERROR',
        output: '',
        error: `Online execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: 0,
        memoryUsage: 0,
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A'
      }
    }
  }
}
