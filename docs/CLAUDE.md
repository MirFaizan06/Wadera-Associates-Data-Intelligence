
# Data Selling Platform – Project Guide for Claude

## 1. Project Overview
We are building a full‑stack platform to sell time‑series datasets (e.g., global oil prices, electricity prices).  
Key features:
- Public website with free resources and paid datasets.
- User accounts (optional for guest checkout) with license‑based access control.
- Full admin panel with role‑based dashboards (Developer, Financial, Data, User, CMS managers).
- Licensing system that grants permissions (view, download, etc.) and can be time‑limited or device‑restricted.
- Monthly dataset updates via XLSX upload and inline data editing.
- Automatic generation of downloadable files (XLSX, CSV, PDF, PNG) on demand.
- Geolocation‑based pricing (base in INR, live currency conversion for display).
- Unit of measure (UOM) support with conversion.
- Email notifications (OTP, order confirmations, etc.) with editable HTML templates.

## 2. Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Material‑UI, shadcn/ui, Axios, Recharts (interactive charts)
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, MySQL
- **Authentication**: JWT (with optional device‑based session control)
- **Payments**: Razorpay
- **Emails**: Nodemailer (SMTP / SendGrid / SES)
- **File Storage**: AWS S3 (production), local disk (development)
- **Logging**: Winston (structured logging, rotated hourly)
- **Deployment**: Railway (backend), Netlify/Vercel (frontend) – separate services
- **External APIs**: Exchange rate API (for live currency conversion), geolocation API (for pricing)

## 3. Project Structure
```
/
├── client/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Public pages (Home, About, Contact, etc.)
│   │   ├── features/           # Feature‑based modules (auth, datasets, downloads)
│   │   ├── services/           # API client functions
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Helpers (currency conversion, UOM conversion)
│   │   ├── types/              # TypeScript interfaces shared with backend
│   │   ├── contexts/           # React context (auth, theme, etc.)
│   │   └── styles/             # Global CSS (Tailwind + custom)
│   └── package.json
│
├── server/                     # Express backend
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API route definitions
│   │   ├── middleware/         # Auth, role checks, license enforcement, validation
│   │   ├── services/           # Business logic (licenses, datasets, payments)
│   │   ├── models/             # Prisma client (generated)
│   │   ├── utils/              # Helpers (email, logging, file generation, conversions)
│   │   ├── types/              # TypeScript types (shared with frontend)
│   │   ├── jobs/               # Cron jobs (exchange rate updates, log rotation)
│   │   ├── templates/          # Email HTML templates (editable by admin)
│   │   └── prisma/             # Prisma schema and migrations
│   └── package.json
│
├── admin/                      # (Optional – if separate frontend for admin)  
│   └── ...                     # Could be a separate React app or part of client
│
├── .env.example                # Environment variables template
├── CLAUDE.md                   # This file
└── .claudeignore               # Files to exclude from Claude context
```

## 4. Key Conventions

### 4.1 Code Style
- TypeScript strictly typed; avoid `any`.
- Use functional React components with named exports.
- Prefer async/await over raw promises.
- Use `import`/`export` (ES modules).
- Follow existing ESLint and Prettier configurations.

### 4.2 File Naming
- React components: `ComponentName.tsx`
- Pages: `PageName.tsx` (e.g., `HomePage.tsx`)
- Hooks: `useHookName.ts`
- Services: `serviceName.ts` (e.g., `datasetService.ts`)
- Controllers: `controllerName.controller.ts`
- Routes: `routeName.routes.ts`
- Middleware: `middlewareName.middleware.ts`

### 4.3 API Routes
- All API endpoints prefixed with `/api/v1/`.
- Public endpoints: `/api/v1/public/...`
- Authenticated user endpoints: `/api/v1/user/...`
- Admin endpoints: `/api/v1/admin/[role]/...` (e.g., `/api/v1/admin/data/datasets`)
- Standard response format:
  - Success: `{ success: true, data: ... }`
  - Error: `{ success: false, error: { code: string, message: string } }`

