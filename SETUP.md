# Wadera Associates — Data Intelligence Platform
## Complete Setup Guide

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Install](#2-clone--install)
3. [Environment Configuration](#3-environment-configuration)
4. [External Services Setup](#4-external-services-setup)
   - [MySQL Database](#41-mysql-database)
   - [Razorpay (Payments)](#42-razorpay-payments)
   - [SMTP Email](#43-smtp-email)
   - [AWS S3 (File Storage — Production Only)](#44-aws-s3-file-storage--production-only)
   - [ExchangeRate API](#45-exchangerate-api)
   - [Geolocation API (Optional)](#46-geolocation-api-optional)
5. [Database Setup](#5-database-setup)
6. [Run Development Servers](#6-run-development-servers)
7. [Default Admin Credentials](#7-default-admin-credentials)
8. [Admin Panel Access](#8-admin-panel-access)
9. [Project Structure](#9-project-structure)
10. [Running Tests](#10-running-tests)
11. [Building for Production](#11-building-for-production)
12. [Production Deployment](#12-production-deployment)
13. [Environment Variables Reference](#13-environment-variables-reference)

---

## 1. Prerequisites

Install the following before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18.x or 20.x LTS | https://nodejs.org |
| npm | 9+ (bundled with Node) | — |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/mysql/ |
| Git | any | https://git-scm.com |

> **Optional:** Redis 7+ for rate-limiting/caching. The app runs without it in development — rate limiting falls back gracefully.

**Verify your environment:**

```bash
node --version    # v18.x or v20.x
npm --version     # 9.x+
mysql --version   # 8.0+
```

---

## 2. Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd wadera-data-platform

# Install all dependencies (root + client + server) in one step
npm run install:all
```

> **Note:** If `install:all` fails on peer dependency conflicts, run each individually:
> ```bash
> cd server && npm install --legacy-peer-deps
> cd ../client && npm install --legacy-peer-deps
> ```

---

## 3. Environment Configuration

Copy the example environment file into the server directory:

```bash
cp .env.example server/.env
```

Open `server/.env` and fill in the values. The sections marked **[REQUIRED]** must be set before the app will start. Sections marked **[OPTIONAL]** have safe defaults for local development.

```env
# ── Core ─────────────────────────────────────────────────────
NODE_ENV=development                # [REQUIRED] development | production | test
PORT=5000                           # [OPTIONAL] API server port

# ── Database ─────────────────────────────────────────────────
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/wadera_db"  # [REQUIRED]

# ── JWT ──────────────────────────────────────────────────────
JWT_SECRET="replace-with-a-64-char-random-string"  # [REQUIRED]
JWT_EXPIRES_IN="7d"                                # [OPTIONAL]

# ── Razorpay ─────────────────────────────────────────────────
RAZORPAY_KEY_ID=""                  # [REQUIRED for payments]
RAZORPAY_KEY_SECRET=""              # [REQUIRED for payments]

# ── SMTP Email ───────────────────────────────────────────────
SMTP_HOST=""                        # [REQUIRED for email]
SMTP_PORT=587                       # [OPTIONAL]
SMTP_USER=""                        # [REQUIRED for email]
SMTP_PASS=""                        # [REQUIRED for email]
EMAIL_FROM="noreply@waderaassociates.com"  # [OPTIONAL]

# ── AWS S3 (production avatar storage) ───────────────────────
AWS_ACCESS_KEY_ID=""                # [OPTIONAL — dev uses local disk]
AWS_SECRET_ACCESS_KEY=""            # [OPTIONAL — dev uses local disk]
AWS_REGION="ap-south-1"             # [OPTIONAL]
AWS_BUCKET_NAME=""                  # [OPTIONAL]

# ── Exchange Rate API ────────────────────────────────────────
EXCHANGE_RATE_API_KEY=""            # [RECOMMENDED — free tier available]
EXCHANGE_RATE_API_URL="https://api.exchangerate-api.com/v4/latest/INR"

# ── Geolocation API ──────────────────────────────────────────
GEOLOCATION_API_KEY=""              # [OPTIONAL]
GEOLOCATION_API_URL="https://api.ipgeolocation.io/ipgeo"

# ── App URLs ─────────────────────────────────────────────────
FRONTEND_URL="http://localhost:3000"  # [OPTIONAL — must match client port]

# ── Redis ────────────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"  # [OPTIONAL]

# ── Seed Admin ───────────────────────────────────────────────
DEVELOPER_ADMIN_EMAIL="admin@waderaassociates.com"   # [OPTIONAL]
DEVELOPER_ADMIN_PASSWORD="ChangeMe@123"               # [REQUIRED — change in prod]

# ── Logging ──────────────────────────────────────────────────
LOG_LEVEL="info"                    # [OPTIONAL] error | warn | info | debug
```

**Generate a secure JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 4. External Services Setup

### 4.1 MySQL Database

**Create the database:**

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database and user
CREATE DATABASE wadera_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wadera'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON wadera_db.* TO 'wadera'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Update `server/.env`:**

```env
DATABASE_URL="mysql://wadera:your-strong-password@localhost:3306/wadera_db"
```

> The Prisma migration in Step 5 will create all tables automatically.

---

### 4.2 Razorpay (Payments)

The platform uses Razorpay for payment processing. Payments will not work without these credentials, but all other features (browsing, auth, admin panels) function normally without them.

**Steps to obtain API keys:**

1. Create an account at https://razorpay.com
2. Log in to the **Razorpay Dashboard**: https://dashboard.razorpay.com
3. Navigate to: **Account & Settings → Website & App Settings → API Keys**
4. Click **Generate Test Key** (for development)
5. Copy the **Key ID** (`rzp_test_...`) and **Key Secret**

**For test mode** (development/staging):
- Key ID format: `rzp_test_XXXXXXXXXXXX`
- Use Razorpay's test card numbers to simulate payments (no real money moves)
- Test card: `4111 1111 1111 1111`, any future expiry, any CVV

**For live mode** (production):
- Complete Razorpay KYC verification first
- Navigate to: **Account & Settings → API Keys → Live**
- Click **Generate Live Key**
- Live key format: `rzp_live_XXXXXXXXXXXX`

**Update `server/.env`:**

```env
RAZORPAY_KEY_ID="rzp_test_XXXXXXXXXXXX"
RAZORPAY_KEY_SECRET="your_key_secret_here"
```

> **Important:** Never commit real `rzp_live_` keys to version control.

---

### 4.3 SMTP Email

The platform sends OTP codes, welcome emails, and order confirmations via SMTP. Auth flows requiring OTP will not complete without SMTP configured.

**Option A — Gmail (quick setup for development):**

1. Enable 2-Step Verification on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app password for "Mail"

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your.email@gmail.com"
SMTP_PASS="your-16-char-app-password"
EMAIL_FROM="your.email@gmail.com"
```

**Option B — SendGrid (recommended for production):**

1. Create account at https://sendgrid.com
2. Navigate to: **Settings → API Keys → Create API Key**
3. Grant "Full Access" or "Mail Send" permission

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
```

**Option C — Amazon SES:**

1. Verify your sending domain in the SES console
2. Create SMTP credentials: **SES → SMTP Settings → Create SMTP Credentials**

```env
SMTP_HOST="email-smtp.ap-south-1.amazonaws.com"
SMTP_PORT=587
SMTP_USER="AKIAIOSFODNN7EXAMPLE"
SMTP_PASS="your-ses-smtp-password"
```

---

### 4.4 AWS S3 (File Storage — Production Only)

Used for **profile picture avatars** and **dataset cover images**.

In **development**, all uploads are saved to `server/public/uploads/` on local disk and served at `/uploads/` — no S3 needed.

In **production** (`NODE_ENV=production`), uploads go to S3. Skip this section for local development.

**Setup steps:**

1. Create an S3 bucket in the AWS Console
   - Region: `ap-south-1` (or your preferred region)
   - Block all public access: **disabled** (avatars need to be publicly readable)
2. Create an IAM user with programmatic access
3. Attach this inline policy to the IAM user:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

4. Add a bucket CORS policy to allow browser uploads:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "MaxAgeSeconds": 3000
  }
]
```

**Update `server/.env`:**

```env
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_REGION="ap-south-1"
AWS_BUCKET_NAME="wadera-avatars-prod"
```

---

### 4.5 ExchangeRate API

Used to display dataset prices in multiple currencies (USD, EUR, GBP, AED, etc.). Without this key, only INR pricing displays.

**Steps:**

1. Sign up (free tier available): https://www.exchangerate-api.com
2. After signup, your API key is shown on the dashboard immediately

```env
EXCHANGE_RATE_API_KEY="your-api-key-here"
EXCHANGE_RATE_API_URL="https://v6.exchangerate-api.com/v6/your-api-key-here/latest/INR"
```

> Free tier: 1,500 requests/month. Rates are cached server-side by a background job so actual usage is minimal.

---

### 4.6 Geolocation API (Optional)

Used by the admin IP Ban feature to display country information for banned IPs. Fully optional — the IP ban feature works without it.

**Steps:**

1. Sign up: https://ipgeolocation.io (free tier: 1,000 req/day)
2. Copy your API key from the dashboard

```env
GEOLOCATION_API_KEY="your-api-key-here"
```

---

## 5. Database Setup

Once MySQL is running and `DATABASE_URL` is set in `server/.env`, run:

```bash
cd server

# Run all migrations (creates all tables)
npx prisma migrate dev --name init

# Seed initial data:
#   → 5 admin roles (Developer, FinancialManager, DataManager, UserManager, CMSManager)
#   → 4 license types (View Only, Download Enabled, Full Access, Guest Temporary)
#   → 1 Developer admin account
#   → 6 unit conversions (barrel, kWh, ton, MMBtu, etc.)
#   → 5 email templates (OTP, Welcome, Order Confirmation, Password Reset, Contact Reply)
#   → Static pages seeded for generic CMS slugs (not About/Privacy/Terms — those are standalone React components)
npm run seed
```

> **Re-running seed:** The seed uses `upsert` so it is safe to run multiple times.

---

## 6. Run Development Servers

Open two terminal windows:

**Terminal 1 — Backend API (port 5000):**

```bash
cd server
npm run dev
```

**Terminal 2 — Frontend (port 3000):**

```bash
cd client
npm run dev
```

Visit: **http://localhost:3000**

API base: **http://localhost:5000/api/v1/**

Health check: **http://localhost:5000/health**

---

## 7. Default Admin Credentials

After seeding, a Developer admin account is created with full access to all admin panels.

| Field | Value |
|-------|-------|
| Email | `admin@waderaassociates.com` |
| Password | `ChangeMe@123` |
| Role | Developer (all permissions) |

> **Change the default password immediately** — either via the Admin Profile page (`/admin/profile`) or update `DEVELOPER_ADMIN_PASSWORD` in `.env` and re-run `npm run seed`.

---

## 8. Admin Panel Access

| Role | URL | Permissions |
|------|-----|-------------|
| Developer | http://localhost:3000/admin/dev | All — metrics, logs, settings, IP bans |
| Financial Manager | http://localhost:3000/admin/finance | Orders, payments, refunds |
| Data Manager | http://localhost:3000/admin/data | Datasets, data points, XLSX upload, UOM |
| User Manager | http://localhost:3000/admin/users | Users, licenses, download logs, IP bans |
| CMS Manager | http://localhost:3000/admin/cms | Email templates, static pages, contact messages, free resources |

**To create additional admin users:**

1. Register a regular account via http://localhost:3000/auth/register
2. Log in as Developer → Admin Panel → Users tab
3. Find the user → assign the desired admin role

---

## 9. Project Structure

```
wadera-data-platform/
├── client/                     # React 18 + Vite + TypeScript frontend
│   ├── public/
│   │   ├── images/             # Optimized WebP illustrations (logo, hero, illustrations, placeholders)
│   │   └── team_profile_pics/  # Partner profile photos (faizan.jpg, hamid.jpg, rauf.jpg)
│   ├── scripts/
│   │   └── optimize-images.cjs # Sharp image optimization script (PNG → WebP)
│   └── src/
│       ├── components/
│       │   ├── datasets/       # DatasetCard
│       │   ├── layout/         # Navbar, PublicLayout, AdminLayout
│       │   └── ui/             # Button, Card, UserAvatar, LoadingSpinner, etc.
│       ├── contexts/           # AuthContext, CurrencyContext
│       ├── pages/
│       │   ├── admin/          # DevDashboard, FinanceDashboard, DataDashboard,
│       │   │                   # UsersDashboard, CmsDashboard, AdminProfilePage
│       │   └── auth/           # LoginPage, RegisterPage, OtpPage, etc.
│       │   # Public: HomePage, DatasetsPage, DatasetDetailPage, AboutPage,
│       │   # ContactPage, FreeDataPage, FreeDataDetailPage, PurchasesPage,
│       │   # ProfilePage, DownloadPage, PrivacyPolicyPage, TermsPage,
│       │   # StaticPage, NotFoundPage
│       ├── lib/                # axios instance, cn() utility
│       └── types/              # TypeScript interfaces
│
├── server/                     # Express + TypeScript + Prisma backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (Prisma CLI reads this)
│   │   └── migrations/         # Migration history
│   ├── public/
│   │   └── uploads/            # Local dev file storage (avatars + cover images)
│   └── src/
│       ├── config/             # env.ts (environment validation)
│       ├── controllers/        # Request handlers (dataset, auth, cms, freeResource, etc.)
│       ├── middleware/         # auth, rateLimiter, errorHandler, ipBan, license
│       ├── routes/             # auth, public, user, admin/* route files
│       ├── services/           # Business logic (auth, dataset, license, payment, etc.)
│       ├── utils/              # prisma, logger, token, email, storage, errors
│       ├── jobs/               # Background cron jobs (OTP cleanup, exchange rates)
│       └── prisma/             # seed.ts + schema.prisma (TypeScript imports)
│
├── docs/                       # Phase documentation
├── .env.example                # Environment variable template
├── SETUP.md                    # This file
├── TESTING.md                  # Developer testing guide
├── PLATFORM_OVERVIEW.md        # Non-technical client-facing platform guide
├── CLAUDE_CONTEXT.md           # AI assistant context file
├── XLSX_IMPORT_FORMAT.txt      # Data import format specification
└── package.json                # Root workspace + convenience scripts
```

---

## 10. Running Tests

```bash
# From the project root
npm test

# Or from the server directory
cd server && npm test

# With coverage report
cd server && npm test -- --coverage

# Run a specific test file
cd server && npm test -- --testPathPattern="auth"
```

**Expected output:** 4 test suites, 30 tests — all passing.

Test suites:
- `auth.service.test.ts` — register, login, OTP verification, profile fetch
- `license.service.test.ts` — assign, revoke, expire, validate license
- `currency.test.ts` — INR→USD/EUR/GBP/AED conversions, unknown currency handling
- `slugify.test.ts` — slug generation, collision handling, special characters

---

## 11. Building for Production

**Backend:**

```bash
cd server
npm run build          # Compiles TypeScript → dist/
npm start              # Runs dist/index.js
```

**Frontend:**

```bash
cd client
npm run build          # Outputs to client/dist/
npm run preview        # Preview the production build locally
```

The frontend build is a static site — serve `client/dist/` from any CDN or static host (Vercel, Netlify, S3+CloudFront).

---

## 12. Production Deployment

### Backend — Railway / Render / EC2

1. Set all environment variables in the hosting platform's dashboard
2. Set `NODE_ENV=production`
3. Set `FRONTEND_URL` to your deployed frontend domain (for CORS)
4. Run migrations on the production database:
   ```bash
   npx prisma migrate deploy   # Does NOT prompt — safe for CI/CD
   npm run seed                # Only needed on first deploy
   ```

### Frontend — Vercel / Netlify

1. Build command: `npm run build`
2. Output directory: `dist`
3. No environment variables needed — the frontend uses relative `/api/` paths proxied by Vite in dev and handled by your reverse proxy in prod

### Reverse Proxy (Nginx example)

If hosting both on the same server, proxy `/api` to the backend:

```nginx
location /api/ {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location / {
    root /var/www/wadera/client/dist;
    try_files $uri $uri/ /index.html;
}
```

---

## 13. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Runtime environment |
| `PORT` | No | `5000` | API server port |
| `DATABASE_URL` | Yes | — | MySQL connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry duration |
| `RAZORPAY_KEY_ID` | For payments | — | Razorpay test/live key ID |
| `RAZORPAY_KEY_SECRET` | For payments | — | Razorpay test/live key secret |
| `SMTP_HOST` | For email | — | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP port (587=TLS, 465=SSL) |
| `SMTP_USER` | For email | — | SMTP username/email |
| `SMTP_PASS` | For email | — | SMTP password/app password |
| `EMAIL_FROM` | No | `noreply@waderaassociates.com` | Sender address |
| `AWS_ACCESS_KEY_ID` | Production only | — | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Production only | — | AWS IAM secret key |
| `AWS_REGION` | No | `ap-south-1` | AWS region |
| `AWS_BUCKET_NAME` | Production only | — | S3 bucket for avatars |
| `EXCHANGE_RATE_API_KEY` | Recommended | — | ExchangeRate API key |
| `EXCHANGE_RATE_API_URL` | No | exchangerate-api.com URL | Exchange rate endpoint |
| `GEOLOCATION_API_KEY` | Optional | — | IPGeolocation API key |
| `GEOLOCATION_API_URL` | No | ipgeolocation.io URL | Geolocation endpoint |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL for CORS + email links |
| `REDIS_URL` | Optional | `redis://localhost:6379` | Redis connection URL |
| `DEVELOPER_ADMIN_EMAIL` | No | `admin@waderaassociates.com` | Seed admin email |
| `DEVELOPER_ADMIN_PASSWORD` | No | `ChangeMe@123` | Seed admin password |
| `LOG_LEVEL` | No | `info` | Winston log level |

---

## Minimum Working Setup (Local Development)

To get the platform fully running locally with all core features, you only need:

```env
DATABASE_URL="mysql://wadera:password@localhost:3306/wadera_db"
JWT_SECRET="<64-char-random-string>"
RAZORPAY_KEY_ID="rzp_test_XXXXXXXXXXXX"
RAZORPAY_KEY_SECRET="<key-secret>"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your@gmail.com"
SMTP_PASS="<app-password>"
EXCHANGE_RATE_API_KEY="<api-key>"
```

Everything else uses the defaults listed above and works out of the box.
