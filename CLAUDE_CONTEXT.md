# Claude Developer Context — Wadera Associates Data Intelligence Website

> Read this at the start of every new session to restore full project context.
> Last updated: 2026-03-27

---

## 1. What This Project Is

A full-stack **B2B data marketplace** where businesses can buy structured time-series datasets (energy prices, commodity rates, sector indices, etc.). Also has a free section for articles and PDFs. Built as a monorepo.

**Live frontend:** https://wa-data-intel.netlify.app
**GitHub:** https://github.com/MirFaizan06/Wadera-Associates-Data-Intelligence

**Team (from MOU):**
- **Faizan** — Technology Manager (building this)
- **Hamid** — Product & Data Development Lead
- **Rauf** — Finance, Compliance & Legal

---

## 2. Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router v6, React Hook Form + Zod, Recharts, Axios |
| i18n | react-i18next + i18next-http-backend + i18next-browser-languagedetector (12 languages) |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma v5, MySQL |
| Payments | Razorpay (**currently disabled** — keys set to empty strings) |
| Storage | Cloudflare R2 (prod) / local `public/uploads/` (dev) |
| Email | Nodemailer (Gmail SMTP via App Password) |
| Auth | JWT (httpOnly) + OTP email verification |
| Testing | Jest (server only) |
| Markdown | `marked` + `DOMPurify` (client-side rendering) |
| SEO | react-helmet-async (per-page meta) + JSON-LD structured data |

---

## 3. Monorepo Structure

```
/                          ← workspace root (npm workspaces)
├── client/                ← React frontend (Vite, port 3000 dev)
│   ├── public/
│   │   ├── locales/       ← i18n JSON files (en, zh, es, de, fr, pt, ru, ja, ar, hi, ko, id)
│   │   ├── faq-data.json  ← FAQ questions/answers for FAQChatBubble
│   │   ├── homepage_hero_imgs/  ← 5 hero slideshow images (1.png–5.png)
│   │   ├── images/        ← Optimized WebP assets (logo, illustrations)
│   │   ├── sitemap.xml    ← Static sitemap
│   │   ├── robots.txt     ← Points to sitemap.xml
│   │   └── _redirects     ← Netlify SPA redirect (/* /index.html 200)
│   └── src/
│       ├── App.tsx         ← All routes (React.lazy for every page)
│       ├── i18n.ts         ← i18next config (12 langs, localStorage detection only)
│       ├── pages/          ← All page components
│       ├── components/
│       │   ├── layout/     ← Navbar, Footer, PublicLayout, AdminLayout
│       │   │               ← PublicLayout includes FAQChatBubble
│       │   ├── ui/         ← Button, Input, Card, SettingsModal, FAQChatBubble, UserAvatar, LoadingSpinner
│       │   ├── datasets/   ← DatasetCard
│       │   └── payment/    ← PaymentModal
│       ├── contexts/       ← AuthContext, CurrencyContext
│       ├── lib/            ← api.ts (axios instance), utils.ts
│       └── types/          ← index.ts (all shared TypeScript interfaces)
│
├── server/                 ← Express backend (port 5000 dev)
│   ├── prisma/
│   │   └── schema.prisma   ← THE authoritative Prisma schema
│   └── src/
│       ├── config/env.ts   ← All env vars validated via envalid
│       ├── controllers/
│       ├── services/
│       ├── routes/
│       │   ├── public.routes.ts
│       │   ├── auth.routes.ts
│       │   ├── user.routes.ts
│       │   └── admin/  (cms, data, dev, finance, users)
│       ├── middleware/
│       ├── jobs/           ← Cron: exchange rates, OTP cleanup, session cleanup
│       └── utils/
│
├── docs/CLAUDE.md          ← Old/legacy context (superseded by this file)
├── BACKEND_DEPLOYMENT_GUIDE.md  ← Railway + Gmail SMTP + Cloudflare R2 deploy steps
├── SETUP.md                ← Full local developer setup guide
├── TESTING.md              ← Testing strategy and test commands
├── SAMPLE_CORRECT_FORMAT.xlsx   ← Correct XLSX format for dataset import
└── CLAUDE_CONTEXT.md       ← This file
```

---

## 4. Database Schema (All Models)

> Prisma CLI reads `server/prisma/schema.prisma`. TypeScript imports use `@prisma/client`.
> There is also `server/src/prisma/schema.prisma` — **keep both identical**.

