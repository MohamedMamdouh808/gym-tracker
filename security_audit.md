# 🔐 GymTracker Pro — Security Audit Report (007)

> **Date**: 2026-07-16 | **Auditor**: Antigravity (007 Mode) | **Scope**: Full-stack (Backend + Frontend + DB + Secrets)

---

## 1. System Summary

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Backend** | Node.js / Express | `backend/server.js` (1347 lines) + `backend/api/index.js` (1129 lines — serverless copy) |
| **Frontend** | React 18 / Vite/CRA | `frontend/src/` — Axios-based API client, Supabase Auth UI |
| **Database** | Supabase (PostgreSQL + RLS) | 8 SQL schema files, partial RLS |
| **AI** | Groq (Llama 3.3) + Google Gemini | Used for coaching + InBody image vision |
| **Auth** | Supabase Auth (email + Google OAuth) | JWT-based session, passed via `Authorization` header |
| **Deployment** | Vercel (serverless) | `vercel.json` rewrites all `/api/*` to `api/index.js` |

---

## 2. Attack Surface Map

```
Internet
   │
   ├─ Frontend (React, browser)
   │     ├─ Supabase Auth UI (login/signup)
   │     ├─ Axios client (api.js) — sends Bearer JWT + x-user-id header
   │     └─ .env contains: SUPABASE_URL, SUPABASE_ANON_KEY (exposed to browser ✅ by design)
   │
   ├─ Backend API (Express / Vercel Serverless)
   │     ├─ CORS: app.use(cors()) → wildcard * — NO origin restriction ❌
   │     ├─ Auth: getUserId() reads x-user-id header OR query param OR body — trivially spoofable ❌
   │     ├─ No rate limiting ❌
   │     ├─ No input schema validation ❌
   │     ├─ No security headers ❌
   │     ├─ Multer file upload (10 MB) — no MIME type validation ❌
   │     ├─ AI endpoints: user message injected directly into system prompt ❌
   │     └─ Secrets in .env (committed to repo with real values) ❌❌
   │
   ├─ Supabase (PostgreSQL + Auth)
   │     ├─ RLS enabled on profiles, workout_logs (partial) — NOT all tables ❌
   │     ├─ Backend uses SERVICE_ROLE_KEY → bypasses ALL RLS ❌
   │     └─ anon key exposed in frontend (acceptable for client SDK)
   │
   └─ External APIs
         ├─ Groq API (LLM) — key in .env
         └─ Google Gemini API — key in .env
```

---

## 3. Vulnerabilities Found