### 4.4 Error Handling
- Centralized error‑handling middleware in Express.
- All operational errors should be caught and passed to the middleware.
- Use custom error classes (e.g., `LicenseError`, `PaymentError`).
- Log all errors (Winston) with appropriate severity.

### 4.5 Authentication & Authorization
- JWT tokens stored in HTTP‑only cookies (or localStorage fallback for guest checkout).
- Guest checkout: after purchase, generate a temporary token (email‑based) for download access.
- License checks performed in middleware before accessing protected dataset endpoints.
- Role‑based access control (RBAC) for admin panels – permissions defined in database (dynamic).
- Developer (super admin) can create/modify roles and assign permissions.

### 4.6 Database (Prisma)
- All foreign keys indexed.
- Use Prisma migrations for schema changes.
- Sensitive fields (passwords, tokens) never logged.
- Soft deletes where appropriate (e.g., `deletedAt`).
- Enums for license permissions, user roles, etc.

## 5. Database Schema Outline

```prisma
// User model
model User {
  id             String    @id @default(cuid())
  email          String    @unique
  passwordHash   String?   // null for guest users who later register
  fullName       String?
  roleId         String?   // assigned admin role (if any)
  licenses       LicenseAssignment[]
  purchases      Purchase[]
  downloads      DownloadLog[]
  sessions       Session[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime? // soft delete
}

// Session (for device tracking)
model Session {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  token         String   @unique
  deviceInfo    Json?    // browser, OS, IP (optional)
  lastActive    DateTime @default(now())
  expiresAt     DateTime
}

// Role (for admin RBAC)
model Role {
  id          String   @id @default(cuid())
  name        String   @unique // e.g., "DataManager", "FinancialManager"
  permissions Json     // array of permission strings ["view_datasets", "edit_datasets", ...]
  users       User[]
}

// License type (template)
model LicenseType {
  id          String   @id @default(cuid())
  name        String   // e.g., "View Only", "Download Enabled"
  permissions Json     // array of strings: ["VIEW", "DOWNLOAD", ...]
  maxDevices  Int?     // null for unlimited
  validDays   Int?     // null for perpetual
}

// License assignment (to a user)
model LicenseAssignment {
  id            String       @id @default(cuid())
  userId        String
  user          User         @relation(fields: [userId], references: [id])
  licenseTypeId String
  licenseType   LicenseType  @relation(fields: [licenseTypeId], references: [id])
  validFrom     DateTime
  validTo       DateTime?    // null = no expiry
  isActive      Boolean      @default(true)
  revokedAt     DateTime?
  revokedReason String?
  // Optional: apply to specific datasets? If null, applies to all.
  datasetIds    Json?        // array of dataset IDs, empty = all
}

// Time series dataset
model TimeSeries {
  id               String        @id @default(cuid())
  name             String
  description      String?
  defaultUnit      String        // e.g., "barrel", "kWh"
  priceINR         Float         // base price in INR
  isVisible        Boolean       @default(true)
  createdById      String
  createdBy        User          @relation("DatasetCreator", fields: [createdById], references: [id])
  dataPoints       DataPoint[]
  purchases        Purchase[]
  metadata         Json?         // additional info (source, region, etc.)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
}

// Individual data points (monthly values)
model DataPoint {
  id             String     @id @default(cuid())
  timeSeriesId   String
  timeSeries     TimeSeries @relation(fields: [timeSeriesId], references: [id])
  date           DateTime   // month/year
  value          Float      // the actual data value
  unitOverride   String?    // if different from default unit
  note           String?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  // uniqueness constraint: one data point per dataset per month
  @@unique([timeSeriesId, date])
}

// Purchase (order)
model Purchase {
  id             String     @id @default(cuid())
  userId         String?
  user           User?      @relation(fields: [userId], references: [id])
  guestEmail     String?    // for guest checkout
  timeSeriesId   String
  timeSeries     TimeSeries @relation(fields: [timeSeriesId], references: [id])
  amountINR      Float
  razorpayOrderId String?   @unique
  razorpayPaymentId String? @unique
  status         String     // "PENDING", "SUCCESS", "FAILED"
  purchasedAt    DateTime   @default(now())
  // After successful purchase, generate temporary download tokens or assign license?
}

// Download log
model DownloadLog {
  id             String   @id @default(cuid())
  userId         String?  // null if guest
  user           User?    @relation(fields: [userId], references: [id])
  guestEmail     String?
  timeSeriesId   String
  timeSeries     TimeSeries @relation(fields: [timeSeriesId], references: [id])
  format         String   // "XLSX", "CSV", "PDF", "PNG"
  downloadedAt   DateTime @default(now())
  ipAddress      String?
}

// Email log
model EmailLog {
  id        String   @id @default(cuid())
  type      String   // e.g., "OTP", "ORDER_CONFIRMATION", "DOWNLOAD_LINKS"
  recipient String
  subject   String
  status    String   // "SENT", "FAILED"
  error     String?
  sentAt    DateTime @default(now())
}

// Contact messages / feedback
model ContactMessage {
  id          String   @id @default(cuid())
  name        String
  email       String
  message     String
  status      String   // "NEW", "IN_PROGRESS", "RESOLVED"
  adminNotes  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Exchange rate cache (optional)
model ExchangeRate {
  id           String   @id @default(cuid())
  fromCurrency String   // e.g., "INR"
  toCurrency   String
  rate         Float
  updatedAt    DateTime @updatedAt
  @@unique([fromCurrency, toCurrency])
}

// Unit conversion factors (can be edited by admin)
model UnitConversion {
  id           String   @id @default(cuid())
  fromUnit     String
  toUnit       String
  factor       Float    // multiplication factor
  updatedAt    DateTime @updatedAt
  @@unique([fromUnit, toUnit])
}
```

