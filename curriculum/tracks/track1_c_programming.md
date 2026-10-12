# Track 1: C Programming — From Bits to Systems Architecture

**Category**: Systems & Core Programming  
**Target Audience**: CS/IT Freshmen, Competitive Programmers, Systems/Embedded Engineers  
**Primary Language**: C (ISO C17 / GCC 13)  
**Total Estimated Duration**: 120 Hours  

---

## Level 1: C Foundations
- **Difficulty**: Beginner
- **Estimated Completion Time**: 8 Hours
- **Prerequisites**: Basic computer literacy, familiarity with text editors.
- **Skills Unlocked**: GCC compilation pipeline, stdin/stdout formatting, variable declarations, memory primitive types.

### Description & Learning Objectives
Students learn how high-level C code translates into machine instructions. By understanding `main()`, header inclusions, the preprocessor, and formatted I/O, students bridge the gap between abstract ideas and low-level computer operation.

### Lesson Breakdown
1. **The Compilation Pipeline**: `gcc -E` (preprocessor), `gcc -S` (assembly), `gcc -c` (object file), and `ld` (linker).
2. **Standard I/O Anatomy**: Deep dive into `printf()` formatting flags (`%d`, `%f`, `%c`, `%s`, `%lf`, `%p`, `%02d`, `%.2f`) and `scanf()` address-of operator `&`.
3. **Data Types & Storage Sizes**: `char` (1B), `short` (2B), `int` (4B), `long long` (8B), `float` (4B), `double` (8B), and `sizeof()` evaluation.

- **Real-World Example**: Reading embedded sensor telemetry (temperature float, timestamp integer) and serializing to formatted standard output.
- **Common Mistakes**:
  - Forgetting the address-of `&` operator in `scanf("%d", num)` causing segmentation fault.
  - Using mismatched format specifiers (e.g. `%d` for `double`), causing garbage bit printing.
  - Forgetting `#include <stdio.h>` causing implicit function declaration warnings.
- **Debugging Challenge**:
  ```c
  // Buggy Code:
  #include <stdio.h>
  int main() {
      int age;
      float gpa;
      printf("Enter age and GPA: ");
      scanf("%d %d", age, &gpa); // BUG: missing & on age, wrong format specifier on gpa
      printf("Age: %d, GPA: %.2f\n", age, gpa);
      return 0;
  }
  // Fixed: scanf("%d %f", &age, &gpa);
  ```

### MCQ Quest (Gatekeeper: Min 70% to Unlock Coding)
1. What does the `-c` flag instruct the GCC compiler to do? (Ans: Compile and assemble, but do not link)
2. What is the return value of `printf("Hello\n")`? (Ans: 6 — total characters written)
3. Which memory section does the executable code reside in? (Ans: Text/Code segment)
4. What happens when calling `scanf("%d", &x)` if the user inputs `abc`? (Ans: Returns 0, `x` remains unassigned)
5. What is the minimum range guaranteed for a standard signed 32-bit `int`? (Ans: -2,147,483,648 to 2,147,483,647)

### Monaco RCE Coding Challenges
#### Easy: Student Identity Tag Formatter
- **Problem Statement**: Read a student's ID (int), Section (char), and CGPA (float). Print a formatted identity tag.
- **Input Format**: Line 1: `ID`, Line 2: `Section`, Line 3: `CGPA`.
- **Output Format**: `[STUDENT-TAG] ID: <ID> | SEC: <SEC> | CGPA: <CGPA to 2 decimal places>`
- **Constraints**: $1 \le ID \le 10^6$, Section $\in [A-Z]$, $0.0 \le CGPA \le 10.0$.
- **Starter Code**:
  ```c
  #include <stdio.h>

  int main() {
      int id;
      char section;
      float cgpa;
      if (scanf("%d %c %f", &id, &section, &cgpa) == 3) {
          printf("[STUDENT-TAG] ID: %d | SEC: %c | CGPA: %.2f\n", id, section, cgpa);
      }
      return 0;
  }
  ```
- **Hidden Test Cases**: Boundary ID $10^6$, Section 'Z', CGPA 10.00.

#### Medium: High-Precision Currency & Metric Converter
- Convert raw USD cents into full dollars, quarters, dimes, nickels, and pennies using integer division and modulo arithmetic.

#### Hard: Bit-Level Storage Inspector
- Read an integer and display its `sizeof()` in bytes, hex representation, and octal representation with standard leading zero prefixes.

