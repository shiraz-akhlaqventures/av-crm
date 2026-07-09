# Production Deployment Best Practices: Next.js + NestJS + Firebase

**Context:** Akhlaq Ventures 3D Dashboard — production-ready deployment guidance.

---

## 1. Vercel Plan Selection: Pro vs Enterprise

**Recommended: Vercel Pro** for most production company dashboards. Upgrade to **Enterprise** when compliance/scale demands it.

| Factor | Pro | Enterprise |
|--------|-----|------------|
| Cost | ~$20/seat/month | Custom |
| Bandwidth | 1 TB | Custom |
| Build minutes | 6,000 min | Custom |
| Team seats | Included | SSO, SCIM |
| Support | Email | Dedicated CSM / SLA |
| Security | Basic ACL | SSO, audit logs, DLP |
| Edge Network | Global | Global + custom |
| Preview deployments | Yes | Yes |

**Why Pro:**
- Custom domains, preview envs, analytics, 99.99% SLA
- `vercel.json` headers/rewrites, edge functions
- Affordable until you need SSO/audit compliance

**Why Enterprise:**
- SOC 2 / HIPAA / GDPR requirements
- Need SSO/SAML, SCIM, audit logs
- Massive traffic or custom MSA

---

## 2. Render Plan Selection & Cold-Start Mitigation

**Recommended: Render Standard** for production NestJS APIs.

| Plan | Best For | Cold Start |
|------|----------|------------|
| Starter | Prototyping | High (spin-down after 15 min idle) |
| Standard | Production APIs | None (always on) |
| Pro | High-traffic / teams | None + more resources |

**Cold-start mitigation:**
- Use **Standard or Pro** (no spin-down)
- Enable **health checks** and **keep-alive pings**
- Set minimum instances if using Render autoscaling
- Use connection pooling (Firestore)
- Move heavy work to background jobs

---

## 3. Firebase Production Plan: Blaze & Cost Estimation

**Use Blaze (pay-as-you-go).** Spark has hard limits unsuitable for production.

**Estimated monthly costs for a mid-size company dashboard:**

| Service | Usage | Est. Cost |
|---------|-------|-----------|
| Firebase Auth | 10k MAU | Free tier, then ~$0.01/SMS (phone auth) |
| Firestore | 5M reads, 2M writes, 1M deletes | $5–$15 |
| Cloud Storage | 500 GB + 100 GB download | $15–$30 |
| Cloud Messaging | 1M messages | Free |
| Cloud Functions (optional) | 5M invocations | $5–$20 |
| **Total** | | **$30–$80/month** |

Set **budget alerts** in Google Cloud Billing.

---

## 4. CI/CD Pipeline for Monorepo

**Tooling:** GitHub Actions + Turborepo/Nx + pnpm/yarn workspaces

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, staging]

jobs:
  lint-test-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build

  deploy-web:
    needs: lint-test-build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-api:
    needs: lint-test-build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

**Best practices:**
- Use **Turborepo** remote caching
- Parallel builds for Next.js and NestJS
- Require PR checks before merge
- Tag releases and maintain changelogs

---

## 5. Environment Strategy: Dev, Staging, Production

| Environment | Purpose | Data |
|-------------|---------|------|
| **Dev** | Local development | Emulators / sandbox project |
| **Staging** | Pre-production testing | Anonymized production-like data |
| **Production** | Live users | Real data |

**Implementation:**
- Separate Vercel projects: `my-app-dev`, `my-app-staging`, `my-app-prod`
- Separate Render services per env
- Separate Firebase projects:
  - `mycompany-dev`
  - `mycompany-staging`
  - `mycompany-prod`

Use `.env.development`, `.env.staging`, `.env.production` in apps.

---

## 6. Secrets Management Across Vercel, Render, GitHub

**Principles:**
- Never commit secrets
- Rotate quarterly
- Use least-privilege service accounts