## 6. Licensing System Details

- Licenses are **assigned to users** (not directly to datasets).
- Each license references a `LicenseType` which defines a set of permissions (e.g., `VIEW`, `DOWNLOAD`).
- The license may optionally be restricted to specific datasets (via `datasetIds` JSON field – if empty, applies to all datasets).
- License validity is controlled by `validFrom` / `validTo`.
- Device‑based restriction: enforce maximum concurrent sessions by checking `Session` records per user. When a new login occurs and limit is reached, expire the oldest session.
- License enforcement happens in middleware before accessing any protected dataset endpoint or download action.
- License revocation is soft (set `isActive = false`), with reason and timestamp.

## 7. Admin Panel Structure

Admins access separate dashboards under `/admin/[role]`. The backend uses role‑based middleware to allow/deny access to specific API routes.

- **Developer Admin** (`/admin/dev`): system health, logs (Winston), error rates, traffic analytics, user signup stats, server metrics, and full control over all settings (including role/permission management).
- **Financial Manager** (`/admin/finance`): revenue reports, payment logs, refunds (if allowed), order history, filters by date/dataset.
- **Data Manager** (`/admin/data`): CRUD for datasets, upload XLSX, append monthly data via modal, edit metadata, set visibility, manage UOM, generate previews.
- **User Manager** (`/admin/users`): manage user accounts, assign licenses, revoke/suspend, IP ban (global), view download logs, send emails.
- **CMS Manager** (`/admin/cms`): edit email templates (HTML), update static pages (Privacy Policy, T&C, About, Contact), change copyright year, manage contact messages.

Each admin role has a dedicated frontend module; permissions are stored in the `Role` model and can be modified by the Developer.

## 8. Environment Variables

Create a `.env` file with the following keys (example in `.env.example`):

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="mysql://user:pass@localhost:3306/dbname"

# JWT
JWT_SECRET="your-secret"
JWT_EXPIRES_IN="7d"

# Razorpay
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""

# Email (Nodemailer)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="noreply@example.com"

# AWS S3
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=""
AWS_BUCKET_NAME=""