### Mini Project
- **Level 1 Micro-Utility**: **Campus Student Profile & Metric CLI**
- Develop a standalone C command-line tool that inputs student personal details, calculates age in days/hours, prints an aligned ASCII student ID card, and outputs execution memory metrics.

---

## Level 2: Operators & Expressions
- **Difficulty**: Elementary
- **Estimated Completion Time**: 10 Hours
- **Prerequisites**: Level 1
- **Skills Unlocked**: Arithmetic, bitwise manipulations (`&`, `|`, `^`, `~`, `<<`, `>>`), type casting, operator precedence.

### Description & Learning Objectives
Master expression evaluation, implicit vs explicit type promotion, sequence points, and bitwise optimization commonly tested in collegiate placement rounds.

### Lesson Breakdown
1. **Arithmetic & Modulo Operations**: Integer division pitfalls (`5 / 2 == 2`), negative dividend modulo behavior.
2. **Bitwise Arithmetic**: Fast powers of two (`1 << n`), bit masking, parity checks (`n & 1`), clearing/setting bits.
3. **Precedence & Associativity**: Sequence points, post-increment vs pre-increment (`i++` vs `++i`).

- **Real-World Example**: Low-level IoT micro-controller register flag manipulation (setting bit 3 for GPIO enable, clearing bit 0 for sleep mode).
- **Common Mistakes**:
  - Assuming `^` performs exponentiation in C (in C, `^` is bitwise XOR; exponentiation requires `pow()`).
  - Confusing logical AND `&&` with bitwise AND `&`.
  - Undefined behavior in `printf("%d %d", i++, i++)`.

### Coding Challenges
- **Easy**: Fast Bitwise Parity & Power of Two Checker (`(n > 0) && ((n & (n - 1)) == 0)`).
- **Medium**: Dynamic Electricity Tariff Calculator (tiered slab pricing with surcharge rules).
- **Hard**: 32-Bit Register Flag Masker (pack and unpack 4 single-byte sensor readings into one `uint32_t`).

### Mini Project
- **Level 2 Utility**: **Point of Sale & Tiered Billing System**
- Implement an automated billing system computing gross totals, tiered progressive tax brackets, loyalty discounts, and exact coin change breakdown.

---

## Level 3: Conditions & Control Flow
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 12 Hours
- **Prerequisites**: Level 2
- **Skills Unlocked**: Multi-way branching, switch jump tables, loop invariants, nested iterative patterns.

### Description & Learning Objectives
Transition from linear code to dynamic branching logic. Understand how compilers optimize `switch` statements into jump tables and implement robust input-validation loops.

### Key Concepts & Exercises
- `if-else` vs ternary `? :`
- `switch-case` fall-through mechanics and `default` handling
- `for`, `while`, `do-while` lifecycle and off-by-one prevention
- Jump control: `break`, `continue`, structured termination

### Coding Challenges
- **Easy**: Leap Year & Gregorian Date Validator.
- **Medium**: Prime Factorization & Collatz Conjecture Sequence Analyzer.
- **Hard**: Aligned Diamond & Hollow Hexagon ASCII Matrix Renderer.

### Mini Project
- **Level 3 Logic App**: **Menu-Driven Financial Portfolio Simulator**
- An interactive CLI simulation for bank account operations: compound interest schedules, EMI calculation, account balance tracking with transaction history.

---

## Level 4: Arrays & Strings
- **Difficulty**: Upper-Intermediate
- **Estimated Completion Time**: 14 Hours
- **Prerequisites**: Level 3
- **Skills Unlocked**: 1D/2D contiguous memory layouts, null-terminated C-strings (`\0`), buffer overflow safety, string manipulation without library functions.

### Description & Learning Objectives
Master memory layout of arrays, row-major order of 2D matrices, null-terminator mechanics, and secure string operations (`fgets()`, `snprintf()` vs deprecated `gets()`, `strcpy()`).

### Key Concepts & Exercises
- Array bounds: Why C does not perform runtime bounds checking.
- C-String mechanics: `strlen()`, `strcmp()`, `strcpy()`, `strcat()` reimplementation from scratch.
- 2D Matrix transformations: Transposition, spiral printing, matrix multiplication ($O(N^3)$).

### Coding Challenges
- **Easy**: In-Place Array Reversal and Rotation by $K$ positions.
- **Medium**: Matrix Saddle Point and Spiral Order Traversal.
- **Hard**: Custom Anagram & Palindromic Substring Finder with Zero Memory Leaks.

