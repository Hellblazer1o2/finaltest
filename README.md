# Igenium IDE - Problem Solving Platform

A competitive programming platform with **client-side code execution** for Python, C++, JavaScript, and Java. Built with Next.js, TypeScript, and Prisma.

## 🚀 Key Features

### Client-Side Code Execution
- **Python**: Pyodide (WebAssembly) with fallback analyzer
- **C++**: JSCPP with fallback pattern matching
- **JavaScript**: QuickJS with fallback analyzer  
- **Java**: Pattern-based code analysis
- **100% Reliable**: Fallback systems ensure execution always works

### Core Functionality
- **Real-time Code Testing**: Instant feedback without server calls
- **Problem Management**: Admin panel for creating and managing problems
- **User Authentication**: Secure login/registration system
- **Leaderboard**: Track user progress and rankings
- **Tab Restrictions**: Prevents cheating during problem solving

## 🛠️ Quick Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Start development server
npm run dev
```

### Easy Git Push
```bash
# Make the push script executable (if not already)
chmod +x push.sh

# Push your changes
./push.sh
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   ├── problem/[id]/      # Problem solving page
│   └── ...
├── components/             # React components
├── lib/                    # Core libraries
│   ├── clientCodeExecutorSafe.ts  # Main client-side executor
│   ├── fallbackCppExecutor.ts     # C++ fallback
│   └── ...
└── contexts/               # React contexts
```

## 🔧 Client-Side Execution

The platform uses a sophisticated fallback system:

1. **Primary**: Real execution engines (Pyodide, JSCPP, QuickJS)
2. **Fallback**: Pattern-based analyzers for reliability
3. **Always Works**: No external dependencies required

### Supported Languages
- ✅ **Python**: `print("Hello World")`
- ✅ **C++**: `cout << "Hello World" << endl;`
- ✅ **JavaScript**: `console.log("Hello World");`
- ✅ **Java**: `System.out.println("Hello World");`

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t igenium-ide .
docker run -p 3000:3000 igenium-ide
```

## 📝 Git Workflow

### Quick Push
```bash
./push.sh
```

### Manual Git Commands
```bash
# Add changes
git add .

# Commit with message
git commit -m "Your commit message"

# Push to remote
git push origin main
```

## 🔒 Security Features

- **Tab Restrictions**: Prevents switching tabs during problem solving
- **Code Execution Limits**: Timeout and memory limits
- **Input Validation**: Sanitized user inputs
- **Session Management**: Secure authentication

## 📊 Database Schema

- **Users**: User accounts and authentication
- **Problems**: Coding problems with test cases
- **Submissions**: User code submissions and results
- **Rounds**: Competition rounds and timing

## 🎯 Usage

1. **Register/Login**: Create an account or login
2. **Select Problem**: Choose from available problems
3. **Write Code**: Use the Monaco editor with syntax highlighting
4. **Test Code**: Run tests with client-side execution
5. **Submit Solution**: Submit for final evaluation

## 🛠️ Development

### Adding New Languages
1. Add language to `isClientSideSupported()` in `page.tsx`
2. Create executor method in `clientCodeExecutorSafe.ts`
3. Add fallback analyzer if needed

### Debugging
- Check browser console for execution logs
- Use test files in root directory for testing
- Monitor network tab for CDN loading issues

## 📄 License

This project is licensed under the MIT License.

---

**Made with ❤️ for competitive programming**