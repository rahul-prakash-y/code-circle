import { ISeedTrackData } from './types';

export const track9Cyber: ISeedTrackData = {
  name: 'Cybersecurity & Ethical Hacking: Defensive Systems & Auditing',
  description:
    'Hands-on security engineering, network packet inspection, Linux host hardening, OWASP Top 10 mitigation, and authorized CTF assessments.',
  coverImageUrl:
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
  isLocked: false,
  levels: [
    {
      levelNumber: 1,
      title: 'Level 1: Cybersecurity Foundations & Isolated Lab Setup',
      youtubeVideoId: 'inWWhr5tnEA',
      studyMaterials: [
        {
          title: 'The CIA Triad & Threat Modeling',
          type: 'notes',
          content: `# Cybersecurity Foundations\n\n- CIA Triad: Confidentiality, Integrity, Availability\n- Risk Equation: Risk = Threat x Vulnerability x Impact\n- Legal and Ethical boundaries: Testing only authorized systems.`,
        },
      ],
      questQuestions: [
        {
          question: 'Which principle of the CIA Triad ensures that sensitive data is protected against unauthorized modification?',
          options: ['Integrity', 'Confidentiality', 'Availability', 'Non-repudiation'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 1: Password Entropy & Complexity Validator',
        description: 'Read a password string. Output "SECURE" if length >= 12 and contains digit and special character (#, $, @), else "WEAK".',
        inputFormat: 'Single string password',
        outputFormat: 'SECURE or WEAK',
        constraints: '1 <= length <= 100',
        sampleInput: 'CodeCircle@2026',
        sampleOutput: 'SECURE',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    pwd = sys.stdin.read().strip()\n    has_digit = any(c.isdigit() for c in pwd)\n    has_spec = any(c in '#$@' for c in pwd)\n    if len(pwd) >= 12 and has_digit and has_spec:\n        print('SECURE')\n    else:\n        print('WEAK')\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: 'CodeCircle@2026', expectedOutput: 'SECURE', isHidden: false },
          { input: 'short123', expectedOutput: 'WEAK', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the Principle of Least Privilege in security architecture?',
          options: ['Users and services are granted only the minimum permissions necessary to complete their required tasks', 'Allow all by default', 'Zero authentication', 'Shared root passwords'],
          correctOptionIndex: 0,
          explanation: 'Least privilege minimizes damage from compromises by limiting user/process permissions to essential functions.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 2,
      title: 'Level 2: Networking Protocols & Packet Inspection',
      youtubeVideoId: 'lb1Dw0elw0Q',
      studyMaterials: [
        {
          title: 'TCP 3-Way Handshake & Wireshark Labs',
          type: 'notes',
          content: `# Computer Networking for Security\n\n- OSI 7-Layer Model vs TCP/IP Stack\n- TCP 3-Way Handshake: SYN -> SYN-ACK -> ACK\n- Packet inspection with Wireshark in authorized local networks.`,
        },
      ],
      questQuestions: [
        {
          question: 'What packet flags complete the normal TCP 3-way handshake sequence?',
          options: ['SYN, SYN-ACK, ACK', 'SYN, ACK, FIN', 'RST, SYN, ACK', 'SYN, PSH, ACK'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 2: Standard Network Port Service Mapper',
        description: 'Read a port number integer. Output "HTTP" (80), "HTTPS" (443), "SSH" (22), "DNS" (53), or "UNKNOWN".',
        inputFormat: 'Integer port',
        outputFormat: 'Service name',
        constraints: '1 <= port <= 65535',
        sampleInput: '443',
        sampleOutput: 'HTTPS',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        p = int(lines[0])\n        mapping = {80: 'HTTP', 443: 'HTTPS', 22: 'SSH', 53: 'DNS'}\n        print(mapping.get(p, 'UNKNOWN'))\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '443', expectedOutput: 'HTTPS', isHidden: false },
          { input: '22', expectedOutput: 'SSH', isHidden: false },
          { input: '8080', expectedOutput: 'UNKNOWN', isHidden: true },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What security vulnerability is inherently present in unencrypted HTTP and Telnet protocols?',
          options: ['Credentials and payload data are transmitted in cleartext and susceptible to network eavesdropping', 'High latency', 'No DNS support', 'Buffer overflow'],
          correctOptionIndex: 0,
          explanation: 'Cleartext protocols allow attackers on the same network path to sniff passwords and sensitive tokens.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 3,
      title: 'Level 3: Linux System Administration & Host Hardening',
      youtubeVideoId: 'lZAoFs75_CS',
      studyMaterials: [
        {
          title: 'Linux Permissions & CIS Hardening',
          type: 'notes',
          content: `# Linux Host Hardening\n\n- File permissions (rwx: 4, 2, 1) and SUID/SGID bits\n- Disabling root SSH login (PermitRootLogin no in /etc/ssh/sshd_config)\n- Auditing listening ports with ss -tulpn.`,
        },
      ],
      questQuestions: [
        {
          question: 'What does a file permission of octal 750 represent?',
          options: ['Owner: rwx, Group: r-x, Others: ---', 'Owner: r-x, Group: rwx', 'Everyone rwx', 'Owner only'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 3: Octal Permission Security Auditor',
        description: 'Read a 3-digit octal permission (e.g. 777). If "Others" has write permission (last digit in [2,3,6,7]), output "INSECURE_WORLD_WRITABLE", else "SAFE".',
        inputFormat: '3-digit integer',
        outputFormat: 'INSECURE_WORLD_WRITABLE or SAFE',
        constraints: '3-digit octal number',
        sampleInput: '777',
        sampleOutput: 'INSECURE_WORLD_WRITABLE',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        octal = lines[0]\n        other = int(octal[-1])\n        if other in [2, 3, 6, 7]: print('INSECURE_WORLD_WRITABLE')\n        else: print('SAFE')\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '777', expectedOutput: 'INSECURE_WORLD_WRITABLE', isHidden: false },
          { input: '755', expectedOutput: 'SAFE', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the risk of an unmonitored binary with the SUID bit set in Linux?',
          options: ['Any user executing the binary runs with the effective privileges of the binary owner (often root)', 'Deletes system logs', 'Disables firewalls', 'Slows down CPU'],
          correctOptionIndex: 0,
          explanation: 'SUID binaries execute with the owner permissions, which can lead to privilege escalation if flawed.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 4,
      title: 'Level 4: Web Security Foundations & OWASP Principles',
      youtubeVideoId: '2_lswM1S264',
      studyMaterials: [
        {
          title: 'HTTP Security Headers & OWASP Top 10',
          type: 'notes',
          content: `# Web Security Foundations\n\n- Essential headers: Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options\n- Cookie security attributes: HttpOnly, Secure, SameSite=Strict\n- Local practice using OWASP Juice Shop.`,
        },
      ],
      questQuestions: [
        {
          question: 'Which cookie attribute prevents client-side scripts from reading session cookies?',
          options: ['HttpOnly', 'Secure', 'SameSite', 'Path'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 4: Cookie Security Flag Inspector',
        description: 'Read a cookie string. Output "SECURE" if it contains both "HttpOnly" and "Secure", else "VULNERABLE".',
        inputFormat: 'Cookie header string',
        outputFormat: 'SECURE or VULNERABLE',
        constraints: 'Valid header format',
        sampleInput: 'session=abc; HttpOnly; Secure; SameSite=Strict',
        sampleOutput: 'SECURE',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    cookie = sys.stdin.read().strip()\n    if 'HttpOnly' in cookie and 'Secure' in cookie:\n        print('SECURE')\n    else:\n        print('VULNERABLE')\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: 'session=abc; HttpOnly; Secure; SameSite=Strict', expectedOutput: 'SECURE', isHidden: false },
          { input: 'session=abc; SameSite=Lax', expectedOutput: 'VULNERABLE', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What attack is mitigated by setting the X-Frame-Options: DENY header?',
          options: ['Clickjacking (preventing malicious sites from embedding pages in iframes)', 'SQL Injection', 'Cross-Site Scripting', 'DDoS'],
          correctOptionIndex: 0,
          explanation: 'X-Frame-Options prevents attackers from rendering pages in transparent iframes to hijack user clicks.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 5,
      title: 'Level 5: Web Application Vulnerabilities & Remediation',
      youtubeVideoId: 'ciNHn38EyRc',
      studyMaterials: [
        {
          title: 'SQL Injection & XSS Remediation',
          type: 'notes',
          content: `# Web Vulnerabilities & Secure Code\n\n- SQL Injection: Parameterized prepared statements completely separate code from data\n- Cross-Site Scripting (XSS): Context-aware HTML entity encoding\n- Cross-Site Request Forgery (CSRF): Anti-CSRF synchronization tokens.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the definitive defense against SQL Injection vulnerabilities?',
          options: ['Parameterized queries (Prepared Statements)', 'Blacklisting quotes', 'Client-side input regex', 'Disabling JavaScript'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 5: HTML Context-Aware XSS Sanitizer',
        description: 'Read an input string. Encode dangerous characters (& -> &amp;, < -> &lt;, > -> &gt;, " -> &quot;) and print sanitized text.',
        inputFormat: 'Input string',
        outputFormat: 'Sanitized string',
        constraints: '1 <= length <= 200',
        sampleInput: '<script>alert("hack")</script>',
        sampleOutput: '&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    s = sys.stdin.read().strip()\n    res = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')\n    print(res)\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '<script>alert("hack")</script>', expectedOutput: '&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is an Insecure Direct Object Reference (IDOR)?',
          options: ['When an application exposes references to internal objects without validating that the user is authorized to access them', 'A null pointer error', 'A memory leak', 'An unencrypted connection'],
          correctOptionIndex: 0,
          explanation: 'IDOR happens when user input is used directly to retrieve database records without access-control ownership checks.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 6,
      title: 'Level 6: Security Testing & Vulnerability Assessment',
      youtubeVideoId: '4t4kBkMsDbQ',
      studyMaterials: [
        {
          title: 'Authorized Port Scanning & CVSS Scoring',
          type: 'notes',
          content: `# Vulnerability Assessment\n\n- Nmap scanning techniques in authorized labs: SYN stealth (-sS), Version detection (-sV)\n- CVSS v3.1 calculation: Base, Temporal, and Environmental metrics\n- Structured vulnerability reporting.`,
        },
      ],
      questQuestions: [
        {
          question: 'What CVSS v3.1 score range qualifies a vulnerability as "CRITICAL"?',
          options: ['9.0 - 10.0', '7.0 - 8.9', '4.0 - 6.9', '0.1 - 3.9'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 6: CVSS v3.1 Severity Rating Categorizer',
        description: 'Read a floating-point score (0.0 to 10.0). Output "NONE" (0.0), "LOW" (0.1-3.9), "MEDIUM" (4.0-6.9), "HIGH" (7.0-8.9), or "CRITICAL" (9.0-10.0).',
        inputFormat: 'Float score',
        outputFormat: 'Severity level',
        constraints: '0.0 <= score <= 10.0',
        sampleInput: '9.8',
        sampleOutput: 'CRITICAL',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        s = float(lines[0])\n        if s == 0.0: print('NONE')\n        elif s <= 3.9: print('LOW')\n        elif s <= 6.9: print('MEDIUM')\n        elif s <= 8.9: print('HIGH')\n        else: print('CRITICAL')\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '9.8', expectedOutput: 'CRITICAL', isHidden: false },
          { input: '5.4', expectedOutput: 'MEDIUM', isHidden: false },
          { input: '7.5', expectedOutput: 'HIGH', isHidden: true },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'Why is an active port scan considered a form of active reconnaissance rather than passive reconnaissance?',
          options: ['Active scans send packets directly to the target system and can be logged by firewalls and IDSs', 'It uses Google search', 'It looks up WHOIS records', 'It downloads source code'],
          correctOptionIndex: 0,
          explanation: 'Active reconnaissance interacts directly with the target host, leaving detectable traces in network logs.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 7,
      title: 'Level 7: Defensive Security, SIEM & Incident Response',
      youtubeVideoId: 'qL52vA8Xq0g',
      studyMaterials: [
        {
          title: 'SIEM Log Analysis & Incident Handling',
          type: 'notes',
          content: `# Defensive Security\n\n- Security Information and Event Management (SIEM): Centralized log ingestion and correlation\n- NIST SP 800-61 6-phase incident response lifecycle\n- Intrusion Detection Systems (Snort / Suricata signature rules).`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the second phase of the NIST Incident Response lifecycle following Preparation?',
          options: ['Detection and Analysis', 'Containment', 'Eradication', 'Post-Incident Recovery'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 7: Web Access Log Failed Login Anomaly Detector',
        description: 'Read N HTTP response codes from a login endpoint. If count of 401 Unauthorized >= 5, output "ALERT_BRUTE_FORCE", else "NORMAL".',
        inputFormat: 'Line 1: N\\nLine 2: N status codes',
        outputFormat: 'ALERT_BRUTE_FORCE or NORMAL',
        constraints: '1 <= N <= 1000',
        sampleInput: '6\n401 401 401 401 401 200',
        sampleOutput: 'ALERT_BRUTE_FORCE',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        n = int(lines[0])\n        codes = [int(x) for x in lines[1:1+n]]\n        unauth = sum(1 for c in codes if c == 401)\n        print('ALERT_BRUTE_FORCE' if unauth >= 5 else 'NORMAL')\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '6\n401 401 401 401 401 200', expectedOutput: 'ALERT_BRUTE_FORCE', isHidden: false },
          { input: '4\n401 401 200 200', expectedOutput: 'NORMAL', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is an Indicator of Compromise (IoC)?',
          options: ['Forensic artifact (e.g. hash, IP address, registry key) indicating a system was compromised', 'A software patch', 'A user manual', 'An encryption key'],
          correctOptionIndex: 0,
          explanation: 'IoCs are evidence on systems or networks indicating that an intrusion or malware infection occurred.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 8,
      title: 'Level 8: Penetration Testing Methodologies & CTF Labs',
      youtubeVideoId: '3Kq1MIfTWCE',
      studyMaterials: [
        {
          title: 'PTES Framework & Responsible Disclosure',
          type: 'notes',
          content: `# Penetration Testing Methodology\n\n- PTES Phases: Pre-engagement, Intelligence, Threat Modeling, Vuln Analysis, Exploitation, Post-Exploitation, Reporting\n- Rules of Engagement (RoE) definition\n- Capture The Flag (CTF) environments for safe practice.`,
        },
      ],
      questQuestions: [
        {
          question: 'What legal document authorizes penetration testers to evaluate a network within specific boundaries?',
          options: ['Rules of Engagement (RoE) / Authorization Letter', 'Driver license', 'Github commit', 'Software license'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 8: CTF Flag SHA-256 Verifier Simulation',
        description: 'Read an input string. Output "CORRECT_FLAG" if string matches "FLAG{code_circle_security_2026}", else "INCORRECT".',
        inputFormat: 'Flag string',
        outputFormat: 'CORRECT_FLAG or INCORRECT',
        constraints: 'Non-empty string',
        sampleInput: 'FLAG{code_circle_security_2026}',
        sampleOutput: 'CORRECT_FLAG',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    flag = sys.stdin.read().strip()\n    if flag == 'FLAG{code_circle_security_2026}': print('CORRECT_FLAG')\n    else: print('INCORRECT')\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: 'FLAG{code_circle_security_2026}', expectedOutput: 'CORRECT_FLAG', isHidden: false },
          { input: 'FLAG{wrong}', expectedOutput: 'INCORRECT', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the purpose of post-exploitation cleanup after an authorized penetration test?',
          options: ['Removing any test accounts, uploaded scripts, or artifacts to restore systems to their original safe state', 'Deleting system logs permanently', 'Formatting disks', 'Installing permanent backdoors'],
          correctOptionIndex: 0,
          explanation: 'Testers must clean up all test files and user accounts so systems remain stable and uncompromised.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 9,
      title: 'Level 9: Cloud, Container & DevSecOps API Security',
      youtubeVideoId: 'o9hN421k5wE',
      studyMaterials: [
        {
          title: 'Container Security & OWASP API Top 10',
          type: 'notes',
          content: `# Cloud & DevSecOps\n\n- OWASP API Security Top 10: Broken Object Level Authorization (BOLA)\n- Docker container security: Rootless containers, Trivy CVE scanning\n- Secret management: Never commit API keys to git repositories.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is Broken Object Level Authorization (BOLA) in REST APIs?',
          options: ['When an endpoint allows users to manipulate objects they do not own by simply substituting IDs in the request URL', 'When the API server crashes', 'When JSON is malformed', 'When an image fails to load'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 9: Dockerfile Insecure Root User Linter',
        description: 'Read N lines of a Dockerfile. If any line specifies "USER root" or no non-root USER instruction is found, output "WARN_ROOT_CONTAINER", else "PASS".',
        inputFormat: 'Line 1: N\\nNext N lines: Dockerfile lines',
        outputFormat: 'WARN_ROOT_CONTAINER or PASS',
        constraints: '1 <= N <= 50',
        sampleInput: '3\nFROM node:20\nWORKDIR /app\nUSER appuser',
        sampleOutput: 'PASS',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = [line.strip() for line in sys.stdin if line.strip()]\n    if lines:\n        docker_lines = lines[1:]\n        has_non_root = any('USER ' in l and not 'USER root' in l for l in docker_lines)\n        has_explicit_root = any('USER root' in l for l in docker_lines)\n        if has_explicit_root or not has_non_root:\n            print('WARN_ROOT_CONTAINER')\n        else:\n            print('PASS')\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '3\nFROM node:20\nWORKDIR /app\nUSER appuser', expectedOutput: 'PASS', isHidden: false },
          { input: '2\nFROM node:20\nWORKDIR /app', expectedOutput: 'WARN_ROOT_CONTAINER', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'Why should containerized production processes not run as the root user?',
          options: ['If the container is escaped, the attacker inherits root access directly on the host kernel', 'Containers run slower', 'Requires more disk space', 'Cannot bind ports'],
          correctOptionIndex: 0,
          explanation: 'Running as non-root mitigates container breakouts by limiting host privileges if the process is compromised.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 10,
      title: 'Level 10: Professional Security Auditing & Capstone',
      youtubeVideoId: 'dz7Ntp7KQGA',
      studyMaterials: [
        {
          title: 'Purple Teaming & Executive Reporting',
          type: 'notes',
          content: `# Professional Security Auditing\n\n- Purple Teaming: Collaborative emulation to tune Blue Team sensors\n- Executive reporting: Quantifiable business risks and remediation roadmaps\n- Compliance standards: ISO 27001, SOC 2, HIPAA.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the primary objective of a Purple Team exercise?',
          options: ['Fosters collaboration between offensive (Red) and defensive (Blue) teams to maximize threat detection and response capabilities', 'Replaces security audits', 'Penalizes developers', 'Installs firewalls'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 10: Executive Risk Score Prioritizer',
        description: 'Read N vulnerability records (Name, CVSS, Impact). Output the vulnerability name with highest combined Risk = CVSS * Impact.',
        inputFormat: 'Line 1: N\\nNext N lines: Name CVSS Impact',
        outputFormat: 'Vulnerability name',
        constraints: '1 <= N <= 100',
        sampleInput: '3\nSQLi 9.8 1.5\nXSS 6.1 1.0\nMisconfig 5.0 2.0',
        sampleOutput: 'SQLi',
        difficulty: 'Easy',
        allowedLanguages: ['python'],
        starterCode: {
          python: `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if lines:\n        n = int(lines[0])\n        idx = 1\n        best_name, max_risk = '', -1.0\n        for _ in range(n):\n            name = lines[idx]\n            cvss = float(lines[idx+1])\n            impact = float(lines[idx+2])\n            risk = cvss * impact\n            if risk > max_risk:\n                max_risk = risk\n                best_name = name\n            idx += 3\n        print(best_name)\n\nif __name__ == '__main__':\n    main()\n`,
        },
        testCases: [
          { input: '3\nSQLi 9.8 1.5\nXSS 6.1 1.0\nMisconfig 5.0 2.0', expectedOutput: 'SQLi', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the primary target audience of an Executive Summary in a security assessment report?',
          options: ['C-Suite leadership and non-technical board members who need strategic risk overviews and budget allocation context', 'Database admins', 'Junior developers', 'Network switches'],
          correctOptionIndex: 0,
          explanation: 'The Executive Summary translates complex technical findings into strategic business impacts and priorities.',
          points: 1,
        },
      ],
    },
  ],
};
