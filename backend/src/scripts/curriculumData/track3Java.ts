import { ISeedTrackData } from './types';

export const track3Java: ISeedTrackData = {
  name: 'Java Programming: Core to Cloud Microservices',
  description:
    'Master Java 21 LTS, object-oriented design, Collections, Streams, Virtual Threads, and enterprise Spring Boot microservices.',
  coverImageUrl:
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
  isLocked: false,
  levels: [
    {
      levelNumber: 1,
      title: 'Level 1: Java Architecture, JVM & Scanner I/O',
      youtubeVideoId: 'eIrMbAQSU34',
      studyMaterials: [
        {
          title: 'JVM Bytecode & Standard Scanner',
          type: 'notes',
          content: `# Java Foundations\n\n- Write Once, Run Anywhere (WORA) via JVM bytecode.\n- Primitives: byte, short, int, long, float, double, char, boolean.\n- Scanner input: Scanner sc = new Scanner(System.in);`,
        },
      ],
      questQuestions: [
        {
          question: 'What executes Java bytecode (.class) files?',
          options: ['JVM (Java Virtual Machine)', 'JDK Compiler', 'Operating System Kernel', 'Browser V8'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 1: Student Score Summary Formatter',
        description: 'Read a student name (string), roll number (integer), and average marks (double). Print a formatted scorecard.',
        inputFormat: 'Line 1: Name\\nLine 2: RollNumber\\nLine 3: Marks',
        outputFormat: '[JAVA-ID] Name: <Name> | Roll: <Roll> | Marks: <Marks to 2 decimals>',
        constraints: 'Marks between 0.0 and 100.0',
        sampleInput: 'Rahul\n101\n92.50',
        sampleOutput: '[JAVA-ID] Name: Rahul | Roll: 101 | Marks: 92.50',
        difficulty: 'Easy',
        allowedLanguages: ['java'],
        starterCode: {
          java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            String name = sc.next();\n            int roll = sc.nextInt();\n            double marks = sc.nextDouble();\n            System.out.printf("[JAVA-ID] Name: %s | Roll: %d | Marks: %.2f\\n", name, roll, marks);\n        }\n    }\n}\n`,
        },
        testCases: [
          { input: 'Rahul\n101\n92.50', expectedOutput: '[JAVA-ID] Name: Rahul | Roll: 101 | Marks: 92.50', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the size of an int primitive in Java?',
          options: ['4 bytes (32-bit signed)', '2 bytes', '8 bytes', 'Platform dependent'],
          correctOptionIndex: 0,
          explanation: 'Java primitives have strictly defined platform-independent sizes; int is always 32-bit signed.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 2,
      title: 'Level 2: Control Flow & Methods',
      youtubeVideoId: 'mAtkPQO1FcA',
      studyMaterials: [
        {
          title: 'Java Methods & Pass-by-Value',
          type: 'notes',
          content: `# Java Methods & Control Flow\n\n- Java is strictly pass-by-value.\n- Enhanced for loop: for (int x : array) { ... }`,
        },
      ],
      questQuestions: [
        {
          question: 'Does Java support pass-by-reference for primitive variables?',
          options: ['No, Java is strictly pass-by-value', 'Yes', 'Only with Ref keyword', 'Only for arrays'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 2: Array Maximum & Minimum Element Finder',
        description: 'Read N integers and output the minimum and maximum space-separated.',
        inputFormat: 'Line 1: N\\nLine 2: N integers',
        outputFormat: '<Min> <Max>',
        constraints: '1 <= N <= 10^5',
        sampleInput: '5\n10 50 5 90 20',
        sampleOutput: '5 90',
        difficulty: 'Easy',
        allowedLanguages: ['java'],
        starterCode: {
          java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int min = Integer.MAX_VALUE, max = Integer.MIN_VALUE;\n            for (int i = 0; i < n; i++) {\n                int v = sc.nextInt();\n                if (v < min) min = v;\n                if (v > max) max = v;\n            }\n            System.out.println(min + " " + max);\n        }\n    }\n}\n`,
        },
        testCases: [
          { input: '5\n10 50 5 90 20', expectedOutput: '5 90', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the default value of an uninitialized int array element in Java?',
          options: ['0', 'null', 'undefined', 'garbage'],
          correctOptionIndex: 0,
          explanation: 'Java automatically initializes array numerical elements to zero upon heap allocation.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 3,
      title: 'Level 3: Strings & Core Collections',
      youtubeVideoId: 'viTHC1kIS4M',
      studyMaterials: [
        {
          title: 'String Immutability & HashMaps',
          type: 'notes',
          content: `# Strings & Collections\n\n- String is immutable; stored in String Pool.\n- StringBuilder is mutable for efficient concatenations.\n- HashMap<K, V> and ArrayList<T>.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the difference between str1 == str2 and str1.equals(str2) in Java?',
          options: ['== compares reference addresses; equals() compares character contents', 'No difference', '== compares length', 'equals() checks types'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 3: Two Sum Target Indices via HashMap',
        description: 'Read N, Target, and N integers. Output the two 0-based indices whose values sum to Target.',
        inputFormat: 'Line 1: N Target\\nLine 2: N integers',
        outputFormat: 'Index1 Index2 (or -1 -1)',
        constraints: '1 <= N <= 10^5',
        sampleInput: '4 9\n2 7 11 15',
        sampleOutput: '0 1',
        difficulty: 'Medium',
        allowedLanguages: ['java'],
        starterCode: {
          java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int target = sc.nextInt();\n            int[] arr = new int[n];\n            Map<Integer, Integer> map = new HashMap<>();\n            for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n            for (int i = 0; i < n; i++) {\n                int complement = target - arr[i];\n                if (map.containsKey(complement)) {\n                    System.out.println(map.get(complement) + " " + i);\n                    return;\n                }\n                map.put(arr[i], i);\n            }\n            System.out.println("-1 -1");\n        }\n    }\n}\n`,
        },
        testCases: [
          { input: '4 9\n2 7 11 15', expectedOutput: '0 1', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the initial default capacity of a standard Java HashMap?',
          options: ['16', '10', '32', '64'],
          correctOptionIndex: 0,
          explanation: 'The default capacity of a HashMap in Java is 16 with a load factor of 0.75.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 4,
      title: 'Level 4: Object-Oriented Java & Interfaces',
      youtubeVideoId: 'pTB0EiLXUC8',
      studyMaterials: [
        {
          title: 'Encapsulation & Interfaces',
          type: 'notes',
          content: `# Java OOP\n\n- Classes, inheritance (extends), interfaces (implements).\n- Abstract classes cannot be instantiated.\n- Overriding methods marked with @Override.`,
        },
      ],
      questQuestions: [
        {
          question: 'Can a Java class inherit from multiple concrete classes?',
          options: ['No, Java supports single class inheritance only', 'Yes', 'Only with abstract classes', 'Only in Java 21'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 4: Polymorphic Employee Pay Calculator',
        description: 'Read employee type (F for FullTime, P for PartTime) and hours. Compute total pay (FullTime = $50/hr, PartTime = $25/hr).',
        inputFormat: 'Type Hours',
        outputFormat: 'TotalPay',
        constraints: 'Hours >= 0',
        sampleInput: 'F 40',
        sampleOutput: '2000',
        difficulty: 'Easy',
        allowedLanguages: ['java'],
        starterCode: {
          java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNext()) {\n            char type = sc.next().charAt(0);\n            int hours = sc.nextInt();\n            int rate = (type == 'F') ? 50 : 25;\n            System.out.println(hours * rate);\n        }\n    }\n}\n`,
        },
        testCases: [
          { input: 'F 40', expectedOutput: '2000', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What does the super keyword refer to in Java?',
          options: ['The immediate parent class instance', 'The current class', 'The JVM root', 'The thread context'],
          correctOptionIndex: 0,
          explanation: 'super is a reference variable used to access parent class members and constructors.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 5,
      title: 'Level 5: Exceptions, Generics & Custom Enums',
      youtubeVideoId: '1XAfapkNYjk',
      studyMaterials: [
        {
          title: 'Java Exception Hierarchy & Generics',
          type: 'notes',
          content: `# Exceptions & Generics\n\n- Checked vs Unchecked exceptions.\n- try-with-resources closes AutoCloseable streams.\n- Generics: <T> type parameters with type erasure.`,
        },
      ],
      questQuestions: [
        {
          question: 'Which class is the root of all exceptions and errors in Java?',
          options: ['java.lang.Throwable', 'java.lang.Exception', 'java.lang.Error', 'java.lang.Object'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 5: Safe Mathematical Division Evaluator',
        description: 'Read two integers A and B. Print result of A / B. If B is 0, print "DIV_BY_ZERO".',
        inputFormat: 'A B',
        outputFormat: 'Result or DIV_BY_ZERO',
        constraints: '-10^9 <= A, B <= 10^9',
        sampleInput: '10 2',
        sampleOutput: '5',
        difficulty: 'Easy',
        allowedLanguages: ['java'],
        starterCode: {
          java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLong()) {\n            long a = sc.nextLong();\n            long b = sc.nextLong();\n            if (b == 0) {\n                System.out.println("DIV_BY_ZERO");\n            } else {\n                System.out.println(a / b);\n            }\n        }\n    }\n}\n`,
        },
        testCases: [
          { input: '10 2', expectedOutput: '5', isHidden: false },
          { input: '10 0', expectedOutput: 'DIV_BY_ZERO', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is type erasure in Java Generics?',
          options: ['Generic type parameters are removed by the compiler at compile-time for backward compatibility', 'Memory clearing', 'Null pointer check', 'Heap deallocation'],
          correctOptionIndex: 0,
          explanation: 'Java replaces generic type parameters with Object or their bound at compile time.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 6,
      title: 'Level 6: Modern Java: Functional Interfaces & Streams API',
      youtubeVideoId: 't1-YZ6bF-g0',
      studyMaterials: [
        {
          title: 'Java Streams & Lambdas',
          type: 'notes',
          content: `# Java Streams\n\n- map(), filter(), reduce(), collect(Collectors.toList())\n- Optional<T> to prevent NullPointerException\n- Lambdas: (x) -> x * 2`,
        },
      ],
      questQuestions: [
        {
          question: 'Are intermediate operations on Java Streams executed immediately or lazily?',
          options: ['Lazily (evaluated only when a terminal operation is invoked)', 'Immediately', 'Asynchronously in separate thread', 'Synchronously on creation'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 6: Stream Filtering: Sum of Even Squares',
        description: 'Read N integers. Using Java Streams, filter even numbers, square them, and print their sum.',
        inputFormat: 'Line 1: N\\nLine 2: N integers',
        outputFormat: 'Single integer with sum of even squares',
        constraints: '1 <= N <= 1000',
        sampleInput: '4\n1 2 3 4',
        sampleOutput: '20',
        difficulty: 'Easy',
        allowedLanguages: ['java'],
        starterCode: {
          java: `import java.util.*;\nimport java.util.stream.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            List<Long> list = new ArrayList<>();\n            for (int i = 0; i < n; i++) list.add(sc.nextLong());\n            long sum = list.stream()\n                .filter(x -> x % 2 == 0)\n                .mapToLong(x -> x * x)\n                .sum();\n            System.out.println(sum);\n        }\n    }\n}\n`,
        },
        testCases: [
          { input: '4\n1 2 3 4', expectedOutput: '20', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'Which method transforms a stream into a standard collection?',
          options: ['collect()', 'reduce()', 'filter()', 'map()'],
          correctOptionIndex: 0,
          explanation: 'The collect() terminal operation accumulates stream elements into collections like List or Set.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 7,
      title: 'Level 7: JDBC Persistence & SQL Transactions',
      youtubeVideoId: 'B9vT9J3tK2M',
      studyMaterials: [
        {
          title: 'Database Connectivity with JDBC',
          type: 'notes',
          content: `# JDBC Architecture\n\n- Connection, PreparedStatement (prevents SQL injection), ResultSet\n- ACID Transactions: setAutoCommit(false), commit(), rollback()`,
        },
      ],
      questQuestions: [
        {
          question: 'Why should PreparedStatement be used instead of Statement for SQL queries?',
          options: ['It uses parameterized queries which neutralize SQL injection vulnerabilities', 'It runs in GPU', 'It caches Java objects', 'It bypasses the DB engine'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 7: In-Memory SQL Table Filter Simulation',
        description: 'Read N records of (ID, Salary). Print count of records with Salary >= 50000.',
        inputFormat: 'Line 1: N\\nNext N lines: ID Salary',
        outputFormat: 'Count integer',
        constraints: '1 <= N <= 1000',
        sampleInput: '3\n101 60000\n102 45000\n103 80000',
        sampleOutput: '2',
        difficulty: 'Easy',
        allowedLanguages: ['java'],
        starterCode: {
          java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int count = 0;\n            for (int i = 0; i < n; i++) {\n                int id = sc.nextInt();\n                long sal = sc.nextLong();\n                if (sal >= 50000) count++;\n            }\n            System.out.println(count);\n        }\n    }\n}\n`,
        },
        testCases: [
          { input: '3\n101 60000\n102 45000\n103 80000', expectedOutput: '2', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the role of connection.rollback() in JDBC?',
          options: ['Undoes all changes made in the current transaction if an error occurs', 'Disconnects from DB', 'Truncates table', 'Flushes cache'],
          correctOptionIndex: 0,
          explanation: 'rollback() reverses database updates in an open uncommitted transaction to preserve ACID integrity.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 8,
      title: 'Level 8: Multithreading & Virtual Threads (Loom)',
      youtubeVideoId: 'r_MbozD32eo',
      studyMaterials: [
        {
          title: 'Java Concurrency & Virtual Threads',
          type: 'notes',
          content: `# Java 21 Concurrency\n\n- ExecutorService, CompletableFuture, ReentrantLock\n- Virtual Threads (Project Loom): Lightweight user-mode threads scheduled by JVM.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the advantage of Java 21 Virtual Threads over traditional OS platform threads?',
          options: ['They are extremely lightweight, allowing millions of concurrent tasks with minimal memory footprint', 'They bypass the JVM', 'They run without CPU cores', 'They disable garbage collection'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 8: Thread-Safe Counter Aggregator Simulation',
        description: 'Read N operations (+1 or -1). Output the final accumulated count.',
        inputFormat: 'Line 1: N\\nLine 2: N space-separated integers (+1 or -1)',
        outputFormat: 'Final total',
        constraints: '1 <= N <= 10^5',
        sampleInput: '4\n1 1 -1 1',
        sampleOutput: '2',
        difficulty: 'Easy',
        allowedLanguages: ['java'],
        starterCode: {
          java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            long sum = 0;\n            for (int i = 0; i < n; i++) sum += sc.nextLong();\n            System.out.println(sum);\n        }\n    }\n}\n`,
        },
        testCases: [
          { input: '4\n1 1 -1 1', expectedOutput: '2', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'Which concurrent collection is optimized for high-concurrency key-value access?',
          options: ['ConcurrentHashMap', 'Hashtable', 'HashMap', 'TreeMap'],
          correctOptionIndex: 0,
          explanation: 'ConcurrentHashMap provides thread safety via bucket-level locks without synchronizing the entire map.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 9,
      title: 'Level 9: Spring Boot & REST APIs',
      youtubeVideoId: '9SGDpanrc8U',
      studyMaterials: [
        {
          title: 'Spring Boot Architecture',
          type: 'notes',
          content: `# Spring Boot Architecture\n\n- Inversion of Control (IoC) & Dependency Injection\n- @RestController, @Service, @Repository, Spring Data JPA\n- Bean validation (@Valid, @NotNull)`,
        },
      ],
      questQuestions: [
        {
          question: 'What does the @RestController annotation do in Spring Boot?',
          options: ['Marks the class as a web controller and automatically serializes return values to JSON', 'Runs database migrations', 'Configures security', 'Enables WebSocket'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 9: REST JSON Payload Parameter Extractor',
        description: 'Read key-value count N, followed by N lines of "Key:Value". Print value for key "status".',
        inputFormat: 'Line 1: N\\nNext N lines: Key:Value',
        outputFormat: 'Value of status key',
        constraints: '1 <= N <= 100',
        sampleInput: '3\nid:101\nstatus:SUCCESS\ncode:200',
        sampleOutput: 'SUCCESS',
        difficulty: 'Easy',
        allowedLanguages: ['java'],
        starterCode: {
          java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            String found = "NOT_FOUND";\n            for (int i = 0; i < n; i++) {\n                String line = sc.next();\n                String[] parts = line.split(":");\n                if (parts.length == 2 && parts[0].equals("status")) found = parts[1];\n            }\n            System.out.println(found);\n        }\n    }\n}\n`,
        },
        testCases: [
          { input: '3\nid:101\nstatus:SUCCESS\ncode:200', expectedOutput: 'SUCCESS', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is Inversion of Control (IoC) in Spring?',
          options: ['The framework manages object creation and dependency injection rather than manual instantiation', 'Inverting thread execution', 'Reversing bytecode', 'Database rollback'],
          correctOptionIndex: 0,
          explanation: 'IoC delegates lifecycle and dependency management of beans to the Spring ApplicationContext.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 10,
      title: 'Level 10: Enterprise Cloud Microservices & Capstone',
      youtubeVideoId: 'y8IQb4ofjDo',
      studyMaterials: [
        {
          title: 'Spring Security & Microservices',
          type: 'notes',
          content: `# Microservices & Cloud-Native Java\n\n- Spring Security 6 with stateless JWT authentication.\n- Docker multi-stage builds for Spring Boot jar containers.\n- Redis caching layer and JUnit 5 testing.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the role of an API Gateway in a microservices architecture?',
          options: ['Single entry point routing requests, handling authentication, and rate limiting', 'Compiles bytecode', 'Runs database backups', 'Provides DNS'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 10: Distributed Seat Booking Lock Simulator',
        description: 'Read N booking requests for Seat ID. Print "BOOKED" on first success, "ALREADY_TAKEN" on duplicates.',
        inputFormat: 'Line 1: N\\nLine 2: N integers (Seat IDs)',
        outputFormat: 'N lines with status',
        constraints: '1 <= N <= 100',
        sampleInput: '3\n12 15 12',
        sampleOutput: 'BOOKED\nBOOKED\nALREADY_TAKEN',
        difficulty: 'Medium',
        allowedLanguages: ['java'],
        starterCode: {
          java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            Set<Integer> booked = new HashSet<>();\n            for (int i = 0; i < n; i++) {\n                int seat = sc.nextInt();\n                if (booked.contains(seat)) {\n                    System.out.println("ALREADY_TAKEN");\n                } else {\n                    booked.add(seat);\n                    System.out.println("BOOKED");\n                }\n            }\n        }\n    }\n}\n`,
        },
        testCases: [
          { input: '3\n12 15 12', expectedOutput: 'BOOKED\nBOOKED\nALREADY_TAKEN', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'How does JWT (JSON Web Token) achieve stateless authentication in Spring Security?',
          options: ['The token contains cryptographically signed user claims, so the server does not need to store session state in memory', 'It stores sessions in cookies', 'It encrypts database tables', 'It runs in browser memory only'],
          correctOptionIndex: 0,
          explanation: 'The server verifies the digital signature of the token to authenticate the user without maintaining server session state.',
          points: 1,
        },
      ],
    },
  ],
};
