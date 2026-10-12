# Track 2: C++ Programming — From Modern Syntax to High-Frequency Engineering

**Category**: Systems & High-Performance Engineering  
**Target Audience**: Competitive Programmers, Game Engine Developers, Financial Systems Engineers  
**Primary Language**: C++ (ISO C++20 / GCC 13)  
**Total Estimated Duration**: 130 Hours  

---

## Level 1: C++ Foundations & Stream I/O
- **Difficulty**: Beginner
- **Estimated Completion Time**: 8 Hours
- **Prerequisites**: High-school algebra.
- **Skills Unlocked**: `iostream`, namespaces (`std::`), streams `cin`/`cout`, primitive types, fast I/O optimization.

### Description & Objectives
Transition from C paradigms to standard C++ streams. Learn the difference between `std::endl` and `'\n'`, understand buffer flushing, and configure fast I/O for competitive programming.

### Concepts & Real-World Example
- `std::cin` extraction, `std::cout` insertion, `std::cerr` unbuffered error logging.
- Type deduction with `auto` basics.
- Real-World: Trading terminal input parsing where nanoseconds matter (`cin.tie(NULL); ios_base::sync_with_stdio(false);`).

### Coding Challenges
- **Easy**: Fast I/O Two-Integer Sum & Difference Reporter.
- **Medium**: High-Precision Floating-Point Scientific Calculator (`std::fixed`, `std::setprecision`).
- **Hard**: Formatted Matrix Multi-Stream Reporter.

### Mini Project
- **Level 1 Micro-Utility**: **Console Scientific Calculator & Unit Converter**
- A menu-driven C++ application executing trigonometric, logarithmic, and metric conversion functions with formatted output streams.

---

## Level 2: Control Flow, References & Modern Functions
- **Difficulty**: Elementary
- **Estimated Completion Time**: 10 Hours
- **Skills Unlocked**: Pass-by-reference (`&`), pass-by-const-reference (`const &`), default arguments, inline functions.

### Key Concepts & Exercises
- Eliminating copy overhead: Why passing objects by value is expensive.
- References vs pointers: Syntax, nullability, rebindability.
- Switch statements with initialization (`if (int x = compute(); x > 0)`).

### Coding Challenges
- **Easy**: Reference-Based In-Place Variable Swap & Bounds Clamper.
- **Medium**: Number Classification Engine (Armstrong, Strong, Perfect, Palindromic).
- **Hard**: Recursive Function with Default Arguments & Call Counter.

### Mini Project
- **Level 2 Utility**: **Automated Student Grade & Attendance Evaluator**
- Computes weighted semester GPAs using pass-by-reference calculation helpers, formatting grade cards according to university grading policies.

---

## Level 3: Arrays, Strings & STL Sequence Containers
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 12 Hours
- **Skills Unlocked**: `std::string`, `std::vector`, `std::pair`, `std::tuple`, dynamic resizing, string stream parsing.

### Key Concepts & Exercises
- `std::string` vs raw `char*`: Memory safety, SSO (Small String Optimization).
- `std::vector`: Capacity vs size, geometric reallocation (`push_back` vs `emplace_back`).
- `std::stringstream`: Tokenizing space-separated streams.

### Coding Challenges
- **Easy**: Vector Dynamic Resizing & Running Prefix Sums.
- **Medium**: Substring Pattern Frequency Counter using `std::string::find`.
- **Hard**: Vector Anagram Grouping using Sorted Keys.

### Mini Project
- **Level 3 Logic App**: **Student Record Processing & Ranking Engine**
- Collects and ranks hundreds of student marks using `std::vector<std::pair<int, double>>`, sorting dynamically by roll number or CGPA.

---

## Level 4: Object-Oriented Programming (OOP)
- **Difficulty**: Upper-Intermediate
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: Encapsulation, Constructors/Destructors, `this`, Inheritance, Virtual Functions, Polymorphism, Abstract Classes, Pure Virtual Methods (`= 0`).

### Key Concepts & Exercises
- Access specifiers (`public`, `private`, `protected`).
- Member initializer lists vs body assignment.
- Virtual Method Table (vtable) and dynamic dispatch.
- Pure virtual functions and interface design in C++.

### Coding Challenges
- **Easy**: Encapsulated Bank Account Class with Deposit/Withdrawal Invariants.
- **Medium**: Polymorphic Shape Hierarchy (`Circle`, `Rectangle`, `Triangle`) with Virtual `area()` and `perimeter()`.
- **Hard**: Custom String Class (`MyString`) with Manual Deep Copy Constructor and Destructor.

### Mini Project
- **Level 4 Data-Processing App**: **Banking Management System**
- Full OOP banking application supporting `SavingsAccount`, `CheckingAccount`, transaction audit logs, overdraft limits, and polymorphic interest calculation.

---

## Level 5: Operator Overloading, Templates & Exceptions
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: Operator overloading (`+`, `-`, `<<`, `>>`, `[]`), Function & Class Templates, Exception handling (`try`, `catch`, `throw`), Custom Exception classes.

### Key Concepts & Exercises
- Overloading stream insertion `operator<<` and extraction `operator>>`.
- Template specialization for specific types.
- Exception safety guarantees (Basic, Strong, Nothrow).

### Coding Challenges
- **Easy**: Complex Number Class with Overloaded Arithmetic Operators.
- **Medium**: Generic Dynamic Array Template `SmartVector<T>` with Overloaded `operator[]`.
- **Hard**: Custom Exception Hierarchy (`InsufficientFundsException`, `InvalidAccountException`).