### Models at a glance:
```
User               id, email, passwordHash, fullName, phone, profilePicture, roleId,
                   isEmailVerified, isActive, deletedAt
Session            id, userId, token, deviceInfo, ipAddress, lastActive, expiresAt
OtpCode            id, userId, email, code, type (REGISTER|LOGIN|RESET_PASSWORD), isUsed, expiresAt
Role               id, name (unique), permissions (Json)
LicenseType        id, name, description, permissions (Json), maxDevices, validDays
LicenseAssignment  id, userId, licenseTypeId, validFrom, validTo, isActive, revokedAt, datasetIds (Json)
TimeSeries         id, slug, name, description, defaultUnit, priceINR, isVisible, isFeatured,
                   category, tags (Json), source, region, metadata (Json), coverImage, createdById
DataPoint          id, timeSeriesId, date, value, unitOverride, note
Purchase           id, userId, guestEmail, timeSeriesId, amountINR, currency, amountDisplay,
                   razorpayOrderId, razorpayPaymentId, razorpaySignature,
                   status (PENDING|SUCCESS|FAILED|REFUNDED), downloadToken, downloadTokenExpiry
DownloadLog        id, userId, guestEmail, timeSeriesId, format (XLSX|CSV|PDF|PNG), ipAddress
EmailLog           id, type, recipient, subject, status (SENT|FAILED), error
ContactMessage     id, name, email, subject, message, status (NEW|IN_PROGRESS|RESOLVED), adminNotes, ipAddress
ExchangeRate       id, fromCurrency, toCurrency, rate
UnitConversion     id, fromUnit, toUnit, factor, label
BannedIP           id, ipAddress, reason, bannedBy
EmailTemplate      id, type (unique), subject, htmlBody, isActive, updatedBy
StaticPage         id, slug (unique), title, content (LongText HTML), metaTitle, metaDesc, updatedBy
FreeResource       id, slug (unique), title, summary, type (ARTICLE|PDF), content (LongText Markdown),
                   pdfUrl, category, tags (Json), author, coverImage, isPublished, createdById
```

---

## 5. i18n System

- **12 languages:** en, zh, es, de, fr, pt, ru, ja, ar, hi, ko, id
- **Translation files:** `client/public/locales/{lang}/translation.json`
- **Detection:** `localStorage` only — browser language is never auto-detected. First visit always falls back to English.
- **RTL languages:** `ar` only — handled via `RTL_LANGUAGES` array in `i18n.ts`
- **All public pages** are fully translated (nav, hero, datasets, about, contact, free data, auth, profile, purchases, download, settings, FAQ, footer)
- **Namespace:** `translation` (single namespace)

---

## 6. Key UI Components

