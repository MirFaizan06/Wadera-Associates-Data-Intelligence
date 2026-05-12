# Testing Guide — ARW Analytics Backend

This guide walks through testing every feature of the backend.  
**Before starting:** Complete the Local Setup Guide and make sure the server is running at `http://localhost:5000`.

---

## How to Use This Guide

Each test section tells you:
- **What it tests** — what feature you are checking
- **How to do it** — step-by-step
- **What you should see** — the expected result
- **What a failure looks like** — so you know something is broken

Tests are grouped into logical sections. Start from the top — some tests (like "Create a Dataset") are needed before later tests (like "Download a File").

---

## Tool Setup

### Using a Browser (for simple GET tests)
Many tests below can be done just by opening a URL in your browser. Those are marked with 🌐.

### Using Bruno or Postman (for everything else)
For tests that send data or require login, you will use a REST client.

**Base URL:** `http://localhost:5000`  
**All API endpoints start with:** `/api/v1`

### Using curl (command line alternative)
All tests include a `curl` command you can paste into your terminal (the one where `npm run dev` is **not** running — open a second terminal).

---

## Section 1 — Server Health

### Test 1.1: Basic health check 🌐

**What it tests:** The server is running and responding.

**How to do it:**  
Open your browser and go to: `http://localhost:5000/health`

**Expected result:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-13T..."
}
```

**Failure:** Page not loading, connection refused, or any error message → the server is not running.

---

## Section 2 — Authentication

### Test 2.1: Admin Login

**What it tests:** The admin account exists and login works.

**In Bruno/Postman:**
- Method: `POST`
- URL: `http://localhost:5000/api/v1/auth/login`
- Body (JSON):
```json
{
  "email": "admin@waderaassociates.com",
  "password": "ChangeMe@123"
}
```

**Expected result:**
```json
{
  "success": true,
  "data": {
    "message": "Logged in successfully"
  }
}
```

**Important:** The login sets a cookie automatically. Bruno and Postman handle this for you — subsequent requests in the same session will be authenticated.

**curl version:**
```bash
curl -s -c /tmp/cookies.txt -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@waderaassociates.com","password":"ChangeMe@123"}'
```

**Failure:** `"success": false` with an error → wrong password or admin account not seeded. Run `npm run seed` in the `server/` folder again.

---

### Test 2.2: View Admin Profile

**What it tests:** The authentication cookie is working and the admin user has the Developer role.

**In Bruno/Postman (after logging in):**
- Method: `GET`
- URL: `http://localhost:5000/api/v1/auth/profile`

**Expected result:**
```json
{
  "success": true,
  "data": {
    "email": "admin@waderaassociates.com",
    "fullName": "Developer Admin",
    "role": {
      "name": "Developer",
      "permissions": ["view_all", "edit_all", "delete_all", ...]
    }
  }
}
```

**curl:**
```bash
curl -s -b /tmp/cookies.txt http://localhost:5000/api/v1/auth/profile
```

**Failure:** `"code": "NO_TOKEN"` → you are not logged in. Run Test 2.1 first.

---

### Test 2.3: Register a New User

**What it tests:** User self-registration works.

> **Note:** An OTP verification email would normally be sent, but since email is not configured locally, registration will succeed but the OTP email will fail silently. The user account is still created.

**In Bruno/Postman:**
- Method: `POST`
- URL: `http://localhost:5000/api/v1/auth/register`
- Body (JSON):
```json
{
  "email": "testuser@example.com",
  "password": "TestPass1",
  "fullName": "Test User"
}
```

**Expected result:**
```json
{
  "success": true,
  "data": {
    "message": "Registration successful. Check your email for the verification code."
  }
}
```

The user is created in the database even though the email cannot be delivered locally.

**curl:**
```bash
curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"TestPass1","fullName":"Test User"}'
```

**Failure:** `"VALIDATION_ERROR"` → check the password has uppercase, lowercase, and a number.

---

### Test 2.4: Update Profile

**What it tests:** Authenticated users can update their profile.

**In Bruno/Postman (must be logged in as admin):**
- Method: `PUT`
- URL: `http://localhost:5000/api/v1/auth/profile`
- Body (JSON):
```json
{
  "fullName": "Developer Admin",
  "phone": "+91 9876543210"
}
```

