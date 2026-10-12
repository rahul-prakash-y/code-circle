# Track 9: Cybersecurity & Ethical Hacking — Defensive Architecture & Authorized Assessments

> **CRITICAL ETHICAL & LEGAL NOTICE**:  
> All practices, exercises, methodologies, and labs taught in this curriculum are strictly intended for **authorized systems, local isolated virtual machines, CTF (Capture The Flag) competitions, and intentionally vulnerable training applications** (such as OWASP Juice Shop, DVWA, and WebGoat). Executing security testing against third-party systems without prior explicit, written authorization is illegal under the Computer Fraud and Abuse Act (CFAA), the UK Computer Misuse Act, the Indian Information Technology Act (Section 43/66), and international cybercrime statutes.

**Category**: Security Engineering & Offensive-Defensive Systems  
**Target Audience**: Security Analysts, Ethical Hackers, DevSecOps Engineers, Systems Auditors  
**Core Technologies**: Linux (Debian/Kali), Wireshark, Python 3.12, OWASP ZAP, Burp Suite (Community/Lab), Docker, Snort/Suricata, OpenVAS  
**Total Estimated Duration**: 140 Hours  

---

## Level 1: Cybersecurity Foundations & Lab Architecture
- **Difficulty**: Beginner
- **Estimated Completion Time**: 10 Hours
- **Prerequisites**: Basic operating system literacy.
- **Skills Unlocked**: The CIA Triad (Confidentiality, Integrity, Availability), Threat vs Vulnerability vs Risk equation ($R = T \times V$), Authentication vs Authorization, Principles of Least Privilege and Defense-in-Depth, Setting up local virtualized sandbox environments.

### Description & Objectives
Build a rigorous foundational understanding of digital assets and threat models. Learn the legal boundaries, professional codes of ethics (EC-Council / (ISC)²), and configure an isolated local lab.

### Concepts & Real-World Example
- Legal Boundaries: Rules of Engagement, scoping, non-disclosure agreements.
- Hypervisors & Isolated Virtual Networking: NAT Networks vs Host-Only vs Bridged.
- CIA Triad breakdown: Real-world case study of banking transaction data encryption (C), cryptographic hashing (I), and DDoS mitigation (A).

### Coding Challenges
- **Easy**: Python Hash Calculator: Verify File Integrity with SHA-256.
- **Medium**: Password Complexity & Entropy Validator based on NIST 800-63B guidelines.
- **Hard**: Automated Virtual Sandbox Verification Script (Verifying network isolation).

### Lab / Mini Project
- **Level 1 Micro-Utility & Lab**: **Local Sandboxed Security Lab Deployment**
- Configure a local hypervisor environment containing an isolated host-only network with a testing workstation and an intentionally vulnerable target machine (e.g., Metasploitable 2 or OWASP BWA).

---

## Level 2: Computer Networking & Packet Inspection
- **Difficulty**: Elementary
- **Estimated Completion Time**: 12 Hours
- **Skills Unlocked**: OSI 7-Layer Model vs TCP/IP Stack, Packet encapsulation, IPv4 addressing & subnetting, ARP protocol, TCP 3-way handshake & teardown, UDP vs TCP, DNS resolution, DHCP, Firewalls and NAT.

### Key Concepts & Exercises
- Deep packet inspection with Wireshark in local authorized labs.
- Tracking TCP flags (`SYN`, `ACK`, `FIN`, `RST`) and state machines.
- Protocol analysis: Unencrypted HTTP/Telnet plaintext credentials vs TLS 1.3 encryption.

### Coding Challenges
- **Easy**: IPv4 Subnet Mask and Host Range Calculator.
- **Medium**: Python Raw Socket Packet Sniffer for Local Loopback Traffic.
- **Hard**: Automated TCP Handshake Flag State Machine Analyzer.

### Lab / Mini Project
- **Level 2 Utility & Lab**: **Authorized Local Network Traffic Analyzer**
- Capture and analyze local test traffic using Wireshark and Python, identifying unencrypted protocols, mapping active MAC addresses, and graphing conversation endpoints.

---

## Level 3: Linux System Administration & Host Hardening
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: Linux CLI, User & Group permissions (rwx, octal permissions, SUID, SGID, Sticky bit), Process monitoring (`ps`, `top`), Systemd service management, Log auditing (`/var/log/auth.log`, `syslog`), OpenSSH server hardening, UFW firewall configuration.

### Key Concepts & Exercises
- Security implications of improper file permissions and misconfigured SUID binaries.
- Host hardening: Disabling root SSH login, configuring public key authentication, fail2ban setup.
- Auditing active listening network ports with `ss -tulpn` and `netstat`.

### Coding Challenges
- **Easy**: Bash Script: Scan for Insecure World-Writable Files and Directories.
- **Medium**: SUID/SGID Binary Inventory and Privilege Auditor.
- **Hard**: Automated Linux Host Hardening Script (SSH, UFW, Sysctl kernel hardening).

