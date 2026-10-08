# Track 3: Java Programming — From Core Fundamentals to Enterprise Microservices

**Category**: Enterprise Software & Cloud Backend  
**Target Audience**: Enterprise Backend Developers, Placement Aspirants, Cloud Engineers  
**Primary Language**: Java (Java 21 LTS / OpenJDK 21)  
**Total Estimated Duration**: 130 Hours  

---

## Level 1: Java Architecture & Foundations
- **Difficulty**: Beginner
- **Estimated Completion Time**: 8 Hours
- **Prerequisites**: Basic computing logic.
- **Skills Unlocked**: JDK/JRE/JVM bytecode execution, `javac` compilation, `Scanner` input, strongly-typed variables, Java memory model overview.

### Description & Objectives
Understand the "Write Once, Run Anywhere" (WORA) philosophy. Learn how Java source code compiles to bytecode (`.class`) and is interpreted/JIT-compiled by the JVM.

### Concepts & Examples
- JVM Anatomy: ClassLoader, Memory (Method Area, Heap, Stack, PC Registers), Execution Engine (JIT).
- Standard Input/Output: `System.out.println()`, `java.util.Scanner`, `java.io.BufferedReader`.
- Primitives vs Reference wrappers (`int` vs `Integer`).

### Coding Challenges
- **Easy**: Scanner-Driven Student Metric Card.
- **Medium**: Currency Converter with Rounding Modes (`BigDecimal` basics).
- **Hard**: Primitive Bitwise Flag Masking in Java.

### Mini Project
- **Level 1 Micro-Utility**: **Console Scientific Calculator & Currency Exchange**
- Interactive console app providing arithmetic, logarithmic computations, and real-time exchange conversions with robust input formatting.

---

## Level 2: Control Flow, Methods & Array Mechanics
- **Difficulty**: Elementary
- **Estimated Completion Time**: 10 Hours
- **Skills Unlocked**: Method signatures, return types, pass-by-value semantics, 1D/2D arrays, enhanced for-loops (`for-each`).

### Key Concepts & Exercises
- Java's Pass-by-Value guarantee: References are passed by value; changing an object modifies heap state, but rebinding references does not affect the caller.
- Enhanced for loop and `Arrays` utility methods (`Arrays.sort`, `Arrays.binarySearch`, `Arrays.fill`).

### Coding Challenges
- **Easy**: Array Min-Max & Average Analyzer.
- **Medium**: Matrix Multiplication with Dimensional Validation.
- **Hard**: Kadane's Algorithm for Maximum Subarray Sum.

### Mini Project
- **Level 2 Utility**: **Automated College Grading & GPA Evaluation System**
- Processes multi-course student marks, calculates GPA, and assigns letter grades based on credit weighting and university thresholds.

---

## Level 3: Strings, Immutability & Core Collections
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 12 Hours
- **Skills Unlocked**: `String` immutability, String Constant Pool, `StringBuilder`, `ArrayList`, `HashSet`, `HashMap`.

### Key Concepts & Exercises
- Why `String` is immutable in Java (security, caching, synchronization, class loading).
- `equals()` vs `==` operator.
- Core Collections: `ArrayList` (dynamic resizing array), `HashSet` (unique items), `HashMap` (key-value hash table).

### Coding Challenges
- **Easy**: Word Frequency Counter using `HashMap<String, Integer>`.
- **Medium**: Anagram and Palindrome Checker using `StringBuilder`.
- **Hard**: Two Sum with $O(N)$ Time Complexity using `HashMap`.

### Mini Project
- **Level 3 Logic App**: **Interactive Contact & Directory Management System**
- CLI application managing contacts with duplicate phone number rejection via `HashSet` and fast name lookup via `HashMap`.

---

## Level 4: Object-Oriented Programming (OOP)
- **Difficulty**: Upper-Intermediate
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: Classes, Encapsulation, Inheritance (`extends`), Polymorphism (Overloading vs Overriding), Abstraction (`abstract`), Interfaces (`implements`), `super`, `final`.

