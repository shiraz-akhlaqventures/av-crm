# Security, Privacy & Compliance Guide

**Context:** Akhlaq Ventures 3D Dashboard — production security and compliance requirements.

---

## 1. Authentication Hardening

| Control | Implementation |
|---|---|
| **MFA Enforcement** | Require MFA for all users, especially SOC/finance teams. Use Firebase MFA (SMS/TOTP) or IdP-enforced MFA. |
| **Password Policy** | Delegate to corporate IdP (SAML/OIDC); avoid local passwords. If Firebase Auth local accounts: minimum 16 chars, breached-password detection. |
| **Session Management** | Short-lived access tokens (5–15 min), refresh tokens with rotation. Store session state server-side in NestJS; issue encrypted session cookie. |
| **Secure Cookies** | `HttpOnly`, `Secure`, `SameSite=Strict` or `Lax`, `__Host-` prefix. |
| **Token Rotation** | Rotate refresh tokens on every use; detect reuse and revoke immediately. |
| **Logout** | Revoke refresh tokens server-side; clear cookies. |
| **IdP Integration** | Prefer SAML 2.0 / OIDC from corporate IdP with SCIM provisioning. |

---

## 2. Authorization Patterns

### RBAC (Role-Based Access Control)
- `Employee` — view own profile, limited org chart
- `Manager` — view direct reports, approve project data
- `HR` — manage employee profiles, PII access
- `Finance` — read financial data, no PII beyond needed
- `Security/SOC` — read/write security data, audit logs
- `Admin` — tenant configuration, user lifecycle

### ABAC (Attribute-Based Access Control)
Add dynamic attributes:
- Department match
- Manager relationship
- Project membership
- Time-based access
- Device trust / network location

### Resource-Level Permissions
Implement in NestJS Guards/Interceptors. Example checks:
- Can user `U` read employee profile `E`?
- Is `U` in the same department as `E`, or `U === E`, or `U` is in HR chain?
- Can `U` view project `P`?

Never trust client-side role checks.

---

## 3. API Security (Next.js + NestJS)

| Control | Implementation |
|---|---|
| **Rate Limiting** | NestJS `@nestjs/throttler` per IP/user; Redis store for distributed rate limiting. |
| **Input Validation** | `class-validator` + DTOs; reject unexpected fields; sanitize uploads. |
| **CORS** | Whitelist only known origins; never `*`. |
| **CSRF Protection** | `SameSite=Strict` cookies + origin/referer validation for mutations. |
| **Injection Prevention** | Parameterized Firestore queries; no string-concatenated queries. |
| **Error Handling** | Generic error messages to client; log details server-side. |
| **HTTPS Only** | HSTS, TLS 1.2+. |
| **Security Headers** | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. |

---

## 4. Firebase Security Rules Best Practices

