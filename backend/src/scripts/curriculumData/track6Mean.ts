import { ISeedTrackData } from './types';

export const track6Mean: ISeedTrackData = {
  name: 'MEAN Stack Development: Enterprise Reactive Systems',
  description:
    'Build reactive enterprise applications with Angular 18+, TypeScript 5+, RxJS, Node.js 20, Express, and MongoDB persistence.',
  coverImageUrl:
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
  isLocked: false,
  levels: [
    {
      levelNumber: 1,
      title: 'Level 1: Web Standards & Frontend Foundations',
      youtubeVideoId: 'UB1O30fR-EE',
      studyMaterials: [
        {
          title: 'Semantic Web & Modern CSS Variables',
          type: 'notes',
          content: `# Web Standards\n\n- Semantic HTML5 structure\n- CSS Custom Properties (--primary-color: #2563eb)\n- Modern Git branching and semantic commits.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the syntax to access a CSS custom property (variable)?',
          options: ['var(--variable-name)', '$variable-name', '@variable-name', 'prop(variable-name)'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 1: CSS Hex Color to RGB Normalizer',
        description: 'Read a 6-character hex color code (without #). Output "rgb(R, G, B)".',
        inputFormat: '6-character hex string',
        outputFormat: 'rgb(R, G, B)',
        constraints: 'Valid hex string',
        sampleInput: 'FFFFFF',
        sampleOutput: 'rgb(255, 255, 255)',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const hex = fs.readFileSync(0, 'utf-8').trim();\n    const r = parseInt(hex.substring(0, 2), 16);\n    const g = parseInt(hex.substring(2, 4), 16);\n    const b = parseInt(hex.substring(4, 6), 16);\n    console.log(\`rgb(\${r}, \${g}, \${b})\`);\n}\nmain();\n`,
        },
        testCases: [
          { input: 'FFFFFF', expectedOutput: 'rgb(255, 255, 255)', isHidden: false },
          { input: '000000', expectedOutput: 'rgb(0, 0, 0)', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the specificity order in standard CSS cascading rules?',
          options: ['Inline styles > ID selectors > Class/Attribute selectors > Element selectors', 'Class > ID > Inline', 'Element > Class > ID', 'Alphabetical'],
          correctOptionIndex: 0,
          explanation: 'Inline styles hold the highest specificity (1000), followed by IDs (100), classes/attributes (10), and elements (1).',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 2,
      title: 'Level 2: TypeScript Deep Dive & Generic Contracts',
      youtubeVideoId: 'BwuLxPH8IDs',
      studyMaterials: [
        {
          title: 'TypeScript Type System',
          type: 'notes',
          content: `# TypeScript in Enterprise Systems\n\n- Interfaces vs Types\n- Generics: <T extends Record<string, any>>\n- Discriminated Unions and Type Narrowing.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is a discriminated union in TypeScript?',
          options: ['A union of object types having a common literal property used for type narrowing', 'A union of numbers', 'An enum', 'A generic array'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 2: Discriminated Union Result Extractor',
        description: 'Read TYPE (SUCCESS or ERROR) and VALUE. If SUCCESS, output "RESULT: <val>", else "ERROR_LOG: <val>".',
        inputFormat: 'Type Value',
        outputFormat: 'Formatted string',
        constraints: 'Type is SUCCESS or ERROR',
        sampleInput: 'SUCCESS 42',
        sampleOutput: 'RESULT: 42',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const [type, val] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (type === 'SUCCESS') console.log(\`RESULT: \${val}\`);\n    else console.log(\`ERROR_LOG: \${val}\`);\n}\nmain();\n`,
        },
        testCases: [
          { input: 'SUCCESS 42', expectedOutput: 'RESULT: 42', isHidden: false },
          { input: 'ERROR 500', expectedOutput: 'ERROR_LOG: 500', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What does the keyof operator do in TypeScript?',
          options: ['Produces a string or numeric literal union of an object type keys', 'Iterates over keys at runtime', 'Creates a new object', 'Encrypts keys'],
          correctOptionIndex: 0,
          explanation: 'keyof takes an object type and produces a union of its keys at compile time.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 3,
      title: 'Level 3: Angular Foundations & Signals Architecture',
      youtubeVideoId: '3dHNOWTI7H8',
      studyMaterials: [
        {
          title: 'Angular Standalone Components & Signals',
          type: 'notes',
          content: `# Angular Components\n\n- Standalone components (standalone: true)\n- Modern control flow: @if, @for, @switch\n- Angular Signals: signal(), computed(), effect().`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the modern control flow replacement for *ngFor in Angular 17+?',
          options: ['@for (item of items; track item.id)', '*forLoop', '<ng-for>', '@loop'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 3: Angular Signal Track Key Dedup Evaluator',
        description: 'Read N IDs. Output the count of duplicate IDs.',
        inputFormat: 'Line 1: N\\nLine 2: N integers',
        outputFormat: 'Count of duplicates',
        constraints: '1 <= N <= 10^5',
        sampleInput: '5\n10 20 10 30 20',
        sampleOutput: '2',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (lines.length >= 2) {\n        const n = parseInt(lines[0], 10);\n        const arr = lines.slice(1, 1 + n);\n        const set = new Set(arr);\n        console.log(arr.length - set.size);\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '5\n10 20 10 30 20', expectedOutput: '2', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is an Angular Signal?',
          options: ['A reactive value wrapper that notifies interested consumers when it changes', 'A DOM event', 'An HTTP interceptor', 'A service worker'],
          correctOptionIndex: 0,
          explanation: 'Signals represent values that can change synchronously and provide fine-grained reactivity in Angular.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 4,
      title: 'Level 4: Reactive Angular, RxJS & Dependency Injection',
      youtubeVideoId: 'ba_fB3Zz7s0',
      studyMaterials: [
        {
          title: 'RxJS Operators & Reactive Forms',
          type: 'notes',
          content: `# RxJS & Services\n\n- Observables vs Promises: Observables emit multiple values over time.\n- switchMap cancels previous in-flight requests.\n- Hierarchical Dependency Injection with @Injectable({ providedIn: 'root' }).`,
        },
      ],
      questQuestions: [
        {
          question: 'What does switchMap do when a new emission arrives from the source Observable?',
          options: ['Unsubscribes from the previous inner Observable and switches to the new one', 'Merges all emissions', 'Ignores the new emission', 'Throws an error'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 4: RxJS switchMap Cancel-and-Emit Simulator',
        description: 'Given sequence of emitted search query tokens, output only the final token emitted.',
        inputFormat: 'Space-separated tokens',
        outputFormat: 'Final token',
        constraints: 'At least one token',
        sampleInput: 'a ap app apple',
        sampleOutput: 'apple',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    console.log(tokens[tokens.length - 1]);\n}\nmain();\n`,
        },
        testCases: [
          { input: 'a ap app apple', expectedOutput: 'apple', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'Why should takeUntilDestroyed() be used with RxJS in Angular components?',
          options: ['Automatically completes the subscription when the component is destroyed to prevent memory leaks', 'Speeds up HTTP calls', 'Converts to Promises', 'Formats dates'],
          correctOptionIndex: 0,
          explanation: 'takeUntilDestroyed automatically ties observable subscriptions to the component lifecycle, preventing dangling references.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 5,
      title: 'Level 5: Node.js Core, Events & Libuv Asynchrony',
      youtubeVideoId: 'ENrzD9HAZK4',
      studyMaterials: [
        {
          title: 'Node.js Core Architecture',
          type: 'notes',
          content: `# Node.js Backend for MEAN\n\n- EventEmitter pattern for decoupled services\n- Buffer and Stream processing\n- Worker Threads for CPU intensive tasks.`,
        },
      ],
      questQuestions: [
        {
          question: 'What method registers an event listener on a Node.js EventEmitter?',
          options: ['emitter.on(event, listener)', 'emitter.listen()', 'emitter.bind()', 'emitter.add()'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 5: Event Listener Call Count Aggregator',
        description: 'Read N event emissions of types (EVENT_A or EVENT_B). Output count of EVENT_A emissions.',
        inputFormat: 'Line 1: N\\nNext N lines: Event name',
        outputFormat: 'Count of EVENT_A',
        constraints: '1 <= N <= 1000',
        sampleInput: '3\nEVENT_A\nEVENT_B\nEVENT_A',
        sampleOutput: '2',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\r?\\n/);\n    if (lines.length >= 2) {\n        const n = parseInt(lines[0], 10);\n        let count = 0;\n        for (let i = 1; i <= n && i < lines.length; i++) {\n            if (lines[i].trim() === 'EVENT_A') count++;\n        }\n        console.log(count);\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '3\nEVENT_A\nEVENT_B\nEVENT_A', expectedOutput: '2', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'When should Worker Threads be used in Node.js instead of standard async callbacks?',
          options: ['For CPU-intensive computations (e.g., cryptography, image compression) that would block the event loop', 'For database queries', 'For file reads', 'For timers'],
          correctOptionIndex: 0,
          explanation: 'Worker threads run in parallel CPU threads, offloading CPU-bound operations so the event loop remains responsive.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 6,
      title: 'Level 6: Express.js REST Services & Swagger Specs',
      youtubeVideoId: 'G8uL0lFFoN0',
      studyMaterials: [
        {
          title: 'Enterprise Express Routing',
          type: 'notes',
          content: `# Express Tiered Architecture\n\n- Controller -> Service -> Repository pattern\n- Request validation and centralized error envelopes\n- OpenAPI/Swagger API documentation.`,
        },
      ],
      questQuestions: [
        {
          question: 'In the Controller-Service-Repository pattern, where does core business logic reside?',
          options: ['Service layer', 'Controller layer', 'Repository layer', 'Router'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 6: HTTP Status Code Reason Classifier',
        description: 'Read an HTTP status code integer. Output "SUCCESS" (2xx), "CLIENT_ERROR" (4xx), or "SERVER_ERROR" (5xx).',
        inputFormat: 'Status integer',
        outputFormat: 'Category string',
        constraints: 'Valid HTTP status',
        sampleInput: '404',
        sampleOutput: 'CLIENT_ERROR',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const code = parseInt(fs.readFileSync(0, 'utf-8').trim(), 10);\n    if (code >= 200 && code < 300) console.log('SUCCESS');\n    else if (code >= 400 && code < 500) console.log('CLIENT_ERROR');\n    else if (code >= 500 && code < 600) console.log('SERVER_ERROR');\n}\nmain();\n`,
        },
        testCases: [
          { input: '404', expectedOutput: 'CLIENT_ERROR', isHidden: false },
          { input: '200', expectedOutput: 'SUCCESS', isHidden: false },
          { input: '500', expectedOutput: 'SERVER_ERROR', isHidden: true },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the purpose of an API contract (like OpenAPI/Swagger)?',
          options: ['Provides an unambiguous machine-readable specification of endpoints, inputs, and outputs', 'Compiles backend code', 'Acts as database index', 'Runs security audits'],
          correctOptionIndex: 0,
          explanation: 'OpenAPI specs document REST endpoints so frontend and backend teams can integrate seamlessly.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 7,
      title: 'Level 7: MongoDB Enterprise Persistence & ACID Transactions',
      youtubeVideoId: 'W-b9KGwVUCE',
      studyMaterials: [
        {
          title: 'MongoDB Multi-Document Transactions',
          type: 'notes',
          content: `# ACID Transactions in MongoDB\n\n- session.withTransaction() ensures atomic multi-document writes.\n- Compound indexes optimize multi-field search.\n- TypeScript schema validation with Mongoose.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is required in MongoDB to execute multi-document ACID transactions?',
          options: ['A Replica Set deployment', 'A standalone instance', 'Redis cache', 'Sharded cluster only'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 7: Atomic Transaction Ledger Balance Verifier',
        description: 'Read initial balance B and N transaction delta amounts. If balance ever drops below 0, output "ROLLBACK", else output final balance.',
        inputFormat: 'Line 1: B N\\nLine 2: N integer deltas',
        outputFormat: 'Final balance or ROLLBACK',
        constraints: 'B >= 0, N <= 1000',
        sampleInput: '100 3\n50 -120 30',
        sampleOutput: '60',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (lines.length >= 2) {\n        let b = parseInt(lines[0], 10);\n        const n = parseInt(lines[1], 10);\n        let rollback = false;\n        for (let i = 2; i < 2 + n; i++) {\n            b += parseInt(lines[i], 10);\n            if (b < 0) { rollback = true; break; }\n        }\n        if (rollback) console.log('ROLLBACK');\n        else console.log(b);\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '100 3\n50 -120 30', expectedOutput: '60', isHidden: false },
          { input: '100 2\n-150 200', expectedOutput: 'ROLLBACK', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What does the "A" in ACID stand for?',
          options: ['Atomicity (all operations succeed or none do)', 'Asynchrony', 'Availability', 'Authentication'],
          correctOptionIndex: 0,
          explanation: 'Atomicity ensures that a series of database operations either all execute successfully or roll back completely.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 8,
      title: 'Level 8: Full MEAN Integration & Angular HTTP Interceptors',
      youtubeVideoId: 'Wt1b7Rz72c8',
      studyMaterials: [
        {
          title: 'Angular HttpClient & Auth Interceptors',
          type: 'notes',
          content: `# MEAN Integration\n\n- HTTP Interceptors clone requests to inject Authorization: Bearer <token>\n- Route guards (canActivate) protect private paths\n- RxJS catchError for seamless client-side error handling.`,
        },
      ],
      questQuestions: [
        {
          question: 'What interface or function is used to create HTTP interceptors in modern Angular?',
          options: ['HttpInterceptorFn (functional interceptor)', 'NgModule', 'RouteGuard', 'ComponentInterceptor'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 8: Authorization Bearer Header Parser',
        description: 'Read an HTTP header line like "Authorization: Bearer mySecretToken123". Extract and print the token string.',
        inputFormat: 'Header string',
        outputFormat: 'Extracted token',
        constraints: 'Valid bearer format',
        sampleInput: 'Authorization: Bearer mySecretToken123',
        sampleOutput: 'mySecretToken123',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const line = fs.readFileSync(0, 'utf-8').trim();\n    const parts = line.split(/\\s+/);\n    console.log(parts[parts.length - 1]);\n}\nmain();\n`,
        },
        testCases: [
          { input: 'Authorization: Bearer mySecretToken123', expectedOutput: 'mySecretToken123', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'How does an Angular functional HttpInterceptor continue the request chain?',
          options: ['next(req)', 'req.send()', 'return true', 'res.next()'],
          correctOptionIndex: 0,
          explanation: 'Interceptors forward the transformed request by invoking next(clonedReq).',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 9,
      title: 'Level 9: Production MEAN: Jasmine Testing & Nginx Reverse Proxy',
      youtubeVideoId: 'G3e-cpL7ofc',
      studyMaterials: [
        {
          title: 'Unit Testing & Nginx Deployment',
          type: 'notes',
          content: `# Production MEAN\n\n- TestBed for Angular component testing\n- Multi-stage Dockerfile: Angular build -> Nginx static serving\n- Nginx proxy_pass to Express backend API.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the role of Nginx in a production MEAN stack deployment?',
          options: ['Serves compiled static Angular assets and acts as a reverse proxy for the Express API', 'Runs MongoDB', 'Compiles TypeScript', 'Manages git'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 9: Nginx Upstream Weight Round-Robin Simulator',
        description: 'Read N requests to be distributed evenly between server1 and server2. Output "server1" or "server2" alternately.',
        inputFormat: 'Integer N',
        outputFormat: 'N lines with server name',
        constraints: '1 <= N <= 100',
        sampleInput: '3',
        sampleOutput: 'server1\nserver2\nserver1',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const n = parseInt(fs.readFileSync(0, 'utf-8').trim(), 10);\n    for (let i = 0; i < n; i++) {\n        console.log(i % 2 === 0 ? 'server1' : 'server2');\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '3', expectedOutput: 'server1\nserver2\nserver1', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the advantage of using TestBed in Angular unit testing?',
          options: ['Configures and initializes an isolated testing module with mock dependencies', 'Runs tests in GPU', 'Generates HTML reports', 'Deploys to AWS'],
          correctOptionIndex: 0,
          explanation: 'TestBed creates an isolated Angular module context for testing components and services.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 10,
      title: 'Level 10: Enterprise Architecture & Capstone Suite',
      youtubeVideoId: 'fXp_d83e2lE',
      studyMaterials: [
        {
          title: 'NgRx Global State & Monorepos',
          type: 'notes',
          content: `# Enterprise Architecture\n\n- NgRx: Store, Actions, Reducers, Effects, Selectors\n- ChangeDetectionStrategy.OnPush for maximum UI performance\n- Nx workspace monorepo for shared enterprise libraries.`,
        },
      ],
      questQuestions: [
        {
          question: 'How does ChangeDetectionStrategy.OnPush improve Angular performance?',
          options: ['Angular only checks the component when its Input references change or an event originates from it', 'Disables change detection entirely', 'Uses Web Workers', 'Bypasses DOM'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 10: NgRx Reducer Action State Transition Simulator',
        description: 'Read initial count C and N actions (INCREMENT or DECREMENT). Output final count.',
        inputFormat: 'Line 1: C N\\nNext N lines: Action',
        outputFormat: 'Final count',
        constraints: '1 <= N <= 1000',
        sampleInput: '10 3\nINCREMENT\nINCREMENT\nDECREMENT',
        sampleOutput: '11',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\r?\\n/);\n    if (lines.length >= 2) {\n        let [c, n] = lines[0].split(/\\s+/).map(Number);\n        for (let i = 1; i <= n && i < lines.length; i++) {\n            if (lines[i].trim() === 'INCREMENT') c++;\n            else if (lines[i].trim() === 'DECREMENT') c--;\n        }\n        console.log(c);\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '10 3\nINCREMENT\nINCREMENT\nDECREMENT', expectedOutput: '11', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the role of an NgRx Effect in enterprise state management?',
          options: ['Handles asynchronous side-effects (like HTTP requests) in response to dispatched actions before dispatching new actions', 'Styles components', 'Compiles code', 'Renders templates'],
          correctOptionIndex: 0,
          explanation: 'NgRx Effects listen for actions, perform side-effects (such as API calls), and emit new actions upon completion.',
          points: 1,
        },
      ],
    },
  ],
};