| # | Severity | Vulnerability | File | Impact | Fix |
|---|----------|--------------|------|--------|-----|
| 1 | 🔴 **CRITICAL** | **Real API keys & Service Role Key committed in `.env` files** | `backend/.env`, `frontend/.env` | Full DB access, API key abuse, billing explosion | Rotate immediately, add to `.gitignore` properly, use secrets manager |
| 2 | 🔴 **CRITICAL** | **`getUserId()` trusts `x-user-id` header / `user_id` body param** — any caller can impersonate any user | `server.js:67-69` | IDOR — access/delete any user's data | Derive user_id exclusively from verified JWT |
| 3 | 🔴 **CRITICAL** | **Backend uses `supabaseAdmin` (SERVICE_ROLE_KEY) for ALL requests** — RLS is completely bypassed | `server.js:49-61` | Any user ID spoofing gives full DB access | Only use service role for truly admin-only ops; pass JWT to Supabase for user-scoped ops |
| 4 | 🔴 **CRITICAL** | **Wildcard CORS** — `app.use(cors())` with no origin restriction | `server.js:44`, `api/index.js:44` | Any website can make credentialed API calls on behalf of authenticated users (CSRF-like) | Restrict origin to frontend domain |
| 5 | 🟠 **HIGH** | **No authentication middleware** — all endpoints are reachable without a valid JWT | `server.js:71+` | Unauthenticated data exfiltration from all endpoints | Add `authenticateRequest` middleware on all non-health endpoints |
| 6 | 🟠 **HIGH** | **No rate limiting** on any endpoint, especially `/api/ai/coach` and `/api/inbody/scan` | `server.js` | AI cost explosion (DoS-by-billing), data scraping | Add `express-rate-limit` per IP and per user |
| 7 | 🟠 **HIGH** | **Prompt Injection via `message` field in `/api/ai/coach`** — user-supplied text is concatenated into an LLM system prompt containing private user data | `server.js:648-756` | Prompt injection can exfiltrate other users' health data (if user ID is spoofed) | Sanitize input, validate message length, scope AI context strictly to authenticated user |
| 8 | 🟠 **HIGH** | **File upload MIME type not validated** — multer only checks file size | `server.js:11-14` | Upload of malicious files disguised as images; potential for SSRF via SVG/XML | Validate `req.file.mimetype` against whitelist `['image/jpeg','image/png','image/webp']` |
| 9 | 🟡 **MEDIUM** | **No input validation / schema enforcement** on any endpoint | `server.js` globally | Malformed data causes unhandled errors, potential DoS, DB corruption | Use `express-validator` or `zod` for all payloads |
| 10 | 🟡 **MEDIUM** | **Limit parameter is user-controlled** with no upper cap enforcement | `server.js:98,184,398` | `?limit=999999` causes uncontrolled DB query load | Enforce `Math.min(limit, 200)` |
| 11 | 🟡 **MEDIUM** | **No security HTTP headers** — missing `Helmet.js`; no CSP, HSTS, X-Frame-Options, X-Content-Type-Options | `server.js:43-45` | XSS exploitation, clickjacking, MIME sniffing attacks | Add `helmet()` middleware |
| 12 | 🟡 **MEDIUM** | **`/api/community/plans` returns ALL community plans with no authentication** | `server.js:353-361` | Public data leak of all shared workout programs including `user_id` | Require auth; filter sensitive fields |
| 13 | 🟡 **MEDIUM** | **RLS not enabled on all tables** — only `profiles`, `workout_logs` have partial RLS; no RLS on `meals`, `water_logs`, `inbody_scans`, `saved_foods`, `personal_records`, `community_programs`, `workout_plans` | `database/` | If SERVICE_ROLE_KEY is removed, all these tables are unprotected | Add RLS policies to all tables |
| 14 | 🟡 **MEDIUM** | **`DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'`** fallback means unauthenticated requests get a predictable UUID | `server.js:64` | Silent data association to a dummy user — confusion and potential data leakage | Remove default, return 401 when no user is identified |
| 15 | 🟡 **MEDIUM** | **`/api/profile` (PUT in `api/index.js`) uses `{ ...req.body }` spread directly into upsert** | `api/index.js:86` | Mass assignment: attacker can inject arbitrary columns (e.g., `id`, `role`, timestamps) | Explicitly whitelist allowed fields |
| 16 | 🟡 **MEDIUM** | **AI responses and internal errors are returned verbatim to the client** | `server.js:753-754` | Internal error messages leak stack traces, DB error details, or model names | Sanitize error responses in production |
| 17 | 🟢 **LOW** | **Two duplicate server files** — `backend/server.js` and `backend/api/index.js` are near-identical and maintained separately | Both files | Security fixes applied to one may be missed in the other | Consolidate into a single codebase |
| 18 | 🟢 **LOW** | **No request body size limit** beyond multer's 10 MB for file uploads | `server.js:45` | Large JSON payloads for text-based endpoints (e.g., `/api/ai/coach` `message`) | Set `bodyParser.json({ limit: '50kb' })` |
| 19 | 🟢 **LOW** | **No audit logging** for critical actions (delete, AI calls, InBody scans) | `server.js` | No forensic trail for security incidents | Add structured logging (winston/pino) with user_id, action, timestamp |
| 20 | 🟢 **LOW** | **Supabase anon key named `SUPABASE_PUBLISHABLE_KEY` in frontend `.env`** but referenced inconsistently | `frontend/.env:6`, `supabaseClient.js:4` | Config confusion, potential key mismatch at runtime | Standardize key naming across all env files |

---

## 4. Threat Model (STRIDE)

### S — Spoofing
| Component | Threat | Current State |
|-----------|--------|--------------|
| `getUserId()` | Any client sends `x-user-id: <victim_uuid>` header | **EXPLOITABLE** — no verification |
| Supabase Auth | JWT token stolen from localStorage | Mitigated by Supabase token rotation |
| Community `author` field | Any user can claim any author name | **EXPLOITABLE** — no binding to authenticated user |

### T — Tampering
| Component | Threat | Current State |
|-----------|--------|--------------|
| Mass assignment via `PUT /api/profile` | Client sends extra fields to overwrite protected columns | **EXPLOITABLE** in `api/index.js` |
| AI Coach prompt | User-crafted `message` modifies system prompt intent | Partially mitigated by system prompt structure; still injectable |

### R — Repudiation
| Component | Threat | Current State |
|-----------|--------|--------------|
| Data deletions | No audit log of who deleted what, when | **MISSING** — no trail |
| AI coach calls | No log of prompts sent to LLM | **MISSING** |

### I — Information Disclosure
| Component | Threat | Current State |
|-----------|--------|--------------|
| `.env` files | Real secrets committed to Git | **CRITICAL** — keys are in repo |
| Error responses | DB error messages returned to client | **EXPLOITABLE** |
| Community plans | All plans + user_ids returned unauthenticated | **EXPLOITABLE** |
| AI system prompt | Contains full user health data; if prompt injection succeeds | **HIGH RISK** |