### Core Rules
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function hasRole(role) {
      return isAuthenticated() && role in request.auth.token.roles;
    }
    function belongsToTenant(tenantId) {
      return isAuthenticated() && request.auth.token.tenantId == tenantId;
    }

    match /users/{userId} {
      allow read: if request.auth.uid == userId || hasRole('hr') || hasRole('admin');
      allow update: if (request.auth.uid == userId &&
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['displayName', 'phone', 'preferences']))
        || hasRole('hr') || hasRole('admin');
    }

    match /employees/{employeeId} {
      allow read: if belongsToTenant(resource.data.companyId) &&
        (request.auth.uid == employeeId || hasRole('hr') || hasRole('manager') || hasRole('finance'));
      allow write: if hasRole('hr') || hasRole('admin');
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Best Practices
- **Default deny** at root level.
- **Tenant isolation:** every document has `companyId`.
- **Role data in custom claims**, not client-writable documents.
- Unit-test rules with Firebase Emulator.
- Keep sensitive collections accessible only from backend service account.

---

## 5. Service Account Key Management

- **Never commit service account keys.**
- Store in **Google Secret Manager** or **HashiCorp Vault**, injected at runtime.
- On Vercel/Render, use environment secrets; rotate quarterly.
- Prefer **Workload Identity** / OIDC federation over long-lived JSON keys.
- Restrict service account key creation via GCP IAM policy.

### Least Privilege
| Service Account | Permissions |
|---|---|
| NestJS API | Firestore read/write scoped to app collections; Firebase Auth verify; Storage limited bucket |
| CI/CD | Deploy to Vercel/Render only; no production DB write |
| Audit logger | Append-only logs |

---

## 6. Data Privacy: PII, Consent, Retention

### PII Handling
- Minimize collection; only collect necessary employee data.
- Separate PII from analytics/aggregated data.
- Mask PII in logs and UI unless user has explicit permission.
- Implement field-level access controls.

### Employee Consent
- Record consent for data processing at onboarding.
- Provide privacy notice covering purpose, retention, third parties, rights.
- Allow employees to access, correct, and delete their profile data.

### Data Retention Policies
| Data Type | Retention |
|---|---|
| Employee profile | Duration of employment + legal requirement |
| Financial records | 7–10 years |
| Security logs | 1–3 years |
| Audit logs | 1–7 years |
| Session/temp logs | 30–90 days |

---

## 7. Compliance Frameworks

| Framework | When It Applies |
|---|---|
| **SOC 2 Type II** | SaaS/internal tools handling company data |
| **ISO 27001** | Information Security Management System |
| **GDPR** | If EU employees or data subjects |
| **HIPAA** | If dashboard accesses PHI |
| **PCI-DSS** | If payment data involved (avoid storing cardholder data) |

### SOC 2 / ISO 27001 Basics
- Policies, access reviews, monitoring, incident response, vendor management.
- Risk assessment, controls (Annex A), internal audits.

### GDPR Basics
- Lawful basis for processing.
- Data subject rights: access, rectification, erasure, portability.
- 72-hour breach notification.
- Data Processing Agreement with Google/Firebase.

---

## 8. Audit Logging

### What to Log
- Authentication events (success/failure, MFA, logout)
- Authorization denials
- User/role/permission changes
- Profile reads/writes, especially PII
- Financial data access/modification
- Security/SOC data access
- Admin actions
- Data exports/downloads
- Password/secret rotations

### Log Content
- Timestamp (UTC)
- Actor (user ID, role, IP, device/session)
- Action (CRUD, login, export)
- Resource (document ID, collection, tenant)
- Outcome
- Correlation ID

### Storage
- Centralized SIEM: Datadog, Splunk, Google Cloud Logging, Panther.
- Append-only, tamper-evident storage.
- Separate from application database.

---

## 9. Penetration Testing & Security Review Checklist

### Checklist
- [ ] MFA enforced; IdP-enforced for privileged roles
- [ ] Session timeout and refresh rotation
- [ ] RBAC/ABAC enforced server-side
- [ ] No direct client access to sensitive Firestore collections
- [ ] Rate limiting on all endpoints
- [ ] Input validation on all DTOs
- [ ] CORS restricted to known origins
- [ ] Security headers configured
- [ ] No secrets in client bundles
- [ ] Dependency scanning (Snyk, Dependabot)
- [ ] Firebase Security Rules default deny and tenant-isolated
- [ ] Service account keys rotated and stored in secret manager
- [ ] PII access logged and minimized
- [ ] Retention and deletion policies defined

### Penetration Testing
- Annual external penetration test
- Quarterly internal vulnerability scans
- Focus: IDOR, XSS, injection, authentication bypass, privilege escalation

---

## 10. Third-Party Integration Security

### OAuth Scopes
- Request minimum scopes.
- Use PKCE for OAuth flows.
- Validate state parameter.
- Store tokens encrypted at rest.

### Webhook Verification
- Verify HMAC-SHA256 signatures.
- Use constant-time comparison.
- Reject old timestamps.
- Whitelist sender IPs when available.

### Vendor Risk Management
- Maintain vendor inventory.
- Review SOC 2 Type II / ISO 27001 reports.
- Sign DPAs where required.

---

## 11. Incident Response Basics

### Phases
1. **Preparation** — roles, runbooks, contact lists
2. **Detection** — SIEM alerts, anomaly detection
3. **Containment** — revoke sessions, disable accounts, rotate secrets
4. **Eradication** — remove attacker access, patch vulnerabilities
5. **Recovery** — restore from known-good backups
6. **Post-Incident** — root cause analysis, update controls

### Notification Requirements
- GDPR: 72 hours to supervisory authority for personal data breach.
- HIPAA: 60 days to individuals, HHS.

---

## 12. Security Monitoring Tools & Alerts

| Layer | Tools |
|---|---|
| Application | Sentry, LogRocket |
| Infrastructure | Vercel Analytics, Render monitoring, Google Cloud Monitoring |
| SIEM/Logging | Google Cloud Logging, Datadog, Splunk |
| Vulnerability Scanning | Snyk, Dependabot, Trivy |
| Secrets Detection | GitGuardian, TruffleHog |

### Key Alerts
- Multiple failed logins followed by success
- Privilege escalation or role changes
- Bulk data export/download
- Access outside business hours or unusual geolocation
- Service account key usage from new IP
- Firestore security rule violations
- Secrets detected in repository