**Expected result:**
```json
{
  "success": true,
  "data": {
    "message": "Profile updated"
  }
}
```

**Failure:** `"NO_TOKEN"` → log in first (Test 2.1).

---

### Test 2.5: Logout

**In Bruno/Postman:**
- Method: `POST`
- URL: `http://localhost:5000/api/v1/auth/logout`

**Expected result:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

After this, requests requiring auth will return errors until you log in again.

---

## Section 3 — Public Data Endpoints

These tests do not require login. They can all be done in the browser.

### Test 3.1: List Datasets 🌐

**URL:** `http://localhost:5000/api/v1/public/datasets`

**Expected result:** A JSON object with a `datasets` array. It will be empty until you add datasets in Section 5.
```json
{
  "success": true,
  "data": {
    "datasets": [],
    "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 },
    "exchangeRates": { "INR": 1 }
  }
}
```

**With search:** `http://localhost:5000/api/v1/public/datasets?search=oil`  
**With category:** `http://localhost:5000/api/v1/public/datasets?category=Energy`  
**Sorted:** `http://localhost:5000/api/v1/public/datasets?sortBy=priceINR&order=asc`

---

### Test 3.2: Featured Datasets 🌐

**URL:** `http://localhost:5000/api/v1/public/datasets/featured`

**Expected:** `{"success":true,"data":[]}` (empty until you mark a dataset as featured)

---

### Test 3.3: Dataset Categories 🌐

**URL:** `http://localhost:5000/api/v1/public/datasets/categories`

**Expected:** `{"success":true,"data":[]}` (empty until you create datasets with categories)

---

### Test 3.4: Exchange Rates 🌐

**URL:** `http://localhost:5000/api/v1/public/exchange-rates`

**Expected:**
```json
{
  "success": true,
  "data": { "INR": 1 }
}
```

Only `INR: 1` will show until an exchange rate API key is configured.

---

### Test 3.5: Static Page — About 🌐

**URL:** `http://localhost:5000/api/v1/public/pages/about`

**Expected:** A JSON object with the About page content (title, HTML content).

Also try:
- `http://localhost:5000/api/v1/public/pages/privacy-policy`
- `http://localhost:5000/api/v1/public/pages/terms-of-service`
- `http://localhost:5000/api/v1/public/pages/contact`

---

### Test 3.6: Sitemap 🌐

**URL:** `http://localhost:5000/api/v1/public/sitemap.xml`

**Expected:** An XML sitemap with URLs for all published datasets and free resources.

---

### Test 3.7: Robots.txt 🌐

**URL:** `http://localhost:5000/api/v1/public/robots.txt`

**Expected:** Plain text like:
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
```

---

### Test 3.8: Free Resources List 🌐

**URL:** `http://localhost:5000/api/v1/public/free`

**Expected:** Empty list until you create free resources in Section 6.

---

## Section 4 — Contact Form

### Test 4.1: Submit Contact Form

**What it tests:** The contact form saves the message to the database.

> **Note:** The auto-reply email will fail silently since email is not configured locally. The message is still saved.

**In Bruno/Postman:**
- Method: `POST`
- URL: `http://localhost:5000/api/v1/public/contact`
- Body (JSON):
```json
{
  "name": "Test Sender",
  "email": "sender@example.com",
  "subject": "Dataset Enquiry",
  "message": "I am interested in energy datasets for South Asia. Can you help?"
}
```

**Expected result:**
```json
{
  "success": true,
  "data": {
    "message": "Message received. We will reply shortly.",
    "id": "..."
  }
}
```

**curl:**
```bash
curl -s -X POST http://localhost:5000/api/v1/public/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Sender","email":"sender@example.com","subject":"Dataset Enquiry","message":"I am interested in energy datasets for South Asia."}'
```

**Failure:** `"VALIDATION_ERROR"` → all four fields are required, and `email` must be a valid email address.

---

## Section 5 — Dataset Management (Admin)

> **Important:** Log in as admin first (Test 2.1) before running these tests.

### Test 5.1: Create a Dataset

**In Bruno/Postman:**
- Method: `POST`
- URL: `http://localhost:5000/api/v1/admin/data/datasets`
- Body (JSON):
```json
{
  "name": "India Crude Oil Import Price",
  "description": "Monthly average crude oil import price for India in USD per barrel",
  "defaultUnit": "barrel",
  "priceINR": 4999,
  "category": "Energy",
  "tags": ["oil", "crude", "energy", "india"],
  "source": "Ministry of Petroleum, Government of India",
  "region": "India"
}
```

