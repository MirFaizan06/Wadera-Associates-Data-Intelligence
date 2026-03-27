# Backend Deployment Guide
**Stack:** Express + TypeScript · Prisma · MySQL · Gmail SMTP · AWS S3**
**Platforms:** Railway (recommended) or Render (free tier)
**Last updated:** March 2026 — based on current official docs

---

## Quick Recommendation: Railway vs Render

| Feature | Railway | Render |
|---|---|---|
| Free tier | $1 credit/month (or $5 one-time trial credit) | 750 hrs/month, sleeps after 15 min |
| MySQL | Built-in add-on (Docker, unmanaged) | No native MySQL — need external provider |
| SMTP ports (465/587) | ✅ Open | ❌ Blocked on free tier |
| Cold start | None (stays awake while credits last) | ~60 seconds from sleep |
| Port binding | Dynamic `PORT` env var | Dynamic `PORT` env var (default 10000) |
| Variable references between services | ✅ Yes (`${{ MySQL.MYSQL_URL }}`) | ✅ Yes |
| Persistent disk | 0.5 GB (free), 5 GB (Hobby $5/mo) | Requires paid plan |

**Use Railway** for this project. Render's free tier blocks Gmail SMTP ports (465/587) — you'd need a paid plan to send emails. Railway has no such restriction and includes a MySQL add-on.

---

## Part 1 — Railway Deployment

### 1.1 Prerequisites