### Lab / Mini Project
- **Level 3 Logic App & Lab**: **Local Linux Server Hardening & Audit Benchmark**
- Perform a systematic host-hardening audit on a local Linux VM, achieving a $> 80\%$ score on CIS (Center for Internet Security) benchmark guidelines.

---

## Level 4: Web Security Foundations & OWASP Principles
- **Difficulty**: Upper-Intermediate
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: HTTP request-response headers, Cookie flags (`HttpOnly`, `Secure`, `SameSite`), Session lifecycle management, Input validation principles, Cross-Origin Resource Sharing (CORS) misconfigurations, OWASP Top 10 overview.

### Key Concepts & Exercises
- Using browser developer tools and intercepting proxies (Burp Suite Community / OWASP ZAP) in local training labs.
- Client-side validation vs server-side validation: Why client-side checks can be bypassed.
- Understanding session token entropy and session fixation.

### Coding Challenges
- **Easy**: HTTP Security Header Checker (Inspecting CSP, HSTS, X-Frame-Options).
- **Medium**: Secure Cookie Parser and Attribute Validator.
- **Hard**: Content Security Policy (CSP) Policy Generator and Rule Parser.

### Lab / Mini Project
- **Level 4 Data-Processing App & Lab**: **OWASP Juice Shop Local Exploration & Triage**
- Deploy OWASP Juice Shop locally via Docker and complete fundamental training challenges: inspecting traffic, analyzing client-side source code, and documenting observed security weaknesses.

---

## Level 5: Web Application Vulnerabilities & Remediation
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: SQL Injection (SQLi: In-band, Error-based, Blind) mechanisms, Cross-Site Scripting (XSS: Reflected, Stored, DOM), Cross-Site Request Forgery (CSRF), Broken Access Control (IDOR), Insecure Direct Object References, Server-Side Request Forgery (SSRF) fundamentals.

### Key Concepts & Exercises
- Analyzing vulnerable source code vs remediated code (e.g., parameterized queries vs string concatenation).
- Context-aware HTML entity encoding to neutralize XSS payloads.
- Implementing CSRF tokens and validating SameSite cookie policies.

### Coding Challenges
- **Easy**: SQL Query Sanitization: Refactoring String Concatenation to Parameterized Prepared Statements.
- **Medium**: Context-Aware XSS Sanitizer and HTML Encoder.
- **Hard**: IDOR Access Control Guard verifying User Ownership before Resource Dispatch.

### Lab / Mini Project
- **Level 5 Structured App & Lab**: **Vulnerable Application Triage & Secure Code Remediation**
- Given an intentionally vulnerable web application (DVWA / Juice Shop), identify 5 distinct OWASP vulnerabilities in the local lab, document proof-of-concept steps, and rewrite the server-side source code to fully patch each vulnerability.

---

## Level 6: Security Testing, Enumeration & Vulnerability Assessment
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: Ethical reconnaissance concepts, Passive vs Active information gathering, DNS enumeration, Port scanning methodologies (TCP connect, SYN stealth), Service version detection, Vulnerability scanning using OpenVAS/Nessus (in lab VMs), CVSS scoring calculation.

### Key Concepts & Exercises
- Understanding Nmap scan types: `-sS`, `-sT`, `-sV`, `-sC`, `-O`, and `-p-`.
- CVSS v3.1 calculation: Attack Vector, Complexity, Privileges Required, User Interaction, Scope, Impact metrics.
- Formulating vulnerability prioritization matrices based on exploitability and business impact.

### Coding Challenges
- **Easy**: Multi-Threaded TCP Port Scanner in Python for Localhost.
- **Medium**: Banner Grabber and Service Version Parser for Authorized Lab Services.
- **Hard**: Automated CVSS v3.1 Base Score Calculator Engine.

### Lab / Mini Project
- **Level 6 Structured App & Lab**: **Authorized Local Network Vulnerability Assessment Report**
- Conduct an automated and manual vulnerability assessment against an authorized local lab VM, cataloging discovered services, identifying vulnerabilities, assigning CVSS scores, and writing a technical remediation roadmap.

---

## Level 7: Defensive Security, SIEM & Incident Response
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: Security Information and Event Management (SIEM) concepts, Log parsing (ELK Stack / Wazuh), Intrusion Detection Systems (Snort / Suricata rules), Incident response lifecycle (NIST SP 800-61), Threat intelligence fundamentals, Yara rules basics.

### Key Concepts & Exercises
- Centralized log ingestion and searching for Indicators of Compromise (IoCs).
- Writing custom Snort/Suricata rules to detect suspicious local traffic patterns.
- The 6 phases of incident response: Preparation, Detection, Containment, Eradication, Recovery, Lessons Learned.