**Expected result:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "slug": "india-crude-oil-import-price",
    "name": "India Crude Oil Import Price",
    ...
  }
}
```

**Copy the `id` from the response** — you will need it for the next tests.

**Failure:** `"WRONG_ROLE"` or `"ADMIN_REQUIRED"` → you are not logged in as admin. Run Test 2.1 again.

---

### Test 5.2: Add Data Points to a Dataset

Replace `DATASET_ID` with the `id` you copied from Test 5.1.

**In Bruno/Postman:**
- Method: `POST`
- URL: `http://localhost:5000/api/v1/admin/data/datasets/DATASET_ID/data-points`
- Body (JSON):
```json
{
  "points": [
    { "date": "2024-01", "value": 82.5, "usdValue": 82.5 },
    { "date": "2024-02", "value": 83.1, "usdValue": 83.1 },
    { "date": "2024-03", "value": 85.2, "usdValue": 85.2 },
    { "date": "2024-04", "value": 87.0, "usdValue": 87.0 },
    { "date": "2024-05", "value": 84.5, "usdValue": 84.5 },
    { "date": "2024-06", "value": 86.0, "usdValue": 86.0 }
  ]
}
```

**Important:** Dates must be in `YYYY-MM` format (year-month only, no day).

**Expected result:**
```json
{
  "success": true,
  "data": {
    "message": "6 data points saved"
  }
}
```

**Failure:** `"VALIDATION_ERROR"` with `"Date must be YYYY-MM format"` → check your date format.

---

### Test 5.3: Import Data from an Excel File

**What it tests:** XLSX file upload and bulk data import.

First, create a test Excel file:
1. Open Excel or Google Sheets
2. Create a sheet with these columns in Row 1:
   ```
   Date (YYYY-MM)  |  LocalCurrency/Unit  |  USD/Unit  |  Note
   ```
3. Add some rows:
   ```
   2024-07  |  88.0  |  88.0  |  Post-monsoon
   2024-08  |  85.5  |  85.5  |
   2024-09  |  83.0  |  83.0  |
   ```
4. Save as `.xlsx`

**In Bruno/Postman:**
- Method: `POST`
- URL: `http://localhost:5000/api/v1/admin/data/datasets/DATASET_ID/import-xlsx`
- Body: **Form Data** (not JSON!)
  - Key: `file`
  - Value: Select your `.xlsx` file

**Expected result:**
```json
{
  "success": true,
  "data": {
    "imported": 3,
    "errors": []
  }
}
```

**Failure:** `"errors": ["Row 2: Missing date..."]` → check column order in your Excel file (Date must be column A, LocalCurrency/Unit in column B).

---

### Test 5.4: View the Dataset Publicly 🌐

After creating the dataset and adding data points, verify it appears publicly.

**URL:** `http://localhost:5000/api/v1/public/datasets/india-crude-oil-import-price`

**With data points:** `http://localhost:5000/api/v1/public/datasets/india-crude-oil-import-price?includeData=true`

**Expected:** Full dataset details including the data points you added.

---

### Test 5.5: Update a Dataset

**In Bruno/Postman:**
- Method: `PUT`
- URL: `http://localhost:5000/api/v1/admin/data/datasets/DATASET_ID`
- Body (JSON):
```json
{
  "isFeatured": true,
  "priceINR": 5499
}
```

**Expected result:**
```json
{
  "success": true,
  "data": {
    "message": "Dataset updated"
  }
}
```

After this, check `http://localhost:5000/api/v1/public/datasets/featured` — your dataset should appear.

---

### Test 5.6: List All Datasets (Admin View)

**In Bruno/Postman:**
- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/data/datasets`

**Expected:** A list of all datasets including hidden ones, with counts of data points and purchases.

---

### Test 5.7: Unit Conversions (UOM)

**View existing conversions:**
- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/data/uom`

**Expected:** A list of pre-seeded conversions (barrel→liter, kWh→MWh, etc.)

**Add a new conversion:**
- Method: `POST`
- URL: `http://localhost:5000/api/v1/admin/data/uom`
- Body (JSON):
```json
{
  "fromUnit": "tonne",
  "toUnit": "kg",
  "factor": 1000,
  "label": "tonne → kg"
}
```