### Mini Project
- **Level 5 Structured App**: **Generic Matrix Math & Linear Algebra Library**
- A templated C++ library supporting arbitrary data types (`int`, `double`, `float`) for matrix addition, transpose, multiplication, and determinant calculation.

---

## Level 6: The Standard Template Library (STL) Deep Dive
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: `std::deque`, `std::list`, `std::set`, `std::map`, `std::unordered_map`, `std::priority_queue`, Iterators, `<algorithm>` (`sort`, `binary_search`, `lower_bound`, `upper_bound`).

### Key Concepts & Exercises
- Red-Black Tree backed containers (`std::set`, `std::map`) $O(\log N)$ vs Hash Table backed (`unordered_map`) $O(1)$ amortized.
- Custom comparators for priority queues and sets.
- Iterator categories (Random Access, Bidirectional, Forward, Input).

### Coding Challenges
- **Easy**: Most Frequent Element Counter using `std::unordered_map`.
- **Medium**: Top-K Frequent Elements using `std::priority_queue`.
- **Hard**: Custom Comparator Sorter for Stock Trade Orders (`price`, `timestamp`).

### Mini Project
- **Level 6 Structured App**: **High-Throughput Inventory & Order Fulfillment System**
- Manages SKU inventories, tracks low stock via priority queues, and matches orders against catalog maps in logarithmic time.

---

## Level 7: Modern C++ (C++11 to C++20)
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: RAII, Smart Pointers (`unique_ptr`, `shared_ptr`, `weak_ptr`), Move Semantics, Rvalue References (`&&`), `std::move`, Lambda expressions, `constexpr`.

### Key Concepts & Exercises
- Eliminating manual `delete`: Automatic lifetime with `std::unique_ptr`.
- Circular reference prevention with `std::weak_ptr`.
- Move constructors and move assignment operators: Stealing resources without copying.
- Lambdas: Capture clauses (`[=]`, `[&]`, `[this]`, mutable).

### Coding Challenges
- **Easy**: Custom RAII File Stream Guard using `std::unique_ptr`.
- **Medium**: Move-Only Buffer Class with Zero Copy Transfer Verification.
- **Hard**: Expression Evaluator using Modern Lambdas and `std::function`.

### Mini Project
- **Level 7 Real-World App**: **Modern Smart Memory Event Bus**
- An event dispatching engine using `std::shared_ptr`, `std::weak_ptr`, and modern lambda subscriber callbacks for decoupled cross-module communication.

---

## Level 8: Advanced Algorithms & Data Structures
- **Difficulty**: Advanced
- **Estimated Completion Time**: 18 Hours
- **Skills Unlocked**: Dynamic Programming, Graph Traversal (BFS, DFS), Shortest Path (Dijkstra), Disjoint Set Union (DSU), Trie, Segment Tree.

### Key Concepts & Exercises
- Competitive programming patterns: 2-Pointers, Sliding Window, Memoization, Tabulation.
- Graph representations: Adjacency list with vectors, priority queue Dijkstra.
- Trie trees for prefix matching.

### Coding Challenges
- **Easy**: Shortest Path in Weighted Graph via Dijkstra.
- **Medium**: 0/1 Knapsack with Space-Optimized 1D Dynamic Programming.
- **Hard**: Prefix Autocomplete Trie with Query Frequency Counts.

### Mini Project
- **Level 8 Real-World App**: **Graph-Based Route Planning & Navigation Engine**
- A road network simulation applying Dijkstra's algorithm, A* search, and network minimum spanning trees to compute optimal multi-stop vehicle delivery routes.

---

## Level 9: Concurrency, Multithreading & High Performance
- **Difficulty**: Professional
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: `std::thread`, `std::mutex`, `std::lock_guard`, `std::unique_lock`, `std::condition_variable`, `std::atomic`, Deadlock prevention, Memory order basics.

### Key Concepts & Exercises
- Race conditions and critical sections.
- Thread pooling: Reusing threads instead of spawning per task.
- Lock-free programming fundamentals with `std::atomic<int>`.

### Coding Challenges
- **Easy**: Thread-Safe Counter with `std::mutex` and `std::atomic`.
- **Medium**: Producer-Consumer Bounded Queue using `std::condition_variable`.
- **Hard**: Multithreaded Merge Sort leveraging Work-Stealing Task Splitting.

### Mini Project
- **Level 9 Production Project**: **High-Performance Concurrent Task Execution Pool**
- A production-grade C++ thread pool library featuring dynamic task enqueuing, `std::future` return values, thread affinity, and graceful shutdown handling.

---

## Level 10: Production Engineering & Capstone
- **Difficulty**: Capstone / Professional
- **Estimated Completion Time**: 20 Hours
- **Skills Unlocked**: Benchmark profiling (Google Benchmark), unit testing (Google Test), sanitizers (AddressSanitizer, ThreadSanitizer), cache optimization, zero-allocation design.

### Key Concepts & Exercises
- Cache locality: CPU L1/L2/L3 cache misses, struct-of-arrays vs array-of-structs.
- Modern build tooling: `CMake` configurations, target-based dependencies.
- Static analysis and performance profiling with `perf`.

### Level 10 Capstone Project
- **Production Capstone**: **Ultra-Low-Latency In-Memory Key-Value Storage Engine & Order Book**
  - **Scope**: Implements an in-memory key-value cache and matching engine inspired by Redis and LMAX Disruptor.
  - **Key Features**:
    - Zero dynamic allocations on the critical hot path.
    - Concurrent lock-free or fine-grained bucket locking architecture.
    - Append-only write-ahead log (WAL) for crash durability.
    - Benchmarked to process $> 1,000,000$ operations/second with sub-microsecond P99 latencies.
    - Full suite of Google Test unit tests and ASAN memory leak validation.
