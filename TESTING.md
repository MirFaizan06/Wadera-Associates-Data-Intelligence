# Developer Testing Guide — Wadera Associates Data Intelligence Platform

> **Scope**: Full manual + automated testing of all platform features.
> **Excluded**: OTP email delivery flow and Razorpay payment processing (require live credentials/sandbox accounts).

---

## Table of Contents

1. [Setup & Prerequisites](#1-setup--prerequisites)
2. [Automated Tests (Jest)](#2-automated-tests-jest)
3. [Backend API Testing (Auth)](#3-backend-api-testing-auth)
4. [Dataset Management (Admin – Data Manager)](#4-dataset-management-admin--data-manager)
5. [Licensing System](#5-licensing-system)
6. [Download Flow](#6-download-flow)
7. [Financial Manager Dashboard](#7-financial-manager-dashboard)
8. [User Manager Dashboard](#8-user-manager-dashboard)
9. [CMS Manager Dashboard](#9-cms-manager-dashboard) *(includes Free Resources)*
10. [Developer Dashboard](#10-developer-dashboard)
11. [Public Website & Catalog](#11-public-website--catalog) *(includes Free Data, 404 page)*
12. [Profile & Avatar](#12-profile--avatar)
13. [Admin Profile Pages](#13-admin-profile-pages)
14. [Currency Conversion](#14-currency-conversion)
15. [Unit of Measure Conversion](#15-unit-of-measure-conversion)
16. [IP Banning](#16-ip-banning)
17. [Session Management](#17-session-management)
18. [Security Checks](#18-security-checks)
19. [Error Handling](#19-error-handling)

---

## 1. Setup & Prerequisites

### 1.1 Environment

```bash
cp .env.example server/.env
# Edit server/.env:
# DATABASE_URL="mysql://root:pass@localhost:3306/wadera"
# JWT_SECRET="any-32-char-random-string-here!!"
# NODE_ENV=development
# PORT=5000
# FRONTEND_URL=http://localhost:3000
# All other keys can remain as placeholders for local dev
```

### 1.2 Install & Initialize

```bash
# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install

# Generate Prisma client & run migrations
cd ../server
npx prisma migrate dev --name init
npm run seed
```

**Expected seed output:**
```
Seeding roles: Developer, FinancialManager, DataManager, UserManager, CMSManager
Seeding license types: View Only, Download Enabled, Full Access, API Access
Seeding admin user: admin@waderaassociates.com
Seeding unit conversions...
Seeding email templates...
Seeding static pages...
Seed complete.
```

### 1.3 Start Servers

```bash
# Terminal 1
cd server && npm run dev
# Expect: "Server running on port 5000"

# Terminal 2
cd client && npm run dev
# Expect: Vite dev server at http://localhost:3000
```

### 1.4 Default Admin Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@waderaassociates.com | ChangeMe@123 | Developer |

> **First action**: change this password after first login.

---

## 2. Automated Tests (Jest)

```bash
cd server

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run individual test file
npm test -- auth.service.test.ts
```

### Expected Results

| Suite | Tests | Coverage |
|-------|-------|----------|
| `auth.service.test.ts` | 7 | register (conflict, success), login (not found, wrong pass, valid, unverified) |
| `license.service.test.ts` | 7 | checkLicense, assign, revoke |
| `currency.test.ts` | 4 | convertFromINR, getAllRates |
| `slugify.test.ts` | 7 | URL slug generation edge cases |

**All 30 tests should pass with zero failures.**

If tests fail:
- `Cannot find module '@prisma/client'` → run `npx prisma generate`
- `jest-mock-extended` errors → run `npm install` in server
- DB connection errors → tests use mocks; verify `setup.ts` is loaded via `setupFilesAfterFramework` in `jest.config.js`

---

## 3. Backend API Testing (Auth)

Use **HTTPie**, **Postman**, or **curl**. All endpoints at `http://localhost:5000/api/v1`.

### 3.1 Register

```bash
POST /auth/register
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "Test@1234",
  "fullName": "Test User"
}
```

**Expected**: `201` — `{ success: true, data: { message: "..." } }`
**Conflict**: Same email → `409 ConflictError`
**Weak password**: `"pass"` → `422 ValidationError`

### 3.2 Login (no OTP in dev if email not verified)

```bash
POST /auth/login
{ "email": "admin@waderaassociates.com", "password": "ChangeMe@123" }
```

**Expected**: `200` with HTTP-only cookie `token` set.
The Developer admin is seeded with `isEmailVerified: true` so login is immediate.

### 3.3 Get Profile

```bash
GET /auth/profile
Cookie: token=<from login>
```

**Expected**: `{ success: true, data: { id, email, fullName, phone, profilePicture, role, ... } }`

### 3.4 Update Profile

```bash
PUT /auth/profile
Cookie: token=<...>
{ "fullName": "Updated Name", "phone": "+91-9876543210" }
```

**Expected**: `200` — `{ success: true, data: { message: "Profile updated" } }`
Verify with GET /auth/profile that changes persisted.

### 3.5 Change Password

```bash
PUT /auth/change-password
Cookie: token=<...>
{ "oldPassword": "ChangeMe@123", "newPassword": "NewPass@999" }
```

**Expected**: `200`. All other sessions invalidated.
**Wrong old password**: `401 AuthError`

### 3.6 Forgot Password (flow — no email delivery tested)

```bash
POST /auth/forgot-password
{ "email": "testuser@example.com" }
```

**Expected**: `200` always (silent for non-existent email to prevent enumeration).

### 3.7 Logout

```bash
POST /auth/logout
```

**Expected**: `200`, cookie cleared.

### 3.8 Rate Limiting

Send 11 rapid login requests with wrong password:

```bash
for i in {1..11}; do
  curl -s -X POST http://localhost:5000/api/v1/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"x@x.com","password":"wrong"}' | jq .
done
```

**Expected**: First 10 → `401`. Request 11 → `429 Too Many Requests`.

---

## 4. Dataset Management (Admin – Data Manager)

Login as Developer or DataManager admin. All endpoints at `/api/v1/admin/data/`.

### 4.1 Create Dataset

```bash
POST /admin/data/datasets
Cookie: token=<...>
{
  "name": "Global Oil Prices 2024",
  "description": "Brent crude monthly averages",
  "defaultUnit": "USD/barrel",
  "priceINR": 1999.00,
  "category": "Energy",
  "tags": ["oil", "energy", "brent"],
  "isFeatured": true
}
```

**Expected**: `201` with dataset object including auto-generated `slug`.
**Duplicate name**: `409`

### 4.2 List Datasets (Admin)

```bash
GET /admin/data/datasets?page=1&limit=10
```

**Expected**: Paginated list with `{ data, total, page, limit }`.

### 4.3 Import Data Points via XLSX

Prepare a simple XLSX (see `XLSX_IMPORT_FORMAT.txt` for exact format):
- Column A: Date in `YYYY-MM` format (e.g. `2024-01`)
- Column B: Numeric value (e.g. `78.5`)
- Column C: Optional note

```bash
POST /admin/data/datasets/:id/import-xlsx
Cookie: token=<...>
Content-Type: multipart/form-data
file: @your-data.xlsx
```

**Expected**: `200` with `{ imported: N, skipped: M }`.
**Invalid format**: `.pdf` upload → `400`

### 4.4 Append Data Points (manual inline)

```bash
POST /admin/data/datasets/:id/data-points
Cookie: token=<...>
{ "date": "2024-02-01", "value": 79.3, "note": "February average" }
```

**Expected**: `201`. Re-posting same date → `409` (unique constraint).

### 4.5 Edit / Delete Dataset

```bash
PUT /admin/data/datasets/:id
{ "priceINR": 2499.00, "isFeatured": false }

DELETE /admin/data/datasets/:id   # soft delete (isVisible = false)
```

### 4.6 Upload Cover Image

```bash
POST /admin/data/datasets/:id/cover-image
Cookie: token=<...>
Content-Type: multipart/form-data
image: @thumbnail.jpg
```

**Expected**: `200` — dataset `coverImage` URL updated (local path in dev, S3 URL in prod).

UI test:
1. In Data Manager → dataset table, click **Cover** button on any row
2. Upload panel opens → select a JPG/PNG → click Upload
3. Small thumbnail appears in the table row immediately

### 4.7 UI Verification

1. Navigate to `http://localhost:3000/admin/data`
2. Click **+ New Dataset** → fill form → Save → dataset appears in table
3. Click **Import XLSX** → upload file → verify row count shown
4. Click a dataset → data points table with pagination
5. Toggle visibility → dataset disappears from public catalog
6. Datasets without a cover image show `Dataset_Placeholder.webp` thumbnail in the public catalog

---

## 5. Licensing System

### 5.1 Assign License (via User Manager)

```bash
POST /admin/users/licenses/assign
Cookie: token=<...>
{
  "userId": "<user-id>",
  "licenseTypeId": "<download-enabled-license-type-id>",
  "validFrom": "2024-01-01T00:00:00Z",
  "datasetIds": ["<dataset-id>"]  # empty array = all datasets
}
```

**Expected**: `201` with license assignment.

### 5.2 Check License Enforcement

Without license:
```bash
GET /user/datasets/:id/download/xlsx
Cookie: token=<user-without-license>
```
**Expected**: `403 LicenseError`

With valid license:
**Expected**: File download initiated.

### 5.3 Revoke License

```bash
DELETE /admin/users/licenses/:licenseId
Cookie: token=<...>
{ "reason": "Trial expired" }
```

**Expected**: `200`. Subsequent download attempt → `403`.

### 5.4 Expired License

Set `validTo` to a past date in the DB directly, then attempt download:
**Expected**: `403 LicenseError` — "License expired"

---

## 6. Download Flow

### 6.1 Authenticated User Download

1. Assign license with `DOWNLOAD` permission to a user
2. Login as that user
3. Visit dataset detail page → Download button visible
4. Select format (XLSX / CSV / PDF)

```bash
GET /user/datasets/:id/download/xlsx
Cookie: token=<...>
```

**Expected**: Binary file download with correct MIME type and filename.

### 6.2 Guest Token Download

After a purchase (simulated by creating a purchase record and calling the post-payment hook):

```bash
GET /download/:token
```

**Expected**: Download page shows format selector; clicking downloads file.

### 6.3 Format Verification

| Format | MIME Type | Extension |
|--------|-----------|-----------|
| XLSX | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `.xlsx` |
| CSV | `text/csv` | `.csv` |
| PDF | `application/pdf` | `.pdf` |

Verify:
- XLSX opens in Excel with branded header row
- CSV is UTF-8, comma-separated with header row
- PDF contains dataset name, date, data table, and Wadera Associates branding

### 6.4 Invalid / Expired Token

```bash
GET /download/invalid-token-here
```
**Expected**: `401` or redirect to error page.

### 6.5 Download Logging

After each download:
```bash
GET /admin/users/:userId/download-logs
Cookie: token=<admin>
```
**Expected**: Entry with format, timestamp, IP.

---

## 7. Financial Manager Dashboard

Login as Developer or FinancialManager admin.

### 7.1 Revenue Summary

```bash
GET /admin/finance/revenue
Cookie: token=<...>
```

**Expected**: `{ today, month, year, total, byDataset, monthlyChart }`

Verify UI at `http://localhost:3000/admin/finance`:
- 4 stat cards: Today / Month / Year / All-Time
- 12-month bar chart (Recharts)
- Revenue by dataset table

### 7.2 Orders List

```bash
GET /admin/finance/orders?page=1&limit=20&status=SUCCESS
GET /admin/finance/orders?startDate=2024-01-01&endDate=2024-12-31
```

**Expected**: Paginated purchases with user info, dataset, amount, payment ID.

### 7.3 Filter & Export

UI test:
1. Set date range filter → table updates
2. Filter by status (SUCCESS / PENDING / FAILED) → only matching rows shown
3. Export CSV button → downloads `.csv` file with correct columns

---

## 8. User Manager Dashboard

Login as Developer or UserManager admin. Navigate to `http://localhost:3000/admin/users`.

### 8.1 List & Search Users

```bash
GET /admin/users?page=1&search=test&isActive=true
```

**Expected**: Paginated list with email, role, status, purchase/license counts.

UI:
- Search by email → results filter live
- Filter by role, active status

### 8.2 Suspend / Restore User

```bash
POST /admin/users/:id/suspend
POST /admin/users/:id/restore
```

**Verify**: Suspended user login → `403 AccountSuspended`
**UI**: Status badge toggles between Active/Suspended; action button label changes.

### 8.3 View User Detail

Navigate to `/admin/users/:id`:
- Profile tab: email, name, role, status, join date
- Licenses tab: all assignments with type, validity, status
- Purchases tab: all purchases with dataset, amount, date
- Downloads tab: last 50 download log entries

### 8.4 Assign License from UI

In Licenses tab → "Assign License":
- Select license type from dropdown
- Set validity dates (or leave blank for perpetual)
- Optionally restrict to specific datasets
- Submit → new license appears in list

---

## 9. CMS Manager Dashboard

Login as Developer or CMSManager admin. Navigate to `http://localhost:3000/admin/cms`.

### 9.1 Static Pages

```bash
GET  /admin/cms/pages
PUT  /admin/cms/pages/:id
```

UI:
1. Click "Pages" → list of seeded pages (about, privacy, terms, etc.)
2. Click edit → HTML editor with live preview pane
3. Save → navigate to `http://localhost:3000/pages/about` → updated content appears (DOMPurify sanitized)

### 9.2 Email Templates

```bash
GET /admin/cms/email-templates
PUT /admin/cms/email-templates/:id
```

UI:
1. Click "Email Templates" → list: welcome, otp, order-confirmation, download-links
2. Edit `order-confirmation` template → change body text
3. Click "Preview" → modal shows rendered HTML with sample variables
4. Save

### 9.3 Contact Messages

Submit a contact form as a visitor:
```bash
POST /public/contact
{ "name": "Test", "email": "test@example.com", "subject": "Hello", "message": "Test message" }
```

In CMS dashboard:
1. Click "Contact Messages" → new message appears with status "NEW"
2. Change status to "IN_PROGRESS" → save
3. Add admin notes → save

### 9.4 Free Resources

```bash
GET  /admin/cms/free-resources
POST /admin/cms/free-resources
{ "title": "Energy Market Overview 2024", "slug": "energy-overview-2024", "type": "ARTICLE", "content": "<p>Article body...</p>", "summary": "A brief summary", "isFeatured": true }

PUT  /admin/cms/free-resources/:id
DELETE /admin/cms/free-resources/:id
```

**For a PDF resource:**
```json
{ "title": "Oil Price Report Q1", "slug": "oil-price-q1", "type": "PDF", "pdfUrl": "https://example.com/report.pdf", "summary": "Quarterly oil price data" }
```

UI test:
1. CMS Dashboard → "Free Resources" tab
2. Click **+ New Resource** → select type (Article / PDF) → fill form → Save
3. Article: navigate to `http://localhost:3000/free-data/energy-overview-2024` → article renders
4. PDF: navigate to `/free-data/oil-price-q1` → PDF download link shown
5. Public listing: `http://localhost:3000/free-data` → new resource appears in grid

### 9.5 Sitemap & Robots.txt

```bash
GET /public/sitemap.xml
GET /public/robots.txt
```

**Expected**:
- `sitemap.xml`: valid XML with dataset and static page URLs
- `robots.txt`: `User-agent: *` with allow/disallow rules

---

## 10. Developer Dashboard

Login as Developer admin. Navigate to `http://localhost:3000/admin/dev`.

### 10.1 System Health

```bash
GET /admin/dev/health
```

**Expected**:
```json
{
  "status": "ok",
  "uptime": 1234,
  "memory": { "rss": "...", "heap": "..." },
  "stats": { "userCount": 1, "datasetCount": 0, "purchaseCount": 0 },
  "nodeVersion": "v18.x.x"
}
```

UI: Health card with uptime, memory usage, database connection status.

### 10.2 Log Viewer

```bash
GET /admin/dev/logs?lines=50
GET /admin/dev/error-logs?lines=50
```

UI:
- "App Logs" tab: scrollable terminal-style log with timestamps
- "Error Logs" tab: filtered error entries
- "Refresh" button fetches latest

### 10.3 Role Management

```bash
GET  /admin/dev/roles
POST /admin/dev/roles
PUT  /admin/dev/roles/:id
```

**Create a test role:**
```json
{
  "name": "TestRole",
  "permissions": ["VIEW_DATASETS", "VIEW_REVENUE"]
}
```

**Assign role to user:**
```bash
PUT /admin/dev/users/:id/role
{ "roleId": "<test-role-id>" }
```

**Verify**: User now has limited access; cannot reach routes beyond their permissions.

### 10.4 Exchange Rate Management

```bash
GET /admin/dev/exchange-rates
POST /admin/dev/exchange-rates/refresh   # manual trigger of cron job
```

**Expected**: 8+ currencies with rates and `updatedAt` timestamp.

---

## 11. Public Website & Catalog

### 11.1 Home Page

Navigate to `http://localhost:3000/`:
- Two-column hero: text + CTA buttons on the left, `Homepage_Hero_Illustration.webp` on the right
- "How It Works" section: 3 step cards (Browse & Discover, Purchase Securely, Download & Use) with illustrations
- Featured datasets grid (requires at least 1 dataset with `isFeatured: true`)
- Features section
- JSON-LD Organization schema in `<head>`

### 11.2 Dataset Catalog

Navigate to `/datasets`:
- Search bar: type "oil" → list filters
- Category filter dropdown works
- Pagination controls (if > 12 datasets)
- Each card shows: name, description, data point count, price in selected currency

### 11.3 Dataset Detail Page

Navigate to `/datasets/:slug`:
- Recharts line chart with last 60 data points
- First 5 data points table (preview)
- Purchase card with price in user's currency
- "Buy Now" button opens PaymentModal
- JSON-LD Dataset schema in `<head>`

### 11.4 About / Privacy Policy / Terms of Service

These are standalone React components — they do NOT fetch from the CMS database.

Navigate directly to:
- `http://localhost:3000/about` — full About page with hero, mission, team (3 partners), and CTA
- `http://localhost:3000/pages/privacy-policy` — full Privacy Policy (12 sections)
- `http://localhost:3000/pages/terms-of-service` — full Terms of Service (13 sections)

**Verify:**
- Pages render instantly (no loading state)
- Team section on About shows Faizan, Hamid, Rauf with role titles and photo placeholders
- No API call fired (check browser Network tab — no `/api/v1/public/pages/` request)
- Generic CMS slugs (e.g. `/pages/custom-slug`) still work via `StaticPage` component + API

### 11.5 Free Data Section

Navigate to `http://localhost:3000/free-data`:
- Hero with two-column layout: text left, `Free_Data_Section_Illustration.webp` right
- Grid of free resources (Articles and PDFs); empty state shown if none published
- Filter or browse by type

Navigate to `/free-data/:slug`:
- **Article**: full article content rendered as HTML
- **PDF**: PDF info card with download link (external URL)

### 11.6 404 Page

Navigate to any unknown URL, e.g. `http://localhost:3000/this-page-does-not-exist`:
- `404_Page_Illustration.webp` displayed
- "Page Not Found" heading
- "Go to Homepage" + "Browse Datasets" buttons

### 11.7 Contact Form

1. Navigate to `/contact`
2. Fill name, email, subject, message
3. Submit
4. **Expected**: Success message; entry appears in CMS → Contact Messages

---

## 12. Profile & Avatar

### 12.1 View Profile

Login as any registered user → navigate to `/profile`:
- Profile picture card with initials avatar (if no photo)
- Account details form (email disabled, fullName, phone editable)

### 12.2 Upload Profile Picture

```bash
POST /auth/profile/picture
Cookie: token=<...>
Content-Type: multipart/form-data
avatar: <image file>
```

**Expected**: `{ success: true, data: { profilePicture: "..." } }`

UI test:
1. Click "Change Photo"
2. Select a JPG/PNG under 5 MB
3. Loading state appears
4. Avatar updates immediately after success

**Edge cases:**
- File > 5 MB → error message shown
- Non-image file → error message shown

### 12.3 Avatar in Navbar

After upload: navbar user dropdown shows circular avatar photo instead of initials icon.

### 12.4 Update Profile Data

1. Edit "Full Name" field
2. Click "Save Changes"
3. Refresh page — changes persisted
4. Navbar shows updated name

---

## 13. Admin Profile Pages

All admin types share the same `/admin/profile` page.

### 13.1 Access Admin Profile

Login as any admin → sidebar bottom shows avatar + name + role badge → click to navigate to `/admin/profile`.

### 13.2 Profile Page Layout

- Banner gradient header
- Avatar with edit pencil button
- Name + role badge
- Account details form
- Change password section

### 13.3 Edit Admin Profile

1. Update "Full Name" and "Phone"
2. Save → "Saved!" confirmation
3. Sidebar avatar/name updates

### 13.4 Change Admin Password

1. Enter current password
2. Enter new password (≥8 chars, upper+lower+number)
3. Confirm new password
4. Submit → success message; re-login with new password works

**Mismatch passwords**: Error shown client-side without API call.
**Wrong current password**: API returns 401, error shown.

### 13.5 Upload Admin Avatar

Identical to section 12.2, but accessed via `/admin/profile`.
Verify avatar updates in:
- Profile page header
- Sidebar bottom

---

## 14. Currency Conversion

### 14.1 Exchange Rates API

```bash
GET /public/exchange-rates
```

**Expected**: JSON object with rates for USD, EUR, GBP, JPY, AED, SGD, AUD, CAD (8 currencies vs INR).

### 14.2 Currency Selector

On any public page:
1. Open currency dropdown in navbar
2. Switch from INR → USD
3. All dataset prices update (e.g., ₹1,999 → ~$24.00)
4. Selection persists in localStorage across page reloads

### 14.3 Manual Rate Trigger

```bash
POST /admin/dev/exchange-rates/refresh
Cookie: token=<developer>
```

**Expected**: `200` — rates updated from external API (requires `EXCHANGE_RATE_API_KEY` in `.env`).

### 14.4 Cron Job Verification

Check server logs after 1 hour:
```
[info] Exchange rates updated: USD=0.012, EUR=0.011, ...
```

---

## 15. Unit of Measure Conversion

### 15.1 List Conversions

```bash
GET /public/uom/conversions
```

**Expected**: Seeded conversions (e.g., barrel→gallon, kWh→MJ).

### 15.2 Convert Value

```bash
GET /public/uom/convert?from=barrel&to=gallon&value=10
```

**Expected**: `{ result: 420 }` (1 barrel = 42 gallons).

### 15.3 Admin UOM Management

```bash
POST /admin/data/uom
Cookie: token=<...>
{ "fromUnit": "ton", "toUnit": "kg", "factor": 1000 }

PUT /admin/data/uom/:id
DELETE /admin/data/uom/:id
```

### 15.4 UI on Dataset Detail

1. Open a dataset detail page with multiple unit conversions available
2. Select a different unit from the dropdown
3. Chart y-axis values update with converted numbers
4. Table preview values update accordingly

---

## 16. IP Banning

### 16.1 Ban an IP

```bash
POST /admin/users/ip-bans
Cookie: token=<...>
{ "ipAddress": "192.168.1.100", "reason": "Abuse detected" }
```

**Expected**: `201` — IP added to ban list.

### 16.2 Verify Ban Enforcement

Simulate a request from that IP (use `X-Forwarded-For` header in dev):
```bash
curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:5000/api/v1/public/datasets
```

**Expected**: `403 IP_BANNED`

### 16.3 Unban IP

```bash
DELETE /admin/users/ip-bans/:id
Cookie: token=<...>
```

**Expected**: `200`. Subsequent requests from that IP succeed.

### 16.4 UI Verification

Navigate to User Manager → IP Bans tab:
- New ban form with IP field + reason
- List of banned IPs with unban button
- Unban removes from list immediately

---

## 17. Session Management

### 17.1 Session Created on Login

Check DB after login:
```sql
SELECT * FROM Session WHERE userId = '<your-user-id>' ORDER BY createdAt DESC;
```

**Expected**: New session with token, deviceInfo (user-agent, IP), expiresAt.

### 17.2 Logout Clears Session

```bash
POST /auth/logout
Cookie: token=<...>
```

**Expected**: Cookie cleared; subsequent authenticated requests → `401`.

**DB check**: Session record deleted or invalidated.

### 17.3 Expired Session

Manually set session `expiresAt` to a past timestamp in DB:
```sql
UPDATE Session SET expiresAt = '2020-01-01' WHERE id = '<session-id>';
```

Then make a request with that token:
**Expected**: `401 Token expired or session invalid`

### 17.4 Cron Session Cleanup

Cron runs every 6 hours:
```
[info] Cleaned up 0 expired sessions
```

Confirm expired sessions are removed from DB.

---

## 18. Security Checks

### 18.1 SQL Injection (Prisma parameterized queries)

```bash
GET /public/datasets?search=' OR '1'='1
```

**Expected**: Normal empty result (no SQL injection), no 500 error.

### 18.2 XSS — Contact Form

```bash
POST /public/contact
{ "name": "<script>alert(1)</script>", "message": "<img src=x onerror=alert(1)>" }
```

**Expected**: `200`. Check DB — `xss()` sanitized the content. Admin dashboard renders the stored text safely.

### 18.3 Helmet Security Headers

```bash
curl -I http://localhost:5000/api/v1/public/datasets
```

**Expected headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: ...`
- `Strict-Transport-Security` (in production)

### 18.4 CORS Policy

```bash
curl -H "Origin: http://malicious-site.com" http://localhost:5000/api/v1/public/datasets
```

**Expected**: No `Access-Control-Allow-Origin` header for unknown origins (or CORS error).

### 18.5 Auth Required on Protected Routes

```bash
GET /auth/profile      # no cookie
GET /admin/dev/health  # no cookie
GET /user/purchases    # no cookie
```

**All expected**: `401 No authentication token provided`

### 18.6 Role Authorization

Login as DataManager user, then:
```bash
GET /admin/finance/revenue
Cookie: token=<data-manager>
```

**Expected**: `403 Forbidden` — insufficient permissions.

---

## 19. Error Handling

### 19.1 404 — Not Found

```bash
GET /api/v1/public/datasets/nonexistent-slug
```

**Expected**: `404 { success: false, error: { code: "NOT_FOUND", message: "..." } }`

### 19.2 422 — Validation Error

```bash
POST /auth/register
{ "email": "not-an-email", "password": "short" }
```

**Expected**: `422` with Zod validation details per field.

### 19.3 409 — Conflict

```bash
POST /auth/register  # same email twice
```

**Expected**: `409 { error: { code: "CONFLICT", message: "Email already in use" } }`

### 19.4 500 — Unexpected Error Logging

Check `server/logs/app-<date>.log` after triggering any server error:
```json
{ "level": "error", "message": "...", "stack": "...", "timestamp": "..." }
```

**Expected**: Error is logged; response is `500 { success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }` (no stack trace leaked to client).

---

## Appendix: Quick Curl Reference

```bash
BASE=http://localhost:5000/api/v1

# Login and save cookie
curl -c cookies.txt -X POST $BASE/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@waderaassociates.com","password":"ChangeMe@123"}'

# Authenticated request
curl -b cookies.txt $BASE/auth/profile

# Upload profile picture
curl -b cookies.txt -X POST $BASE/auth/profile/picture \
  -F 'avatar=@/path/to/photo.jpg'

# Create dataset
curl -b cookies.txt -X POST $BASE/admin/data/datasets \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test DS","defaultUnit":"barrel","priceINR":999}'

# Import XLSX
curl -b cookies.txt -X POST $BASE/admin/data/datasets/<id>/import-xlsx \
  -F 'file=@data.xlsx'

# Upload dataset cover image
curl -b cookies.txt -X POST $BASE/admin/data/datasets/<id>/cover-image \
  -F 'image=@thumbnail.jpg'

# Ban IP
curl -b cookies.txt -X POST $BASE/admin/users/ip-bans \
  -H 'Content-Type: application/json' \
  -d '{"ipAddress":"1.2.3.4","reason":"test"}'
```

---

*Generated for Wadera Associates Data Intelligence Platform — March 2026*