---

## Section 6 — Free Resources (Admin)

### Test 6.1: Create a Free Resource

**In Bruno/Postman:**
- Method: `POST`
- URL: `http://localhost:5000/api/v1/admin/cms/free-resources`
- Body (JSON):
```json
{
  "title": "Understanding Crude Oil Benchmarks",
  "summary": "An introduction to Brent, WTI, and Dubai crude benchmarks",
  "type": "ARTICLE",
  "content": "# Crude Oil Benchmarks\n\nBrent, WTI, and Dubai are the three main global benchmarks...",
  "category": "Energy",
  "tags": ["oil", "energy", "benchmarks"],
  "author": "ARW Analytics Team",
  "isPublished": true
}
```

**Expected:** The created resource object with a `slug` and `id`.

**Copy the `id`** for the next test.

---

### Test 6.2: View Published Free Resource 🌐

**URL:** `http://localhost:5000/api/v1/public/free/understanding-crude-oil-benchmarks`

**Expected:** The full article content.

Also check the list: `http://localhost:5000/api/v1/public/free`

---

### Test 6.3: Update and Delete Free Resources

**Update:**
- Method: `PUT`
- URL: `http://localhost:5000/api/v1/admin/cms/free-resources/RESOURCE_ID`
- Body: Any fields you want to change (e.g., `{"author": "Research Team"}`)

**Delete:**
- Method: `DELETE`
- URL: `http://localhost:5000/api/v1/admin/cms/free-resources/RESOURCE_ID`

---

## Section 7 — CMS (Content Management)

### Test 7.1: View All Static Pages (Admin)

- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/cms/pages`

**Expected:** A list of 4 pages: about, privacy-policy, terms-of-service, contact.

---

### Test 7.2: Update a Static Page

- Method: `PUT`
- URL: `http://localhost:5000/api/v1/admin/cms/pages/about`
- Body (JSON):
```json
{
  "title": "About ARW Analytics",
  "content": "<h1>About Us</h1><p>We provide premium energy data for researchers and professionals.</p>",
  "metaTitle": "About ARW Analytics | Data Intelligence",
  "metaDesc": "Learn about ARW Analytics, your source for energy market data."
}
```

**Expected:** `{"success":true,"data":{"message":"Page updated"}}`

---

### Test 7.3: View Email Templates

- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/cms/email-templates`

**Expected:** A list of 5 templates: OTP, WELCOME, ORDER_CONFIRMATION, PASSWORD_RESET, CONTACT_AUTO_REPLY.

**View a specific template:**
- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/cms/email-templates/OTP`

---

### Test 7.4: Preview an Email Template

**What it tests:** The template engine works — variables are replaced correctly.

- Method: `POST`
- URL: `http://localhost:5000/api/v1/admin/cms/email-templates/preview`
- Body (JSON):
```json
{
  "htmlBody": "<h1>Hello {{name}}!</h1><p>Your code is: <strong>{{otp}}</strong></p>",
  "variables": {
    "name": "Test User",
    "otp": "123456"
  }
}
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "preview": "<h1>Hello Test User!</h1><p>Your code is: <strong>123456</strong></p>"
  }
}
```

---

### Test 7.5: View Contact Messages

- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/cms/contact-messages`

If you ran Test 4.1 (Contact Form), you will see that message here.

**Update message status:**
- Method: `PATCH`
- URL: `http://localhost:5000/api/v1/admin/cms/contact-messages/MESSAGE_ID`
- Body (JSON):
```json
{
  "status": "IN_PROGRESS",
  "adminNotes": "Replied via email on 13 May"
}
```

Valid statuses: `NEW`, `IN_PROGRESS`, `RESOLVED`

---

## Section 8 — User Management (Admin)

### Test 8.1: List All Users

- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/users/users`

**With search:** `http://localhost:5000/api/v1/admin/users/users?search=admin`

**Expected:** A paginated list of users. After Test 2.3 (registration), you should see 2 users.

---

### Test 8.2: Assign a License to a User

First, get the user ID from Test 8.1, and a license type ID from:
- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/users/license-types`

Then assign:
- Method: `POST`
- URL: `http://localhost:5000/api/v1/admin/users/licenses`
- Body (JSON):
```json
{
  "userId": "USER_ID_HERE",
  "licenseTypeId": "LICENSE_TYPE_ID_HERE",
  "validFrom": "2026-05-13",
  "datasetIds": ["DATASET_ID_HERE"]
}
```