- Railway account at [railway.app](https://railway.app) (sign in with GitHub)
- GitHub repository with the server code
- Server entry point: `npm start` → `node dist/index.js`
- Prisma schema using `provider = "mysql"`

### 1.2 Create a New Project

1. Log in to Railway → click **+ New Project**
2. Select **Deploy from GitHub repo**
3. Authorize Railway to access your account
4. Choose the repository → select the branch (`master` / `main`)
5. Railway will auto-detect Node.js and begin the first build

### 1.3 Set the Root Directory (monorepo)

Since the server lives in a `server/` subdirectory:

1. Service → **Settings** → **Root Directory** → set to `server`
2. Railway will now run all commands relative to `server/`

### 1.4 Build & Start Commands

Railway auto-detects these from `package.json` scripts, but verify in Service → Settings:

| Field | Value |
|---|---|
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

`npm run build` runs `tsc`, producing `dist/`. `npm start` runs `node dist/index.js`.

### 1.5 Add the MySQL Service

1. On the project canvas → **+ New** → search **MySQL**
2. Click **MySQL** → Railway deploys a MySQL 8 Docker container
3. Railway auto-injects these variables into the MySQL service:
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQL_URL`

### 1.6 Set Environment Variables

Go to your **Node.js service** → **Variables** tab → **Raw Editor**, then paste:

```env
NODE_ENV=production
PORT=${{RAILWAY_PORT}}
DATABASE_URL=${{MySQL.MYSQL_URL}}
JWT_SECRET=your-very-long-random-secret-here
JWT_EXPIRES_IN=7d

# Gmail SMTP (see Part 2)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM=noreply@waderaassociates.com

# AWS S3 (see Part 3)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your-bucket-name

# Exchange rate / geo APIs
EXCHANGE_RATE_API_KEY=your-key
GEOLOCATION_API_KEY=your-key

# Frontend URL (your Netlify URL)
FRONTEND_URL=https://wa-data-intel.netlify.app

# Razorpay — disabled for now, leave empty
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Seed admin (used only by prisma seed, safe to set here)
DEVELOPER_ADMIN_EMAIL=admin@waderaassociates.com
DEVELOPER_ADMIN_PASSWORD=ChangeMe@123

LOG_LEVEL=info
```

> **Note on `${{MySQL.MYSQL_URL}}`:** Railway's reference variable syntax. It pulls the connection string directly from the MySQL service. No need to construct it manually.

> **Note on `PORT`:** Railway injects a random port. Using `${{RAILWAY_PORT}}` or just leaving it — `envalid` reads `process.env.PORT` automatically. The current `env.ts` default of `5000` is overridden at runtime.

### 1.7 PORT Binding — One Code Change Required

Railway requires binding to `0.0.0.0` (not just `localhost`). Update `server/src/index.ts`:

```ts
// Before
app.listen(PORT, () => { ... });

// After
app.listen(PORT, '0.0.0.0', () => { ... });
```

This is required because Railway's internal network is IPv6 — binding only to `localhost` will cause **502 Application Failed to Respond** errors.

### 1.8 Add a Health Check Endpoint

Add to `server/src/app.ts` (or a dedicated route):

```ts
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});
```

Then in Railway: Service → **Settings** → **Health Check Path** → `/health`

### 1.9 Run Prisma Migrations

After the first deploy, run migrations against the Railway MySQL instance.

**Option A — Via Railway CLI (recommended):**

```bash
npm install -g @railway/cli
railway login
railway link   # select your project and service
cd server
railway run npx prisma migrate deploy
```

**Option B — Add as a one-time start command override:**

Temporarily set Start Command to:
```
npx prisma migrate deploy && node dist/index.js
```
Then revert to `node dist/index.js` after migrations apply.

**Option C — During build:**

Add to Build Command:
```
npm install && npm run build && npx prisma generate
```
And keep deploy migration in start command until migrations are stable.

> ⚠️ **Never run `prisma migrate dev` in production.** Use `prisma migrate deploy` only — it applies existing migrations without generating new ones.

### 1.10 Prisma — Binary Targets

Railway runs on Debian Linux. Add the binary target to `prisma/schema.prisma`:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

Re-run `npx prisma generate` locally after this change.

### 1.11 Puppeteer on Railway (PDF generation)

Puppeteer is in your dependencies and requires Chromium. Railway's free containers may not have the necessary system libraries. Options:

- **Add system dependencies** via a `Dockerfile` (most reliable):
  ```dockerfile
  FROM node:20-slim
  RUN apt-get update && apt-get install -y \
    chromium fonts-liberation libatk-bridge2.0-0 libgtk-3-0 \
    libnss3 libxss1 && rm -rf /var/lib/apt/lists/*
  ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
  COPY . .
  RUN npm ci && npm run build
  CMD ["npm", "start"]
  ```
- **Or use `@sparticuz/chromium`** (smaller serverless-compatible Chromium build)

### 1.12 Redis

Your `env.ts` includes `REDIS_URL`. If your app uses Redis (rate limiting, sessions, caching), add a Redis service on Railway the same way as MySQL: **+ New → Redis**. Then reference it with `${{Redis.REDIS_URL}}`. If Redis is not actually used in production paths, you can leave the default (`redis://localhost:6379`) — it will throw a connection error only when that code path runs.

---

## Part 2 — Gmail SMTP Setup

### 2.1 Why App Password (not OAuth2)

Google removed Less Secure App access in May 2022. For a small internal project, **App Password** is the simplest approach. OAuth2 is only necessary for high-volume sending or Google Workspace delegated sending.

### 2.2 Generate an App Password

**Requirements:** 2-Step Verification must be enabled on the Google account.

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Under **"How you sign in to Google"**, click **2-Step Verification**
3. Scroll to the bottom → **App passwords**
4. Name it (e.g., `Wadera Backend`) → click **Create**
5. Copy the **16-character password** (displayed once, no spaces needed)

> ⚠️ This password is revoked if you change your Google account password. Generate a new one and update the env var.

### 2.3 Nodemailer Configuration

Your `env.ts` already has `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`. Set them to:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=youraddress@gmail.com
SMTP_PASS=abcdabcdabcdabcd    # 16 chars, no spaces
EMAIL_FROM=noreply@waderaassociates.com
```

In your Nodemailer transport (wherever it's configured in your codebase):

```ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,           // true for port 465 (TLS)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,  // App Password
  },
});
```

> **Port 587 alternative (STARTTLS):** Change `port: 587` and `secure: false`. Both work with Gmail. Port 465 is preferred.

### 2.4 Gmail Limits

| Limit | Value |
|---|---|
| Personal Gmail daily send limit | 500 recipients/24h |
| Google Workspace daily send limit | 2,000 recipients/24h |
| Sender address | Gmail always overwrites `From` with the authenticated address |

For transactional email at scale, migrate to [Resend](https://resend.com) (free: 100 emails/day, 3,000/month) or [Brevo](https://brevo.com) (free: 300 emails/day).

---

## Part 3 — AWS S3 Setup

### 3.1 Create an S3 Bucket

1. AWS Console → **S3** → **Create bucket**
2. **Bucket name:** e.g., `wadera-associates-uploads`
3. **Region:** `ap-south-1` (Mumbai) — matches your default `AWS_REGION`
4. **Block Public Access:** Keep **all four options enabled** (default)
5. **Versioning:** Optional, but useful for dataset files
6. Create the bucket

### 3.2 Add HTTPS-Only Bucket Policy

In the bucket → **Permissions** → **Bucket policy**, paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyHTTP",
    "Effect": "Deny",
    "Principal": "*",
    "Action": "s3:*",
    "Resource": [
      "arn:aws:s3:::wadera-associates-uploads",
      "arn:aws:s3:::wadera-associates-uploads/*"
    ],
    "Condition": {
      "Bool": { "aws:SecureTransport": "false" }
    }
  }]
}
```

This ensures all access is over HTTPS only.

### 3.3 Create an IAM User

1. AWS Console → **IAM** → **Users** → **Create user**
2. Name: `wadera-s3-app`
3. **Permissions:** Attach the following inline policy directly:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ObjectAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::wadera-associates-uploads/*"
    },
    {
      "Sid": "S3BucketAccess",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::wadera-associates-uploads"
    }
  ]
}
```

4. After creating the user → **Security credentials** tab → **Create access key**
5. Select **Application running outside AWS** → click through → copy:
   - `AWS_ACCESS_KEY_ID` (starts with `AKIA`)
   - `AWS_SECRET_ACCESS_KEY` (shown once only — save it immediately)

### 3.4 SDK Already Installed

Your `package.json` already has:
```
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
```

No additional installation needed.

### 3.5 How Presigned URLs Work (your current flow)

The SDK reads credentials from env vars automatically:

```ts
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION });

// Generate a time-limited download URL (e.g., for dataset purchases)
const downloadUrl = await getSignedUrl(
  s3,
  new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: 'datasets/oil-price-2024.xlsx',
  }),
  { expiresIn: 3600 }  // 1 hour; max 7 days for IAM user credentials
);

// Upload a file
await s3.send(new PutObjectCommand({
  Bucket: process.env.AWS_BUCKET_NAME,
  Key: 'uploads/profile-picture.jpg',
  Body: fileBuffer,
  ContentType: 'image/jpeg',
}));
```

---

## Part 4 — Dropping Razorpay (for now)

Your `env.ts` already has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` as optional with `default: ''`. Setting them to empty strings in Railway is sufficient — no code changes required unless your payment routes crash when these are empty.

Check that your payment routes are guarded:

```ts
// If Razorpay instance is created at startup, wrap it:
const razorpay = env.RAZORPAY_KEY_ID
  ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
  : null;
```

Any route that calls `razorpay.orders.create(...)` will fail if `razorpay` is null — add a guard:

```ts
if (!razorpay) {
  return res.status(503).json({ success: false, message: 'Payments are temporarily disabled.' });
}
```

---

## Part 5 — Complete Environment Variable Reference

All variables for Railway's Raw Editor (copy-paste ready):

```env
# ── Server ─────────────────────────────────────────────────────────────────
NODE_ENV=production
# PORT is injected by Railway automatically — do not set manually

# ── Database ───────────────────────────────────────────────────────────────
DATABASE_URL=${{MySQL.MYSQL_URL}}

# ── Auth ───────────────────────────────────────────────────────────────────
JWT_SECRET=<generate: openssl rand -hex 64>
JWT_EXPIRES_IN=7d

# ── Email (Gmail SMTP) ─────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=<16-char App Password>
EMAIL_FROM=noreply@waderaassociates.com

# ── AWS S3 ─────────────────────────────────────────────────────────────────
AWS_ACCESS_KEY_ID=<from IAM user>
AWS_SECRET_ACCESS_KEY=<from IAM user>
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=wadera-associates-uploads

# ── External APIs ──────────────────────────────────────────────────────────
EXCHANGE_RATE_API_KEY=<your key>
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest/INR
GEOLOCATION_API_KEY=<your key>
GEOLOCATION_API_URL=https://api.ipgeolocation.io/ipgeo

# ── Frontend ───────────────────────────────────────────────────────────────
FRONTEND_URL=https://wa-data-intel.netlify.app

# ── Payments (disabled) ────────────────────────────────────────────────────
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# ── Seed / Admin ───────────────────────────────────────────────────────────
DEVELOPER_ADMIN_EMAIL=admin@waderaassociates.com
DEVELOPER_ADMIN_PASSWORD=<a strong password>

# ── Logging ────────────────────────────────────────────────────────────────
LOG_LEVEL=info
```

---

## Part 6 — Deployment Checklist

### One-time setup
- [ ] Railway account created, GitHub connected
- [ ] MySQL service added to Railway project
- [ ] S3 bucket created (Mumbai region, public access blocked)
- [ ] IAM user `wadera-s3-app` created, access keys copied
- [ ] Gmail 2FA enabled, App Password generated
- [ ] All env vars set in Railway service Variables tab

### Code changes (before first deploy)
- [ ] `app.listen(PORT, '0.0.0.0', ...)` — bind to all interfaces
- [ ] `prisma/schema.prisma` — add `binaryTargets` for Debian
- [ ] Razorpay routes — null-guard when keys are empty
- [ ] `/health` endpoint returning DB ping

### After first deploy
- [ ] Run `railway run npx prisma migrate deploy`
- [ ] Run `railway run npm run seed` (if seed script is needed)
- [ ] Test `/health` endpoint returns 200
- [ ] Test email sending (OTP flow or contact form)
- [ ] Test S3 upload (profile picture or dataset upload)
- [ ] Update Netlify frontend env var: `VITE_API_URL=https://<your-railway-domain>/api`

---

## Part 7 — Render Alternative (if Railway credits run out)

Render free tier cannot use Gmail SMTP directly (ports 465/587 are blocked). If you move to Render:

1. **Email:** Switch to [Resend](https://resend.com) free tier (100 emails/day):
   - Install: `npm install resend`
   - `RESEND_API_KEY=re_...`
   - No SMTP needed — uses their REST API

2. **MySQL:** Use [Aiven](https://aiven.io) free tier MySQL (1 CPU, 1 GB RAM, 5 GB storage, no expiry) or [PlanetScale](https://planetscale.com) (MySQL-compatible, free tier available).
   - Set `DATABASE_URL` to the external provider's connection string

3. **Sleep behavior:** Add a `/health` ping to keep it awake (e.g., via UptimeRobot free tier pinging every 5 minutes) — though Render's ToS discourages this for free tier.

4. **Build/Start Commands on Render:**
   - Build: `npm install && npm run build && npx prisma generate`
   - Start: `npx prisma migrate deploy && node dist/index.js`
   - Health Check Path: `/health`