### SettingsModal (`client/src/components/ui/SettingsModal.tsx`)
- Gear icon in Navbar (desktop right + mobile header)
- Two sections: Language (12 options) + Currency (8 options)
- Uses `Flag` component: `flagcdn.com` PNG images (NOT emoji — emoji don't render as flags on Windows)
- `LANGUAGE_FLAG_CODES`: maps language code → ISO country code for flagcdn
- `CURRENCY_META`: maps currency code → `{ flagCode, label }`
- `SettingsTooltip`: first-visit tooltip (localStorage key `wa_settings_tooltip_shown`), appears 1.5s after load, auto-closes at 6.5s
- `useFirstVisitTooltip()` hook manages tooltip visibility

### FAQChatBubble (`client/src/components/ui/FAQChatBubble.tsx`)
- Floating bottom-right chat bubble, loaded in `PublicLayout` (all public pages)
- Loads `/faq-data.json` (20 questions with answers and optional page links)
- Chat-style UI: list view → conversation view, typing indicator, `**bold**` markdown
- Fullscreen mode, pulse ring animation when closed

### CurrencyContext
- Supports: INR, USD, EUR, GBP, PKR, SAR, AED, JPY (8 currencies)
- Live exchange rates from backend; `formatAmount(price)` formats in selected currency
- Persisted in localStorage

### Hero Slideshow (HomePage)
- 5 images: `client/public/homepage_hero_imgs/1.png–5.png`
- 4.5s interval, 600ms crossfade, clickable progress dots
- Dual dim overlay: `bg-brand-navy/75` + gradient for text readability

---

## 7. All Implemented Pages & Features

### Public Website
| Route | Component | Notes |
|---|---|---|
| `/` | HomePage | Hero slideshow, stats, How It Works, features, data coverage section, featured datasets, CTA |
| `/datasets` | DatasetsPage | Paginated grid, search, category filter, sort |
| `/datasets/:slug` | DatasetDetailPage | Chart (Recharts, lazy-loaded), purchase, data preview |
| `/free-data` | FreeDataPage | Articles + PDFs, type filter, category pills |
| `/free-data/:slug` | FreeDataDetailPage | Markdown rendered, PDF download |
| `/about` | AboutPage | Standalone component (not DB-fetched) |
| `/contact` | ContactPage | Two-column layout, form |
| `/pages/privacy-policy` | PrivacyPolicyPage | Standalone (not DB) |
| `/pages/terms-of-service` | TermsPage | Standalone (not DB) |
| `/pages/:slug` | StaticPage | CMS-managed (DB) for other slugs |

### Auth
| Route | Notes |
|---|---|
| `/auth/login` | JWT login, redirect to `from` |
| `/auth/register` | OTP email verification flow |
| `/auth/verify-otp` | 6-digit OTP input |
| `/auth/forgot-password` | Send reset OTP |
| `/auth/reset-password` | Set new password via OTP |

### Protected User Pages
- `/profile` — ProfilePage (name, phone, avatar upload)
- `/purchases` — PurchasesPage (download links)
- `/download/:token` — DownloadPage (guests allowed)

### Admin Panel (`/admin/*`)
| URL | Role | Dashboard |
|---|---|---|
| `/admin/dev` | Developer | DevDashboard — system stats, users, roles, licenses, IPs, exchange rates |
| `/admin/finance` | FinancialManager | FinanceDashboard — revenue, purchases, refunds |
| `/admin/data` | DataManager | DataDashboard — datasets CRUD, XLSX import, cover images |
| `/admin/users` | UserManager | UsersDashboard — user management |
| `/admin/cms` | CMSManager | CmsDashboard — 4 tabs: Static Pages, Email Templates, Contact Messages, Free Resources |
| `/admin/profile` | Any admin | AdminProfilePage |

`AdminRoute` in App.tsx allows Developer role to bypass role-specific guards.

---

## 8. API Route Map

```
POST   /api/auth/register
POST   /api/auth/verify-otp
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/resend-otp

GET    /api/public/datasets
GET    /api/public/datasets/featured
GET    /api/public/datasets/categories
GET    /api/public/datasets/:slug          ← ?includeData=true returns dataPoints
GET    /api/public/pages/:slug
POST   /api/public/contact
GET    /api/public/free
GET    /api/public/free/categories
GET    /api/public/free/:slug

GET    /api/user/profile
PUT    /api/user/profile
POST   /api/user/profile/picture           ← multipart, field: "avatar"
GET    /api/user/purchases
GET    /api/user/licenses
POST   /api/user/purchases/:id/regenerate-token

POST   /api/payment/create-order           ← disabled while Razorpay keys empty
POST   /api/payment/verify
GET    /api/download/:token

GET    /api/admin/data/datasets
POST   /api/admin/data/datasets
PUT    /api/admin/data/datasets/:id
DELETE /api/admin/data/datasets/:id
POST   /api/admin/data/datasets/:id/data-points
POST   /api/admin/data/datasets/:id/import-xlsx      ← field: "file"
POST   /api/admin/data/datasets/:id/cover-image      ← field: "image"
GET    /api/admin/data/uom
POST   /api/admin/data/uom

GET/POST/PUT/DELETE /api/admin/cms/pages
GET/POST/PUT/DELETE /api/admin/cms/email-templates
GET/PUT             /api/admin/cms/contact/:id
GET/POST/PUT/DELETE /api/admin/cms/free-resources

GET/POST/PUT/DELETE /api/admin/dev/*       ← users, roles, licenses, IPs, exchange rates
GET                 /api/admin/finance/*
GET/PUT/DELETE      /api/admin/users/*

GET /health                                ← returns DB ping, used by Railway
```

---

## 9. SEO Implementation

- **react-helmet-async** manages all per-page `<title>`, `<meta>`, canonical, OG, Twitter tags
- **index.html** does NOT have a static `<meta name="description">` (removed to prevent duplicates)
- **Canonical domain:** `https://wa-data-intel.netlify.app` across all pages
- **Structured data (JSON-LD):** FAQPage + WebSite + Organization + DataCatalog (index.html) + Dataset (DatasetDetailPage)
- **DatasetDetailPage:** auto-generates keywords from `dataset.name`, `dataset.slug`, `dataset.category`, `dataset.defaultUnit`
- **Sitemap:** `client/public/sitemap.xml` (static, accessible at `/sitemap.xml`)
- **robots.txt:** `client/public/robots.txt` (points to sitemap, blocks /auth, /admin, /api)
- **recharts** is NOT in `manualChunks` — Vite auto-splits it only with DatasetDetailPage (lazy-loaded), never preloaded on homepage

---

## 10. Images & Assets

All source images in `client/public/`. WebP-optimized versions in `client/public/images/`. **Always use `/images/*.webp` in code.**

| File | Used in |
|---|---|
| `logo.webp` | Navbar, auth pages (h-16), favicon |
| `Homepage_Hero_Illustration.webp` | Deprecated (hero now uses slideshow) |
| `Browse_and_Discover.webp` | HomePage "How It Works" step 1 |
| `Purchase_Securely.webp` | HomePage "How It Works" step 2 |
| `Download_and_Use.webp` | HomePage "How It Works" step 3 |
| `About_Page_Hero_Illustration.webp` | AboutPage |
| `Contact_Page_Illustration.webp` | ContactPage |
| `Free_Data_Section_Illustration.webp` | FreeDataPage |
| `404_Page_Illustration.webp` | NotFoundPage |
| `No_Results_Found.webp` | DatasetsPage empty state |
| `No_Purchases_Yet.webp` | PurchasesPage empty state |
| `Dataset_Placeholder.webp` | DatasetCard fallback |
| `homepage_hero_imgs/1–5.png` | Hero slideshow (in `public/`, not `public/images/`) |

Team profile pictures: `client/public/team_profile_pics/faizan.jpg`, `hamid.jpg`, `rauf.jpg`

---

## 11. Environment Variables

All in `server/.env`. Validated at startup via `envalid` in `server/src/config/env.ts`.

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=mysql://user:pass@localhost:3306/dbname
JWT_SECRET=...
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=          # leave empty — payments disabled
RAZORPAY_KEY_SECRET=      # leave empty
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=youraddress@gmail.com
SMTP_PASS=<16-char App Password>
EMAIL_FROM=noreply@waderaassociates.com
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=wadera-associates-uploads
R2_PUBLIC_URL=https://pub-xxx.r2.dev          # or your custom R2 domain
EXCHANGE_RATE_API_KEY=...
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest/INR
GEOLOCATION_API_KEY=...
GEOLOCATION_API_URL=https://api.ipgeolocation.io/ipgeo
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
DEVELOPER_ADMIN_EMAIL=admin@waderaassociates.com   # REQUIRED — no default, server won't start without it
DEVELOPER_ADMIN_PASSWORD=ChangeMe@123              # REQUIRED — no default, set a strong password
LOG_LEVEL=info
```

---

## 12. Technical Gotchas

### Prisma v5
- `$on('query', ...)` — event param type is `never` in v5, cast: `(prisma as any).$on('query', ...)`
- Nullable JSON fields require `Prisma.JsonNull` not `null`: `datasetIds: value ?? Prisma.JsonNull`
- Run `prisma generate` from `server/` (not root, not `server/src/`)
- Binary targets for Railway/Linux: add `binaryTargets = ["native", "debian-openssl-3.0.x"]` in schema

### Two Schema Files
`server/prisma/schema.prisma` is what Prisma CLI reads. `server/src/prisma/schema.prisma` is what TypeScript imports reference. **Always edit both. They must be identical.**

### FLAG IMAGES — Do Not Use Emoji
Flag emoji (`🇬🇧`, `🇨🇳` etc.) do not render as flag images on Windows browsers — they appear as letter pairs. The `Flag` component in SettingsModal uses `flagcdn.com` PNG images instead. Never replace with emoji.

### JWT `expiresIn` type
`jsonwebtoken` newer types require `StringValue`. Workaround: `jwt.sign(payload, secret, { expiresIn: env.JWT_EXPIRES_IN as any })`

### React Hook Form + Zod
Must type the form: `useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })`. Without the generic, `errors.field.message` is typed as `unknown`.

### Tailwind CSS variables
`client/tailwind.config.js` has `extend.colors` with `border: 'hsl(var(--border))'` etc. Required because `globals.css` uses `@apply border-border`. Do not remove.

### exceljs buffer type
`workbook.xlsx.load(buffer)` requires `buffer as any` due to `Buffer<ArrayBufferLike>` vs `Buffer` incompatibility.

### PORT binding for Railway
`app.listen(PORT, '0.0.0.0', ...)` — must bind to all interfaces. Railway's internal network is IPv6; binding only to localhost causes 502 errors.

### Razorpay null-guard
Razorpay instance should be null when keys are empty. Any payment route must check `if (!razorpay) return res.status(503)...` before calling SDK methods.

### XLSX Import Format
Importer expects: Col A = `YYYY-MM` date, Col B = numeric value, Col C = optional note. See `SAMPLE_CORRECT_FORMAT.xlsx`.

---

## 13. Running the Project

```bash
# Install all workspaces from root
npm install --legacy-peer-deps

