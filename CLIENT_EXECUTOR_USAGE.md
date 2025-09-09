# Client-Side Code Executor

This implementation provides client-side code execution for Python, C++, and Node.js directly in the browser without any backend or external API calls.

## Features

- **Python**: Uses Pyodide (WebAssembly-based Python interpreter)
- **C++**: Uses JSCPP (JavaScript-based C++ interpreter)
- **Node.js**: Uses QuickJS (WebAssembly-based JavaScript engine)

## Installation

The required dependencies are already installed:
- `pyodide` - For Python execution
- `quickjs-emscripten` - For Node.js execution
- JSCPP is loaded from CDN for C++ execution

## Usage

### Basic Usage

```typescript
import { runCode } from './src/lib/clientCodeExecutor';

// Execute Python code
const pythonResult = await runCode('python', `
print("Hello from Python!")
print("2 + 3 =", 2 + 3)
`);

// Execute C++ code
const cppResult = await runCode('cpp', `
#include <iostream>
using namespace std;
int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}
`);

// Execute Node.js code
const nodejsResult = await runCode('nodejs', `
console.log("Hello from Node.js!");
console.log("2 + 3 =", 2 + 3);
`);
```

### Advanced Usage

```typescript
import { clientCodeExecutor } from './src/lib/clientCodeExecutor';

// Check if a language is supported
if (clientCodeExecutor.isLanguageSupported('python')) {
    const result = await clientCodeExecutor.runCode('python', code);
}

// Get list of supported languages
const supportedLanguages = clientCodeExecutor.getSupportedLanguages();
console.log('Supported languages:', supportedLanguages); // ['python', 'cpp', 'nodejs']
```

## API Reference

### `runCode(language: string, code: string): Promise<ClientExecutionResult>`

Executes code in the specified language and returns the result.

**Parameters:**
- `language`: The programming language ('python', 'cpp', 'nodejs')
- `code`: The code to execute

**Returns:** `Promise<ClientExecutionResult>`

### `ClientExecutionResult` Interface

```typescript
interface ClientExecutionResult {
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  output: string;
  error: string;
  executionTime: number;
}
```

**Properties:**
- `status`: Execution status
- `output`: Program output (stdout)
- `error`: Error message if execution failed
- `executionTime`: Execution time in milliseconds

## Supported Languages

| Language | Aliases | Engine |
|----------|---------|---------|
| Python | `python`, `py` | Pyodide |
| C++ | `cpp`, `c++`, `cplusplus` | JSCPP |
| Node.js | `nodejs`, `node.js`, `javascript`, `js` | QuickJS |

## Examples

### Python Example

```python
# Simple calculation
print("Hello from Python!")
print("2 + 3 =", 2 + 3)

# Function definition
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print("Fibonacci(10) =", fibonacci(10))
```

### C++ Example

```cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++!" << endl;
    cout << "2 + 3 = " << (2 + 3) << endl;
    
    // Simple function
    int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n-1) + fibonacci(n-2);
    }
    
    cout << "Fibonacci(10) = " << fibonacci(10) << endl;
    return 0;
}
```

### Node.js Example

```javascript
console.log("Hello from Node.js!");
console.log("2 + 3 =", 2 + 3);

// Function definition
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

console.log("Fibonacci(10) =", fibonacci(10));

// Array operations
const arr = [1, 2, 3, 4, 5];
console.log("Array:", arr);
console.log("Sum:", arr.reduce((a, b) => a + b, 0));
```

## Testing

To test the implementation, open `test-client-executor.html` in a web browser. This test page provides:

- Interactive code editors for each language
- Run buttons to execute code
- Output display with success/error indicators
- Execution time measurement

## Security Considerations

- All code execution happens in the browser sandbox
- No network requests are made during execution
- Memory usage is limited by browser constraints
- Execution time is not artificially limited but may be constrained by browser performance

## Performance Notes

- **Python**: Pyodide has some overhead due to WebAssembly compilation
- **C++**: JSCPP is an interpreter, so performance is slower than native compilation
- **Node.js**: QuickJS is fast but doesn't support all Node.js APIs

## Browser Compatibility

- Modern browsers with WebAssembly support
- ES2020+ features required for QuickJS
- Tested on Chrome, Firefox, Safari, and Edge

## Error Handling

The executor provides comprehensive error handling:

- Syntax errors are caught and reported
- Runtime errors are captured with stack traces
- Initialization errors are handled gracefully
- Network errors (for CDN loading) are reported

## Limitations

1. **Python**: Some Python packages may not be available in Pyodide
2. **C++**: JSCPP has limited C++ standard library support
3. **Node.js**: QuickJS doesn't support all Node.js built-in modules
4. **Performance**: All execution is slower than native execution
5. **Memory**: Limited by browser memory constraints