### D — Denial of Service
| Component | Threat | Current State |
|-----------|--------|--------------|
| `/api/ai/coach` | Unlimited calls to Groq/Gemini — no rate limit | **EXPLOITABLE** — billing DoS |
| `/api/inbody/scan` | 10 MB image upload per request, no rate limit | **EXPLOITABLE** |
| `?limit=` parameter | No cap — could cause large DB reads | **EXPLOITABLE** |

### E — Elevation of Privilege
| Component | Threat | Current State |
|-----------|--------|--------------|
| `getUserId()` spoofing + admin Supabase client | Normal user gains access to any user's data | **CRITICAL** |
| Mass assignment | Client can attempt to set `id` or elevated fields | **HIGH** |

---

## 5. 🚑 Immediate Fixes Required (Critical Path)

### Fix 1: Rotate All Exposed Credentials — DO THIS NOW

The following real credentials are committed in the repository:

- `SUPABASE_URL` + `SUPABASE_ANON_KEY` — in both `backend/.env` and `frontend/.env`
- `SUPABASE_SERVICE_ROLE_KEY` — **⚠️ FULL DATABASE ACCESS — REVOKE IMMEDIATELY**
- `GEMINI_API_KEY` — Google AI key
- `GROQ_API_KEY` — Groq AI key

**Steps**:
1. Go to Supabase Dashboard → Settings → API → regenerate service role key
2. Go to Google AI Studio → revoke and regenerate `GEMINI_API_KEY`
3. Go to Groq Console → revoke and regenerate `GROQ_API_KEY`
4. Ensure `.env` is in `.gitignore` (it IS listed, but the files were still committed — remove from git history)

```bash
# Remove .env from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env frontend/.env" \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```

---

### Fix 2: Enforce Real JWT Authentication

Replace the insecure `getUserId()` with a proper middleware:

```javascript
// backend/middleware/auth.js
const { createClient } = require('@supabase/supabase-js');

const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const authenticateRequest = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
  req.user = user;         // Set verified user — never trust client-provided ID
  req.userId = user.id;   // Use this everywhere instead of getUserId()
  next();
};

module.exports = { authenticateRequest };
```

Apply to all routes:
```javascript
const { authenticateRequest } = require('./middleware/auth');

// Apply globally (except health check)
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  return authenticateRequest(req, res, next);
});
```

---

### Fix 3: Fix CORS — Restrict to Known Origins

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-frontend.vercel.app',  // replace with real domain
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

---

### Fix 4: Add Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

// General API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});

// Strict limit for AI endpoints (cost control)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'AI request limit reached. Try again in 1 hour.' }
});

// Strict limit for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
});

app.use('/api', apiLimiter);
app.use('/api/ai/coach', aiLimiter);
app.use('/api/inbody/scan', uploadLimiter);
```

---

### Fix 5: Add Security Headers (Helmet)

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

### Fix 6: Validate File Uploads MIME Type

```javascript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP allowed.'));
    }
  }
});
```

---

### Fix 7: Fix Mass Assignment in Profile PUT

In `api/index.js` line 86, replace:
```javascript
// ❌ DANGEROUS
const updates = { ...req.body, updated_at: new Date().toISOString() };
```
With:
```javascript
// ✅ SAFE — explicit whitelist
const { display_name, goal, bio, unit_preference, privacy_public, ai_persona } = req.body;
const updates = {
  display_name,
  goal,
  bio,
  unit_preference: unit_preference || 'metric',
  privacy_public: !!privacy_public,
  ai_persona: ai_persona || 'friendly',
  updated_at: new Date().toISOString()
};
```

---

### Fix 8: Cap Limit Parameter

In all `GET` endpoints:
```javascript
// ❌ Before
const limit = +(req.query.limit || 30);

// ✅ After
const limit = Math.min(+(req.query.limit || 30), 200);
```

---

### Fix 9: Sanitize Error Responses

```javascript
// Add global error handler
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal server error'
  });
});
```

---

### Fix 10: Add AI Prompt Injection Guard

```javascript
const sanitizeAIMessage = (message) => {
  if (typeof message !== 'string') throw new Error('Invalid message');
  const MAX_LENGTH = 2000;
  if (message.length > MAX_LENGTH) throw new Error('Message too long');
  // Strip common injection patterns
  const forbidden = /ignore (all )?(previous|above|prior) (instructions?|prompts?)/gi;
  if (forbidden.test(message)) throw new Error('Invalid message content');
  return message.trim();
};
```

---

### Fix 11: Add RLS Policies to All Tables

Run these in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbody_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_programs ENABLE ROW LEVEL SECURITY;

-- Generic pattern for each table (repeat per table name)
CREATE POLICY "meals_select_own" ON public.meals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "meals_insert_own" ON public.meals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "meals_update_own" ON public.meals FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "meals_delete_own" ON public.meals FOR DELETE TO authenticated USING (user_id = auth.uid());

-- community_programs: public read, own write
CREATE POLICY "community_select_all" ON public.community_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "community_insert_own" ON public.community_programs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "community_delete_own" ON public.community_programs FOR DELETE TO authenticated USING (user_id = auth.uid());
```

