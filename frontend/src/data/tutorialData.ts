export interface TutorialAction {
  title: string;
  description: string;
  badge?: string;
  highlight?: boolean;
}

export interface TutorialData {
  id: string;
  title: string;
  subtitle: string;
  category: 'page' | 'modal';
  icon: string;
  overview: string;
  whatYouCanDo: TutorialAction[];
  studentGuide?: string[];
  adminGuide?: string[];
  proTips?: string[];
}

export const TUTORIALS: Record<string, TutorialData> = {
  // ──────────────── PAGES ────────────────
  dashboard: {
    id: 'dashboard',
    title: 'Dashboard Overview',
    subtitle: 'Your personal command center for streaks, activities, and club events',
    category: 'page',
    icon: 'LayoutDashboard',
    overview:
      'The Dashboard provides an aggregated glance at your learning velocity, daily attendance streaks, active registrations, and leaderboard rank.',
    whatYouCanDo: [
      {
        title: 'Track Streaks & Points',
        description: 'Monitor your active attendance streak and total accumulated points toward club tier status.',
        badge: 'Activity',
        highlight: true,
      },
      {
        title: 'Upcoming Events & Workshops',
        description: 'See next club workshops, register with one click, and view live countdown timers.',
        badge: 'Events',
      },
      {
        title: 'Quick Course Resume',
        description: 'Pick up immediately where you left off in your enrolled courses and level quests.',
        badge: 'Courses',
      },
      {
        title: 'Club Announcements',
        description: 'Read the latest broadcasts and tech spotlights directly from the club leads.',
        badge: 'Updates',
      },
    ],
    studentGuide: [
      'Check your daily streak counter and keep it active by attending events and quizzes.',
      'Click on any upcoming event card to view venue details or online links.',
      'Review your points tier progress (Bronze, Silver, Gold, Platinum, Diamond).',
    ],
    adminGuide: [
      'Review quick stats on active student engagement across the platform.',
      'Use the Broadcast modal from the top navigation to send urgent announcements to all students.',
    ],
    proTips: [
      'Press ⌘K or Ctrl+K anywhere to instantly search across events, courses, and assessments.',
      'Your tier updates in real-time as points are awarded.',
    ],
  },

  courses: {
    id: 'courses',
    title: 'Courses & Skill Trees',
    subtitle: 'Structured multi-level learning tracks with video lectures, quests, and coding assessments',
    category: 'page',
    icon: 'Compass',
    overview:
      'Courses offer progressive domain masteries. Each course contains sequential levels with curated video lectures, downloadable notes, verification quizzes, and practical coding challenges.',
    whatYouCanDo: [
      {
        title: 'Level Progression Flow',
        description: 'Progress through levels sequentially: watch videos, review materials, pass the quest, and solve coding challenges.',
        badge: 'Learning',
        highlight: true,
      },
      {
        title: 'Verification Quests',
        description: 'Take timed concept quizzes at the end of each level to unlock subsequent levels.',
        badge: 'Quests',
      },
      {
        title: '1-Hour Level Coding Assessments',
        description: 'Solve 2 randomly assigned coding challenges within 60 minutes to complete the level.',
        badge: 'Coding',
      },
      {
        title: 'Bulk Excel Upload (Admin)',
        description: 'Upload entire courses and their levels from Excel (.xlsx) with YouTube lecture links and custom points.',
        badge: 'Admin Only',
        highlight: true,
      },
    ],
    studentGuide: [
      'Enroll in any course track to unlock Level 1.',
      'Watch lecture videos and study attached reference guides.',
      'Complete the verification quest with the passing score to unlock the next level or level coding assessment.',
      'Earn completion certificates once all levels are mastered.',
    ],
    adminGuide: [
      'Click "Bulk Upload (Excel)" to import multiple courses and levels from a single multi-sheet workbook.',
      'Inside any course, use "Bulk Upload Levels" to append levels directly to that specific course.',
      'Configure custom point rewards for each level completion.',
      'Manage the level question pool to add or reorder coding challenge questions.',
    ],
    proTips: [
      'Always download the sample Excel template to ensure column headers match perfectly.',
      'YouTube links in Excel are automatically cleaned into embedded players.',
    ],
  },

  assessments: {
    id: 'assessments',
    title: 'Assessments & Quizzes',
    subtitle: 'Competitive and timed MCQ assessments with custom point rewards',
    category: 'page',
    icon: 'Award',
    overview:
      'The Assessments hub hosts standardized timed multiple-choice quizzes across various tech domains. Students earn custom points directly credited to their balance on passing.',
    whatYouCanDo: [
      {
        title: 'Timed MCQ Tests',
        description: 'Test your knowledge under time constraints with automated evaluation and instant score breakdown.',
        badge: 'Quizzes',
        highlight: true,
      },
      {
        title: 'Custom Points Rewards',
        description: 'Each assessment awards points configured by admins (+25, +50, +100 pts) straight to your ledger.',
        badge: 'Points',
      },
      {
        title: 'Excel MCQ Bulk Upload (Admin)',
        description: 'Import dozens of questions and options using standard Excel (.xlsx) templates.',
        badge: 'Admin Only',
      },
      {
        title: 'Submissions & Retry Management (Admin)',
        description: 'Inspect student submissions, allow retries ("Allow Reappear"), or award custom performance points.',
        badge: 'Admin Only',
        highlight: true,
      },
    ],
    studentGuide: [
      'Click "Take Assessment" to begin an attempt.',
      'Once started, keep your window focused—integrity events may track window blur or tab changes.',
      'Upon passing, your custom reward points are automatically credited to your profile.',
    ],
    adminGuide: [
      'Click "+ Create Assessment" to author a quiz with custom points reward and passing threshold.',
      'Use "Bulk Upload (Excel)" to upload multiple questions and options in bulk.',
      'Click the "Submissions" button on any assessment card to view student results, grant retries, or award bonus points.',
    ],
    proTips: [
      'Passing points are awarded only once per student to prevent retry farming.',
      'Admins can manually adjust points from the Submissions roster modal at any time.',
    ],
  },

  coding: {
    id: 'coding',
    title: 'Coding Assessments & Challenges',
    subtitle: 'Algorithmic coding problems with automated evaluation across 5 programming languages',
    category: 'page',
    icon: 'Code2',
    overview:
      'Practice algorithmic problem solving in Python, C, C++, Java, and JavaScript with automated test case evaluation and custom point awards.',
    whatYouCanDo: [
      {
        title: 'Multi-Language IDE Workspace',
        description: 'Code and execute in Python, C++, C, Java, or JavaScript with pre-configured boilerplates.',
        badge: 'IDE',
        highlight: true,
      },
      {
        title: 'Test Cases & Automated Judging',
        description: 'Run code against sample test cases and submit for complete hidden evaluation.',
        badge: 'Judge',
      },
      {
        title: 'Custom Points Rewards',
        description: 'Admins assign custom point rewards (+25, +50, +75, +100 pts) earned upon passing all test cases.',
        badge: 'Points',
      },
      {
        title: 'Excel Bulk Upload (Admin)',
        description: 'Bulk upload coding challenges with starter templates and test cases from Excel.',
        badge: 'Admin Only',
      },
    ],
    studentGuide: [
      'Choose your preferred programming language from the top bar.',
      'Use "Run Code" to test against visible sample test cases with custom stdin.',
      'Click "Submit Code" to run against all hidden test cases and earn points.',
    ],
    adminGuide: [
      'Create challenges with custom point rewards, time limits, and visible/hidden test cases.',
      'Upload questions in bulk from Excel to standalone library or a specific course level pool.',
      'View student code submissions and reset locks if a student needs to reappear.',
    ],
    proTips: [
      'Ensure your solution reads input from standard stdin and prints only the required output.',
      'Language execution runs in a sandboxed, secure container.',
    ],
  },

  contests: {
    id: 'contests',
    title: 'Contests & Hackathons',
    subtitle: 'Live competitive coding arenas with dynamic leaderboards and anti-cheating monitoring',
    category: 'page',
    icon: 'Flame',
    overview:
      'Participate in high-stakes, timed coding contests. Compete in real-time, solve multi-tiered algorithmic challenges, and climb the contest leaderboard.',
    whatYouCanDo: [
      {
        title: 'Live Contest Arena',
        description: 'Access problems, solve within the countdown window, and track problem acceptance.',
        badge: 'Live Arena',
        highlight: true,
      },
      {
        title: 'Real-Time Scoreboard',
        description: 'Rankings calculated by total score and penalty times for incorrect submissions.',
        badge: 'Rankings',
      },
      {
        title: 'Custom Points Allocation (Admin)',
        description: 'Admins allocate points to winners and top finishers based on custom rank brackets.',
        badge: 'Admin Only',
      },
    ],
    studentGuide: [
      'Register for upcoming contests before the scheduled start time.',
      'Enter the Arena once the contest is live.',
      'Avoid switching tabs or losing window focus to prevent integrity penalty flags.',
    ],
    adminGuide: [
      'Create contests, set start and end dates, and select curated coding problems.',
      'Monitor live submissions and anti-cheating audit trail logs in real-time.',
      'Use "Allocate Points" to distribute rank-based bonus points to participants.',
    ],
    proTips: [
      'Earlier submissions with fewer test-case failures rank higher in tie-breakers.',
    ],
  },

  events: {
    id: 'events',
    title: 'Events & Workshops',
    subtitle: 'Club meetups, hands-on bootcamps, tech talks, and guest lectures',
    category: 'page',
    icon: 'Calendar',
    overview:
      'Browse all upcoming and past club events. Register in advance, download digital tickets to your Passport, and get attendance points.',
    whatYouCanDo: [
      {
        title: 'Event Registration',
        description: 'RSVP for online webinars and offline campus sessions with a single tap.',
        badge: 'RSVP',
        highlight: true,
      },
      {
        title: 'Digital Event Pass',
        description: 'Registered events appear automatically in your Student Passport.',
        badge: 'Passport',
      },
      {
        title: 'Attendance Points',
        description: 'Attend sessions to receive verified hourly club points towards your tier.',
        badge: 'Points',
      },
    ],
    studentGuide: [
      'Browse upcoming events and click "Register".',
      'For offline events, present your registration or scan the session QR code on site.',
    ],
    adminGuide: [
      'Click "+ Create Event" to schedule new workshops, specify venue/link, and set hourly point weights.',
      'Manage participant lists and launch attendance sessions for the event.',
    ],
    proTips: [
      'Filter events by format (Online / Offline / Hybrid) or category (Workshop / Contest / Meetup).',
    ],
  },

  attendance: {
    id: 'attendance',
    title: 'Attendance & QR Check-In',
    subtitle: 'Fast QR check-ins for events, lectures, and club sessions',
    category: 'page',
    icon: 'CalendarCheck',
    overview:
      'Verify presence during club meetings and training sessions. Students scan rotating dynamic QR codes to earn attendance hours and points.',
    whatYouCanDo: [
      {
        title: 'Dynamic QR Scanning',
        description: 'Scan live session QR codes using your phone or device camera.',
        badge: 'Check-In',
        highlight: true,
      },
      {
        title: 'Hourly Points Crediting',
        description: 'Earn points calculated by the number of session class hours.',
        badge: 'Ledger',
      },
      {
        title: 'Session Management (Admin)',
        description: 'Generate dynamic OTPs / QR codes, toggle check-in windows, and export rosters.',
        badge: 'Admin Only',
      },
    ],
    studentGuide: [
      'Open the QR scanner when the session host displays the QR code.',
      'Check-in is verified instantly and logged in your attendance ledger.',
    ],
    adminGuide: [
      'Select an event to launch a dynamic QR attendance session.',
      'Control OTP rotation frequency to prevent link sharing.',
      'Manually toggle attendance for individual students if needed.',
    ],
    proTips: [
      'Attendance points count towards both your club tier and certificate eligibility.',
    ],
  },

  certificates: {
    id: 'certificates',
    title: 'Certificates & Credentials',
    subtitle: 'Cryptographically verifiable PDF credentials and achievement badges',
    category: 'page',
    icon: 'Medal',
    overview:
      'View and download your earned certificates for courses, contests, and event completions. Every certificate has a permanent public verification URL.',
    whatYouCanDo: [
      {
        title: 'Instant PDF Download',
        description: 'Download high-resolution, print-ready PDF certificates with unique certificate IDs.',
        badge: 'PDF',
        highlight: true,
      },
      {
        title: 'Public Verification Link',
        description: 'Share verification links directly to LinkedIn, portfolios, or resumes.',
        badge: 'Verify',
      },
      {
        title: 'Issue Certificates (Admin)',
        description: 'Generate manual certificates for special recognitions and contest winners.',
        badge: 'Admin Only',
      },
    ],
    studentGuide: [
      'Complete all course levels or contest requirements to automatically receive your credential.',
      'Click "Download PDF" to save a copy or "Copy Link" to share on your resume.',
    ],
    adminGuide: [
      'Use "Issue Certificate" to grant custom credentials to specific students.',
      'Inspect the issuance registry and verify credentials by certificate code.',
    ],
    proTips: [
      'Employers can scan the QR code on the certificate PDF to verify authenticity without logging in.',
    ],
  },

  leaderboard: {
    id: 'leaderboard',
    title: 'Club Leaderboard & Tiers',
    subtitle: 'Global, department, and graduation year rankings',
    category: 'page',
    icon: 'Trophy',
    overview:
      'Explore who is leading the club in points, course completions, and contest wins. Tiers range from Bronze (starting) to Diamond (master).',
    whatYouCanDo: [
      {
        title: 'Global Rankings',
        description: 'See the top students across all departments and academic years.',
        badge: 'Top 100',
        highlight: true,
      },
      {
        title: 'Department & Year Filters',
        description: 'Narrow down rankings by department (CSE, IT, ECE) or graduation year.',
        badge: 'Filters',
      },
      {
        title: 'Tier Progress',
        description: 'Track how many points are needed to rank up to Silver, Gold, Platinum, or Diamond.',
        badge: 'Tiers',
      },
    ],
    studentGuide: [
      'Earn points through assessments, courses, attendance, and contests to climb higher.',
      'Check your rank relative to peers in your department.',
    ],
    adminGuide: [
      'Review top performing students for leadership appointments and bearer selections.',
    ],
    proTips: [
      'Diamond tier requires 2,500+ points and unlocks elite badge styling.',
    ],
  },

  points: {
    id: 'points',
    title: 'Points Ledger & Audits',
    subtitle: 'Transparent, immutable ledger of all earned club points',
    category: 'page',
    icon: 'Sparkles',
    overview:
      'Detailed ledger showing every transaction where points were credited or adjusted across attendance, quizzes, courses, coding challenges, and bonus awards.',
    whatYouCanDo: [
      {
        title: 'Transaction History',
        description: 'Filter transactions by category: Attendance, Course, Assessment, Coding, Contest, or Bonus.',
        badge: 'Ledger',
        highlight: true,
      },
      {
        title: 'Award Custom Points (Admin)',
        description: 'Admins can award custom merit points directly to any student with reason and note.',
        badge: 'Admin Only',
        highlight: true,
      },
      {
        title: 'Student Audit (Admin)',
        description: 'Inspect full 360° point audits for any student to see how and when they earned every point.',
        badge: 'Admin Only',
      },
    ],
    studentGuide: [
      'Verify that all attended sessions, passed assessments, and completed courses are properly credited.',
      'Each entry displays timestamp, category, and exact points earned.',
    ],
    adminGuide: [
      'Click "Award Points" to grant merit points for hackathons, club contributions, or special projects.',
      'Select any student in the audit list to see their comprehensive breakdown.',
    ],
    proTips: [
      'Every point modification creates an immutable audit trail entry with the admin issuer name.',
    ],
  },

  passport: {
    id: 'passport',
    title: 'Student Passport',
    subtitle: 'Your verified club identity, event tickets, and enrolled courses',
    category: 'page',
    icon: 'Ticket',
    overview:
      'The Student Passport is your personal portfolio passport showing your registered events, active course enrollments, badges, and verification status.',
    whatYouCanDo: [
      {
        title: 'Active Event Passes',
        description: 'View tickets for upcoming registered events with quick access to venue and time.',
        badge: 'Tickets',
      },
      {
        title: 'Course Progression Card',
        description: 'See percentage completion and active level for every enrolled course track.',
        badge: 'Courses',
      },
    ],
    studentGuide: [
      'Keep your passport handy when attending offline campus workshops.',
      'Check course completion milestones.',
    ],
    proTips: [
      'Your passport QR code can be scanned at event venues for rapid check-in.',
    ],
  },

  feedback: {
    id: 'feedback',
    title: 'Feedback Hub',
    subtitle: 'Share your thoughts, suggestions, and session ratings',
    category: 'page',
    icon: 'MessageSquare',
    overview:
      'A two-way communication channel between students and club leadership. Rate completed sessions and submit suggestions anonymously.',
    whatYouCanDo: [
      {
        title: 'Submit Feedback',
        description: 'Rate recent events and share suggestions for topics, workshops, or club improvements.',
        badge: 'Student',
      },
      {
        title: 'Feedback Analytics (Admin)',
        description: 'Review satisfaction scores, sentiment metrics, and feedback trends.',
        badge: 'Admin Only',
      },
    ],
    studentGuide: [
      'Submit ratings after attending workshops to help organizers improve future sessions.',
      'Feedback is anonymized to ensure candid and constructive inputs.',
    ],
    adminGuide: [
      'Inspect feedback ratings per event to identify best-rated speakers and topics.',
    ],
    proTips: [
      'Students with constructive feedback can receive bonus merit points from admins.',
    ],
  },

  news: {
    id: 'news',
    title: 'News & Announcements',
    subtitle: 'Official club updates, hackathon announcements, and tech blogs',
    category: 'page',
    icon: 'Newspaper',
    overview:
      'Stay updated with club newsletters, upcoming hackathons, partner opportunities, and student spotlights.',
    whatYouCanDo: [
      {
        title: 'Read Broadcasts',
        description: 'Browse categorized updates with rich formatting, external links, and images.',
        badge: 'News',
      },
      {
        title: 'Publish Articles (Admin)',
        description: 'Create and broadcast new announcements to all club members.',
        badge: 'Admin Only',
      },
    ],
    studentGuide: ['Check regularly for internship postings and hackathon team formation notices.'],
    adminGuide: ['Publish news items with priority banners to reach all students immediately.'],
    proTips: ['Pinned announcements remain at the top of the feed until unpinned.'],
  },

  tracking: {
    id: 'tracking',
    title: 'Student Tracking System (STS)',
    subtitle: 'Comprehensive 360° analytics on student activity and learning progress',
    category: 'page',
    icon: 'UserCheck',
    overview:
      'Advanced administrative analytics dashboard. Monitor individual student progress across courses, quiz pass rates, coding submissions, and attendance ratios.',
    whatYouCanDo: [
      {
        title: 'Individual Student Dossier',
        description: 'Inspect full profile, course levels completed, quiz scores, and attendance rates.',
        badge: 'Admin Only',
        highlight: true,
      },
      {
        title: 'CSV Data Export',
        description: 'Export student roster and performance data for academic audits and reporting.',
        badge: 'Export',
      },
      {
        title: 'Engagement Filters',
        description: 'Filter by department, academic year, minimum points, or inactivity status.',
        badge: 'Filters',
      },
    ],
    adminGuide: [
      'Search for any student by Roll Number or Name to view their real-time progression.',
      'Identify at-risk or inactive students who may need follow-up mentoring.',
      'Export complete CSV reports with one click.',
    ],
    proTips: [
      'Use the department filter to generate branch-specific attendance reports.',
    ],
  },

  analytics: {
    id: 'analytics',
    title: 'Platform Analytics',
    subtitle: 'Club KPIs, platform growth metrics, and engagement graphs',
    category: 'page',
    icon: 'BarChart3',
    overview:
      'High-level overview of platform health, total code executions, quiz attempts, event attendance, and user growth over time.',
    whatYouCanDo: [
      {
        title: 'Growth & Active Users',
        description: 'Visualize daily and weekly active student trends.',
        badge: 'KPIs',
      },
      {
        title: 'Course Completion Funnel',
        description: 'See which course levels have high completion rates and where students drop off.',
        badge: 'Funnel',
      },
    ],
    adminGuide: [
      'Evaluate course drop-off rates to adjust question difficulty or add more study notes.',
    ],
    proTips: [
      'Charts update automatically as sessions and submissions occur.',
    ],
  },

  users: {
    id: 'users',
    title: 'User Management & Roles',
    subtitle: 'Manage club members, accounts, and permission clearances',
    category: 'page',
    icon: 'Shield',
    overview:
      'Administrative directory to manage registered users, update roles (Admin, Faculty, Committee, Student), and reset passwords.',
    whatYouCanDo: [
      {
        title: 'Role Management',
        description: 'Assign or revoke Admin, Faculty, or Committee clearances.',
        badge: 'Security',
        highlight: true,
      },
      {
        title: 'Account Status & Password Reset',
        description: 'Trigger password resets or force password update upon next login.',
        badge: 'Accounts',
      },
    ],
    adminGuide: [
      'SuperAdmin accounts can promote students to Committee or Faculty roles.',
      'Never share admin credentials; invite each coordinator with their individual account.',
    ],
    proTips: [
      'Role changes take effect on the user’s next authenticated request.',
    ],
  },

  // ──────────────── MODALS ────────────────
  'course-bulk-upload': {
    id: 'course-bulk-upload',
    title: 'Course & Level Bulk Upload Tutorial',
    subtitle: 'How to structure and upload courses and levels from Microsoft Excel',
    category: 'modal',
    icon: 'FileSpreadsheet',
    overview:
      'Import entire courses or multi-level tracks from Excel (.xlsx/.xls). Supports video lecture URLs, study materials, verification quest questions, and custom completion points.',
    whatYouCanDo: [
      {
        title: 'Multi-Sheet Workbook Structure',
        description: 'Sheet 1: Courses (DomainTitle, CourseTitle, Description, Category, Difficulty). Sheet 2: Levels (CourseTitleOrCode, LevelNumber, Title, PointsReward, Lectures, Materials, QuestQuestions).',
        badge: 'Structure',
        highlight: true,
      },
      {
        title: 'Destination Selector',
        description: 'Choose "Create New Courses & Levels" for full import, or "Add Levels to Existing Course" to append to a single course.',
        badge: 'Modes',
      },
      {
        title: 'Custom Completion Points',
        description: 'Specify custom completion points per level in the PointsReward column (e.g. 50, 100, 150 pts).',
        badge: 'Points',
      },
      {
        title: 'Video Lecture & Study Material Syntax',
        description: 'Lectures: YouTube link or title|url. Materials: Pipe-separated "Notes|https://... || Slides|https://...".',
        badge: 'Syntax',
      },
    ],
    adminGuide: [
      'Always click "Download Sample Template (.xlsx)" first to examine the sample data.',
      'Ensure the CourseTitleOrCode in the Levels sheet matches CourseTitle in the Courses sheet exactly.',
      'Verification quest questions syntax: "Question text?|Opt A|Opt B|Opt C|Opt D|0" (0 is the 0-indexed correct option).',
    ],
    proTips: [
      'If you only have a single sheet with level data, use the "Add Levels to Existing Course" mode and select your course.',
    ],
  },

  'mcq-bulk-upload': {
    id: 'mcq-bulk-upload',
    title: 'MCQ Assessment Bulk Upload Tutorial',
    subtitle: 'Upload dozens of multiple choice assessment questions in seconds',
    category: 'modal',
    icon: 'FileSpreadsheet',
    overview:
      'Bulk import MCQ assessments from an Excel (.xlsx) file. Automatically configures questions, 4 options, correct answer keys, explanations, and custom points.',
    whatYouCanDo: [
      {
        title: 'Standard Excel Format',
        description: 'Columns: Title, Category, Difficulty, TimeLimitMinutes, PassingScore, CustomPoints, QuestionText, OptionA, OptionB, OptionC, OptionD, CorrectOption, Explanation.',
        badge: 'Format',
        highlight: true,
      },
      {
        title: 'Custom Points Column',
        description: 'Define custom points (e.g. 50, 100) awarded to students when passing the assessment.',
        badge: 'Points',
      },
      {
        title: 'Correct Option Syntax',
        description: 'Accepts A/B/C/D, 0/1/2/3, or 1/2/3/4.',
        badge: 'Key',
      },
    ],
    adminGuide: [
      'Download the sample template, populate your questions, and upload.',
      'Rows with the same Assessment Title will be grouped into a single multi-question quiz.',
    ],
    proTips: [
      'Keep question text clear and add helpful explanations for students after submission.',
    ],
  },

  'coding-bulk-upload': {
    id: 'coding-bulk-upload',
    title: 'Coding Questions Bulk Upload Tutorial',
    subtitle: 'Upload algorithmic challenges, starter codes, and test cases from Excel',
    category: 'modal',
    icon: 'FileSpreadsheet',
    overview:
      'Import complex coding challenges with boilerplate templates and hidden test cases into your challenge library or a course level question pool.',
    whatYouCanDo: [
      {
        title: 'Starter Code Templates',
        description: 'Columns: StarterCode_Python, StarterCode_Cpp, StarterCode_Java, StarterCode_JavaScript, StarterCode_C.',
        badge: 'Boilerplates',
        highlight: true,
      },
      {
        title: 'Test Cases & Hidden Flags',
        description: 'Define TestCase1_Input, TestCase1_ExpectedOutput, TestCase1_IsHidden (TRUE/FALSE) up to 20 test cases.',
        badge: 'Test Cases',
      },
      {
        title: 'Custom Points Reward',
        description: 'Set custom points in the CustomPoints column (default: 50 pts).',
        badge: 'Points',
      },
    ],
    adminGuide: [
      'Select "Add to a Course Level Pool" to make these challenges part of a 1-hour level assessment.',
      'Include at least 2 visible test cases and 2 hidden test cases for robust grading.',
    ],
    proTips: [
      'Use \\n in test case strings to denote newlines.',
    ],
  },

  'assessment-editor': {
    id: 'assessment-editor',
    title: 'Assessment Editor Tutorial',
    subtitle: 'Authoring quizzes, setting timers, and configuring custom reward points',
    category: 'modal',
    icon: 'Edit3',
    overview:
      'Create or modify MCQ assessments. Set duration, passing percentage, questions, and custom points awarded to students upon passing.',
    whatYouCanDo: [
      {
        title: 'Custom Points Reward',
        description: 'Use the preset pills (+25, +50, +75, +100, +150) or type custom points credited to passing students.',
        badge: 'Points',
        highlight: true,
      },
      {
        title: 'Passing Score & Time Limit',
        description: 'Specify the required passing percentage (e.g. 70%) and timer in minutes.',
        badge: 'Settings',
      },
      {
        title: 'Option Keys & Explanations',
        description: 'Add 2 to 6 options per question and select the green radio button for the correct answer.',
        badge: 'Questions',
      },
    ],
    adminGuide: [
      'Students only receive the custom completion points once upon their first passing attempt.',
      'You can reorder questions and edit options at any time.',
    ],
    proTips: [
      'Higher difficulty assessments should award more custom points (e.g. 100-150 pts).',
    ],
  },

  'coding-challenge-editor': {
    id: 'coding-challenge-editor',
    title: 'Coding Challenge Editor Tutorial',
    subtitle: 'Creating algorithmic problems, starter code, and test cases',
    category: 'modal',
    icon: 'Code2',
    overview:
      'Author competitive coding challenges. Configure problem description, constraints, supported languages, custom reward points, and automated judging test cases.',
    whatYouCanDo: [
      {
        title: 'Custom Points Award',
        description: 'Select preset points (+25, +50, +75, +100, +150) or specify custom points awarded for full test pass.',
        badge: 'Points',
        highlight: true,
      },
      {
        title: 'Language Configuration',
        description: 'Enable or disable specific languages (Python, C++, Java, JS, C).',
        badge: 'Languages',
      },
      {
        title: 'Visible vs Hidden Test Cases',
        description: 'Visible test cases run during user testing; hidden test cases evaluate final submissions.',
        badge: 'Judge',
        highlight: true,
      },
    ],
    adminGuide: [
      'Provide clean starter templates with standard I/O already imported.',
      'Ensure test case expected outputs contain no trailing unwanted spaces.',
    ],
    proTips: [
      'Locking submission prevents resubmissions after an assessment attempt.',
    ],
  },

  'assessment-submissions': {
    id: 'assessment-submissions',
    title: 'Submissions Roster & Points Tutorial',
    subtitle: 'Managing attempts, granting reappears, and awarding custom bonus points',
    category: 'modal',
    icon: 'Users',
    overview:
      'Manage student attempts for this assessment. Review scores, allow students to retake the quiz, delete obsolete attempts, or award custom bonus points.',
    whatYouCanDo: [
      {
        title: 'Award Custom Points',
        description: 'Click "Award Points" on any student row to give custom bonus points with a reason and ledger note.',
        badge: 'Points',
        highlight: true,
      },
      {
        title: 'Allow Reappear',
        description: 'Reset attempt locks so a student who experienced connectivity issues can retake cleanly.',
        badge: 'Retry',
      },
      {
        title: 'Delete Retry Submission',
        description: 'Permanently remove an unwanted or invalid submission record.',
        badge: 'Clean Up',
      },
    ],
    adminGuide: [
      'Use the search bar to locate students by name, roll number, or department.',
      'Custom points awarded here appear immediately in the student’s ledger and total points.',
    ],
    proTips: [
      'Granting "Allow Reappear" resets locks without wiping previous point transactions.',
    ],
  },
};

/**
 * Resolves a tutorial by pathname or fallback ID
 */
export const getTutorialForPath = (pathname: string): TutorialData => {
  const clean = pathname.toLowerCase().replace(/^\//, '').split('/')[0];
  if (clean && TUTORIALS[clean]) {
    return TUTORIALS[clean];
  }
  // Secondary mappings
  if (clean === 'problem' || clean === 'code') return TUTORIALS['coding'];
  if (clean === 'domain' || clean === 'course') return TUTORIALS['courses'];
  if (clean === 'quiz' || clean === 'assessment') return TUTORIALS['assessments'];
  if (clean === 'contest') return TUTORIALS['contests'];
  if (clean === 'event') return TUTORIALS['events'];
  if (clean === 'certificate') return TUTORIALS['certificates'];

  return TUTORIALS['dashboard'];
};