### Mini Project
- **Level 4 Data-Processing App**: **Examination Marks Statistical Analyzer**
- Processes multi-subject grades for up to 500 students: computes mean, median, standard deviation, percentile ranks, and generates an ASCII grade distribution histogram.

---

## Level 5: Functions, Recursion & Storage Classes
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 12 Hours
- **Prerequisites**: Level 4
- **Skills Unlocked**: Call stack frames, activation records, base cases in recursion, storage classes (`auto`, `register`, `static`, `extern`), variable scope & lifetime.

### Description & Learning Objectives
Understand the runtime stack architecture. Learn how recursive functions push activation frames onto memory, prevent stack overflows, and implement divide-and-conquer algorithms.

### Key Concepts & Exercises
- Passing arrays to functions (decaying to pointers).
- Recursion: Base case identification, tail recursion optimization.
- Storage classes: `static` persistence across invocations, `extern` for multi-file linkage.

### Coding Challenges
- **Easy**: Tail-Recursive Fibonacci with Memoization Array.
- **Medium**: Tower of Hanoi Move Sequencer with Move Counter.
- **Hard**: Recursive Maze Backtracking Solver (Finding paths in a grid).

### Mini Project
- **Level 5 Structured App**: **High-Precision Scientific Math Toolkit**
- A modular mathematical library featuring root finding via Newton-Raphson, polynomial evaluation via Horner's rule, and recursive permutations generator.

---

## Level 6: Pointers & Direct Memory Architecture
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Prerequisites**: Level 5
- **Skills Unlocked**: Memory addressing, pointer dereferencing (`*`), pointer arithmetic (`ptr + 1`), double pointers (`**`), function pointers, constant pointers vs pointer to constants.

### Description & Learning Objectives
Demystify pointers. Understand how memory addresses work at the silicon level, how array indexing $A[i] \equiv *(A + i)$, and how to use function pointers for callbacks.

### Key Concepts & Exercises
- `&` (address-of) and `*` (dereference) operators.
- Pointer arithmetic: Scaled by `sizeof(*ptr)`.
- `void*` generic pointers and safe typecasting.
- Function pointers: Syntax, arrays of function pointers, callback mechanisms (`qsort`).

### Coding Challenges
- **Easy**: In-place String Reversal using Raw Pointers.
- **Medium**: Generic Swapper and Array Sorter using `void*` and Function Pointer Comparators.
- **Hard**: Custom `qsort()` implementation with generic callback comparator.

### Mini Project
- **Level 6 Structured App**: **In-Memory Dynamic Data Processor**
- Build an extensible CLI filter/map pipeline using arrays of function pointers that dynamically transforms numerical datasets based on runtime flags.

---

## Level 7: Structures, Unions & Dynamic Memory
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Prerequisites**: Level 6
- **Skills Unlocked**: Heap allocation (`malloc`, `calloc`, `realloc`, `free`), memory leaks, dangling pointers, Valgrind debugging, structure padding and byte alignment.

### Description & Learning Objectives
Gain complete control of heap memory allocation. Learn how the operating system manages the heap, how CPU architectures pad `struct` fields for word-alignment, and how to write memory-safe code.

### Key Concepts & Exercises
- Dynamic Memory: Heap allocation, checking for `NULL`, preventing double-free.
- Memory leaks: Tracking allocations, Valgrind methodology.
- Structures: Memory layout, `->` operator, padding vs `#pragma pack(1)`.
- Unions & Enums: Memory sharing for packet decoders.

### Coding Challenges
- **Easy**: Dynamic Vector (Resizing array using `realloc` with doubling strategy).
- **Medium**: Student Database Struct with Dynamic Name Allocations and Sorting.
- **Hard**: Memory Leak Sanitizer: Custom `my_malloc()` and `my_free()` wrappers that track active byte counts.

### Mini Project
- **Level 7 Real-World App**: **Enterprise Campus Student Management System (SMS)**
- A robust, dynamic student registry supporting CRUD operations, dynamic student record resizing, searching by roll number/department, and 100% leak-free heap cleanup.

---

## Level 8: File Handling & Classical Data Structures
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Prerequisites**: Level 7
- **Skills Unlocked**: File streams (`FILE*`), binary serialization (`fread`, `fwrite`), singly & doubly linked lists, stack & queue data structures from scratch.

### Description & Learning Objectives
Transition from volatile RAM to non-volatile disk storage. Implement core data structures from scratch in C with strict memory ownership.