### Key Concepts & Exercises
- Access modifiers (`private`, default, `protected`, `public`).
- Method overriding and the `@Override` annotation.
- Interface default methods, static methods, and loose coupling.

### Coding Challenges
- **Easy**: Encapsulated Employee Class with Salary Invariants and Overtime Calculation.
- **Medium**: Bank Account Hierarchy (`SavingsAccount`, `CurrentAccount`) with Overdrawn Exception Protection.
- **Hard**: Polymorphic Payment Processor Interface (`CreditCardPayment`, `UpiPayment`, `CryptoPayment`).

### Mini Project
- **Level 4 Data-Processing App**: **Full-Featured Core Banking & Transaction Engine**
- Models an enterprise banking system with interest calculation, balance minimums, transaction journals, and polymorphic account types.

---

## Level 5: Exceptions, Generics, Enums & Annotations
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: Checked vs Unchecked Exceptions, `try-catch-finally`, `try-with-resources`, Custom Exceptions, Generic Classes & Methods (`<T>`), Wildcards (`<?>`, `<? extends T>`), Enums.

### Key Concepts & Exercises
- `Throwable`, `Exception`, `RuntimeException`, and `Error`.
- AutoCloseable interface with `try-with-resources`.
- Type erasure in Java Generics.
- Enums with fields, constructors, and methods.

### Coding Challenges
- **Easy**: Safe Mathematical Division with Custom `DivideByZeroException`.
- **Medium**: Generic Bounded Stack `GenericStack<T>` with Resizing Logic.
- **Hard**: Custom Validation Annotation & Reflection Processor (`@NotNull`, `@Range`).

### Mini Project
- **Level 5 Structured App**: **University Library & Asset Management System**
- Implements cataloging, book borrowing, and late-fee calculation with custom business exceptions (`BookNotAvailableException`, `MemberOverdueException`).

---

## Level 6: Modern Java: Functional Interfaces & Streams API
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: Lambda Expressions, Method References (`::`), `Predicate`, `Function`, `Consumer`, `Supplier`, `Stream` operations (`map`, `filter`, `reduce`, `collect`), `Optional<T>`, `java.time` API.

### Key Concepts & Exercises
- Stream pipelining: Intermediate (lazy) vs Terminal operations.
- Avoiding `NullPointerException` with `Optional<T>`.
- Modern date/time: `LocalDate`, `LocalDateTime`, `ZonedDateTime`, `Duration`.

### Coding Challenges
- **Easy**: Stream Filtering: Extract Even Squares from List.
- **Medium**: Department Employee Aggregation: Group by department and find highest earner via `Collectors.groupingBy`.
- **Hard**: Custom Collector implementing statistical summary.

### Mini Project
- **Level 6 Structured App**: **High-Throughput E-Commerce Sales Analytics Engine**
- Streams-powered analytics engine filtering thousands of transactions, computing running totals, average order value per category, and monthly top customers.

---

## Level 7: Files, I/O & JDBC Database Persistence
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: Java NIO (`java.nio.file.Files`, `Path`), Object Serialization (`Serializable`), JDBC (`DriverManager`, `Connection`, `PreparedStatement`, `ResultSet`), Connection Pooling basics (HikariCP), ACID transactions.

### Key Concepts & Exercises
- Preventing SQL injection with `PreparedStatement`.
- Managing database transactions: `connection.setAutoCommit(false)`, `commit()`, `rollback()`.
- Fast file I/O with Java NIO Channels and Buffers.

### Coding Challenges
- **Easy**: CSV Student Record Importer and Exporter using NIO.
- **Medium**: Secure JDBC User Authentication & Registration Dao.
- **Hard**: Multi-Table Transactional Money Transfer with Rollback Guard.

### Mini Project
- **Level 7 Real-World App**: **Database-Driven Corporate HR & Payroll Management System**
- Complete CRUD enterprise system communicating with PostgreSQL/MySQL via JDBC, handling employees, salary slip generation, and tax deduction reports.

---

