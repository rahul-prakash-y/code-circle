# Code Circle ⭕

> **An enterprise-grade campus coding club ecosystem, interactive learning platform, and competitive assessment engine.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-v5-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://fastify.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-In--Browser_IDE-1E1E1E?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://microsoft.github.io/monaco-editor/)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Core Features & Modules](#-core-features--modules)
  - [1. Multi-Track Learning Paths (Domains & Levels)](#1-multi-track-learning-paths-domains--levels)
  - [2. Sandboxed Coding Workspace & RCE Engine](#2-sandboxed-coding-workspace--rce-engine)
  - [3. Anti-Cheat & Exam Integrity Monitoring](#3-anti-cheat--exam-integrity-monitoring)
  - [4. High-Throughput Attendance Buffer](#4-high-throughput-attendance-buffer)
  - [5. Student 360° Tracking & Analytics](#5-student-360-tracking--analytics)
  - [6. Gamification, Badges & Student Passport](#6-gamification-badges--student-passport)
  - [7. Institutional Governance & Security](#7-institutional-governance--security)
- [Technology Stack](#-technology-stack)
- [Directory Structure](#-directory-structure)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Environment Configuration](#-environment-configuration)
- [Database Seeding & Initial Credentials](#-database-seeding--initial-credentials)
- [API Reference](#-api-reference)
- [Role-Based Access Control (RBAC) Matrix](#-role-based-access-control-rbac-matrix)
- [Production Build & Deployment](#-production-build--deployment)
- [Contributing & License](#-contributing--license)

---

## 🌟 Overview

**Code Circle** is an all-in-one platform built for collegiate developer clubs, technical societies, and computer science departments (engineered specifically for institutions like Bannari Amman Institute of Technology and Anna University-affiliated colleges).

The platform bridges the gap between passive video-based tutorials and real hands-on software development:
- **Guided Curricula**: Students follow structured learning tracks with video lectures, reading notes, and knowledge-check quests.
- **Hands-On Coding Assessments**: An integrated Monaco Editor workspace executes student submissions in isolated sandboxes.
- **Campus Operations**: High-throughput event attendance via OTP/QR check-ins, automated student passport stamp records, executive leadership showcases, and deep academic tracking.
- **Academic Governance**: Real-time auditing of student performance, onboarding tracking, and streaming report exports (Excel, CSV, PDF).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client (React 19 + Vite 8)"]
        UI["Tailwind CSS v4 & Radix UI"]
        Monaco["Monaco Editor (Code Workspace)"]
        Store["Zustand Auth Store & React Query"]
    end

    subgraph Server ["Backend (Fastify v5 TypeScript)"]
        Gateway["Fastify Server & Router"]
        AuthMiddleware["JWT & Single-Device Session Guard"]
        RCE["RCE Orchestrator (Piston + Judge0 Fallback)"]
        RceQueue["In-Memory RCE Concurrency Limiter"]
        AttBuffer["In-Memory Attendance Buffer (Batch Flusher)"]
        Exporters["Report Generator (PDFKit, XLSX, CSV-Stringify)"]
    end

    subgraph DataServices ["External & Data Services"]
        MongoDB[("MongoDB (Mongoose v9)")]
        PistonAPI["Emkc Piston API Sandbox"]
        Judge0API["Judge0 API (RapidAPI / CE)"]
        Cloudinary["Cloudinary (Media & Files)"]
        FirebaseAuth["Firebase Admin (Google Auth)"]
    end

    Client -->|REST API Requests| Gateway
    Gateway --> AuthMiddleware
    AuthMiddleware --> MongoDB

    Gateway -->|Execute Code| RceQueue
    RceQueue --> RCE
    RCE -->|Primary| PistonAPI
    RCE -->|Failover Fallback| Judge0API

    Gateway -->|High-Frequency OTP Check-in| AttBuffer
    AttBuffer -->|Batch Writes (every 4s / 50 records)| MongoDB

    Gateway -->|Uploads / Avatars| Cloudinary
    Gateway -->|Verify Tokens| FirebaseAuth
    Gateway -->|Export Reports| Exporters
```

---

## 🚀 Core Features & Modules

### 1. Multi-Track Learning Paths (Domains & Levels)
- **Domain Structure**: Organize curricula into distinct specializations (e.g., *Python Programming: Zero to Hero*, *Web Development*, *Cloud & DevOps*, *AI/ML*, *DSA*).
- **Progressive Unlocking**: Each domain consists of sequenced levels. Completing Level $N$ unlocks Level $N+1$.
- **Lesson Delivery**: Embedded YouTube video player, attached study notes, external references, and code cheatsheets.
- **Gated Progression**: Students must pass an interactive MCQ Quest with at least **70% marks** before the system unlocks the corresponding live coding challenge.
- **Access Controls**: SuperAdmins can mark courses as locked, public, or whitelist specific student batches.

### 2. Sandboxed Coding Workspace & RCE Engine
- **In-Browser IDE**: Powered by Microsoft's Monaco Editor with multi-language syntax highlighting, editor theme switching, font size controls, and code formatting.
- **Supported Languages**: Python 3, C, C++, Java, and JavaScript (Node.js).
- **Dual-Engine Failover**: Out-of-the-box primary dispatch to **Emkc Piston API** with automatic, zero-downtime failover to **Judge0 API**.
- **Execution Concurrency Limiter**: An in-memory queue protects host resources and remote API quotas (`MAX_CONCURRENT_RCE=5`, `MAX_RCE_QUEUE_SIZE=50`).
- **Sliding Window Rate Limiting**: Enforces a minimum 2-second cooldown between test runs and a quota of 20 runs per 2-minute sliding window per user.
- **Automated Test Validation**: Compares normalized user output against public and hidden test cases, reporting execution time, memory usage, and compiler/runtime errors.

### 3. Anti-Cheat & Exam Integrity Monitoring
- **Real-Time Proctoring**: Monitors active coding assessments for tab switches (`visibilitychange`), window blurring (`blur`), fullscreen exit breaches, and copy-paste clipboard abuse.
- **Warning Thresholds**: Increments warning counters on policy breaches and displays warning modals with auto-submit penalties upon exceeding limits.
- **Integrity Event Auditing**: Logs timestamps and event types alongside final submissions for administrative review.

### 4. High-Throughput Attendance Buffer
- **Sub-Millisecond Response**: Solves the high-concurrency bottleneck when hundreds of students scan OTPs or QR codes simultaneously during club meetings.
- **In-Memory Buffer Engine**: Validates active OTPs against an in-memory `Map` and deduplicates check-ins using a local `Set`.
- **Scheduled Batch Flushes**: Queues entries and flushes in bulk to MongoDB every 4,000 milliseconds or when 50 items accumulate.
- **Zero Loss Graceful Shutdown**: Flushes all queued entries on server process termination signals (`SIGINT`, `SIGTERM`).

### 5. Student 360° Tracking & Analytics
- **Student 360 View**: Detailed student profiles displaying enrollment status, domain completion rate, attendance percentage, and assessment scores.
- **Academic Year Auto-Derivation**: Intelligently parses Anna University roll number patterns (e.g., `7376YY...`) and institutional emails to classify students into 1st, 2nd, 3rd, or 4th Year.
- **Streaming Report Exports**:
  - **Excel (.xlsx)**: Formatted workbooks with department and domain tabs.
  - **CSV**: Streaming low-RAM, constant-memory CSV export designed for thousands of records.
  - **PDF**: Branded official club transcripts and attendance sheets generated via `PDFKit`.

### 6. Gamification, Badges & Student Passport
- **Student Passport**: A digital credential passport containing event attendance stamps, verified workshop participation, and skill badges.
- **Platform Leaderboard**: Global and domain-specific rankings calculated from quest scores, solved problem points, and verified attendance.
- **Developer Profiles**: Scrapes and renders live developer statistics from **GitHub** and **HackerRank**.

### 7. Institutional Governance & Security
- **Role-Based Access Control (RBAC)**: Fine-grained permissions across 6 role tiers: `SuperAdmin`, `Admin`, `Faculty`, `Committee`, `Member`, and `Student`.
- **Single-Device Session Lock**: Detects duplicate active logins using UUID session identifiers and automatically invalidates stale sessions.
- **Mandatory Password Setup**: Newly provisioned accounts are forced through a password reset onboarding flow (`mustChangePassword: true`) before accessing the dashboard.
- **Bulk CSV Provisioning**: Import hundreds of students with roll numbers, departments, and pre-generated credentials in one step.
- **Anonymous Feedback System**: Transparent student feedback channels with SuperAdmin-only deanonymization privileges to protect student privacy while preventing abuse.

---

## 🛠️ Technology Stack

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Backend Runtime** | Node.js (v18+), TypeScript 5.8, TSX, ESBuild |
| **Backend Framework** | Fastify v5, `@fastify/cors`, `@fastify/multipart`, `@fastify/static` |
| **Database & ODM** | MongoDB, Mongoose v9 |
| **Remote Code Execution** | Piston API (Emkc), Judge0 CE / RapidAPI |
| **Auth & Security** | JWT (`jsonwebtoken`), `bcryptjs`, Firebase Admin SDK |
| **Media & Files** | Cloudinary v2, Multer / Multipart Streams |
| **Report Generation** | PDFKit, SheetJS (`xlsx`), `csv-stringify` |
| **Validation** | Zod schemas, Fastify route schemas |
| **Frontend Framework** | React 19, Vite 8, React Router v7 |
| **Styling & Design** | Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Framer Motion |
| **In-Browser IDE** | `@monaco-editor/react` (Monaco Editor) |
| **State & Cache** | Zustand (persistent auth store), TanStack React Query v5 |
| **Visualizations** | Recharts, `date-fns` |
| **Notifications** | `react-hot-toast` |

---

## 📂 Directory Structure

```text
code-circle/
├── backend/
│   ├── scripts/
│   │   └── copyJsToDist.js            # Build script to copy non-TS assets to dist
│   ├── src/
│   │   ├── config/                    # Database, Cloudinary, Firebase configs
│   │   ├── controllers/               # Business logic controllers
│   │   │   ├── adminController.ts
│   │   │   ├── assessmentController.ts
│   │   │   ├── attendanceController.ts
│   │   │   ├── authController.ts
│   │   │   ├── bearerController.ts
│   │   │   ├── codingAssessmentController.ts
│   │   │   ├── domainController.ts
│   │   │   ├── eventController.ts
│   │   │   ├── studentTrackingController.ts
│   │   │   └── userManagementController.ts
│   │   ├── middleware/                # JWT verification, RBAC guards, global error handler
│   │   ├── models/                    # Mongoose schemas (User, Level, Domain, Attendance, etc.)
│   │   ├── routes/                    # Fastify route modules
│   │   ├── scripts/                   # Database seeding and migration CLI utilities
│   │   │   ├── seedSuperAdmin.ts      # Bootstrap SuperAdmin account
│   │   │   ├── seedPythonCourse.ts    # Seed 10-level comprehensive Python curriculum
│   │   │   ├── seedStudentBearers.ts  # Seed club executive board
│   │   │   └── seedNotifications.ts   # Seed platform system notifications
│   │   ├── services/                  # AttendanceBuffer, RCEService, Exporters, Metrics
│   │   │   └── rce/                   # Piston & Judge0 providers, concurrency limiter
│   │   ├── types/                     # Shared TypeScript interfaces & types
│   │   ├── utils/                     # ApiError, PDF generator, string normalizers
│   │   └── server.ts                  # Fastify server entry point
│   ├── .env.example                   # Backend environment variables template
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/                        # Static assets, club logo, favicon
│   ├── src/
│   │   ├── assets/                    # Platform graphics, banners
│   │   ├── components/
│   │   │   ├── admin/                 # Admin console, tracking table, OTP generator
│   │   │   ├── assessments/           # MCQ quest cards, timers
│   │   │   ├── bearers/               # Club leadership cards
│   │   │   ├── coding/                # Monaco IDE workspace, console, anti-cheat modal
│   │   │   ├── dashboard/             # Stats widgets, course progress, event feeds
│   │   │   ├── domains/               # Domain syllabus, level accordions, video viewer
│   │   │   ├── events/                # Event RSVP cards, calendar
│   │   │   ├── navigation/            # Sidebar, topbar, mobile drawer
│   │   │   └── ui/                    # Buttons, dialogs, dropdowns, skeletons
│   │   ├── context/                   # Theme context (Dark / Light mode)
│   │   ├── layouts/                   # MainLayout with persistent sidebar & header
│   │   ├── lib/                       # Axios instance with interceptors, Firebase web client
│   │   ├── pages/                     # Routed view components
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── AssessmentsPage.tsx
│   │   │   ├── AttendancePage.tsx
│   │   │   ├── BearerManagement.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DomainsPage.tsx
│   │   │   ├── EventsPage.tsx
│   │   │   ├── Login.jsx
│   │   │   ├── PassportPage.tsx
│   │   │   ├── Profile.jsx
│   │   │   ├── StudentTrackingPage.tsx
│   │   │   └── UserManagement.tsx
│   │   ├── store/                     # Zustand stores (useAuthStore)
│   │   ├── App.jsx                    # Route definitions and route guards
│   │   ├── index.css                  # Design system tokens and Apple-like CSS variables
│   │   └── main.tsx                   # React root mount
│   ├── .env.example                   # Frontend environment variables template
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── package.json                       # Monorepo root scripts
└── readme.md                          # Project documentation
```

---

## ⚡ Getting Started & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) `>= 18.0.0`
- [MongoDB](https://www.mongodb.com/try/download/community) running locally or a [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI
- [Git](https://git-scm.com/)

### Step 1: Clone the Repository
```bash
git clone https://github.com/rahul-prakash-y/code-circle.git
cd code-circle
```

### Step 2: Install Dependencies
Install dependencies across both root, backend, and frontend:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

### Step 3: Configure Environment Variables
Create the `.env` files from their respective examples:

```bash
# Configure Backend
cp backend/.env.example backend/.env

# Configure Frontend
cp frontend/.env.example frontend/.env
```

*(Refer to [Environment Configuration](#-environment-configuration) below for details on each variable).*

### Step 4: Seed the Database
Populate your database with the default SuperAdmin, a complete 10-level Python curriculum, and the student executive board:

```bash
cd backend
# 1. Seed SuperAdmin user
npx tsx src/scripts/seedSuperAdmin.ts

# 2. Seed 10-level interactive Python curriculum
npx tsx src/scripts/seedPythonCourse.ts

# 3. Seed student executive bearers
npx tsx src/scripts/seedStudentBearers.ts

# 4. Seed sample notifications (optional)
npx tsx src/scripts/seedNotifications.ts

cd ..
```

### Step 5: Start the Development Servers
You can run both servers simultaneously:

**Terminal 1 — Backend API Server:**
```bash
cd backend
npm run dev
# Backend runs at http://localhost:5000
```

**Terminal 2 — Frontend Application:**
```bash
cd frontend
npm run dev
# Frontend runs at http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)

| Variable | Description | Default / Example | Required |
| :--- | :--- | :--- | :---: |
| `PORT` | Fastify server port | `5000` | No |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` | No |
| `LOG_LEVEL` | Fastify logger verbosity (`info`, `warn`, `error`) | `info` | No |
| `CLIENT_URL` | Frontend origin for CORS and password reset URLs | `http://localhost:5173` | Yes |
| `MONGO_URI` | MongoDB connection URI | `mongodb://localhost:27017/code-circle` | **Yes** |
| `JWT_SECRET` | Secret key for signing authentication JWTs | `your_secret_jwt_key` | **Yes** |
| `SUPERADMIN_DEFAULT_PASSWORD` | Default password used by the SuperAdmin seed script | `SuperAdmin@2026!` | No |
| `FIREBASE_SERVICE_ACCOUNT` | Raw JSON string or path for Firebase Admin SDK | `{...}` | Optional |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier for file uploads | `your_cloud_name` | Optional |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your_api_key` | Optional |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_api_secret` | Optional |
| `RCE_PROVIDER` | Primary code execution provider (`piston` or `judge0`) | `piston` | No |
| `RCE_TIMEOUT_MS` | Sandbox code execution timeout limit (ms) | `10000` | No |
| `MAX_CONCURRENT_RCE` | Maximum simultaneous external sandbox executions | `5` | No |
| `MAX_RCE_QUEUE_SIZE` | Maximum queue depth before rejecting code runs | `50` | No |
| `PISTON_API_URL` | Base URL of the Piston API service | `https://emkc.org/api/v2/piston` | No |
| `PISTON_API_KEY` | Optional API key for high-rate Piston clusters | `""` | No |
| `JUDGE0_API_URL` | Base URL of the Judge0 execution API | `https://ce.judge0.com` | No |
| `JUDGE0_API_KEY` | RapidAPI key if using Judge0 RapidAPI plan | `""` | Optional |
| `GITHUB_TOKEN` | Personal GitHub token for fetching user statistics | `""` | Optional |

### Frontend (`frontend/.env`)

| Variable | Description | Default / Example | Required |
| :--- | :--- | :--- | :---: |
| `VITE_API_BASE_URL` | Base endpoint for the Fastify API backend | `http://localhost:5000/api` | **Yes** |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key for client auth | `AIzaSy...` | Optional |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Web Auth Domain | `project.firebaseapp.com` | Optional |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `project-id` | Optional |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `project.firebasestorage.app` | Optional |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase Messaging Sender ID | `123456789` | Optional |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID | `1:12345:web:abc` | Optional |

---

## 🔑 Database Seeding & Initial Credentials

Executing `npx tsx src/scripts/seedSuperAdmin.ts` sets up the initial root administrator account:

| Field | Default Value | Notes |
| :--- | :--- | :--- |
| **Email** | `superadmin@codecircle.com` | Primary SuperAdmin login |
| **Roll Number** | `SUPERADMIN01` | Alternative login identifier |
| **Password** | `SuperAdmin@2026!` | Override via `SUPERADMIN_DEFAULT_PASSWORD` |
| **Assigned Role** | `SuperAdmin` | Universal system permissions |

> [!TIP]
> After logging in for the first time, navigate to the **Profile** page to update your password and configure your personal profile.

---

## 📡 API Reference

All API routes are prefixed with `/api`. Protected routes require an `Authorization: Bearer <TOKEN>` header.

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new student account.
- `POST /api/auth/login` — Authenticate via email/roll number and password (issues session token).
- `POST /api/auth/firebase-login` — Exchange Firebase Google ID token for Code Circle JWT.
- `POST /api/auth/setup-password` — Complete initial mandatory password change for newly imported users.
- `POST /api/auth/forgot-password` — Generate password reset token.
- `POST /api/auth/reset-password` — Reset account password with token.
- `GET /api/auth/me` — Retrieve current authenticated user profile and active session status.

### 👥 User & Member Management (`/api/users` & `/api/admin`)
- `GET /api/users` — Paginated list of users with search, role, department, and year filters *(Admin/Faculty)*.
- `GET /api/users/:id` — Retrieve specific user details.
- `PUT /api/users/:id` — Update user details or profile fields.
- `PATCH /api/users/:id/block` — Toggle user block status *(Admin/SuperAdmin)*.
- `POST /api/users/bulk-import` — Bulk import students from CSV *(SuperAdmin/Admin)*.
- `GET /api/admin/onboarding-stats` — Get student onboarding and password-reset completion statistics *(Admin)*.
- `POST /api/admin/onboarding-reminder` — Dispatch onboarding notification reminders to pending students.

### 📊 Student 360° Tracking (`/api/admin/tracking`)
- `GET /api/admin/tracking/students` — Paginated student tracking table with domain completion and attendance percentages.
- `GET /api/admin/tracking/students/:userId` — Detailed 360-degree student profile audit and activity timeline.
- `GET /api/admin/tracking/export` — Constant-memory streaming CSV export of all student metrics *(SuperAdmin)*.

### 📚 Domains & Curricula (`/api/domains` & `/api/courses`)
- `GET /api/domains` — Retrieve all available learning domains with progress summaries.
- `GET /api/domains/:id/levels` — Fetch sequenced levels, lessons, and quest information for a domain.
- `POST /api/domains/:id/register` — Enroll the current student in a learning domain.
- `POST /api/domains` — Create a new learning domain *(Admin/Faculty)*.
- `PUT /api/domains/:id` — Update domain metadata *(Admin/Faculty)*.
- `PATCH /api/domains/:id/toggle-lock` — Toggle public access lock *(Admin/Faculty)*.
- `DELETE /api/domains/:id` — Delete a domain and cascade remove levels *(Admin/Faculty)*.

### 🧩 Levels & Quests (`/api/levels`)
- `GET /api/levels/:id` — Get detailed level information, video metadata, and study notes.
- `POST /api/levels/:id/submit-quest` — Submit MCQ quest answers for evaluation (requires $\ge 70\%$ to unlock coding challenge).
- `PUT /api/levels/:id` — Update level content or linked challenge *(Admin/Faculty)*.
- `DELETE /api/levels/:id` — Delete level *(Admin/Faculty)*.

### 💻 Live Coding Assessments & Sandbox (`/api/assessments/code` & `/api/problems`)
- `GET /api/assessments/code/challenges` — List published coding challenges.
- `GET /api/assessments/code/:problemId` — Fetch challenge specification, starter code, and visible test cases.
- `POST /api/assessments/code/execute` — Execute code against public test cases via the RCE engine.
- `POST /api/assessments/code/submit` — Submit final solution for grading against hidden test cases with anti-cheat log recording.

### 📅 Events & Workshops (`/api/events`)
- `GET /api/events` — Retrieve upcoming and past club events, hackathons, and workshops.
- `GET /api/events/:id` — Retrieve event details and agenda.
- `POST /api/events` — Publish a new event *(Admin/Faculty)*.
- `PUT /api/events/:id` — Update event information *(Admin/Faculty)*.
- `DELETE /api/events/:id` — Delete event *(Admin/Faculty)*.

### ⚡ Attendance Engine (`/api/attendance`)
- `POST /api/attendance/sessions` — Generate a new attendance session with time-limited OTP/QR *(Admin/Faculty)*.
- `POST /api/attendance/mark` — High-speed OTP submission queued through `AttendanceBuffer`.
- `POST /api/attendance/manual` — Manually record or adjust student attendance *(Admin/Faculty)*.
- `GET /api/attendance/sessions/active/:eventId` — Retrieve active session and live check-in stats *(Admin/Faculty)*.
- `GET /api/attendance/history` — Retrieve authenticated student's attendance history.

### 🎖️ Student Bearers / Executive Board (`/api/bearers`)
- `GET /api/bearers` — Publicly list current club executive leadership (President, VP, Tech Head, etc.).
- `POST /api/bearers` — Add a new office bearer *(SuperAdmin only)*.
- `PUT /api/bearers/:id` — Update office bearer profile *(SuperAdmin only)*.
- `DELETE /api/bearers/:id` — Remove an office bearer *(SuperAdmin only)*.

### 📢 Announcements & News Feed (`/api/news`)
- `GET /api/news` — Retrieve announcements and updates feed.
- `POST /api/news` — Create news announcement with media attachments *(Admin/Faculty)*.
- `PUT /api/news/:id` — Update announcement *(Admin/Faculty)*.
- `DELETE /api/news/:id` — Delete announcement *(Admin/Faculty)*.

### 💬 Feedback & In-App Notifications
- `POST /api/feedback` — Submit anonymous feedback or suggestions.
- `GET /api/feedback` — View feedback submissions (SuperAdmins see student details; Admins/Faculty see anonymized entries).
- `GET /api/notifications` — Fetch user notifications with unread counts.
- `POST /api/notifications/read-all` — Mark all notifications as read.

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

| Capability / Action | SuperAdmin | Admin | Faculty | Committee | Member | Student |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Browse Curricula & Solve Problems** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Mark Attendance (OTP Check-in)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Student Passport & Profile** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Submit Feedback & View Announcements**| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create/Edit Events & Attendance Sessions**| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Publish News & Club Announcements** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Create/Edit Domains, Levels & Challenges**| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Student 360° Tracking & Analytics**| ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Bulk Import Users via CSV** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Block / Unblock User Accounts** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Export Low-RAM Streaming Student CSV**| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Manage Student Bearers (Executive Board)**| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View Unmasked Student Feedback (Deanonymize)**| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Course Access & Whitelist Governance** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🚢 Production Build & Deployment

### Unified Single-Server Deployment
Fastify is configured to serve the production-built Vite frontend directly from `frontend/dist` with automatic Single Page Application (SPA) routing fallback.

1. **Build Frontend and Backend**:
   ```bash
   npm run build
   ```
   *This installs dependencies and compiles both backend (`tsc` + asset copy) and frontend (`vite build` to `frontend/dist`).*

2. **Start the Production Server**:
   ```bash
   npm run start
   ```
   Fastify will listen on `0.0.0.0:${PORT}` (default `5000`), serving both the API under `/api` and the React frontend on all other routes.

### Decoupled Cloud Deployment
Alternatively, deploy frontend and backend to specialized hosting platforms:
- **Frontend**: Deploy `frontend/` to **Vercel**, **Cloudflare Pages**, or **Netlify**. Set `VITE_API_BASE_URL` to your production backend URL.
- **Backend**: Deploy `backend/` to **Render**, **Railway**, **Fly.io**, or an **AWS EC2 / DigitalOcean Droplet**. Set `NODE_ENV=production`, `PORT=5000`, `CLIENT_URL=https://your-frontend-domain.com`, and attach a managed MongoDB Atlas database.

---

## 🤝 Contributing & License

1. **Fork the Project** on GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit Your Changes**:
   ```bash
   git commit -m "Add AmazingFeature"
   ```
4. **Push to the Branch**:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**.

This project is licensed under the **ISC License**. Built with ❤️ for the student developer community.