### Key Concepts & Exercises
- `fopen()` modes: `"r"`, `"w"`, `"a"`, `"rb"`, `"wb"`, `"r+b"`.
- Binary vs text file storage: Endianness and serialization safety.
- Singly and Doubly Linked Lists: Insertion, deletion, reversal, cycle detection.
- Dynamic Stacks and Queues with pointer-based nodes.

### Coding Challenges
- **Easy**: Singly Linked List In-Place Reversal.
- **Medium**: Detect Cycle in a Linked List (Floyd's Tortoise and Hare).
- **Hard**: Binary File Database with Direct Record Seeking (`fseek()`, `ftell()`).

### Mini Project
- **Level 8 Real-World App**: **Persistent Indexed Inventory Management System**
- Disk-backed inventory system storing thousands of products in binary format with fast $O(1)$ random access seeks via indexed table files.

---

## Level 9: Advanced C, Preprocessor & Modular Architecture
- **Difficulty**: Professional
- **Estimated Completion Time**: 14 Hours
- **Prerequisites**: Level 8
- **Skills Unlocked**: Macro metaprogramming, `#ifdef` include guards, multi-file modular projects, `Makefile` compilation, static (`.a`) and dynamic (`.so`) libraries, GDB debugging.

### Description & Learning Objectives
Learn how large-scale enterprise C codebases (like the Linux kernel and Git) are architected into modular, reusable, and maintainable software components.

### Key Concepts & Exercises
- The C Preprocessor: Macro hygiene, variadic macros (`__VA_ARGS__`), token pasting `##`, stringification `#`.
- Modular Architecture: Header files (`.h`), implementation files (`.c`), separation of interface and implementation.
- Build Automation: Writing robust `Makefile` targets with dependency tracking.
- Debugging: GDB breakpoints, backtrace inspection, core dump analysis.

### Coding Challenges
- **Easy**: Multi-File Header Library with Safe Include Guards and Version Macros.
- **Medium**: Custom Generic Circular Queue Macro Suite (`QUEUE_INIT`, `QUEUE_PUSH`, `QUEUE_POP`).
- **Hard**: Dynamic Shared Library Loader (`dlopen`, `dlsym`) for a Plugin Architecture.

### Mini Project
- **Level 9 Production Project**: **Modular CLI Shell & Utility Suite**
- Build a modular UNIX-like shell supporting command parsing, environment variable expansion, dynamic plugin loading, and built-in commands (`cd`, `pwd`, `export`, `history`).

---

## Level 10: Systems Programming & Capstone
- **Difficulty**: Capstone / Professional
- **Estimated Completion Time**: 20 Hours
- **Prerequisites**: Complete Levels 1–9
- **Skills Unlocked**: POSIX system calls (`fork`, `exec`, `pipe`, `waitpid`), signal handling, POSIX threads (`pthread`), mutex locks, race conditions, socket programming.

### Description & Learning Objectives
Transform into a professional systems programmer. Interface directly with the operating system kernel, spawn concurrent threads, synchronize critical sections, and handle network traffic.

### Key Concepts & Exercises
- POSIX Process Management: Process tree, zombies, orphans, IPC via pipes.
- Multithreading: `pthread_create`, `pthread_join`, mutex locks, condition variables.
- BSD Sockets: Network programming basics (`socket`, `bind`, `listen`, `accept`).
- Profiling: Using `gprof` and `valgrind --tool=massif` for memory/CPU bottleneck elimination.

### Coding Challenges
- **Easy**: Multithreaded Matrix Multiplication using `pthread`.
- **Medium**: Thread-Safe Bounded Blocking Queue using Mutex & Condition Variables.
- **Hard**: Basic Non-Blocking TCP Echo Server with `select()` / `poll()`.

### Level 10 Capstone Project
- **Production Capstone**: **High-Concurrency Multi-Threaded HTTP/1.1 Static File Server in Pure C**
  - **Scope**: Implements a concurrent, production-grade HTTP web server from scratch in pure C.
  - **Architecture**:
    - Master thread listening on TCP socket port `8080`.
    - Fixed worker thread pool handling request connections from a thread-safe task queue.
    - Full HTTP/1.1 request line parsing (`GET /index.html HTTP/1.1`).
    - MIME type deduction (`text/html`, `image/png`, `application/json`).
    - Cache headers, 200 OK, 404 Not Found, 400 Bad Request, 500 Internal Error handling.
    - Zero memory leaks confirmed under `valgrind --leak-check=full`.
    - Tested using `wrk` / `ab` benchmark reaching 10,000+ requests/second.
