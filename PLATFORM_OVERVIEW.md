# Wadera Associates — Platform Overview

*A plain-language guide to how the platform works, written for non-technical stakeholders.*

---

## What Is This Platform?

Wadera Associates Data Intelligence is an **online marketplace for structured business data**. Think of it like an app store — but instead of apps, people browse, buy, and download datasets. These are organized collections of numbers over time: electricity prices by month, commodity rates by quarter, industry production figures by year, and so on.

Customers can be:
- Businesses that need market data for pricing or strategy
- Researchers and analysts building models
- Consultants preparing industry reports
- Individual professionals needing a quick data reference

---

## What Can You Do on the Platform?

### As a Visitor (no account needed)
- Browse the full dataset catalog
- Search and filter by sector, region, or keyword
- See how many data points a dataset contains and preview its description
- Read prices in your local currency (auto-detected)
- Access all **Free Resources** — articles and downloadable PDFs — at no cost
- Contact the team via the contact form

### As a Registered User
Everything above, plus:
- **Purchase datasets** with a secure one-time payment
- **Download** purchased data instantly in any format (Excel, CSV, PDF, or chart image)
- View your full purchase history and re-download at any time
- Manage your profile and profile picture

### As an Admin
Admins log in to a separate panel and manage the platform. There are five admin roles, each with specific responsibilities (see Admin Panel section below).

---

## The Dataset Buying Experience

1. **Browse** — The catalog page lists all available datasets with thumbnails, category tags, data point counts, and prices.
2. **Preview** — Clicking a dataset opens its detail page with a description, a visual chart of the data, and the price.
3. **Purchase** — A secure Razorpay payment window opens. The customer pays via card, UPI, or net banking. No payment details are stored on our servers.
4. **Download** — Immediately after payment, the customer receives a secure download link. They can also re-download later from their Purchases page.
5. **Format** — The customer chooses Excel (.xlsx), CSV, PDF report, or PNG chart image.

> Guest purchases (without creating an account) are also supported — the download link is sent to the guest's email.

---

## Free Data Section

Separate from the paid catalog, there is a **Free Data** section. It contains:
- **Articles** — Written content rendered as a full web page (like a blog post)
- **PDF Downloads** — Documents the visitor can download for free

These are managed entirely through the admin panel — no coding needed to publish new ones.

---

## Supported Currencies

Prices are stored in Indian Rupees (INR) internally. The platform automatically displays the equivalent price in the visitor's local currency using live exchange rates. A currency selector in the header also lets users switch manually.

Supported currencies include: INR, USD, EUR, GBP, AED, SGD, MYR, and more.

---

## The Admin Panel

Admins access the panel at `/admin`. There are five roles:

| Role | What They Can Do |
|---|---|
| **Developer** | Full access to everything — users, roles, licenses, system settings, all dashboards |
| **Data Manager** | Create and manage datasets, upload data files (Excel import), upload cover images |
| **CMS Manager** | Manage static pages (Privacy Policy, Terms, etc.), email templates, contact messages, free resources (articles and PDFs) |
| **Financial Manager** | View purchases, revenue reports, and manage refunds |
| **User Manager** | View and manage registered users, activate or deactivate accounts |

Each role only sees what they need — a Financial Manager cannot touch datasets, and a Data Manager cannot see financial records.

---

## Data Upload — How It Works for the Data Manager

The Data Manager creates a dataset (title, description, unit, price, category) and then uploads the actual data:

**Option A — Excel Import (recommended for bulk data)**
Upload a formatted `.xlsx` file. The platform reads it row by row and saves each data point. The file format is simple: Column A = date (year-month), Column B = value, Column C = optional note.

**Option B — Manual Entry**
Add individual data points one at a time through the admin form — useful for updating with monthly figures.

**Cover Image**
Each dataset can have a thumbnail image (shown in the catalog listing). The Data Manager uploads this from the admin panel.

---

## Static Pages and Content

Pages like **Privacy Policy**, **Terms of Service**, and **About Us** are built into the website as dedicated pages — they render instantly without any database call and contain the full legal and company content.

Other custom pages (e.g. a "FAQ" page) can be created and managed through the **CMS Manager** tab in the admin panel — no coding required.

---

## Contact Messages

When a visitor submits the Contact form, the message is stored in the database and appears in the **CMS Manager** dashboard under "Contact Messages". Each message has a status (New, In Progress, Resolved) and an admin notes field for internal tracking.

---

## Security Highlights

- **Passwords** are never stored in plain text — they are cryptographically hashed (bcrypt).
- **Payments** are handled entirely by Razorpay. We only store an order ID and status — never card numbers or CVVs.
- **Download links** are one-time-use tokens with an expiry — they cannot be shared indefinitely.
- **Email verification** is required at registration via a one-time code (OTP).
- **Rate limiting** protects login and OTP endpoints from brute-force attacks.
- **IP banning** is available in the Developer dashboard for blocking abusive sources.
- All data in transit is encrypted via HTTPS/TLS.

---

## File Hosting and Storage

**Profile pictures and dataset cover images** are stored either:
- Locally on the server (during development/testing)
- On Amazon S3 (in production) — a widely used, reliable cloud storage service

**Dataset downloads** are generated on-demand when a customer clicks the download button — nothing is pre-stored as a downloadable file.

**Free Resource PDFs** are hosted at a URL that you provide when creating the resource in the CMS panel.

---

## Email Notifications

The platform sends automated emails for:
- OTP verification (at registration and password reset)
- Welcome message (on successful registration)
- Order confirmation (immediately after a successful purchase)

Email templates are customizable through the admin panel (CMS Manager → Email Templates) without touching any code.

---

## What the Platform Does NOT Do (currently)

- No subscription plans — every purchase is a one-time payment per dataset
- No API access endpoint for programmatic data delivery (can be added later)
- No automated data refresh — data is manually uploaded by the Data Manager
- No live/streaming data

These can be discussed as future enhancements.

---

## Summary — The Simple Version

| Who | What they do |
|---|---|
| **Visitor** | Browses catalog, reads free content |
| **Registered User** | Buys datasets, downloads them, manages their account |
| **Data Manager** | Uploads and manages all datasets and their data |
| **CMS Manager** | Publishes free content, manages pages and contact messages |
| **Financial Manager** | Monitors revenue and purchases |
| **Developer** | Maintains and configures the full system |

The platform is fully self-contained — once live, it can be operated entirely through the admin panel without any developer involvement for day-to-day publishing and sales operations.