### Coding Challenges
- **Easy**: Python Web Server Access Log Parser (Extracting 404/401 anomalies).
- **Medium**: Snort Detection Rule Generator for Specific Signature Patterns.
- **Hard**: Yara Rule Writer for Detecting Static Malicious Patterns in Test Files.

### Mini Project
- **Level 7 Real-World App**: **Automated Security Monitoring & Alerting Dashboard**
- Deploy a local ELK/Wazuh monitoring stack that ingests auth logs, detects brute-force login attempts against SSH or web forms, and triggers real-time Discord/Slack webhook alerts.

---

## Level 8: Penetration Testing Methodologies & CTF Labs
- **Difficulty**: Advanced
- **Estimated Completion Time**: 18 Hours
- **Skills Unlocked**: Industry testing frameworks (PTES, OWASP WSTG, NIST 800-115), Rules of Engagement documentation, Systematic exploitation concepts in controlled labs, Privilege escalation concepts (Linux GTFOBins, misconfigured cron jobs, Windows permissions), Professional technical reporting.

### Key Concepts & Exercises
- Following the PTES standard: Pre-engagement, Intelligence Gathering, Threat Modeling, Vulnerability Analysis, Exploitation, Post-Exploitation, Reporting.
- Linux privilege escalation techniques in training VMs: Kernel exploits vs configuration flaws.
- Writing formal penetration test findings with reproduction steps and proof-of-concept evidence.

### Coding Challenges
- **Easy**: Linux Privilege Escalation Checker: Inspect Sudo Permissions (`sudo -l`) and Writable Crontabs.
- **Medium**: Automated Report Finding Generator from JSON Scan Results.
- **Hard**: Simulated Multi-Stage Lab Assessment Runner with Flag Verification.

### Mini Project
- **Level 8 Real-World App & Lab**: **Full Authorized Penetration Test of a Training Virtual Machine**
- Conduct an end-to-end authorized penetration test against a dedicated local CTF machine (e.g., VulnHub / HackTheBox academy lab), capture flags, and compile an exhaustive penetration testing report.

---

## Level 9: Cloud, Container & API Security
- **Difficulty**: Professional
- **Estimated Completion Time**: 18 Hours
- **Skills Unlocked**: REST API Security (OWASP API Security Top 10), Broken Object Level Authorization (BOLA), Rate limiting and API tokens, Docker container security (Docker daemon socket risks, non-root users, Trivy image scanning), Kubernetes RBAC basics, Cloud IAM least privilege.

### Key Concepts & Exercises
- Securing modern microservices: Why traditional perimeter firewalls fail to protect containerized APIs.
- Scanning Docker images for Known CVEs using Trivy in CI/CD pipelines.
- Identifying and fixing BOLA / Broken Function Level Authorization in API routes.

### Coding Challenges
- **Easy**: Dockerfile Security Linter: Detecting Root Users and Insecure Base Images.
- **Medium**: API Token Rate Limiter with Sliding Window in Redis.
- **Hard**: Automated BOLA Vulnerability Scanner for Mock Test APIs.

### Mini Project
- **Level 9 Production Project**: **Containerized DevSecOps CI/CD Security Gate Pipeline**
- Build an automated GitHub Actions security pipeline that runs Trivy image scans, SAST code analysis with Bandit/Semgrep, and secret scanning with Gitleaks, blocking builds that fail severity thresholds.

---

## Level 10: Professional Security Assessment & Capstone
- **Difficulty**: Capstone / Professional
- **Estimated Completion Time**: 22 Hours
- **Skills Unlocked**: Red Team vs Blue Team vs Purple Team collaboration, Advanced attack path mapping, Security automation using Python, Enterprise risk management, Executive reporting for C-suite leaders, Legal ethics and compliance standards (ISO 27001, SOC 2).

### Key Concepts & Exercises
- Purple Teaming: Emulating threat tactics to validate and tune defensive monitoring sensors.
- Translating technical vulnerabilities into quantifiable financial and operational risk metrics.
- Writing Executive Summaries that communicate risk to non-technical executive boards.

### Level 10 Capstone Project
- **Production Capstone**: **Comprehensive Authorized Security Audit & Executive Remediation Suite**
  - **Scope**: Perform a complete authorized security assessment of a complex, purpose-built multi-tier local lab environment (consisting of a frontend web app, REST API, database, and containerized background workers).
  - **Deliverables**:
    1. **Rules of Engagement & Scope Document**: Formal legal scope definitions and testing parameters.
    2. **Threat Model & Architecture Diagram**: Identifying trust boundaries and attack surfaces.
    3. **Technical Findings Registry**: Minimum 5 documented vulnerabilities across Web, API, and Host levels, complete with CVSS v3.1 scores, reproduction evidence, and impacted assets.
    4. **Verified Patch Pull Requests**: Working source code patches and configuration hardening files proving remediation of each finding.
    5. **Executive Summary & Board Presentation**: Business-impact oriented narrative detailing organizational risk posture and strategic remediation investment priorities.