# Exchange Rate API
EXCHANGE_RATE_API_KEY=""
EXCHANGE_RATE_API_URL="https://api.exchangerate-api.com/v4/latest/INR"

# Geolocation API (for pricing)
GEOLOCATION_API_KEY=""

# Frontend URL (for CORS, email links)
FRONTEND_URL="http://localhost:3000"
```

On startup, the backend should validate that all critical variables are present (fail fast).

## 9. Essential Commands

- **Install all dependencies**: `npm run install:all` (or `cd client && npm install && cd ../server && npm install`)
- **Run development servers**:
  - Backend: `cd server && npm run dev`
  - Frontend: `cd client && npm run dev`
- **Build for production**:
  - Backend: `cd server && npm run build`
  - Frontend: `cd client && npm run build`
- **Run tests**: `npm test` (if any)
- **Lint**: `npm run lint`
- **Format**: `npm run format`
- **Prisma migrations**: `cd server && npx prisma migrate dev --name init`
- **Seed database**: `cd server && npm run seed` (creates default roles, developer admin, etc.)
- **Generate/download files**: (triggered via API, not a direct command)

## 10. Additional Notes

### 10.1 Geolocation Pricing
- Use browser geolocation (with user consent) and IP fallback.
- Fetch exchange rates from a public API every hour (cron job) and cache in `ExchangeRate` table.
- On frontend, convert INR price to user’s local currency using cached rates.
- Provide a currency dropdown for manual override.

### 10.2 Unit of Measure (UOM) Conversion
- Each dataset has a `defaultUnit`.
- Conversion factors are stored in `UnitConversion` table and can be updated by admin.
- On dataset view, allow user to select target unit from a dropdown; convert values on the fly (backend or frontend).
- For downloaded files, optionally include a column with converted values based on user’s choice.

### 10.3 File Generation (On‑Demand)
- When a user requests download, the backend:
  - Fetches the relevant dataset data.
  - Generates the requested format (XLSX/CSV using `exceljs` or similar; PDF/PNG chart using Puppeteer to render a chart image).
  - Stores the file temporarily in S3 (or local disk) and returns a signed URL (expires in, say, 5 minutes).
  - Logs the download.
- Chart PNG should be a clean, professional snapshot of the data (simple line/bar chart). Use the same charting library as frontend (Recharts) in a headless browser.

### 10.4 Email Templates
- HTML templates stored in `server/src/templates/` as `.hbs` (Handlebars) or `.ejs` files.
- CMS Manager can edit them via admin UI (saved to database or file system). If saved to DB, the system reads from DB at runtime.
- Preview before saving is required.
- Supported events: OTP, welcome, order confirmation, payment success/failure, refund, download links, contact form auto‑reply, admin alerts.

### 10.5 Guest Checkout & Account Merging
- Guest purchases: after successful payment, generate a unique download token (short‑lived JWT) sent via email. User can access download page with that token.
- If guest later registers using the same email, link all guest purchases to the new user account (by matching email in `Purchase.guestEmail`).
- License assignments for guests: temporary license (e.g., 30 days) granted upon purchase, tied to the guest email. After registration, convert to user‑based license.

### 10.6 Logging & Monitoring (Developer Admin)
- Winston logs written to `logs/` directory, rotated hourly.
- Developer admin dashboard displays:
  - Real‑time log tail (latest errors)
  - Error rate graphs (using aggregated counts)
  - API response time percentiles
  - Active users / sessions
  - Database query performance (slow queries)
  - Server health (CPU, memory) – if deployed on Railway, may need external monitoring.
- No external log aggregation tools – all built in.

### 10.7 IP Banning
- Global IP ban list stored in database (e.g., `BannedIP` table).
- Middleware checks request IP against banned list; rejects with 403.
- User Manager can add/remove IPs.

### 10.8 Seeding Default Data
- Initial migration should create the five admin roles (Developer, Financial, Data, User, CMS) with predefined permissions.
- Create a default Developer admin user (email/password configurable via env).
- Seed basic license types: "View Only", "Download Enabled", "Full Access".


```