# Start backend (port 5000)
cd server && npm run dev

# Start frontend (port 3000)
cd client && npm run dev

# TypeScript checks
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit

# Build frontend
cd client && npm run build

# Run server tests
cd server && npm test
cd server && npm run test:coverage

# Prisma
cd server && npx prisma migrate dev --name <name>
cd server && npx prisma migrate deploy          # production only
cd server && npx prisma generate
cd server && npm run seed
```

---

## 14. Seed Data

```bash
cd server && npx prisma db seed
```

Creates:
- 5 roles: Developer, FinancialManager, DataManager, UserManager, CMSManager
- 1 admin user: `admin@waderaassociates.com` / `ChangeMe@123` (Developer role)
- 3 license types: Personal, Commercial, Enterprise
- Default email templates: OTP, WELCOME, ORDER_CONFIRMATION
- Static page slugs: about, privacy-policy, terms-of-service, contact
  - Note: About/Privacy/Terms are standalone React components now — DB seed content unused for those routes

---

## 15. Deployment

### Frontend — Netlify
- URL: https://wa-data-intel.netlify.app
- Auto-deploys from `master` branch
- `client/public/_redirects` handles SPA routing (`/* /index.html 200`)
- Build command: `cd client && npm run build`
- Publish directory: `client/dist`

### Backend — Railway (not yet deployed, guide written)
- See `BACKEND_DEPLOYMENT_GUIDE.md` for full steps
- MySQL add-on via Railway, Gmail SMTP via App Password, Cloudflare R2
- All deploy-required code changes are **already done**: PORT binding to `0.0.0.0`, Prisma `binaryTargets`, `nixpacks.toml` for Puppeteer, Razorpay null-guard
- Run `railway run npx prisma migrate deploy` after first deploy

---

## 16. Security Hardening (Applied)

All of these are in place as of 2026-03-27:

| What | Where | Detail |
|---|---|---|
| Rate limit on `/register` | `auth.routes.ts` | `loginLimiter` (10/15min) — was unguarded |
| Rate limit on `/reset-password` | `auth.routes.ts` | `otpLimiter` (5/10min) — was unguarded |
| Rate limit on `/contact` | `public.routes.ts` | `contactLimiter` (3/15min) — new limiter |
| Profile picture ext from mimetype | `auth.controller.ts` | Replaces `path.extname(originalname)` — prevents path-traversal via crafted filename |
| Cookie `maxAge` reduced | `auth.controller.ts` | 24 hours (was 7 days) |
| `DEVELOPER_ADMIN_EMAIL/PASSWORD` required | `config/env.ts` | No defaults — server won't start in prod without explicit values set |
| CSP tightened | `app.ts` | Removed `unsafe-inline` from `scriptSrc`; explicit `imgSrc` domains; removed Razorpay `frameSrc` |
| `SameSite: strict` cookies | `auth.controller.ts` | Already in place — mitigates CSRF |
| JWT verified + `deletedAt: null` checked | `auth.middleware.ts` | Already in place |
| IP ban middleware | `app.ts` | Already in place — runs before rate limiting |

---

## 17. Open Tasks

1. **Deploy backend** on Railway — follow `BACKEND_DEPLOYMENT_GUIDE.md`; all code changes are already done
2. **Re-enable Razorpay** — set keys in Railway env vars; null-guard already in payment.service.ts
3. **Redis** — if used in production paths, add Redis service on Railway
4. **Team profile pictures** — add `faizan.jpg`, `hamid.jpg`, `rauf.jpg` to `client/public/team_profile_pics/`
5. **Custom domain** — update all canonical URLs from `wa-data-intel.netlify.app` to the real domain when purchased

---

## 18. Root-Level Documents

| File | Purpose |
|---|---|
| `CLAUDE_CONTEXT.md` | This file — full session context |
| `BACKEND_DEPLOYMENT_GUIDE.md` | Railway + Gmail SMTP + Cloudflare R2 deployment steps |
| `SETUP.md` | Local developer setup guide |
| `TESTING.md` | Testing strategy and commands |
| `SAMPLE_CORRECT_FORMAT.xlsx` | Correct XLSX format for dataset import |
| `docs/CLAUDE.md` | Legacy context file (outdated, superseded by this file) |
