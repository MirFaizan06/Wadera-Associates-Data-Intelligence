# Claude Developer Context — Wadera Associates Data Intelligence Website

> Read this at the start of every new session to restore full project context.
> Last updated: March 2026 (images, 404 page, gitignore, docs)

---

## 1. What This Project Is

A full-stack **B2B data marketplace** where businesses can buy structured time-series datasets (energy prices, commodity rates, sector indices, etc.). Also has a free section for articles and PDFs. Built as a monorepo.

**Partners / Team (from signed MOU):**
- **Faizan** — Technology Manager (you're building this for him)
- **Hamid** — Product & Data Development Lead
- **Rauf** — Finance, Compliance & Legal

---

## 2. Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router v6, React Hook Form + Zod, Recharts, Axios |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma v5, MySQL |
| Payments | Razorpay |
| Storage | AWS S3 (prod) / local `public/uploads/` (dev) |
| Email | Nodemailer (SMTP) |
| Auth | JWT (httpOnly) + OTP email verification |
| Testing | Jest (server only) |
| Markdown | `marked` + `DOMPurify` (client-side rendering) |

---

## 3. Monorepo Structure

```
/                          ← workspace root
├── client/                ← React frontend (Vite)
│   ├── src/
│   │   ├── App.tsx        ← All routes defined here
│   │   ├── pages/         ← All page components
│   │   ├── components/
│   │   │   ├── layout/    ← Navbar, Footer, PublicLayout, AdminLayout
│   │   │   ├── ui/        ← Button, Input, Card, LoadingSpinner, UserAvatar
│   │   │   ├── datasets/  ← DatasetCard
│   │   │   └── payment/   ← PaymentModal
│   │   ├── contexts/      ← AuthContext, CurrencyContext
│   │   ├── lib/           ← api.ts (axios instance), utils.ts
│   │   └── types/         ← index.ts (all shared TypeScript interfaces)
│   ├── public/
│   │   ├── team_profile_pics/   ← Put faizan.jpg, hamid.jpg, rauf.jpg here
│   │   └── SAMPLE DATA...xlsx  ← User's original sample (wrong format)
│   └── tailwind.config.js ← Has CSS variable color mappings (important, see §9)
│
├── server/
│   ├── prisma/
│   │   └── schema.prisma  ← THE authoritative schema (Prisma CLI reads this)
│   └── src/
│       ├── prisma/
│       │   └── schema.prisma ← KEEP IN SYNC with server/prisma/schema.prisma
│       ├── config/env.ts   ← All env vars via envalid
│       ├── controllers/    ← HTTP request handlers
│       ├── services/       ← Business logic
│       ├── routes/
│       │   ├── public.routes.ts
│       │   ├── auth.routes.ts
│       │   ├── user.routes.ts
│       │   └── admin/
│       │       ├── cms.routes.ts
│       │       ├── data.routes.ts
│       │       ├── dev.routes.ts
│       │       ├── finance.routes.ts
│       │       └── users.routes.ts
│       ├── middleware/
│       ├── jobs/           ← Cron jobs: exchange rates, clean OTPs, clean sessions
│       └── utils/
│
├── SETUP.md               ← Full project setup guide
├── CLAUDE_CONTEXT.md      ← This file
├── XLSX_IMPORT_FORMAT.txt ← Data import format spec
├── SAMPLE_CORRECT_FORMAT.xlsx ← Working sample XLSX for import testing
└── prompts.md             ← Gemini image generation prompts for all UI assets
```

---

## 4. Database Schema (All Models)

> **Both** `server/prisma/schema.prisma` AND `server/src/prisma/schema.prisma` must be kept in sync. Prisma CLI reads from `server/prisma/` but TypeScript imports reference `server/src/prisma/`.

### Models at a glance:
```
User               id, email, passwordHash, fullName, phone, profilePicture, roleId, isEmailVerified, isActive, deletedAt
Session            id, userId, token, deviceInfo, ipAddress, lastActive, expiresAt
OtpCode            id, userId, email, code, type (REGISTER|LOGIN|RESET_PASSWORD), isUsed, expiresAt
Role               id, name (unique), permissions (Json)
LicenseType        id, name, description, permissions (Json), maxDevices, validDays
LicenseAssignment  id, userId, licenseTypeId, validFrom, validTo, isActive, revokedAt, datasetIds (Json)
TimeSeries         id, slug, name, description, defaultUnit, priceINR, isVisible, isFeatured, category, tags (Json), source, region, metadata (Json), coverImage, createdById
DataPoint          id, timeSeriesId, date, value, unitOverride, note
Purchase           id, userId, guestEmail, timeSeriesId, amountINR, currency, amountDisplay, razorpayOrderId, razorpayPaymentId, razorpaySignature, status (PENDING|SUCCESS|FAILED|REFUNDED), downloadToken, downloadTokenExpiry
DownloadLog        id, userId, guestEmail, timeSeriesId, format (XLSX|CSV|PDF|PNG), ipAddress
EmailLog           id, type, recipient, subject, status (SENT|FAILED), error
ContactMessage     id, name, email, subject, message, status (NEW|IN_PROGRESS|RESOLVED), adminNotes, ipAddress
ExchangeRate       id, fromCurrency, toCurrency, rate
UnitConversion     id, fromUnit, toUnit, factor, label
BannedIP           id, ipAddress, reason, bannedBy
EmailTemplate      id, type (unique), subject, htmlBody, isActive, updatedBy
StaticPage         id, slug (unique), title, content (LongText HTML), metaTitle, metaDesc, updatedBy
FreeResource       id, slug (unique), title, summary, type (ARTICLE|PDF), content (LongText Markdown), pdfUrl, category, tags (Json), author, coverImage, isPublished, createdById
```

### Pending DB migration (run when MySQL is available):
```bash
cd server
npx prisma migrate dev --name add_cover_image_free_resource
```
This will add `coverImage` to `TimeSeries` and create the `FreeResource` table.
The `profilePicture` and `isActive` fields on `User` also need migration if not yet applied.

---

## 5. Images & Assets

All source PNGs live in `client/public/`. Optimized WebP versions (compressed 87–100% smaller) are in `client/public/images/`. **Always reference `/images/*.webp` in code, never the raw PNGs directly.**

To regenerate WebP after adding new images:
```bash
node client/scripts/optimize-images.cjs
# (script is at: client/scripts/optimize-images.cjs, reads workspace root node_modules/sharp)
```

| File | Used in |
|---|---|
| `logo.webp` | Navbar (replaces BarChart3 icon) |
| `Homepage_Hero_Illustration.webp` | HomePage hero right column |
| `Browse_and_Discover.webp` | HomePage "How It Works" step 1 |
| `Purchase_Securely.webp` | HomePage "How It Works" step 2 |
| `Download_and_Use.webp` | HomePage "How It Works" step 3 |
| `About_Page_Hero_Illustration.webp` | AboutPage above team section |
| `Contact_Page_Illustration.webp` | ContactPage left column |
| `Free_Data_Section_Illustration.webp` | FreeDataPage hero right column |
| `404_Page_Illustration.webp` | NotFoundPage |
| `No_Results_Found.webp` | DatasetsPage empty state |
| `No_Purchases_Yet.webp` | PurchasesPage empty state |
| `Dataset_Placeholder.webp` | DatasetCard fallback thumbnail |

---

## 5. All Implemented Features

### Authentication
- Email + password registration with OTP email verification
- Login with JWT (stored in localStorage or cookie — check AuthContext)
- Forgot password / reset password via OTP email
- Profile page: update name, phone, profile picture (avatar upload)
- `UserAvatar` component with image + initials fallback

### Public Website
- **Homepage** (`/`): Hero with CTA, featured datasets, how-it-works, stats
- **Datasets** (`/datasets`): Paginated grid with search, category filter, sort. Each card shows cover image thumbnail (falls back to placeholder icon if no coverImage set)
- **Dataset Detail** (`/datasets/:slug`): Full info, data preview chart, purchase button
- **Free Data** (`/free-data`): Listing with type filter (ALL/ARTICLE/PDF) and category pills
- **Free Data Detail** (`/free-data/:slug`): Markdown rendered to HTML (via `marked` + DOMPurify), PDF download banner for PDF type
- **About** (`/about`): Full component — hero, mission, values, **About illustration**, **team section with 3 member cards**, structure, CTA
- **Contact** (`/contact`): Two-column layout — illustration + contact info left, form right
- **Privacy Policy** (`/pages/privacy-policy`): Full standalone React component (NOT fetched from DB)
- **Terms of Service** (`/pages/terms-of-service`): Full standalone React component (NOT fetched from DB)
- **Static Pages** (`/pages/:slug`): Generic CMS-managed pages fetched from DB (for other slugs)
- **Purchases** (`/purchases`): User's purchase history with download links
- **Download** (`/download/:token`): Token-based file download (for guests too)

### Admin Panel (`/admin/*`)
Five role-based dashboards, all accessible via a single `AdminProfilePage`:

| URL | Role | Dashboard |
|---|---|---|
| `/admin/dev` | Developer | DevDashboard — full system stats, user/role/license management, IP banning, exchange rates |
| `/admin/finance` | FinancialManager | FinanceDashboard — purchases, revenue, refunds |
| `/admin/data` | DataManager | DataDashboard — create datasets, import XLSX, append data points, **upload cover images** |
| `/admin/users` | UserManager | UsersDashboard — manage users, activate/deactivate |
| `/admin/cms` | CMSManager | CmsDashboard — 4 tabs: Static Pages, Email Templates, Contact Messages, **Free Resources** |
| `/admin/profile` | Any admin | AdminProfilePage — shared profile editor |

`AdminRoute` in `App.tsx` allows Developer role to access all admin routes.

### Dataset Cover Images (Thumbnails)
- Only for paid datasets (TimeSeries), not FreeResource
- Upload via `POST /admin/data/datasets/:id/cover-image` (multipart, field name: `image`)
- **Local dev**: saved to `server/public/uploads/datasets/{id}.{ext}`, served at `/uploads/datasets/`
- **Production (S3)**: uploaded to `datasets/covers/{id}.{ext}`, URL stored as public S3 URL
- Stored as `coverImage String?` on `TimeSeries`
- DatasetCard shows thumbnail with hover zoom; fallback is a gradient box with BarChart2 icon
- Admin table shows a small 32×32 thumbnail preview per row

### Free Resources (CMS)
- Two types: `ARTICLE` (markdown content) and `PDF` (pdfUrl field)
- Markdown typed in admin textarea → rendered on frontend with `marked` + `DOMPurify`
- Admin CMS tab: create, edit, publish/unpublish, delete
- Public routes: `GET /public/free`, `GET /public/free/categories`, `GET /public/free/:slug`
- Admin routes under `POST/PUT/DELETE /admin/cms/free-resources`

### Payments
- Razorpay integration: create order → Razorpay checkout → verify signature → issue download token
- Guest purchases (no account needed) via email
- Download tokens are single-use with expiry

### Background Jobs (cron)
- Exchange rate refresh (periodic)
- OTP cleanup (expired codes)
- Session cleanup (expired sessions)

---

## 6. API Route Map

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
GET    /api/public/datasets/:slug
GET    /api/public/pages/:slug
GET    /api/public/contact          ← not used; contact is POST
POST   /api/public/contact
GET    /api/public/free
GET    /api/public/free/categories
GET    /api/public/free/:slug

GET    /api/user/profile
PUT    /api/user/profile
POST   /api/user/profile/picture
GET    /api/user/purchases
GET    /api/user/licenses
POST   /api/user/purchases/:id/regenerate-token

POST   /api/payment/create-order
POST   /api/payment/verify
GET    /api/download/:token

GET    /api/admin/data/datasets
POST   /api/admin/data/datasets
PUT    /api/admin/data/datasets/:id
DELETE /api/admin/data/datasets/:id
POST   /api/admin/data/datasets/:id/data-points
POST   /api/admin/data/datasets/:id/import-xlsx   ← file field: "file"
POST   /api/admin/data/datasets/:id/cover-image   ← file field: "image"
GET    /api/admin/data/uom
POST   /api/admin/data/uom

GET/POST/PUT/DELETE /api/admin/cms/pages/:id
GET/POST/PUT/DELETE /api/admin/cms/email-templates/:id
GET/PUT             /api/admin/cms/contact/:id
GET/POST/PUT/DELETE /api/admin/cms/free-resources/:id

GET/POST/PUT/DELETE /api/admin/dev/* ← users, roles, licenses, IPs, etc.
GET                 /api/admin/finance/*
GET/PUT/DELETE      /api/admin/users/*
```

---

## 7. Frontend Routes

```
/                          HomePage
/datasets                  DatasetsPage
/datasets/:slug            DatasetDetailPage
/free-data                 FreeDataPage
/free-data/:slug           FreeDataDetailPage
/about                     AboutPage             ← standalone component
/contact                   ContactPage
/pages/privacy-policy      PrivacyPolicyPage     ← standalone component, NOT from DB
/pages/terms-of-service    TermsPage             ← standalone component, NOT from DB
/pages/:slug               StaticPage            ← fetches from DB (other slugs)

/auth/login
/auth/register
/auth/verify-otp
/auth/forgot-password
/auth/reset-password

/profile                   ProfilePage           (protected)
/purchases                 PurchasesPage         (protected)
/download/:token           DownloadPage          (token-based, guests allowed)

/admin/dev                 DevDashboard          (Developer only)
/admin/finance             FinanceDashboard      (FinancialManager | Developer)
/admin/data                DataDashboard         (DataManager | Developer)
/admin/users               UsersDashboard        (UserManager | Developer)
/admin/cms                 CmsDashboard          (CMSManager | Developer)
/admin/profile             AdminProfilePage      (any admin)
```

---

## 8. Important Technical Gotchas

### Prisma v5
- `$on('query', ...)` — event param type is `never` in v5. Must cast: `(prisma as any).$on('query', ...)`
- Nullable JSON fields require `Prisma.JsonNull` not `null`: `datasetIds: value ?? Prisma.JsonNull`
- Run `prisma generate` from `server/` directory (not root, not `server/src/`)

### Two Schema Files
`server/prisma/schema.prisma` is what Prisma CLI reads. `server/src/prisma/schema.prisma` is what TypeScript imports reference. **Always edit both.** They must be identical.

### JWT `expiresIn` type
`jsonwebtoken` newer types require `StringValue`. Workaround: `jwt.sign(payload, secret, { expiresIn: env.JWT_EXPIRES_IN as any })`

### React Hook Form + Zod
Must type the form: `useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })`. Without the generic, `errors.field.message` is typed as `unknown` causing TS errors.

### Tailwind CSS variables
`client/tailwind.config.js` has `extend.colors` with `border: 'hsl(var(--border))'` etc. These are required because `globals.css` uses `@apply border-border`. Removing them breaks the Vite build.

### npm workspace hoisting
`@types/react` hoists to root `node_modules`. If you see `@types/react` as an empty directory in `client/node_modules`, run `npm install --legacy-peer-deps` inside `client/`.

### exceljs buffer type
`workbook.xlsx.load(buffer)` requires `buffer as any` due to `Buffer<ArrayBufferLike>` vs `Buffer` incompatibility in newer TypeScript.

### Static file serving (local dev)
`server/src/app.ts` serves:
- `server/public/uploads/` at `/uploads/` — for user avatars and dataset cover images
Add more static paths here if needed.

### XLSX Import Format
Importer expects: Col A = YYYY-MM date, Col B = numeric value, Col C = optional note.
The user's original sample file has 2 empty columns before data — it's in the wrong format.
See `XLSX_IMPORT_FORMAT.txt` and `SAMPLE_CORRECT_FORMAT.xlsx` for the correct layout.

---

## 9. Seed Data

Run seed (requires DB to be running):
```bash
cd server
npx prisma db seed
```

Seeds:
- 5 roles: Developer, FinancialManager, DataManager, UserManager, CMSManager
- 1 admin user: `admin@waderaassociates.com` / `ChangeMe@123` (role: Developer)
- 3 license types: Personal, Commercial, Enterprise
- Static pages: about, privacy-policy, terms-of-service, contact
  - Note: About/Privacy/Terms are now rendered as standalone React components.
    The DB seed content still exists but is not used for those routes.
    Only the `contact` slug is still used by StaticPage.
- 3 default email templates: OTP, WELCOME, ORDER_CONFIRMATION

---

## 10. Environment Variables

All in `server/.env`. Key ones:
```
DATABASE_URL=mysql://...
JWT_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
SMTP_HOST= / SMTP_PORT= / SMTP_USER= / SMTP_PASS=
AWS_ACCESS_KEY_ID= / AWS_SECRET_ACCESS_KEY= / AWS_REGION= / AWS_BUCKET_NAME=
EXCHANGE_RATE_API_KEY=
FRONTEND_URL=http://localhost:5173  (or 3000)
DEVELOPER_ADMIN_EMAIL=admin@waderaassociates.com
DEVELOPER_ADMIN_PASSWORD=ChangeMe@123
```
See `SETUP.md` for full reference table.

---

## 11. Running the Project

```bash
# From root — install all workspaces
npm install --legacy-peer-deps

# Start backend (port 5000)
cd server && npm run dev

# Start frontend (port 5173)
cd client && npm run dev

# Run server tests
cd server && npm test
cd server && npm run test:coverage

# Build frontend
cd client && npm run build

# TypeScript check (no emit)
cd server && npx tsc --noEmit -p tsconfig.json
cd client && npx tsc --noEmit
```

---

## 12. Assets & Illustrations

`prompts.md` at root contains Gemini image generation prompts for:
- Logo / brand mark (icon-only + wordmark variants)
- Homepage hero illustration
- "How It Works" 3-icon set
- About page illustration
- Contact page illustration
- Free Data section illustration
- Empty state illustrations (no results, no purchases)
- 404 page illustration
- Default dataset thumbnail placeholder

Team profile pictures go in `client/public/team_profile_pics/`:
- `faizan.jpg`, `hamid.jpg`, `rauf.jpg`
- About page gracefully falls back to initial-letter avatar if files missing.

---

## 13. Root-Level Documents

| File | Purpose |
|---|---|
| `SETUP.md` | Full developer setup guide (prerequisites, env, DB, running) |
| `CLAUDE_CONTEXT.md` | This file — developer context for new sessions |
| `PLATFORM_OVERVIEW.md` | Non-technical client-facing platform explanation |
| `XLSX_IMPORT_FORMAT.txt` | Data import format spec for the data manager |
| `SAMPLE_CORRECT_FORMAT.xlsx` | Working sample XLSX for import testing |
| `prompts.md` | Gemini image generation prompts for all UI assets |

---

## 14. What Still Needs Doing (Open Tasks)

1. **Run Prisma migration** when MySQL is online:
   ```bash
   cd server
   npx prisma migrate dev --name add_cover_image_free_resource
   ```
   This creates the `FreeResource` table and adds `coverImage` to `TimeSeries`.
   Also applies `profilePicture` and `isActive` to `User` if not yet done.

2. **Add team profile pictures** to `client/public/team_profile_pics/` — `faizan.jpg`, `hamid.jpg`, `rauf.jpg`.

3. **Generate and add illustrations** — use prompts in `prompts.md` with Gemini. Suggested placements once assets exist:
   - Hero: replace/augment the current text-only hero section
   - About page: add illustration above the team section
   - Contact page: add beside the contact form

4. **Configure external services** for production (see `SETUP.md`): Razorpay keys, SMTP credentials, AWS S3, ExchangeRate API key.

5. **Reformat sample XLSX** if user wants to test the data importer — see `XLSX_IMPORT_FORMAT.txt`.

6. **Footer links** — verify `Privacy Policy` and `Terms of Service` links in Footer point to `/pages/privacy-policy` and `/pages/terms-of-service`.

---

## 14. File Decisions to Remember

- **`AboutPage.tsx`** — Standalone React component, no DB fetch. Team hardcoded in `TEAM` array.
- **`PrivacyPolicyPage.tsx`** — Standalone. Route: `/pages/privacy-policy`. Specific route defined before the generic `/pages/:slug` in App.tsx.
- **`TermsPage.tsx`** — Standalone. Route: `/pages/terms-of-service`.
- **`StaticPage.tsx`** — Still used for any other `/pages/:slug` routes managed via CMS.
- **`DatasetCard.tsx`** — Shows `coverImage` thumbnail if present. Falls back to gradient placeholder with icon.
- **`CmsDashboard.tsx`** — 4 tabs: Static Pages | Email Templates | Contact Messages | Free Resources. Markdown preview button in Free Resources tab.
- **`DataDashboard.tsx`** — "Cover" button per dataset row opens an image upload panel. Tiny thumbnail shown in table.
- **`AdminProfilePage.tsx`** — Single profile page for all 5 admin roles. Role detected from `user.role.name`.
- **`freeResource.service.ts`** — Auto-generates slugs from title. `getPublishedBySlug` checks `isPublished: true`.
- **`dataset.service.ts`** — `getPublicDatasets` select now includes `coverImage`. `updateCoverImage(id, url)` is a dedicated function.
