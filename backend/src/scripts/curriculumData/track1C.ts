import { ISeedTrackData } from './types';

export const track1C: ISeedTrackData = {
  name: 'C Programming: Zero to Systems Architecture',
  description:
    'Master memory management, pointer arithmetic, binary data structures, POSIX threads, and systems engineering in ISO C17.',
  coverImageUrl:
    'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80',
  isLocked: false,
  levels: [
    {
      levelNumber: 1,
      title: 'Level 1: C Foundations & Program Anatomy',
      youtubeVideoId: 'KJgsSFOSQv0',
      studyMaterials: [
        {
          title: 'C Program Anatomy & The Compilation Pipeline',
          type: 'notes',
          content: `# C Program Anatomy\n\n- **Compilation Steps**: Preprocessing (gcc -E) -> Compilation (gcc -S) -> Assembly (gcc -c) -> Linking (ld)\n- **Standard I/O**: printf() outputs formatted data; scanf() reads input using the address-of & operator.\n- **Data Types**: char (1B), int (4B), float (4B), double (8B).`,
        },
        {
          title: 'GNU C Compiler Manual',
          type: 'link',
          url: 'https://gcc.gnu.org/onlinedocs/gcc/',
        },
      ],
      questQuestions: [
        {
          question: 'What is the return type of the main() function in standard C?',
          options: ['void', 'int', 'char', 'float'],
          correctOption: 1,
        },
        {
          question: 'Which GCC flag compiles source code to an object file (.o) without linking?',
          options: ['-S', '-E', '-c', '-o'],
          correctOption: 2,
        },
        {
          question: 'Why is the & operator required before variables in scanf("%d", &num)?',
          options: ['To dereference the value', 'To pass the memory address', 'To cast to int', 'To prevent buffer overflow'],
          correctOption: 1,
        },
        {
          question: 'What does sizeof(char) evaluate to in standard C?',
          options: ['1', '2', '4', '8'],
          correctOption: 0,
        },
        {
          question: 'Which format specifier is used for a double precision floating point in printf()?',
          options: ['%f', '%d', '%c', '%lf'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 1: Student Identity Tag Formatter',
        description: 'Read a student ID (integer), section letter (character), and GPA (float), then print an aligned identity badge.',
        inputFormat: 'A single line containing: <ID> <Section> <GPA>',
        outputFormat: '[STUDENT] ID: <ID> | SEC: <Section> | GPA: <GPA to 2 decimals>',
        constraints: '1 <= ID <= 1000000, Section in [A-Z], 0.0 <= GPA <= 10.0',
        sampleInput: '101 A 8.75',
        sampleOutput: '[STUDENT] ID: 101 | SEC: A | GPA: 8.75',
        difficulty: 'Easy',
        allowedLanguages: ['c'],
        starterCode: {
          c: `#include <stdio.h>\n\nint main() {\n    int id;\n    char sec;\n    float gpa;\n    if (scanf("%d %c %f", &id, &sec, &gpa) == 3) {\n        printf("[STUDENT] ID: %d | SEC: %c | GPA: %.2f\\n", id, sec, gpa);\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '101 A 8.75', expectedOutput: '[STUDENT] ID: 101 | SEC: A | GPA: 8.75', isHidden: false },
          { input: '205 B 9.20', expectedOutput: '[STUDENT] ID: 205 | SEC: B | GPA: 9.20', isHidden: false },
          { input: '999999 Z 10.00', expectedOutput: '[STUDENT] ID: 999999 | SEC: Z | GPA: 10.00', isHidden: true },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the role of the C preprocessor (#include)?',
          options: ['Converts C to assembly', 'Replaces directives with header file contents prior to compilation', 'Links libraries', 'Executes code'],
          correctOptionIndex: 1,
          explanation: 'Preprocessor directives like #include copy the contents of specified headers into the source file before compilation.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 2,
      title: 'Level 2: Operators & Bitwise Manipulations',
      youtubeVideoId: 'yE_U81n20_Y',
      studyMaterials: [
        {
          title: 'Bitwise Operators & Integer Promotion',
          type: 'notes',
          content: `# Bitwise Operations in C\n\n- AND (&), OR (|), XOR (^), NOT (~), Left Shift (<<), Right Shift (>>)\n- Fast power of 2 check: (n > 0) && ((n & (n - 1)) == 0)\n- Integer division truncates towards zero.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the result of 5 ^ 5 in C?',
          options: ['25', '0', '10', '1'],
          correctOption: 1,
        },
        {
          question: 'Which operation multiplies an unsigned integer by 8?',
          options: ['n >> 3', 'n << 3', 'n * 3', 'n & 8'],
          correctOption: 1,
        },
        {
          question: 'What does the expression 7 & 1 evaluate to?',
          options: ['0', '1', '7', '8'],
          correctOption: 1,
        },
      ],
      challenge: {
        title: 'Level 2: Fast Bitwise Parity & Power of Two',
        description: 'Read an integer N. Output "YES" if N is a positive power of two, otherwise "NO".',
        inputFormat: 'A single integer N',
        outputFormat: 'YES or NO',
        constraints: '-10^9 <= N <= 10^9',
        sampleInput: '16',
        sampleOutput: 'YES',
        difficulty: 'Easy',
        allowedLanguages: ['c'],
        starterCode: {
          c: `#include <stdio.h>\n\nint main() {\n    long long n;\n    if (scanf("%lld", &n) == 1) {\n        if (n > 0 && (n & (n - 1)) == 0) {\n            printf("YES\\n");\n        } else {\n            printf("NO\\n");\n        }\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '16', expectedOutput: 'YES', isHidden: false },
          { input: '14', expectedOutput: 'NO', isHidden: false },
          { input: '1', expectedOutput: 'YES', isHidden: true },
          { input: '0', expectedOutput: 'NO', isHidden: true },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the value of 1 << 4 in decimal?',
          options: ['4', '8', '16', '32'],
          correctOptionIndex: 2,
          explanation: 'Left shifting 1 by 4 bits yields 2^4 = 16.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 3,
      title: 'Level 3: Conditions, Decision Making & Loops',
      youtubeVideoId: '7Dh73z3icd8',
      studyMaterials: [
        {
          title: 'Control Structures & Jump Tables',
          type: 'notes',
          content: `# Control Flow\n\n- if, else if, else branching\n- switch-case statements with break statements to prevent fall-through\n- for, while, and do-while loops.`,
        },
      ],
      questQuestions: [
        {
          question: 'What occurs in a C switch-case when the break statement is omitted?',
          options: ['Syntax error', 'Fall-through to subsequent cases', 'Immediate termination', 'Infinite loop'],
          correctOption: 1,
        },
        {
          question: 'How many times does a do-while loop execute if the condition is initially false?',
          options: ['0', '1', 'Infinite', 'Undefined'],
          correctOption: 1,
        },
      ],
      challenge: {
        title: 'Level 3: Prime Number Range Sum',
        description: 'Given two integers L and R, compute the sum of all prime numbers between L and R inclusive.',
        inputFormat: 'Two space-separated integers L and R',
        outputFormat: 'A single integer representing the sum',
        constraints: '1 <= L <= R <= 1000',
        sampleInput: '10 20',
        sampleOutput: '60',
        difficulty: 'Medium',
        allowedLanguages: ['c'],
        starterCode: {
          c: `#include <stdio.h>\n#include <stdbool.h>\n\nbool is_prime(int n) {\n    if (n < 2) return false;\n    for (int i = 2; i * i <= n; i++) {\n        if (n % i == 0) return false;\n    }\n    return true;\n}\n\nint main() {\n    int l, r;\n    if (scanf("%d %d", &l, &r) == 2) {\n        long long sum = 0;\n        for (int i = l; i <= r; i++) {\n            if (is_prime(i)) sum += i;\n        }\n        printf("%lld\\n", sum);\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '10 20', expectedOutput: '60', isHidden: false },
          { input: '1 10', expectedOutput: '17', isHidden: false },
          { input: '20 30', expectedOutput: '52', isHidden: true },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'Which statement immediately skips to the next iteration of a loop?',
          options: ['break', 'continue', 'return', 'goto'],
          correctOptionIndex: 1,
          explanation: 'The continue statement halts the current iteration and begins the next loop cycle.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 4,
      title: 'Level 4: Arrays, Memory Layout & C-Strings',
      youtubeVideoId: '1uR4tLQC65I',
      studyMaterials: [
        {
          title: 'Arrays & Null-Terminated Strings',
          type: 'notes',
          content: `# Arrays & Strings in C\n\n- Arrays occupy contiguous memory blocks.\n- C strings are null-terminated character arrays ending in '\\0'.\n- 2D arrays follow row-major memory order.`,
        },
      ],
      questQuestions: [
        {
          question: 'What marks the end of a string in C?',
          options: ['\\n', '\\t', '\\0', 'EOF'],
          correctOption: 2,
        },
      ],
      challenge: {
        title: 'Level 4: In-Place Array Rotation',
        description: 'Given an array of N integers and a count K, rotate the array to the right by K positions.',
        inputFormat: 'Line 1: N K\\nLine 2: N space-separated integers',
        outputFormat: 'Rotated array space-separated',
        constraints: '1 <= N <= 1000, 0 <= K <= 1000',
        sampleInput: '5 2\\n1 2 3 4 5',
        sampleOutput: '4 5 1 2 3',
        difficulty: 'Medium',
        allowedLanguages: ['c'],
        starterCode: {
          c: `#include <stdio.h>\n\nint main() {\n    int n, k;\n    if (scanf("%d %d", &n, &k) == 2) {\n        int arr[1000];\n        for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n        k = k % n;\n        for (int i = 0; i < n; i++) {\n            int idx = (i - k + n) % n;\n            printf("%d%c", arr[idx], (i == n - 1) ? '\\n' : ' ');\n        }\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '5 2\\n1 2 3 4 5', expectedOutput: '4 5 1 2 3', isHidden: false },
          { input: '4 1\\n10 20 30 40', expectedOutput: '40 10 20 30', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What happens when accessing arr[10] on an array declared as int arr[10]?',
          options: ['Compilation error', 'ArrayOutOfBoundsException', 'Undefined behavior', 'Returns 0'],
          correctOptionIndex: 2,
          explanation: 'C does not perform bounds checking; accessing out of bounds causes undefined behavior.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 5,
      title: 'Level 5: Functions, Recursion & Storage Classes',
      youtubeVideoId: 'Npo9flVvD2w',
      studyMaterials: [
        {
          title: 'Functions, Call Stack & Recursion',
          type: 'notes',
          content: `# Functions & Scope\n\n- Activation stack frames: return address, local variables, parameters.\n- Storage classes: auto, register, static, extern.\n- Tail recursion and memoization.`,
        },
      ],
      questQuestions: [
        {
          question: 'What does the static keyword do when applied to a local function variable?',
          options: ['Makes it read-only', 'Preserves its value across function invocations', 'Stores it in CPU register', 'Exports it globally'],
          correctOption: 1,
        },
      ],
      challenge: {
        title: 'Level 5: Greatest Common Divisor via Euclidean Recursion',
        description: 'Read two integers A and B. Output their GCD using Euclid algorithm.',
        inputFormat: 'Two integers A and B',
        outputFormat: 'GCD integer',
        constraints: '1 <= A, B <= 10^9',
        sampleInput: '48 18',
        sampleOutput: '6',
        difficulty: 'Easy',
        allowedLanguages: ['c'],
        starterCode: {
          c: `#include <stdio.h>\n\nlong long gcd(long long a, long long b) {\n    return (b == 0) ? a : gcd(b, a % b);\n}\n\nint main() {\n    long long a, b;\n    if (scanf("%lld %lld", &a, &b) == 2) {\n        printf("%lld\\n", gcd(a, b));\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '48 18', expectedOutput: '6', isHidden: false },
          { input: '100 25', expectedOutput: '25', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'Which condition terminates a recursive function?',
          options: ['Base case', 'Break statement', 'Return 0', 'Main exit'],
          correctOptionIndex: 0,
          explanation: 'The base case stops recursive calls from overflowing the stack.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 6,
      title: 'Level 6: Pointers & Direct Memory Addressing',
      youtubeVideoId: '2ybLD6_2gKM',
      studyMaterials: [
        {
          title: 'Pointers & Pointer Arithmetic',
          type: 'notes',
          content: `# Pointers\n\n- Address-of (&) and dereference (*) operators.\n- Pointer arithmetic scales by sizeof(*ptr).\n- Array decay: an array name decays to a pointer to its first element.`,
        },
      ],
      questQuestions: [
        {
          question: 'If ptr is an int* pointing to 0x1000, what is the address of ptr + 2 assuming 4-byte ints?',
          options: ['0x1002', '0x1004', '0x1008', '0x1006'],
          correctOption: 2,
        },
      ],
      challenge: {
        title: 'Level 6: Pointer-Based In-Place String Reversal',
        description: 'Reverse a string in-place using two pointer addresses.',
        inputFormat: 'A single word string',
        outputFormat: 'Reversed string',
        constraints: '1 <= length <= 100',
        sampleInput: 'codecircle',
        sampleOutput: 'elcricedoc',
        difficulty: 'Easy',
        allowedLanguages: ['c'],
        starterCode: {
          c: `#include <stdio.h>\n#include <string.h>\n\nvoid reverse(char *str) {\n    char *start = str;\n    char *end = str + strlen(str) - 1;\n    while (start < end) {\n        char temp = *start;\n        *start = *end;\n        *end = temp;\n        start++;\n        end--;\n    }\n}\n\nint main() {\n    char str[200];\n    if (scanf("%199s", str) == 1) {\n        reverse(str);\n        printf("%s\\n", str);\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: 'codecircle', expectedOutput: 'elcricedoc', isHidden: false },
          { input: 'radar', expectedOutput: 'radar', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is a void* pointer in C?',
          options: ['A pointer that points to NULL', 'A generic pointer without an associated data type', 'A pointer to a function', 'An invalid pointer'],
          correctOptionIndex: 1,
          explanation: 'void* represents a generic raw memory address that can point to any type.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 7,
      title: 'Level 7: Structures & Dynamic Memory Allocation',
      youtubeVideoId: 'udagrN8BRvw',
      studyMaterials: [
        {
          title: 'Heap Allocation & Structures',
          type: 'notes',
          content: `# Heap Allocation\n\n- malloc(size), calloc(num, size), realloc(ptr, size), free(ptr)\n- Always check for NULL return.\n- Struct member access via . (value) and -> (pointer).`,
        },
      ],
      questQuestions: [
        {
          question: 'Which function allocates heap memory initialized to zero?',
          options: ['malloc()', 'calloc()', 'realloc()', 'alloc()'],
          correctOption: 1,
        },
      ],
      challenge: {
        title: 'Level 7: Dynamic Array Doubler',
        description: 'Read N integers into dynamically allocated memory, sum them, and free the heap block.',
        inputFormat: 'Line 1: N\\nLine 2: N integers',
        outputFormat: 'Sum of integers',
        constraints: '1 <= N <= 100000',
        sampleInput: '4\\n10 20 30 40',
        sampleOutput: '100',
        difficulty: 'Easy',
        allowedLanguages: ['c'],
        starterCode: {
          c: `#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) == 1) {\n        long long *arr = (long long*)malloc(n * sizeof(long long));\n        long long sum = 0;\n        for (int i = 0; i < n; i++) {\n            scanf("%lld", &arr[i]);\n            sum += arr[i];\n        }\n        printf("%lld\\n", sum);\n        free(arr);\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '4\\n10 20 30 40', expectedOutput: '100', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is a memory leak?',
          options: ['Accessing NULL', 'Failing to free heap memory after its use', 'Stack overflow', 'Buffer overflow'],
          correctOptionIndex: 1,
          explanation: 'Memory leaks occur when dynamically allocated memory is not freed, causing memory bloat.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 8,
      title: 'Level 8: File Streams & Linked Data Structures',
      youtubeVideoId: 'b3_g44Ufv0k',
      studyMaterials: [
        {
          title: 'File I/O & Linked Lists',
          type: 'notes',
          content: `# Files & Linked Lists\n\n- fopen(), fclose(), fread(), fwrite(), fprintf(), fscanf()\n- Singly linked list: node with data and next pointer.\n- Dynamic nodes allocated via malloc().`,
        },
      ],
      questQuestions: [
        {
          question: 'What does fopen() return when opening a non-existent file in "r" mode?',
          options: ['0', 'NULL', '-1', 'EOF'],
          correctOption: 1,
        },
      ],
      challenge: {
        title: 'Level 8: Singly Linked List Node Insertion & Traversal',
        description: 'Read N integers, insert each at the tail of a linked list, and print the linked list.',
        inputFormat: 'Line 1: N\\nLine 2: N space-separated integers',
        outputFormat: 'Values separated by " -> " followed by "NULL"',
        constraints: '1 <= N <= 100',
        sampleInput: '3\\n1 2 3',
        sampleOutput: '1 -> 2 -> 3 -> NULL',
        difficulty: 'Medium',
        allowedLanguages: ['c'],
        starterCode: {
          c: `#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node {\n    int data;\n    struct Node *next;\n} Node;\n\nint main() {\n    int n;\n    if (scanf("%d", &n) == 1) {\n        Node *head = NULL, *tail = NULL;\n        for (int i = 0; i < n; i++) {\n            int val;\n            scanf("%d", &val);\n            Node *newNode = (Node*)malloc(sizeof(Node));\n            newNode->data = val;\n            newNode->next = NULL;\n            if (!head) { head = tail = newNode; }\n            else { tail->next = newNode; tail = newNode; }\n        }\n        Node *curr = head;\n        while (curr) {\n            printf("%d -> ", curr->data);\n            Node *tmp = curr;\n            curr = curr->next;\n            free(tmp);\n        }\n        printf("NULL\\n");\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '3\\n1 2 3', expectedOutput: '1 -> 2 -> 3 -> NULL', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the time complexity to insert a node at the head of a singly linked list?',
          options: ['O(1)', 'O(N)', 'O(log N)', 'O(N^2)'],
          correctOptionIndex: 0,
          explanation: 'Inserting at the head requires updating pointer references in constant O(1) time.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 9,
      title: 'Level 9: Preprocessor Metaprogramming & Modular C',
      youtubeVideoId: 's4_8H3s-pFE',
      studyMaterials: [
        {
          title: 'C Preprocessor & Modular Projects',
          type: 'notes',
          content: `# Preprocessor Metaprogramming\n\n- Token concatenation (##) and stringification (#)\n- Include guards: #ifndef HEADER_H\n- Static vs dynamic libraries (.a vs .so)`,
        },
      ],
      questQuestions: [
        {
          question: 'What does the ## operator do in a C macro?',
          options: ['Concatenates two tokens', 'Converts to string', 'Bitwise XOR', 'Comment'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 9: Generic Dynamic Array Macro Simulation',
        description: 'Read N integers, sort them using standard qsort() with a custom comparator function, and output the sorted array.',
        inputFormat: 'Line 1: N\\nLine 2: N space-separated integers',
        outputFormat: 'Space-separated sorted integers',
        constraints: '1 <= N <= 1000',
        sampleInput: '5\\n50 20 40 10 30',
        sampleOutput: '10 20 30 40 50',
        difficulty: 'Medium',
        allowedLanguages: ['c'],
        starterCode: {
          c: `#include <stdio.h>\n#include <stdlib.h>\n\nint cmp(const void *a, const void *b) {\n    return (*(int*)a - *(int*)b);\n}\n\nint main() {\n    int n;\n    if (scanf("%d", &n) == 1) {\n        int arr[1000];\n        for (int i = 0; i < n; i++) scanf("%d", &arr[i]);\n        qsort(arr, n, sizeof(int), cmp);\n        for (int i = 0; i < n; i++) printf("%d%c", arr[i], (i == n - 1) ? '\\n' : ' ');\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '5\\n50 20 40 10 30', expectedOutput: '10 20 30 40 50', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the purpose of include guards in C header files?',
          options: ['Prevents multiple inclusions and duplicate symbol errors', 'Speeds up execution', 'Allocates heap', 'Enforces strict typing'],
          correctOptionIndex: 0,
          explanation: 'Include guards ensure header file contents are compiled only once per translation unit.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 10,
      title: 'Level 10: Systems Programming & Capstone Server',
      youtubeVideoId: 'ldJ8WGZVXZk',
      studyMaterials: [
        {
          title: 'POSIX Systems & Network Sockets',
          type: 'notes',
          content: `# Systems Programming\n\n- POSIX system calls: fork(), pipe(), waitpid()\n- POSIX threads: pthread_create(), pthread_join(), pthread_mutex_t\n- BSD Sockets: socket(), bind(), listen(), accept()`,
        },
      ],
      questQuestions: [
        {
          question: 'What does fork() return in the newly spawned child process?',
          options: ['Parent PID', '0', '-1', 'Child PID'],
          correctOption: 1,
        },
      ],
      challenge: {
        title: 'Level 10: High-Throughput Matrix Concurrency Simulation',
        description: 'Read an N x N matrix, calculate the sum of its main diagonal and anti-diagonal.',
        inputFormat: 'Line 1: N\\nNext N lines: N integers each',
        outputFormat: 'Single integer with combined diagonal sum (counting intersection once if N is odd)',
        constraints: '1 <= N <= 100',
        sampleInput: '3\\n1 2 3\\n4 5 6\\n7 8 9',
        sampleOutput: '25',
        difficulty: 'Hard',
        allowedLanguages: ['c'],
        starterCode: {
          c: `#include <stdio.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) == 1) {\n        int mat[100][100];\n        long long sum = 0;\n        for (int i = 0; i < n; i++) {\n            for (int j = 0; j < n; j++) {\n                scanf("%d", &mat[i][j]);\n                if (i == j || i + j == n - 1) sum += mat[i][j];\n            }\n        }\n        printf("%lld\\n", sum);\n    }\n    return 0;\n}\n`,
        },
        testCases: [
          { input: '3\\n1 2 3\\n4 5 6\\n7 8 9', expectedOutput: '25', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'Which primitive prevents race conditions between concurrent threads?',
          options: ['Mutex (Mutual Exclusion)', 'Fork', 'Pipe', 'Printf'],
          correctOptionIndex: 0,
          explanation: 'Mutex locks ensure that only one thread executes a critical section at any given time.',
          points: 1,
        },
      ],
    },
  ],
};
