# IT Company Dashboard Data Model

## 1. Company-Level Dashboard

| Data Point | Description | Example |
|---|---|---|
| Company Info | Legal name, trading name, incorporation date, tax ID, website, industry | "NexGen Solutions Inc." |
| Subsidiaries | List of owned/operating entities | NexGen Cloud, NexGen Security, NexGen AI Labs |
| Headcount | Total employees, FTEs, contractors, open roles | 1,247 (1,083 FTE, 164 contractors) |
| Revenue / Sales Pipeline | ARR/MRR, quarterly revenue, pipeline value, win rate, forecast | $48M ARR, $12M pipeline |
| Active Projects | Count, total budget, aggregated health/status | 87 active projects |
| Clients | Total active clients, top accounts, NPS, churn rate | 156 clients, NPS 42 |
| Certifications | ISO 27001, SOC 2, AWS Partner, CMMI, etc. | ISO 27001:2022, SOC 2 Type II |
| Locations | Offices, regions, remote share, time zones | HQ San Francisco, 4 offices, 62% remote |

---

## 2. Subsidiary-Level Dashboard

| Data Point | Description | Example |
|---|---|---|
| Subsidiary Profile | Name, legal entity code, founding date, CEO/GM | NexGen Security Ltd. |
| Focus Area | Primary market, service lines, verticals | Cybersecurity, GRC, MSSP |
| Team Size | Employees by subsidiary, growth trend | 312 employees (+8% YoY) |
| Active Projects | Count, total value, delivery health | 23 active projects, $9.2M |
| Performance Metrics | Revenue, EBITDA, utilization, client satisfaction | 94% utilization, CSAT 4.6/5 |

---

## 3. Department-Level Dashboard

| Data Point | Description | Example |
|---|---|---|
| Department Head | Name, title, tenure, reports-to | Sarah Chen, VP of Engineering |
| Team Members | Direct reports, headcount, open positions | 58 engineers, 4 open roles |
| Current Initiatives | Active programs, objectives, key results | Platform modernization, SRE rollout |
| KPIs | Output metrics, quality metrics, efficiency metrics | Deploy frequency, MTTR, bug escape rate |

**Typical Department KPIs**
- Engineering: velocity, cycle time, deployment frequency, change failure rate, uptime
- Sales: quota attainment, deal velocity, ACV, churn
- Support: ticket volume, first-response time, resolution time, CSAT
- HR: time-to-hire, retention, eNPS, headcount plan vs. actual
- Finance: burn rate, gross margin, DSO, budget variance

---

## 4. Employee Profile Data

| Field | Description | Example |
|---|---|---|
| Name | Full name, preferred name | "Jordan Patel (J.)" |
| Role | Job title, level, employment type | Senior Security Engineer, L5, Full-time |
| Department | Department and cost center | Security Operations (SEC-OPS) |
| Subsidiary | Entity / business unit | NexGen Security |
| Manager | Direct manager, skip-level | Manager: Alex Rivera |
| Skills | Technical and soft skills, proficiency | Python, Splunk, Incident Response (Expert) |
| Certifications | Credentials, expiry dates | CISSP (expires 2027), AWS Security Specialty |
| Contact | Email, phone, Slack handle, timezone | jordan.patel@nexgen.com, @jpatel, PT |
| Bio | Short professional summary | "Security engineer specializing in cloud forensics..." |
| Photo / Avatar | Profile picture or generated avatar | URL to HRMS avatar |
| Current Projects | Projects assigned, role, allocation | Project Titan — Lead IR Engineer (50%) |
| Recent Tasks | Last completed/in-progress tasks | "Investigated alert #4921" |
| Availability / Status | Online, away, busy, OOO, focus time | 🟢 Available |
| Work Anniversary | Hire date, upcoming milestone | Joined 15 Mar 2019 — 6 years |

---

## 5. Project Data

| Field | Description | Example |
|---|---|---|
| Project Name | Internal codename and client-facing name | "Project Titan — Retail SOC Build" |
| Client | Client name, account manager, contract value | Acme Retail, $850K |
| Status | Health, phase, risk level | 🟡 At Risk — Implementation |
| Timeline | Start date, end date, duration | Jan 2026 – Jun 2026 |
| Team Members | Roles, allocations | 6 engineers, 2 analysts, 1 PM |
| Milestones | Name, target date, status, deliverables | SOC design review — Complete |
| Tech Stack | Tools, platforms, languages | Azure Sentinel, Terraform, Python, Kubernetes |
| Progress % | Earned value, task completion | 62% complete |
| Budget | Total, spent, forecast, variance | $850K / $510K spent / $40K overrun |

