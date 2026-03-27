# Wadera Associates — Data Intelligence Platform

A full-stack B2B data marketplace for buying and downloading structured time-series datasets (energy prices, commodity rates, financial indicators, etc.).

**Live site:** https://wa-data-intel.netlify.app

---

## What It Is

Businesses and professionals can:
- Browse a catalog of premium time-series datasets across 8+ sectors
- Preview data charts and sample rows before purchasing
- Purchase datasets with a one-time payment (no subscription)
- Instantly download in **XLSX, CSV, PDF, or PNG chart** format
- Read free articles and download free PDFs — no account required

Admins can manage datasets, users, email templates, static pages, and free resources via five role-based dashboards.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router v6 |
| i18n | react-i18next — 12 languages (EN, ZH, ES, DE, FR, PT, RU, JA, AR, HI, KO, ID) |
| Charts | Recharts (lazy-loaded, only on dataset detail pages) |
| Forms | React Hook Form + Zod |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma v5 + MySQL |
| Auth | JWT (httpOnly) + OTP email verification |
| Email | Nodemailer — Gmail SMTP via App Password |
| Storage | AWS S3 (production) / local disk (development) |
| Payments | Razorpay (integrated, disabled — keys empty) |
| SEO | react-helmet-async, JSON-LD structured data, sitemap.xml |
| Deployment | Netlify (frontend) · Railway (backend, see deploy guide) |

---

## Project Structure

```
/
├── client/                 # React + Vite frontend
│   ├── public/
│   │   ├── locales/        # i18n translation files (12 languages)
│   │   ├── faq-data.json   # FAQ chatbot questions
│   │   ├── homepage_hero_imgs/   # Hero slideshow images
│   │   ├── images/         # Optimized WebP illustrations and logo
│   │   ├── sitemap.xml
│   │   └── robots.txt
│   └── src/
│       ├── App.tsx          # All routes (React.lazy for every page)
│       ├── i18n.ts          # i18next config
│       ├── pages/           # All page components
│       ├── components/
│       │   ├── layout/      # Navbar, Footer, PublicLayout, AdminLayout
│       │   ├── ui/          # SettingsModal, FAQChatBubble, Button, Card, etc.
│       │   ├── datasets/    # DatasetCard
│       │   └── payment/     # PaymentModal
│       └── contexts/        # AuthContext, CurrencyContext
│
├── server/                 # Express + Prisma backend
│   ├── prisma/schema.prisma
│   └── src/
│       ├── config/env.ts    # All env vars (envalid)
│       ├── controllers/
│       ├── services/
│       ├── routes/
│       ├── middleware/
│       ├── jobs/            # Cron jobs
│       └── utils/
│
├── BACKEND_DEPLOYMENT_GUIDE.md   # Railway + Gmail + S3 deploy guide
├── CLAUDE_CONTEXT.md             # Full developer context for AI sessions
├── SETUP.md                      # Local setup guide
└── TESTING.md                    # Testing strategy
```

---

## Local Development

### Prerequisites

- Node.js 20+
- MySQL 8 running locally
- npm 10+

### 1. Install

```bash
# From project root
npm install --legacy-peer-deps
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env — fill in DATABASE_URL, JWT_SECRET, SMTP_*, AWS_*, etc.
```

Key variables:
```env
DATABASE_URL=mysql://root:password@localhost:3306/wadera_db
JWT_SECRET=your-very-long-random-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=<16-char Gmail App Password>
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your-bucket
FRONTEND_URL=http://localhost:3000
```

See `SETUP.md` for the full reference table.

### 3. Database

```bash
cd server
npx prisma migrate dev --name init   # run migrations
npm run seed                          # seed roles, admin user, license types
```

Default admin: `admin@waderaassociates.com` / `ChangeMe@123`

### 4. Run

```bash
# Terminal 1 — backend (port 5000)
cd server && npm run dev

# Terminal 2 — frontend (port 3000)
cd client && npm run dev
```

### 5. Build

```bash
cd client && npm run build    # outputs to client/dist/
cd server && npm run build    # outputs to server/dist/
```

---

## Frontend Routes

| Route | Page |
|---|---|
| `/` | Homepage — hero slideshow, featured datasets, how-it-works |
| `/datasets` | Dataset catalog — search, filter, sort |
| `/datasets/:slug` | Dataset detail — chart, preview, purchase |
| `/free-data` | Free resources — articles and PDFs |
| `/free-data/:slug` | Free resource detail |
| `/about` | About page |
| `/contact` | Contact form |
| `/pages/privacy-policy` | Privacy Policy |
| `/pages/terms-of-service` | Terms of Service |
| `/auth/*` | Login, Register, OTP, Forgot/Reset Password |
| `/profile` | User profile (protected) |
| `/purchases` | Purchase history + downloads (protected) |
| `/download/:token` | Dataset download (guests allowed) |
| `/admin/dev` | Developer dashboard |
| `/admin/finance` | Finance dashboard |
| `/admin/data` | Data manager dashboard |
| `/admin/users` | User manager dashboard |
| `/admin/cms` | CMS dashboard (pages, emails, free resources) |

---

## API Overview

All endpoints prefixed with `/api`. Key groups:

- `POST /api/auth/*` — register, login, OTP, password reset
- `GET  /api/public/*` — datasets, free resources, static pages (no auth)
- `GET/PUT /api/user/*` — profile, purchases (JWT required)
- `POST /api/payment/*` — create order, verify (Razorpay, currently disabled)
- `GET  /api/download/:token` — file download
- `GET/POST/PUT/DELETE /api/admin/*` — role-gated admin endpoints
- `GET  /health` — health check (returns DB ping)

---

## Internationalization

12 supported languages with flag images (via flagcdn.com):

| Code | Language |
|---|---|
| `en` | English (default) |
| `zh` | 中文 |
| `es` | Español |
| `de` | Deutsch |
| `fr` | Français |
| `pt` | Português |
| `ru` | Русский |
| `ja` | 日本語 |
| `ar` | العربية |
| `hi` | हिन्दी |
| `ko` | 한국어 |
| `id` | Bahasa Indonesia |

Language and currency preferences are stored in `localStorage`. First visit always defaults to English.

---

## Currencies

8 currencies supported with live exchange rates: **INR, USD, EUR, GBP, PKR, SAR, AED, JPY**

---

## Deployment

### Frontend (Netlify)

- Connect repo to Netlify
- Build command: `cd client && npm run build`
- Publish directory: `client/dist`
- `client/public/_redirects` handles SPA routing

### Backend (Railway)

All deploy-required code changes are already in place (PORT binding, Prisma binaryTargets, nixpacks.toml for Puppeteer). See **[BACKEND_DEPLOYMENT_GUIDE.md](BACKEND_DEPLOYMENT_GUIDE.md)** for complete step-by-step instructions covering:
- Railway project setup + MySQL add-on
- Gmail SMTP App Password configuration
- AWS S3 bucket + IAM setup
- Environment variables (Railway raw editor format)
- Prisma migration on first deploy (`railway run npx prisma migrate deploy`)

---

## Testing

```bash
cd server && npm test
cd server && npm run test:coverage
```

See `TESTING.md` for the full testing strategy.

---

## Team

| Name | Role |
|---|---|
| Faizan | Technology Manager |
| Hamid | Product & Data Development Lead |
| Rauf | Finance, Compliance & Legal |

---

## License

All platform code, datasets, and intellectual property are jointly owned by the partners under the Wadera Associates venture. See Terms of Service for usage terms.