**Expected:** `{"success":true,"data":{"message":"License assigned"}}`

---

### Test 8.3: View User's Licenses

- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/users/users/USER_ID/licenses`

**Expected:** A list of license assignments for that user.

---

### Test 8.4: Revoke a License

Get the license assignment ID from Test 8.3.

- Method: `DELETE`
- URL: `http://localhost:5000/api/v1/admin/users/licenses/LICENSE_ID`

**Expected:** `{"success":true,"data":{"message":"License revoked"}}`

---

### Test 8.5: IP Banning

**Ban an IP:**
- Method: `POST`
- URL: `http://localhost:5000/api/v1/admin/users/banned-ips`
- Body (JSON):
```json
{
  "ipAddress": "1.2.3.4",
  "reason": "Suspicious activity"
}
```

**List banned IPs:**
- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/users/banned-ips`

**Unban (get the ID from the list above):**
- Method: `DELETE`
- URL: `http://localhost:5000/api/v1/admin/users/banned-ips/BAN_ID`

---

### Test 8.6: Download Logs

- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/users/download-logs`

After running the download tests in Section 9, entries will appear here.

---

## Section 9 — File Downloads

To test downloads, you need a dataset with data points AND a valid license for your user. Complete Sections 5 and 8.2 first.

### Test 9.1: Download XLSX (as Authenticated User)

Make sure you are logged in as admin and have a license for the dataset.

- Method: `GET`
- URL: `http://localhost:5000/api/v1/user/datasets/DATASET_ID/download/XLSX`

**Expected:**
```json
{
  "success": true,
  "data": {
    "url": "http://localhost:3000/downloads/filename.xlsx"
  }
}
```

The URL is where the file is saved. In local dev without R2 configured, files are saved inside the `server/public/downloads/` folder.

---

### Test 9.2: Download CSV

- Method: `GET`
- URL: `http://localhost:5000/api/v1/user/datasets/DATASET_ID/download/CSV`

---

### Test 9.3: Download PDF

- Method: `GET`
- URL: `http://localhost:5000/api/v1/user/datasets/DATASET_ID/download/PDF`

---

### Test 9.4: Verify the Files Exist

In VS Code, open the Explorer on the left. Navigate to:
```
server → public → downloads
```

You should see `.xlsx`, `.csv`, and `.pdf` files there.

---

## Section 10 — Admin Dashboards

### Test 10.1: Developer Dashboard — System Health

- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/dev/health`

**Expected:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 1234,
    "memory": { "rss": "90MB", "heap": "40MB" },
    "stats": {
      "userCount": 2,
      "datasetCount": 1,
      "purchaseCount": 0
    },
    "nodeVersion": "v24.x.x"
  }
}
```

---

### Test 10.2: Developer Dashboard — Application Logs

- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/dev/logs`

**Expected:** Recent log entries (last 100 lines from the latest log file).

---

### Test 10.3: Developer Dashboard — Error Logs

- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/dev/error-logs`

**Expected:** Recent error entries. You will see email-related errors since SMTP is not configured — that is normal.

---

### Test 10.4: Developer Dashboard — Roles

- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/dev/roles`

**Expected:** 5 roles: Developer, FinancialManager, DataManager, UserManager, CMSManager.

---

### Test 10.5: Developer Dashboard — Email Logs

- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/dev/email-logs`

**Expected:** Records of email send attempts (both successful and failed).

---

### Test 10.6: Finance Dashboard — Orders

- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/finance/orders`

**Expected:** Order list (empty until purchases are made), plus revenue totals.

**With filters:**
- `?status=SUCCESS`
- `?dateFrom=2026-01-01&dateTo=2026-12-31`

---

### Test 10.7: Finance Dashboard — Revenue Chart

- Method: `GET`
- URL: `http://localhost:5000/api/v1/admin/finance/revenue-chart`

**Expected:** Revenue data for the last 12 months (all zeros until real purchases are made).

---

## Section 11 — Cleanup After Testing

When you are done testing, clean up the test data so the database is in a clean state.

### Delete test data via Prisma Studio

1. In a terminal (in the `server/` folder):
   ```
   npx prisma studio
   ```
