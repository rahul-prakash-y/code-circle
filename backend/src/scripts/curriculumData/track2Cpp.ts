import { ISeedTrackData } from './types';

export const track2Cpp: ISeedTrackData = {
  name: 'C++ Programming: High-Performance & STL',
  description:
    'Master modern C++20, STL algorithms, template metaprogramming, RAII, memory models, and competitive DSA.',
  coverImageUrl:
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
  isLocked: false,
  levels: [
    {
      levelNumber: 1,
      title: 'Level 1: C++ Foundations & Fast I/O Streams',
      youtubeVideoId: '18c3MTX0PK0',
      studyMaterials: [
        {
          title: 'Modern C++ iostream & Standard Streams',
          type: 'notes',
          content: `# C++ Streams & Competitive I/O\n\n- std::cin, std::cout, std::endl vs '\\n'\n- Fast I/O optimization: std::ios_base::sync_with_stdio(false); std::cin.tie(NULL);\n- Namespaces: namespace std { ... }`,
        },
      ],
      questQuestions: [
        {
          question: 'Why is \'\\n\' faster than std::endl in C++?',
          options: ['std::endl flushes the output buffer on every call', '\\n flushes the buffer', 'std::endl allocates heap', '\\n is a macro'],
          correctOption: 0,
        },
        {
          question: 'Which header provides standard input and output streams in C++?',
          options: ['<stdio.h>', '<iostream>', '<vector>', '<string>'],
          correctOption: 1,
        },
      ],
      challenge: {
        title: 'Level 1: Fast Stream Sum & Difference',
        description: 'Read two integers A and B, print their sum and absolute difference on two separate lines.',
        inputFormat: 'Two space-separated integers A and B',
        outputFormat: 'Line 1: Sum\\nLine 2: Absolute Difference',
        constraints: '-10^9 <= A, B <= 10^9',
        sampleInput: '15 25',
        sampleOutput: '40\\n10',
        difficulty: 'Easy',
        allowedLanguages: ['cpp'],
        starterCode: {
          cpp: `#include <iostream>\n#include <cmath>\n\nint main() {\n    std::ios_base::sync_with_stdio(false);\n    std::cin.tie(NULL);\n    long long a, b;\n    if (std::cin >> a >> b) {\n        std::cout << (a + b) << "\\n";\n        std::cout << std::abs(a - b) << "\\n";\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '15 25', expectedOutput: '40\n10', isHidden: false },
          { input: '-10 10', expectedOutput: '0\n20', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What does sync_with_stdio(false) accomplish in C++?',
          options: ['Disables synchronization between C++ iostream and C stdio for faster I/O', 'Disables multithreading', 'Enables C++ exceptions', 'Initializes buffers to zero'],
          correctOptionIndex: 0,
          explanation: 'It unsyncs C++ streams with C standard I/O, yielding massive speed improvements for high-volume inputs.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 2,
      title: 'Level 2: Control Flow & References',
      youtubeVideoId: 'I-hZkUa9mAM',
      studyMaterials: [
        {
          title: 'Pass-by-Reference in C++',
          type: 'notes',
          content: `# References in C++\n\n- Pass-by-reference (&) avoids expensive object copying.\n- const references (const &) guarantee immutability while preventing copies.`,
        },
      ],
      questQuestions: [
        {
          question: 'Can a C++ reference be NULL or rebound after initialization?',
          options: ['Yes', 'No, references must refer to a valid object and cannot be rebound', 'Only if declared const', 'Only in C++20'],
          correctOption: 1,
        },
      ],
      challenge: {
        title: 'Level 2: In-Place Min-Max Bounds Clamper',
        description: 'Read three integers: X, Low, High. Clamp X between Low and High inclusive.',
        inputFormat: 'Three space-separated integers X Low High',
        outputFormat: 'Clamped value',
        constraints: '-10^9 <= X, Low, High <= 10^9 and Low <= High',
        sampleInput: '150 0 100',
        sampleOutput: '100',
        difficulty: 'Easy',
        allowedLanguages: ['cpp'],
        starterCode: {
          cpp: `#include <iostream>\n#include <algorithm>\n\nint main() {\n    long long x, low, high;\n    if (std::cin >> x >> low >> high) {\n        std::cout << std::clamp(x, low, high) << "\\n";\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '150 0 100', expectedOutput: '100', isHidden: false },
          { input: '-50 0 100', expectedOutput: '0', isHidden: false },
          { input: '45 0 100', expectedOutput: '45', isHidden: true },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'Why is pass-by-const-reference preferred for complex types like std::string?',
          options: ['Avoids copying overhead while preventing caller object mutation', 'Permits null pointers', 'Stores in heap', 'Compiles faster'],
          correctOptionIndex: 0,
          explanation: 'Passing by const & provides zero-copy performance without allowing the function to modify the original argument.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 3,
      title: 'Level 3: std::string & Vector Containers',
      youtubeVideoId: 'PocJ5jXv8No',
      studyMaterials: [
        {
          title: 'STL Vectors & Dynamic Arrays',
          type: 'notes',
          content: `# std::vector & std::string\n\n- std::vector is a dynamically resizing array with contiguous storage.\n- push_back() amortized O(1), emplace_back() constructs in-place.\n- vector.size() vs vector.capacity()`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the amortized time complexity of std::vector::push_back?',
          options: ['O(N)', 'O(1)', 'O(log N)', 'O(N^2)'],
          correctOption: 1,
        },
      ],
      challenge: {
        title: 'Level 3: Vector Running Prefix Sums',
        description: 'Read N integers and output their running prefix sum array.',
        inputFormat: 'Line 1: N\\nLine 2: N space-separated integers',
        outputFormat: 'N space-separated running prefix sums',
        constraints: '1 <= N <= 10^5',
        sampleInput: '4\\n1 2 3 4',
        sampleOutput: '1 3 6 10',
        difficulty: 'Easy',
        allowedLanguages: ['cpp'],
        starterCode: {
          cpp: `#include <iostream>\n#include <vector>\n\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<long long> v(n);\n        long long sum = 0;\n        for (int i = 0; i < n; i++) {\n            long long val;\n            std::cin >> val;\n            sum += val;\n            std::cout << sum << (i == n - 1 ? "\\n" : " ");\n        }\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '4\\n1 2 3 4', expectedOutput: '1 3 6 10', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is Small String Optimization (SSO) in modern C++ standard libraries?',
          options: ['Stores short strings directly inside the string object buffer without heap allocation', 'Compresses strings', 'Converts to UTF-16', 'Prevents null terminators'],
          correctOptionIndex: 0,
          explanation: 'SSO eliminates heap allocation overhead for strings smaller than 15-23 bytes.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 4,
      title: 'Level 4: Object-Oriented C++ & Virtual Tables',
      youtubeVideoId: '2BP8Nhxjr1I',
      studyMaterials: [
        {
          title: 'Encapsulation, Inheritance & Polymorphism',
          type: 'notes',
          content: `# C++ Classes & Virtual Functions\n\n- Access specifiers: public, private, protected\n- Virtual functions and virtual destructors enable dynamic polymorphism.\n- Abstract classes contain pure virtual functions (= 0).`,
        },
      ],
      questQuestions: [
        {
          question: 'Why should base class destructors be marked virtual?',
          options: ['To allow deleting derived objects via base pointers without memory leaks', 'To increase memory alignment', 'Required by compiler', 'For faster destruction'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 4: Bank Account Balance Tracker Class',
        description: 'Process N transactions (D for Deposit, W for Withdrawal) on an initial balance.',
        inputFormat: 'Line 1: InitialBalance N\\nNext N lines: Action Amount',
        outputFormat: 'Final Balance',
        constraints: 'Initial balance >= 0, N <= 1000',
        sampleInput: '1000 3\\nD 500\\nW 200\\nD 100',
        sampleOutput: '1400',
        difficulty: 'Easy',
        allowedLanguages: ['cpp'],
        starterCode: {
          cpp: `#include <iostream>\n\nclass BankAccount {\n    long long balance;\npublic:\n    BankAccount(long long b) : balance(b) {}\n    void deposit(long long a) { balance += a; }\n    void withdraw(long long a) { if (balance >= a) balance -= a; }\n    long long getBalance() const { return balance; }\n};\n\nint main() {\n    long long init; int n;\n    if (std::cin >> init >> n) {\n        BankAccount acc(init);\n        for (int i = 0; i < n; i++) {\n            char op; long long amt;\n            std::cin >> op >> amt;\n            if (op == 'D') acc.deposit(amt);\n            else if (op == 'W') acc.withdraw(amt);\n        }\n        std::cout << acc.getBalance() << "\\n";\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '1000 3\\nD 500\\nW 200\\nD 100', expectedOutput: '1400', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What structure does C++ use at runtime to resolve virtual function calls?',
          options: ['vtable (Virtual Method Table)', 'Binary Search Tree', 'Hash Map', 'Heap Stack'],
          correctOptionIndex: 0,
          explanation: 'The compiler creates a vtable per class with virtual functions, looking up pointers dynamically.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 5,
      title: 'Level 5: Operator Overloading & Templates',
      youtubeVideoId: 'Cl4_8pD1R-g',
      studyMaterials: [
        {
          title: 'Operator Overloading & Generic Templates',
          type: 'notes',
          content: `# Templates & Overloading\n\n- Function templates: template <typename T> T add(T a, T b);\n- Class templates: template <typename T> class Stack;\n- Overloaded operators like operator+ and operator<<.`,
        },
      ],
      questQuestions: [
        {
          question: 'What occurs during C++ template instantiation?',
          options: ['The compiler generates concrete code for each specialized type', 'Types are erased at runtime', 'Dynamically boxed into objects', 'Interpreted by JIT'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 5: Complex Number Operator Addition',
        description: 'Read real and imaginary parts of two complex numbers. Output their sum (Real + Imag i).',
        inputFormat: 'R1 I1 R2 I2',
        outputFormat: 'R + Ii (e.g. 5 + 7i)',
        constraints: '-1000 <= R, I <= 1000',
        sampleInput: '3 4 2 3',
        sampleOutput: '5 + 7i',
        difficulty: 'Easy',
        allowedLanguages: ['cpp'],
        starterCode: {
          cpp: `#include <iostream>\n\nstruct Complex {\n    int r, i;\n    Complex operator+(const Complex &o) const {\n        return {r + o.r, i + o.i};\n    }\n};\n\nint main() {\n    Complex c1, c2;\n    if (std::cin >> c1.r >> c1.i >> c2.r >> c2.i) {\n        Complex res = c1 + c2;\n        std::cout << res.r << " + " << res.i << "i\\n";\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '3 4 2 3', expectedOutput: '5 + 7i', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'Which operator CANNOT be overloaded in C++?',
          options: [':: (Scope Resolution)', '+', '[]', '<<'],
          correctOptionIndex: 0,
          explanation: 'The scope resolution operator ::, member access ., and ternary ?: cannot be overloaded.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 6,
      title: 'Level 6: STL Associative Containers & Algorithms',
      youtubeVideoId: 'g-1Cn3ccwXY',
      studyMaterials: [
        {
          title: 'STL Map, Set & Priority Queue',
          type: 'notes',
          content: `# STL Associative Containers\n\n- std::set / std::map: Red-black balanced binary search trees, O(log N) operations.\n- std::unordered_map: Hash table, O(1) average lookup.\n- std::priority_queue: Max-heap / Min-heap.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the average time complexity of element lookup in std::unordered_map?',
          options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 6: Top-K Frequent Elements in Vector',
        description: 'Read N integers and find the most frequent element. If tied, print the smaller element.',
        inputFormat: 'Line 1: N\\nLine 2: N space-separated integers',
        outputFormat: 'Most frequent integer',
        constraints: '1 <= N <= 100000',
        sampleInput: '6\\n1 3 2 1 4 1',
        sampleOutput: '1',
        difficulty: 'Medium',
        allowedLanguages: ['cpp'],
        starterCode: {
          cpp: `#include <iostream>\n#include <map>\n\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::map<int, int> freq;\n        for (int i = 0; i < n; i++) {\n            int x; std::cin >> x;\n            freq[x]++;\n        }\n        int bestElem = -1, maxCount = -1;\n        for (auto const& [elem, count] : freq) {\n            if (count > maxCount) {\n                maxCount = count;\n                bestElem = elem;\n            }\n        }\n        std::cout << bestElem << "\\n";\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '6\\n1 3 2 1 4 1', expectedOutput: '1', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What underlying data structure powers std::set in GCC libstdc++?',
          options: ['Red-Black Tree', 'Hash Table', 'B-Tree', 'Skip List'],
          correctOptionIndex: 0,
          explanation: 'std::set is implemented as a self-balancing Red-Black binary search tree.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 7,
      title: 'Level 7: Modern C++: RAII, Smart Pointers & Lambdas',
      youtubeVideoId: 'UOB7-B2MfwA',
      studyMaterials: [
        {
          title: 'Smart Pointers & Move Semantics',
          type: 'notes',
          content: `# Smart Pointers in Modern C++\n\n- std::unique_ptr: Sole ownership, zero runtime overhead over raw pointer.\n- std::shared_ptr: Shared ownership via reference counting.\n- std::move: Casts lvalue to rvalue reference to trigger move constructors.`,
        },
      ],
      questQuestions: [
        {
          question: 'Can std::unique_ptr be copied?',
          options: ['No, it can only be moved via std::move', 'Yes, creates another reference', 'Only if assigned to shared_ptr', 'Yes, default copy constructor'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 7: Lambda Expression Filter & Sum',
        description: 'Read N integers. Using a lambda expression with std::accumulate, compute the sum of all even integers.',
        inputFormat: 'Line 1: N\\nLine 2: N integers',
        outputFormat: 'Sum of even integers',
        constraints: '1 <= N <= 1000',
        sampleInput: '5\\n1 2 3 4 5',
        sampleOutput: '6',
        difficulty: 'Easy',
        allowedLanguages: ['cpp'],
        starterCode: {
          cpp: `#include <iostream>\n#include <vector>\n#include <numeric>\n\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<int> v(n);\n        for (int i = 0; i < n; i++) std::cin >> v[i];\n        long long evenSum = std::accumulate(v.begin(), v.end(), 0LL, [](long long acc, int x) {\n            return (x % 2 == 0) ? acc + x : acc;\n        });\n        std::cout << evenSum << "\\n";\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '5\\n1 2 3 4 5', expectedOutput: '6', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is RAII in C++?',
          options: ['Resource Acquisition Is Initialization (tying resource lifetime to object scope)', 'Runtime Array Indexing', 'Recursive Algorithm Invariant', 'Remote Access Interface'],
          correctOptionIndex: 0,
          explanation: 'RAII ensures resources like memory, sockets, or file locks are released when the owning object goes out of scope.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 8,
      title: 'Level 8: Advanced Algorithmic Problem Solving',
      youtubeVideoId: 'tWVWeAqZ0WU',
      studyMaterials: [
        {
          title: 'Graph Traversal & Shortest Path',
          type: 'notes',
          content: `# Graph Algorithms in C++\n\n- Adjacency list with std::vector<std::vector<int>>\n- Breadth-First Search (BFS) and Depth-First Search (DFS)\n- Dijkstra shortest path with std::priority_queue`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the time complexity of Dijkstra with a binary heap priority queue?',
          options: ['O((V + E) log V)', 'O(V^2)', 'O(E log E)', 'O(V * E)'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 8: Shortest Path in Unweighted Graph (BFS)',
        description: 'Given an unweighted graph with N nodes and M edges, output the shortest distance from node 1 to node N (or -1 if unreachable).',
        inputFormat: 'Line 1: N M\\nNext M lines: u v (1-indexed edges)',
        outputFormat: 'Shortest distance integer',
        constraints: '1 <= N, M <= 10^5',
        sampleInput: '4 4\\n1 2\\n2 3\\n3 4\\n1 3',
        sampleOutput: '2',
        difficulty: 'Medium',
        allowedLanguages: ['cpp'],
        starterCode: {
          cpp: `#include <iostream>\n#include <vector>\n#include <queue>\n\nint main() {\n    int n, m;\n    if (std::cin >> n >> m) {\n        std::vector<std::vector<int>> adj(n + 1);\n        for (int i = 0; i < m; i++) {\n            int u, v; std::cin >> u >> v;\n            adj[u].push_back(v);\n            adj[v].push_back(u);\n        }\n        std::vector<int> dist(n + 1, -1);\n        std::queue<int> q;\n        dist[1] = 0;\n        q.push(1);\n        while (!q.empty()) {\n            int u = q.front(); q.pop();\n            for (int v : adj[u]) {\n                if (dist[v] == -1) {\n                    dist[v] = dist[u] + 1;\n                    q.push(v);\n                }\n            }\n        }\n        std::cout << dist[n] << "\\n";\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '4 4\\n1 2\\n2 3\\n3 4\\n1 3', expectedOutput: '2', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'When does Dijkstra algorithm fail?',
          options: ['When edges have negative weights', 'On dense graphs', 'On disconnected graphs', 'On directed trees'],
          correctOptionIndex: 0,
          explanation: 'Dijkstra assumes distances are monotonically increasing; negative weight edges violate greedy choices.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 9,
      title: 'Level 9: Concurrency, Multithreading & Memory Order',
      youtubeVideoId: 'TPVH_PrmCrU',
      studyMaterials: [
        {
          title: 'C++ Threads & Lock Synchronization',
          type: 'notes',
          content: `# std::thread & Concurrency\n\n- std::thread, std::mutex, std::lock_guard, std::unique_lock\n- std::atomic<int> for lock-free atomic increments\n- Condition variables for producer-consumer pipelines`,
        },
      ],
      questQuestions: [
        {
          question: 'What does std::lock_guard provide in C++?',
          options: ['RAII scoped locking: locks mutex on construction, unlocks on destruction', 'Atomic read', 'Thread spawning', 'Deadlock detection'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 9: Concurrent Work-Chunk Accumulator Simulation',
        description: 'Read N integers, divide into two halves, compute sum of both halves, and output total sum.',
        inputFormat: 'Line 1: N\\nLine 2: N space-separated integers',
        outputFormat: 'Total sum',
        constraints: '1 <= N <= 10^5',
        sampleInput: '4\\n10 20 30 40',
        sampleOutput: '100',
        difficulty: 'Medium',
        allowedLanguages: ['cpp'],
        starterCode: {
          cpp: `#include <iostream>\n#include <vector>\n#include <numeric>\n\nint main() {\n    int n;\n    if (std::cin >> n) {\n        std::vector<long long> v(n);\n        for (int i = 0; i < n; i++) std::cin >> v[i];\n        int mid = n / 2;\n        long long s1 = std::accumulate(v.begin(), v.begin() + mid, 0LL);\n        long long s2 = std::accumulate(v.begin() + mid, v.end(), 0LL);\n        std::cout << (s1 + s2) << "\\n";\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '4\\n10 20 30 40', expectedOutput: '100', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is a race condition?',
          options: ['When two threads access shared memory concurrently with at least one write', 'Two threads finishing at the same time', 'CPU overclocking', 'Thread starvation'],
          correctOptionIndex: 0,
          explanation: 'Race conditions occur when shared memory is accessed concurrently without proper synchronization.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 10,
      title: 'Level 10: Production Engineering & Capstone Engine',
      youtubeVideoId: 'wwnw5Vb-WlY',
      studyMaterials: [
        {
          title: 'Low-Latency Systems & Cache Locality',
          type: 'notes',
          content: `# Low-Latency C++\n\n- CPU cache line alignment (64-byte chunks)\n- Zero-allocation hot paths\n- Sanitizers: ASan, TSan, UBSan`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the standard CPU L1/L2 cache line size on modern x86-64 hardware?',
          options: ['64 bytes', '16 bytes', '128 bytes', '4096 bytes'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 10: In-Memory Order Book Price Level Matcher',
        description: 'Read N buy/sell orders and compute the matched execution volume at matching price.',
        inputFormat: 'Line 1: N\\nNext N lines: TYPE PRICE QTY (e.g. BUY 100 5)',
        outputFormat: 'Total executed trade volume integer',
        constraints: '1 <= N <= 100',
        sampleInput: '2\\nBUY 100 10\\nSELL 100 10',
        sampleOutput: '10',
        difficulty: 'Hard',
        allowedLanguages: ['cpp'],
        starterCode: {
          cpp: `#include <iostream>\n#include <string>\n\nint main() {\n    int n;\n    if (std::cin >> n) {\n        long long matched = 0;\n        long long buyQty = 0, sellQty = 0;\n        for (int i = 0; i < n; i++) {\n            std::string type; long long p, q;\n            std::cin >> type >> p >> q;\n            if (type == "BUY") buyQty += q;\n            else sellQty += q;\n        }\n        matched = std::min(buyQty, sellQty);\n        std::cout << matched << "\\n";\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '2\\nBUY 100 10\\nSELL 100 10', expectedOutput: '10', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is false sharing in multi-threaded CPU architectures?',
          options: ['Threads modifying independent variables on the same 64-byte cache line causing cache invalidation', 'Sharing pointers', 'Virtual memory duplication', 'Buffer overflows'],
          correctOptionIndex: 0,
          explanation: 'False sharing happens when independent variables on the same cache line force CPU core cache invalidations.',
          points: 1,
        },
      ],
    },
  ],
};