---

## 6. Hardening & Additional Recommendations

| Area | Recommendation | Priority |
|------|---------------|----------|
| **Code deduplication** | Merge `server.js` and `api/index.js` — they are near-identical; security fixes to one don't propagate | HIGH |
| **Structured logging** | Add `winston` or `pino` with JSON output; log user_id, action, status for all critical ops | MEDIUM |
| **Body size limit** | Set `bodyParser.json({ limit: '50kb' })` to prevent payload flooding | MEDIUM |
| **Dependency audit** | Run `npm audit` in both `backend/` and `frontend/`; fix critical CVEs | MEDIUM |
| **No-default-user fallback** | Remove `DEFAULT_USER_ID` — fail with 401 instead | HIGH |
| **AI token budget** | Add `max_tokens` cap at the server level regardless of client input | MEDIUM |
| **Supabase Service Role** | Only use `supabaseAdmin` for actual admin operations (e.g., triggers, batch jobs), NOT for user-scoped CRUD | CRITICAL |
| **Secrets management** | Use Vercel Environment Variables dashboard or a vault (e.g., Doppler, HashiCorp Vault) instead of `.env` files | CRITICAL |
| **Pre-commit secret scan** | Add `git-secrets` or `trufflehog` as a pre-commit hook | HIGH |
| **Content Security Policy** | Configure CSP headers to prevent XSS in React frontend | MEDIUM |
| **OAuth only** | Consider enforcing only Google OAuth (already configured) to eliminate weak password attacks | LOW |

---

## 7. Scoring

| Domain | Score | Notes |
|--------|-------|-------|
| **Secrets & Credentials** | 5 / 100 | Real keys committed in `.env` to git — catastrophic |
| **Authentication & Authorization** | 10 / 100 | `getUserId()` is trivially spoofable; no JWT verification middleware |
| **Input Validation** | 20 / 100 | Minimal — only `date`, `weight`, `food_name` presence checks; no schema, no type enforcement |
| **Data Protection** | 35 / 100 | Supabase encrypts at rest; RLS partially enabled; but service role bypasses all |
| **Resilience** | 40 / 100 | Promise.allSettled used in dashboard; no global error handler; no circuit breakers |
| **Monitoring & Audit** | 15 / 100 | Only `console.error`; no structured logs; no audit trail |
| **Supply Chain** | 55 / 100 | All deps at latest; no pinned hashes; no `npm audit` enforced in CI |
| **Compliance (OWASP)** | 20 / 100 | Fails A01 (Auth), A02 (Secrets), A03 (Injection), A05 (Misconfig), A07 (Auth failures) |

### **Final Score: 25 / 100**

---

## 8. Verdict

> ## 🔴 BLOQUEADO TOTAL — NÃO APTO PARA PRODUÇÃO

**Justification:**

This application has **multiple CRITICAL vulnerabilities** that can be exploited right now by any attacker with basic knowledge:

1. **All API keys and the Supabase Service Role Key are exposed in the `.env` files** which appear to have been committed to the repository. This gives any attacker full, unrestricted access to the database.

2. **Any unauthenticated user can query/delete data belonging to any other user** by simply passing an `x-user-id` header with a known UUID.

3. **The backend uses the SERVICE_ROLE_KEY for all operations**, meaning even if RLS is correctly configured on Supabase, it is completely bypassed.

4. **There is no rate limiting** on any endpoint, allowing immediate billing-based DoS attacks on the AI endpoints.

**Conditions for Re-evaluation (minimum required before production):**
- [ ] All exposed credentials rotated and removed from git history
- [ ] JWT verification middleware implemented on ALL endpoints
- [ ] CORS restricted to known origins
- [ ] Rate limiting added to all endpoints (especially AI)
- [ ] `getUserId()` replaced with verified JWT-derived user ID
- [ ] Mass assignment vulnerability in `PUT /api/profile` fixed
- [ ] File upload MIME type validation added
- [ ] RLS policies added to all Supabase tables
- [ ] Helmet.js security headers added
- [ ] `DEFAULT_USER_ID` fallback removed

---

*Generated by Antigravity (007 Security Audit Mode) — Follow-up: implement fixes then re-run audit*