2. Your browser will open at `http://localhost:5555`
3. Click on any table (e.g., **TimeSeries**, **User**, **ContactMessage**)
4. Select the test records and delete them

### Or: Reset the database entirely

This **wipes everything** and starts fresh with only seed data:

```bash
# From project root:
npm run db:reset
```

This runs: stop containers → wipe data → restart → migrate → seed.

---

## Quick Reference: All Endpoints

| Category | Method | URL | Auth? |
|---|---|---|---|
| Health | GET | `/health` | No |
| Login | POST | `/api/v1/auth/login` | No |
| Register | POST | `/api/v1/auth/register` | No |
| Get Profile | GET | `/api/v1/auth/profile` | Yes |
| Update Profile | PUT | `/api/v1/auth/profile` | Yes |
| Change Password | PUT | `/api/v1/auth/change-password` | Yes |
| Logout | POST | `/api/v1/auth/logout` | Yes |
| List Datasets | GET | `/api/v1/public/datasets` | No |
| Featured | GET | `/api/v1/public/datasets/featured` | No |
| Categories | GET | `/api/v1/public/datasets/categories` | No |
| Dataset Detail | GET | `/api/v1/public/datasets/:slug` | No |
| Free Resources | GET | `/api/v1/public/free` | No |
| Free Resource | GET | `/api/v1/public/free/:slug` | No |
| Exchange Rates | GET | `/api/v1/public/exchange-rates` | No |
| Static Page | GET | `/api/v1/public/pages/:slug` | No |
| Sitemap | GET | `/api/v1/public/sitemap.xml` | No |
| Contact Form | POST | `/api/v1/public/contact` | No |
| My Purchases | GET | `/api/v1/user/purchases` | Yes |
| My Licenses | GET | `/api/v1/user/licenses` | Yes |
| Download File | GET | `/api/v1/user/datasets/:id/download/:format` | Yes |
| Admin: Datasets | GET/POST | `/api/v1/admin/data/datasets` | Admin |
| Admin: Add Points | POST | `/api/v1/admin/data/datasets/:id/data-points` | Admin |
| Admin: Import XLSX | POST | `/api/v1/admin/data/datasets/:id/import-xlsx` | Admin |
| Admin: UOM | GET/POST | `/api/v1/admin/data/uom` | Admin |
| Admin: Orders | GET | `/api/v1/admin/finance/orders` | Admin |
| Admin: Revenue | GET | `/api/v1/admin/finance/revenue-chart` | Admin |
| Admin: Users | GET | `/api/v1/admin/users/users` | Admin |
| Admin: Licenses | POST/DELETE | `/api/v1/admin/users/licenses` | Admin |
| Admin: IP Bans | GET/POST/DELETE | `/api/v1/admin/users/banned-ips` | Admin |
| Admin: Pages | GET/PUT | `/api/v1/admin/cms/pages` | Admin |
| Admin: Templates | GET/PUT | `/api/v1/admin/cms/email-templates` | Admin |
| Admin: Contact Msgs | GET/PATCH | `/api/v1/admin/cms/contact-messages` | Admin |
| Admin: Free Resources | GET/POST/PUT/DELETE | `/api/v1/admin/cms/free-resources` | Admin |
| Dev: Health | GET | `/api/v1/admin/dev/health` | Developer |
| Dev: Logs | GET | `/api/v1/admin/dev/logs` | Developer |
| Dev: Roles | GET/PUT | `/api/v1/admin/dev/roles` | Developer |

---

## What is Expected to NOT Work Locally

These features require external services that are not configured in the local `.env`. They are expected to fail gracefully (no crash, just an error message):

| Feature | Why it won't work locally | What you'll see |
|---|---|---|
| Email sending (OTP, welcome, order confirmation) | SMTP not configured | Users are created but no email arrives |
| Razorpay payment orders | No API key | Error when calling payment endpoint |
| Currency conversion (USD, EUR, etc.) | Exchange rate API key not set | Only `INR: 1` in exchange rates |
| File upload to R2 (cover images) | No R2 credentials | Files save to `server/public/uploads/` instead |
| Generated file upload to R2 | No R2 credentials | Files save to `server/public/downloads/` instead |

These are all expected and do not indicate a bug.

---

*Testing guide for ARW Analytics — May 2026*