## Level 8: Concurrency & Multithreading Architecture
- **Difficulty**: Advanced
- **Estimated Completion Time**: 18 Hours
- **Skills Unlocked**: `Thread`, `Runnable`, `Callable`, `Future`, `ExecutorService`, Thread Pools, `synchronized`, `ReentrantLock`, `ConcurrentHashMap`, `CompletableFuture`, Virtual Threads (Java 21 Project Loom).

### Key Concepts & Exercises
- Thread synchronization and deadlock conditions.
- Thread pooling with `Executors.newFixedThreadPool()`.
- Java 21 Virtual Threads (`Executors.newVirtualThreadPerTaskExecutor()`) for high-concurrency I/O.
- Asynchronous pipelines with `CompletableFuture`.

### Coding Challenges
- **Easy**: Thread-Safe Bank Account using `ReentrantLock`.
- **Medium**: Concurrent Web URL Scraper using `ExecutorService` and `Callable`.
- **Hard**: High-Throughput Asynchronous Pipeline using `CompletableFuture.allOf()`.

### Mini Project
- **Level 8 Real-World App**: **Concurrent Real-Time Stock Market Ticker Simulator**
- Multithreaded simulation processing mock ticker feeds concurrently, updating order books using `ConcurrentHashMap`, and notifying subscriber listeners asynchronously.

---

## Level 9: Enterprise Backend with Spring Boot & REST APIs
- **Difficulty**: Professional
- **Estimated Completion Time**: 18 Hours
- **Skills Unlocked**: Spring Boot, Inversion of Control (IoC), Dependency Injection (`@Autowired`), `@RestController`, `@Service`, `@Repository`, Spring Data JPA, Hibernate, Bean Validation (`@Valid`), Swagger/OpenAPI.

### Key Concepts & Exercises
- 3-Tier Enterprise Architecture: Controller $\to$ Service $\to$ Repository.
- Spring Data JPA: Entity mappings (`@Entity`, `@Table`, `@Id`), derived query methods.
- Exception handling via `@ControllerAdvice` and `@ExceptionHandler`.
- DTO (Data Transfer Object) pattern with Lombok and MapStruct.

### Coding Challenges
- **Easy**: REST Controller with `@GetMapping` and Path Variables.
- **Medium**: Spring Data JPA Repository with Custom JPQL Queries and Pagination.
- **Hard**: Global Exception Handler returning standardized RFC 7807 error envelopes.

### Mini Project
- **Level 9 Production Project**: **Enterprise E-Commerce REST API Engine**
- Complete REST service supporting product catalogs, user accounts, order placement, stock decrementing, and database migration scripts via Flyway.

---

## Level 10: Cloud-Native Microservices & Capstone
- **Difficulty**: Capstone / Professional
- **Estimated Completion Time**: 22 Hours
- **Skills Unlocked**: Spring Security 6 (JWT & OAuth2), Docker containerization, Microservices architecture, API Gateway (Spring Cloud Gateway), Service Discovery (Eureka / Consul), Distributed Tracing, Testing with JUnit 5 & Mockito.

### Key Concepts & Exercises
- JWT authentication filter chain and stateless session management.
- Unit and integration testing: `@SpringBootTest`, `@MockBean`, MockMvc.
- Dockerizing Spring Boot apps with multi-stage builds.
- Messaging fundamentals: RabbitMQ / Kafka event publishing.

### Level 10 Capstone Project
- **Production Capstone**: **Scalable Cloud-Native Event Booking & Ticketing Microservices Platform**
  - **Scope**: Production-grade distributed ticketing engine built with Spring Boot, Spring Security, PostgreSQL, Redis cache, and Docker.
  - **Key Features**:
    - Distributed seat locking mechanism backed by Redis to prevent double booking.
    - JWT authentication with Role-Based Access Control (`STUDENT`, `ORGANIZER`, `ADMIN`).
    - Event ticket generation with signed QR code payloads.
    - Automated unit and integration test suite with $> 80\%$ code coverage via JUnit 5 and Testcontainers.
    - Multi-stage Docker containerization and Kubernetes deployment manifests.
