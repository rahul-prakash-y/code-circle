import { ISeedTrackData } from './types';

export const track4Js: ISeedTrackData = {
  name: 'JavaScript Programming: Modern V8 to Full-Stack',
  description:
    'Master modern ECMAScript, V8 engine internals, the Event Loop, asynchronous programming, Node.js, and real-time full-stack engineering.',
  coverImageUrl:
    'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=1200&q=80',
  isLocked: false,
  levels: [
    {
      levelNumber: 1,
      title: 'Level 1: JavaScript Foundations & V8 Runtime',
      youtubeVideoId: 'PkZNo7MFNFg',
      studyMaterials: [
        {
          title: 'JavaScript Types & Coercion Rules',
          type: 'notes',
          content: `# JS Foundations\n\n- Primitive types: number, string, boolean, null, undefined, symbol, bigint\n- let & const block scoping vs var\n- Strict equality (===) vs loose equality (==)`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the output of typeof null in JavaScript?',
          options: ['"object"', '"null"', '"undefined"', '"number"'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 1: Bill & Tip Split Calculator',
        description: 'Read total bill amount (number), tip percentage (number), and person count (number). Print each person share to 2 decimal places.',
        inputFormat: 'Bill TipPercentage People',
        outputFormat: 'Total per person',
        constraints: 'Bill >= 0, People >= 1',
        sampleInput: '100 15 2',
        sampleOutput: '57.50',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (input.length >= 3) {\n        const bill = parseFloat(input[0]);\n        const tip = parseFloat(input[1]);\n        const people = parseInt(input[2], 10);\n        const total = bill + (bill * tip / 100);\n        console.log((total / people).toFixed(2));\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '100 15 2', expectedOutput: '57.50', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the Temporal Dead Zone (TDZ) in JavaScript?',
          options: ['The state between variable scope entry and declaration where let and const cannot be accessed', 'Garbage collection cycle', 'Event loop waiting time', 'Asynchronous timeout'],
          correctOptionIndex: 0,
          explanation: 'Variables declared with let and const cannot be accessed before their declaration line is executed.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 2,
      title: 'Level 2: Scopes, Closures & Arrow Functions',
      youtubeVideoId: 'h33Srr5J9nY',
      studyMaterials: [
        {
          title: 'Arrow Functions & Lexical Scope',
          type: 'notes',
          content: `# Functions & Scopes\n\n- Arrow functions do not bind their own this or arguments.\n- Nullish coalescing (??) checks specifically for null or undefined.`,
        },
      ],
      questQuestions: [
        {
          question: 'How do arrow functions handle the "this" keyword?',
          options: ['They inherit "this" lexically from their enclosing scope', 'They bind "this" to window', 'They bind "this" to null', 'They create a new this context'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 2: Nullish Coalescing Fallback Parser',
        description: 'Read two space-separated string tokens. If token 1 is "null" or "undefined", output token 2, else output token 1.',
        inputFormat: 'Token1 Token2',
        outputFormat: 'Evaluated token',
        constraints: 'Non-empty strings',
        sampleInput: 'null fallbackValue',
        sampleOutput: 'fallbackValue',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const [t1, t2] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    const val = (t1 === 'null' || t1 === 'undefined') ? null : t1;\n    console.log(val ?? t2);\n}\nmain();\n`,
        },
        testCases: [
          { input: 'null fallbackValue', expectedOutput: 'fallbackValue', isHidden: false },
          { input: 'hello world', expectedOutput: 'hello', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is a Closure in JavaScript?',
          options: ['A function bundled with references to its surrounding lexical state', 'A closed browser window', 'A private class method', 'A self-terminating loop'],
          correctOptionIndex: 0,
          explanation: 'Closures give inner functions access to outer function scope even after the outer function has returned.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 3,
      title: 'Level 3: Arrays, Objects & Functional Methods',
      youtubeVideoId: 'R8rmfD9Y5-c',
      studyMaterials: [
        {
          title: 'Array Methods: Map, Filter, Reduce',
          type: 'notes',
          content: `# Array Transformations\n\n- map() transforms elements into a new array.\n- filter() selects elements matching a predicate.\n- reduce() accumulates elements into a single value.`,
        },
      ],
      questQuestions: [
        {
          question: 'Does Array.prototype.map mutate the original array?',
          options: ['No, it returns a new array with the transformed elements', 'Yes', 'Only with objects', 'Only in strict mode'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 3: Array Grouping & Total Score via Reduce',
        description: 'Read N integers, use reduce to compute sum of all positive integers.',
        inputFormat: 'Line 1: N\\nLine 2: N integers',
        outputFormat: 'Sum of positives',
        constraints: '1 <= N <= 10^5',
        sampleInput: '5\n10 -5 20 -15 30',
        sampleOutput: '60',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (lines.length >= 2) {\n        const n = parseInt(lines[0], 10);\n        const arr = lines.slice(1, 1 + n).map(Number);\n        const sum = arr.reduce((acc, curr) => curr > 0 ? acc + curr : acc, 0);\n        console.log(sum);\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '5\n10 -5 20 -15 30', expectedOutput: '60', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the purpose of Object.freeze() in JavaScript?',
          options: ['Prevents additions, deletions, or modifications to an object properties', 'Stops async functions', 'Converts object to string', 'Saves to localStorage'],
          correctOptionIndex: 0,
          explanation: 'Object.freeze() makes an object shallowly immutable at runtime.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 4,
      title: 'Level 4: DOM Tree & Browser Web APIs',
      youtubeVideoId: '0ik6X4DJKCc',
      studyMaterials: [
        {
          title: 'Event Bubbling & DOM Delegation',
          type: 'notes',
          content: `# Browser DOM & Storage\n\n- DOM Event Propagation: Capturing phase -> Target -> Bubbling phase.\n- localStorage persists across browser sessions; sessionStorage clears on tab close.`,
        },
      ],
      questQuestions: [
        {
          question: 'What does event.preventDefault() do in a form submission handler?',
          options: ['Prevents the default browser reload and HTTP submission', 'Stops event bubbling', 'Clears input values', 'Disables the submit button'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 4: URL Query String Parameter Parser',
        description: 'Read a query string like "?name=Rahul&role=Developer". Extract and print the value of "role".',
        inputFormat: 'A query string',
        outputFormat: 'Value of role parameter',
        constraints: 'Valid URI query format',
        sampleInput: '?name=Rahul&role=Developer',
        sampleOutput: 'Developer',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const query = fs.readFileSync(0, 'utf-8').trim();\n    const params = new URLSearchParams(query);\n    console.log(params.get('role') || 'NOT_FOUND');\n}\nmain();\n`,
        },
        testCases: [
          { input: '?name=Rahul&role=Developer', expectedOutput: 'Developer', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is event delegation in modern web development?',
          options: ['Attaching a single event listener to a parent element to handle events on its dynamic children using bubbling', 'Spawning web workers', 'Delegating tasks to server', 'Using timers'],
          correctOptionIndex: 0,
          explanation: 'Event delegation leverages event bubbling to handle events on multiple child nodes with a single parent handler.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 5,
      title: 'Level 5: Promises, Async/Await & ES6 Classes',
      youtubeVideoId: 'PoRJizFvM7s',
      studyMaterials: [
        {
          title: 'Asynchronous Control Flow',
          type: 'notes',
          content: `# Asynchronous JavaScript\n\n- Promise states: pending, fulfilled, rejected.\n- async/await simplifies promise chains into linear code.\n- Promise.all() rejects if any promise fails; Promise.allSettled() returns all outcomes.`,
        },
      ],
      questQuestions: [
        {
          question: 'What does Promise.all() do if one of the promises rejects?',
          options: ['Immediately rejects with that reason, ignoring other pending promises', 'Waits for all and returns errors', 'Retries the rejected promise', 'Resolves with null'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 5: Async Task Execution Duration Simulator',
        description: 'Read N task durations in milliseconds. Print the maximum duration (the time Promise.all would take concurrently).',
        inputFormat: 'Line 1: N\\nLine 2: N durations',
        outputFormat: 'Max duration',
        constraints: '1 <= N <= 10^5',
        sampleInput: '3\n200 800 500',
        sampleOutput: '800',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (lines.length >= 2) {\n        const n = parseInt(lines[0], 10);\n        const arr = lines.slice(1, 1 + n).map(Number);\n        console.log(Math.max(...arr));\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '3\n200 800 500', expectedOutput: '800', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What does the async keyword before a function guarantee about its return value?',
          options: ['It always returns a Promise resolving to the returned value', 'It runs in a separate thread', 'It blocks the CPU', 'It returns undefined'],
          correctOptionIndex: 0,
          explanation: 'An async function implicitly wraps its return value in a resolved Promise.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 6,
      title: 'Level 6: V8 Internals, Event Loop & Microtasks',
      youtubeVideoId: '8aGhZQkoFbQ',
      studyMaterials: [
        {
          title: 'V8 Event Loop & Call Stack',
          type: 'notes',
          content: `# The JavaScript Event Loop\n\n- Call Stack: Synchronous execution frame.\n- Microtask Queue: Promise callbacks, queueMicrotask (runs before macrotasks).\n- Macrotask Queue: setTimeout, setInterval, I/O events.`,
        },
      ],
      questQuestions: [
        {
          question: 'Which queue has higher execution priority in the JavaScript event loop?',
          options: ['Microtask Queue (Promises)', 'Macrotask Queue (setTimeout)', 'Both have equal priority', 'Operating system chooses'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 6: Custom Function Memoizer Simulation',
        description: 'Read N query integers. Output number of unique calculations needed to process all queries.',
        inputFormat: 'Line 1: N\\nLine 2: N integers',
        outputFormat: 'Count of unique cache entries',
        constraints: '1 <= N <= 10^5',
        sampleInput: '6\n5 2 5 3 2 5',
        sampleOutput: '3',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (lines.length >= 2) {\n        const n = parseInt(lines[0], 10);\n        const set = new Set(lines.slice(1, 1 + n));\n        console.log(set.size);\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '6\n5 2 5 3 2 5', expectedOutput: '3', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'Why does Promise.resolve().then(...) run before setTimeout(..., 0)?',
          options: ['Promise callbacks are scheduled in the microtask queue, which is exhausted before the next macrotask', 'setTimeout is slower to parse', 'Promises bypass the event loop', 'V8 prioritizes closures'],
          correctOptionIndex: 0,
          explanation: 'The event loop empties the entire microtask queue before picking the next task from the macrotask queue.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 7,
      title: 'Level 7: Server-Side Node.js & Streaming Architecture',
      youtubeVideoId: 'fBNz5xF-Kx4',
      studyMaterials: [
        {
          title: 'Node.js Libuv & Streams',
          type: 'notes',
          content: `# Node.js Backend\n\n- Libuv provides the cross-platform asynchronous I/O thread pool.\n- Stream pipelines process large files with minimal RAM consumption.\n- Fastify & Express for REST API routing.`,
        },
      ],
      questQuestions: [
        {
          question: 'What library handles the event loop and thread pool in Node.js?',
          options: ['Libuv', 'V8 Engine', 'Babel', 'Webpack'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 7: Chunked Buffer Byte Counter',
        description: 'Read N string chunks. Compute and print total byte length across all chunks using Buffer.byteLength().',
        inputFormat: 'Line 1: N\\nNext N lines: String chunk',
        outputFormat: 'Total byte length',
        constraints: '1 <= N <= 100',
        sampleInput: '2\nHello\nWorld',
        sampleOutput: '10',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\r?\\n/);\n    if (lines.length >= 2) {\n        const n = parseInt(lines[0], 10);\n        let total = 0;\n        for (let i = 1; i <= n && i < lines.length; i++) {\n            total += Buffer.byteLength(lines[i], 'utf-8');\n        }\n        console.log(total);\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '2\nHello\nWorld', expectedOutput: '10', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the advantage of stream.pipeline() over stream.pipe() in Node.js?',
          options: ['Automatically destroys streams and cleans up file descriptors on error or finish', 'Faster compile time', 'Compresses files', 'Enables multi-threading'],
          correctOptionIndex: 0,
          explanation: 'stream.pipeline() properly forwards errors and ensures all streams in the pipeline are cleanly closed.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 8,
      title: 'Level 8: Full-Stack Integration with React',
      youtubeVideoId: 'w7ejDZ8SWv8',
      studyMaterials: [
        {
          title: 'React State & API Consumption',
          type: 'notes',
          content: `# React Integration\n\n- React hooks: useState, useEffect, useCallback, useMemo\n- Client-side token storage in memory or HttpOnly cookies\n- Custom hooks for decoupled business logic.`,
        },
      ],
      questQuestions: [
        {
          question: 'Why should keys be provided to items in a React list?',
          options: ['Helps the reconciliation algorithm identify which items have changed, added, or removed', 'Assigns DOM IDs', 'Compiles JSX', 'Styling'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 8: Debounced Search Input Tracker Simulation',
        description: 'Given N search timestamps and strings, output only the last string entered in each burst (gap >= 300ms).',
        inputFormat: 'Line 1: N\\nNext N lines: Timestamp Text',
        outputFormat: 'Final search query of each burst on separate lines',
        constraints: '1 <= N <= 100',
        sampleInput: '3\n100 apple\n200 app\n600 banana',
        sampleOutput: 'app\nbanana',
        difficulty: 'Medium',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\r?\\n/);\n    if (lines.length >= 2) {\n        const n = parseInt(lines[0], 10);\n        const entries = [];\n        for (let i = 1; i <= n && i < lines.length; i++) {\n            const [t, s] = lines[i].split(/\\s+/);\n            entries.push({ time: parseInt(t, 10), str: s });\n        }\n        for (let i = 0; i < entries.length; i++) {\n            if (i === entries.length - 1 || entries[i + 1].time - entries[i].time >= 300) {\n                console.log(entries[i].str);\n            }\n        }\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '3\n100 apple\n200 app\n600 banana', expectedOutput: 'app\nbanana', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the dependency array in React useEffect used for?',
          options: ['Controls when the effect re-runs based on value changes', 'Imports modules', 'Passes props', 'Allocates heap'],
          correctOptionIndex: 0,
          explanation: 'The effect runs after render only if one of the values in the dependency array has changed.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 9,
      title: 'Level 9: Real-Time WebSockets & Redis Caching',
      youtubeVideoId: '1BfCnjr_Vjg',
      studyMaterials: [
        {
          title: 'WebSockets & Redis Architecture',
          type: 'notes',
          content: `# Real-Time Web\n\n- WebSockets enable bi-directional, full-duplex communication over a single TCP connection.\n- Redis in-memory key-value cache with TTL expiration.\n- Background job queues (BullMQ).`,
        },
      ],
      questQuestions: [
        {
          question: 'How does a WebSocket connection begin?',
          options: ['HTTP GET request with an Upgrade: websocket header handshake', 'Direct UDP socket', 'FTP hand-shake', 'DNS lookup'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 9: Redis Sliding Window Rate Limiter Simulation',
        description: 'Given request timestamps in seconds, allow max 2 requests per 5-second sliding window. Print "ALLOWED" or "REJECTED".',
        inputFormat: 'Line 1: N\\nLine 2: N space-separated timestamps',
        outputFormat: 'N lines with status',
        constraints: '1 <= N <= 100',
        sampleInput: '4\n1 2 3 7',
        sampleOutput: 'ALLOWED\nALLOWED\nREJECTED\nALLOWED',
        difficulty: 'Medium',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (lines.length >= 2) {\n        const n = parseInt(lines[0], 10);\n        const timestamps = lines.slice(1, 1 + n).map(Number);\n        const active = [];\n        for (const t of timestamps) {\n            while (active.length > 0 && active[0] <= t - 5) active.shift();\n            if (active.length < 2) {\n                active.push(t);\n                console.log('ALLOWED');\n            } else {\n                console.log('REJECTED');\n            }\n        }\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '4\n1 2 3 7', expectedOutput: 'ALLOWED\nALLOWED\nREJECTED\nALLOWED', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the purpose of the Cache-Aside pattern in Redis?',
          options: ['Application first checks cache; if miss, queries DB and writes to cache before returning', 'Always writes to disk first', 'Bypasses cache on reads', 'Encrypts memory'],
          correctOptionIndex: 0,
          explanation: 'Cache-aside checks the cache first, lazily loading data from the database on a cache miss.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 10,
      title: 'Level 10: Production Engineering & Capstone',
      youtubeVideoId: 'ahCwqrYqo9o',
      studyMaterials: [
        {
          title: 'Full-Stack Production Best Practices',
          type: 'notes',
          content: `# Production Full-Stack Engineering\n\n- TypeScript in full-stack JS applications\n- Monorepos with Turborepo\n- Multi-stage Docker builds & CI/CD pipelines.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the main benefit of multi-stage Docker builds?',
          options: ['Keeps final production image sizes small by omitting build tools and source compilers', 'Runs containers faster', 'Enables TypeScript', 'Disables root access'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 10: Collaborative Operational Transform Character Offset Engine',
        description: 'Read initial text length L, followed by N insert operations (index, stringLength). Output final length.',
        inputFormat: 'Line 1: L N\\nNext N lines: Index Length',
        outputFormat: 'Final text length integer',
        constraints: 'L >= 0, N <= 100',
        sampleInput: '10 2\n5 3\n8 4',
        sampleOutput: '17',
        difficulty: 'Medium',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (lines.length >= 2) {\n        let l = parseInt(lines[0], 10);\n        const n = parseInt(lines[1], 10);\n        let idx = 2;\n        for (let i = 0; i < n; i++) {\n            const insIdx = parseInt(lines[idx++], 10);\n            const len = parseInt(lines[idx++], 10);\n            l += len;\n        }\n        console.log(l);\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '10 2\n5 3\n8 4', expectedOutput: '17', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is Operational Transformation (OT) used for in applications like Google Docs?',
          options: ['Concurrently resolving overlapping text edits across multiple distributed users', 'Compiling TypeScript', 'Optimizing database queries', 'CSS transformations'],
          correctOptionIndex: 0,
          explanation: 'OT adjusts character indices so concurrent user edits apply consistently without data corruption.',
          points: 1,
        },
      ],
    },
  ],
};