**Tools:**
- GitHub: **GitHub Secrets & Variables**
- Vercel: **Project Environment Variables** (encrypted at rest)
- Render: **Environment Variables** (encrypted)
- Firebase: Use **Secret Manager** for Cloud Functions

**Workflow:**
1. Store build-time secrets in GitHub
2. Runtime secrets in Vercel/Render/Firebase
3. Use `GOOGLE_APPLICATION_CREDENTIALS` JSON via Render env (or Secret Manager)
4. Sync envs with tools like **Doppler** or **1Password Secrets Automation**

---

## 7. Firestore Indexing, Backups, Disaster Recovery

**Indexing:**
- Use composite indexes for multi-field queries
- Enable automatic indexing
- Review slow queries in Firebase Console → Firestore → Indexes
- Avoid `array-contains` + ordering on different fields without index

**Backups:**
- Enable **managed backups** in Firebase Console
- Use **scheduled exports** to Cloud Storage:
```bash
gcloud firestore export gs://my-backup-bucket
```

**Disaster recovery:**
- Multi-region Firestore (default is multi-region for most locations)
- Test restore procedures quarterly
- Maintain runbooks

---

## 8. CDN and Asset Optimization

**Frontend (Vercel):**
- Automatic Edge Network CDN
- Use `<Image />` component with WebP/AVIF
- Enable `next/font` for font optimization
- Set `Cache-Control` headers for static assets

**Backend (Render):**
- Serve static assets via Vercel or Firebase Storage CDN
- Use Cloudflare in front of Render if needed (extra DDoS/cache layer)

**Firebase Storage:**
- Enable CDN via Google Cloud CDN
- Compress images, use signed URLs for private assets

---

## 9. Monitoring, Logging, Alerting Stack

| Layer | Tool | Use |
|-------|------|-----|
| Frontend | Vercel Analytics | Core Web Vitals |
| Frontend | Sentry | Errors |
| Backend | Sentry / Datadog | Errors, APM, traces |
| Backend | Render logs | Infrastructure logs |
| Firebase | Cloud Monitoring / Cloud Logging | Function logs, Firestore metrics |
| Alerts | PagerDuty / Opsgenie | On-call alerting |

**Alert on:**
- Error rate spikes
- P95 latency > threshold
- 5xx rate > 0.1%
- Firestore read quota spikes

---

## 10. Uptime Monitoring & Status Pages

**Recommended tools:**
- **UptimeRobot** or **Pingdom**: HTTP/S endpoint checks
- **Better Uptime** or **Statuspage**: Public status pages

**Checks:**
- Frontend homepage every 60s
- Backend `/health` endpoint every 60s
- Critical API endpoints every 5 min

---

## 11. Production Security Checklist

| Area | Action |
|------|--------|
| CORS | Restrict to known origins only |
| Rate limiting | Implement via NestJS `throttler` or Cloudflare |
| DDoS | Cloudflare proxy + Vercel DDoS protection |
| App Check | Enable Firebase App Check for web |
| Service accounts | Use least-privilege, rotate keys, store in Secret Manager |
| Auth | Enforce email verification, MFA for admins |
| HTTPS | Force TLS, HSTS headers |
| Dependencies | Run `npm audit`, Dependabot, Snyk |
| Secrets scanning | GitGuardian, TruffleHog |
| CSP | Configure Content-Security-Policy headers |
| Input validation | Use `class-validator` in NestJS DTOs |

---

## 12. Load Testing Approach

**Tools:**
- **k6** (recommended for APIs)
- **Artillery**
- **Loader.io**

**Plan:**
1. Define baseline traffic and peak targets
2. Test critical flows: login, dashboard load, data fetch, file upload
3. Run tests against **staging**, never production
4. Ramp up: 10 → 100 → 1,000 concurrent users
5. Measure: response time, error rate, throughput, Firestore read spikes

**Post-test:**
- Review Render metrics, Firestore usage, Sentry errors
- Optimize queries, add caching, scale instances if needed