---

## 6. Security / SOC Team Specific Data

| Category | Metrics / Data |
|---|---|
| Incidents | Open incidents, severity breakdown (P1/P2/P3/P4), mean time to detect (MTTD), mean time to respond (MTTR), mean time to contain (MTTC) |
| Alerts | Alert queue, false-positive rate, alerts by source, top alert types, escalation count |
| Compliance Status | Control maturity, audit findings, evidence collection status, overdue items, framework mapping (ISO 27001, SOC 2, NIST, PCI-DSS) |
| Vulnerabilities | Open critical/high/medium/low CVEs, patch age, exposure window, asset coverage, scan schedule |
| SLAs | Response SLA adherence, resolution SLA adherence, breach count, SLA by priority |
| Shift Roster | On-call schedule, current watch officer, handoff notes, shift lead, coverage gaps, pagerDuty/Opsgenie rotation |
| Threat Intel | Active threat actors, IOCs, campaign summaries, dark-web mentions |
| Metrics Examples | Phishing test click rate, endpoint detection coverage, IAM posture score |

---

## 7. Activity / Recent Updates Feed

| Update Type | Example |
|---|---|
| New Hires | "Morgan Lee joined Cloud Engineering as SRE" |
| Project Launches | "Project Aurora kicked off for GlobalBank" |
| Completed Milestones | "Q1 security audit evidence submitted" |
| Internal Announcements | "New remote-work policy effective July 1" |
| Promotions / Role Changes | "Taylor Kim promoted to Principal Architect" |
| Certifications Achieved | "Team completed AWS Advanced Consulting Partner audit" |
| Client Wins | "Closed $1.2M deal with HealthFirst" |
| System Status Updates | "Jira maintenance window completed" |

---

## 8. Real-Time Indicators

| Indicator | Source / Value |
|---|---|
| Online / Away / Busy Status | Slack, Microsoft Teams, Google Chat presence |
| Current Task | Jira/Asana/Monday issue in progress, focus time block |
| Calendar Integration | Next meeting, free/busy blocks, OOO events from Google Calendar / Outlook |
| Active Code / Commits | GitHub/GitLab last push, pull request activity |
| Device / Location | VPN status, last seen IP, geolocation (for access context) |
| Notifications | Unread Slack messages, pending approvals, overdue tasks |

---

## 9. Data Sources & Integrations

| System | Typical Data Provided |
|---|---|
| **Slack** | Presence/status, announcements, DMs, channel activity, incident commands |
| **Jira** | Tasks, sprints, epics, bugs, project progress, release status |
| **GitHub / GitLab / Bitbucket** | Commits, pull requests, code reviews, repository activity, CI/CD status |
| **Notion / Confluence** | Documentation, project wikis, meeting notes, knowledge base |
| **HRMS** (Workday, BambooHR, HiBob, ADP) | Employee profiles, org chart, PTO, anniversaries, headcount, payroll data |
| **Google Workspace / Microsoft 365** | Calendar, email, contacts, file activity, presence |
| **Salesforce / HubSpot** | CRM data, opportunities, pipeline, client contacts, support tickets |
| **Finance / ERP** (NetSuite, SAP, QuickBooks) | Budget, actuals, invoicing, contracts, vendor spend |
| **Identity / Access** (Okta, Azure AD, JumpCloud) | SSO status, group memberships, MFA compliance, access reviews |
| **Security Tools** (Splunk, Sentinel, CrowdStrike, Qualys, Snyk) | Alerts, incidents, vulnerabilities, endpoint telemetry |
| **Monitoring** (Datadog, New Relic, PagerDuty, Opsgenie) | Infrastructure health, uptime, on-call rotations, incident paging |
| **Business Intelligence** (Tableau, Power BI, Looker, Metabase) | Aggregated KPIs, dashboards, executive reporting |

---

## Summary

A realistic IT company dashboard layers data from **company → subsidiary → department → employee → project**, enriched with **real-time presence, activity feeds, and security operations metrics**. The most credible implementations pull from live integrations rather than static spreadsheets, with clear data ownership and refresh frequencies for each source.
