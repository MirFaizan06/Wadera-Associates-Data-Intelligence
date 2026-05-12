# Local Setup Guide — ARW Analytics (Wadera Associates)

This guide walks you through setting up the project on your Windows laptop from scratch.  
**Estimated time: 30–45 minutes**

---

## What You Are Setting Up

- **Backend server** (Node.js) — the API that powers the platform
- **Database** (PostgreSQL) — runs inside Docker, no manual DB install needed
- **Frontend** (React) — the web UI (optional for backend-only testing)

---

## Part 1 — Install the Tools

You need to install four tools. Do these in order.

---

### 1.1 — Install Visual Studio Code (Code Editor)

1. Go to **https://code.visualstudio.com/**
2. Click the big blue **Download for Windows** button
3. Run the downloaded `.exe` file
4. Click through the installer (all default options are fine)
5. On the **Select Additional Tasks** screen, tick **"Add to PATH"** and **"Open with Code"** — this makes things easier later
6. Click **Install**, then **Finish**

---

### 1.2 — Install Git (Version Control)

Git is how you download (clone) the code from GitHub.

1. Go to **https://git-scm.com/download/win**
2. The download will start automatically (pick the 64-bit installer)
3. Run the `.exe` file
4. Click **Next** through all the steps — the defaults are all correct
5. When asked about the default editor, you can change it to **VS Code** if you like, or leave it
6. Click **Install**, then **Finish**

**Verify it worked:** Open a new Command Prompt or PowerShell window and type:
```
git --version
```
You should see something like `git version 2.x.x`.

---

### 1.3 — Create a GitHub Account

If you already have a GitHub account, skip this step.

1. Go to **https://github.com**
2. Click **Sign up**
3. Enter your email, create a password, and pick a username
4. Verify your email when GitHub sends you a confirmation link

---

### 1.4 — Install Node.js (JavaScript Runtime)

Node.js is what actually runs the backend server code.

1. Go to **https://nodejs.org/**
2. Download the **LTS** version (the one that says "Recommended For Most Users")
3. Run the installer, click **Next** through all steps (defaults are correct)
4. When asked about "Tools for Native Modules", **leave it unchecked** unless you know what it is

**Verify it worked:** Open a new Command Prompt or PowerShell and type:
```
node --version
npm --version
```
Both should print version numbers (e.g., `v22.x.x` and `10.x.x`).

---

### 1.5 — Install Docker Desktop (Database Container)

Docker runs the PostgreSQL database inside a container — you don't need to install PostgreSQL itself.

1. Go to **https://www.docker.com/products/docker-desktop/**
2. Click **Download for Windows**
3. Run the installer
4. If asked about **WSL 2**, click **OK** / **Install** — it will set this up automatically
5. After installation, **restart your computer** (Docker Desktop requires a restart)
6. After restarting, Docker Desktop will launch automatically and you will see a whale icon in your system tray (bottom right corner of the taskbar)
7. Wait for the whale icon to stop animating — it takes about 30 seconds to fully start

**Verify it worked:** Open a Command Prompt or PowerShell and type:
```
docker --version
```
You should see `Docker version 2x.x.x`.

---

## Part 2 — Get the Code

### 2.1 — Clone the Repository

"Cloning" means downloading the project code to your computer.

1. Open **VS Code**
2. Press `Ctrl+Shift+P` to open the Command Palette
3. Type `Git: Clone` and press Enter
4. Paste this URL:
   ```
   https://github.com/MirFaizan06/Wadera-Associates-Data-Intelligence.git
   ```
5. Choose a folder on your computer where you want to save the project (e.g., `C:\Projects\`)
6. VS Code will ask if you want to open the cloned repository — click **Open**

**Alternative method (Command Prompt):**
```
cd C:\Projects
git clone https://github.com/MirFaizan06/Wadera-Associates-Data-Intelligence.git
cd Wadera-Associates-Data-Intelligence
```

---

### 2.2 — Open a Terminal in VS Code

Inside VS Code, press `Ctrl+` ` ` (the backtick key, top-left of the keyboard) to open the integrated terminal.

You should see a terminal at the bottom of VS Code with a path like `C:\Projects\Wadera-Associates-Data-Intelligence>`.

---

## Part 3 — Set Up the Environment File

The server needs a configuration file (`.env`) that tells it how to connect to the database, where to send emails, etc. This file is not included in the repo for security reasons — you have to create it manually.

### 3.1 — Create the `.env` File

1. In VS Code, expand the **server** folder in the left sidebar
2. Right-click on the **server** folder and select **New File**
3. Name it `.env` (just `.env` — no other words, with the dot at the start)
4. Paste the following content into the file:

```env
# Server
NODE_ENV=development
PORT=5000

# Database (PostgreSQL via Docker — do not change these)
DATABASE_URL="postgresql://wadera_user:wadera_pass@localhost:5432/wadera_db"

# Auth (generate your own — or use the one below for testing only)
JWT_SECRET="test-secret-for-local-dev-replace-in-production"
JWT_EXPIRES_IN="7d"

# Admin account (this will be created when you seed the database)
DEVELOPER_ADMIN_EMAIL="admin@waderaassociates.com"
DEVELOPER_ADMIN_PASSWORD="ChangeMe@123"

# Frontend (for CORS — keep this as-is for local testing)
FRONTEND_URL="http://localhost:3000"

# Email (not needed for basic testing — leave empty)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="noreply@waderaassociates.com"

# Payments (not needed for basic testing — leave empty)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""

# Storage (not needed for basic testing — files will save locally)
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""

# Exchange Rate API (not needed — rates will show INR only without this)
EXCHANGE_RATE_API_KEY=""
EXCHANGE_RATE_API_URL="https://api.exchangerate-api.com/v4/latest/INR"

# Geolocation (not needed for testing)
GEOLOCATION_API_KEY=""
GEOLOCATION_API_URL="https://api.ipgeolocation.io/ipgeo"

# Redis (not used in dev)
REDIS_URL="redis://localhost:6379"

# Logging
LOG_LEVEL="info"
```

5. Press `Ctrl+S` to save

---

## Part 4 — Start the Database

### 4.1 — Make Sure Docker Desktop Is Running

Look at your system tray (bottom-right of your screen). You should see the **Docker whale icon**. If it's animated (spinning), wait for it to stop — Docker is starting up. If you don't see it, search for "Docker Desktop" in the Start menu and open it.

### 4.2 — Start the PostgreSQL Container

In the VS Code terminal (make sure you are in the project root folder, not inside `server/`):

```
docker compose up -d
```

This downloads the PostgreSQL 16 image (first time only, ~150 MB) and starts a database container called `wadera-postgres`.

**Wait about 15–20 seconds**, then check it's running:

```
docker compose ps
```

You should see something like:
```
NAME              STATUS          PORTS
wadera-postgres   Up (healthy)    0.0.0.0:5432->5432/tcp
```

The word **"healthy"** is key. If it says "starting", wait a few more seconds and run the command again.

**To stop the database later (without losing data):**
```
docker compose stop
```

**To restart it next time:**
```
docker compose up -d
```

---

## Part 5 — Install Dependencies and Set Up the Server

### 5.1 — Navigate to the Server Folder

In the VS Code terminal:
```
cd server
```

### 5.2 — Install Node Packages

```
npm install
```

This downloads all the libraries the server needs (takes 1–3 minutes on first run).

### 5.3 — Run the Database Migration

This creates all the database tables:

```
npx prisma migrate deploy
```

You should see output ending with:
```
All migrations have been successfully applied.
```

### 5.4 — Seed the Database

This creates the admin user, default roles, license types, email templates, and static page content:

```
npm run seed
```

You should see:
```
Seeding database...
Seeding complete!
```

### 5.5 — Start the Server

```
npm run dev
```

You should see:
```
info: Database connected successfully
info: Cron jobs started
info: Server running on port 5000 in development mode
```

The server is now running. **Leave this terminal open** — closing it will stop the server.

---

## Part 6 — Verify Everything Is Working

Open a **new browser tab** and go to:

```
http://localhost:5000/health
```

You should see:
```json
{"status":"ok","timestamp":"2026-..."}
```

If you see this, the server is running correctly. You are ready to test.

---

## Part 7 — Install a REST API Client (For Testing)

Since many of the API endpoints require sending data (POST/PUT requests) or use authentication, you need a tool to test them. We recommend **Bruno** — it's free, lightweight, and runs offline.

### Install Bruno

1. Go to **https://www.usebruno.com/**
2. Click **Download** and install it like a normal Windows app

### Alternative: Postman

If you prefer Postman:
1. Go to **https://www.postman.com/downloads/**
2. Download and install the desktop app
3. You can use it without creating an account

### Or: Use curl (Command Line)

If you are comfortable with the command line, all tests in the Testing Guide use `curl` commands that you can paste directly into your terminal.

---

## Part 8 — Optional: Run the Frontend

If you also want to test the web UI:

1. Open a **second terminal** in VS Code (`Ctrl+Shift+5` to split, or open a new terminal)
2. Navigate to the client folder:
   ```
   cd ../client
   ```
   (or from project root: `cd client`)
3. Install dependencies:
   ```
   npm install
   ```
4. Start the frontend:
   ```
   npm run dev
   ```
5. Open **http://localhost:3000** in your browser

---

## Quick Reference: Start / Stop Commands

| What | Command | Where to run |
|---|---|---|
| Start database | `docker compose up -d` | Project root |
| Stop database | `docker compose stop` | Project root |
| Start server | `npm run dev` | `server/` folder |
| Stop server | Press `Ctrl+C` in the server terminal | — |
| View database tables | `npx prisma studio` | `server/` folder |
| Reset everything | `npm run db:reset` | `server/` folder |

---

## Troubleshooting

**"Cannot connect to the Docker daemon"**  
→ Docker Desktop is not running. Open it from the Start menu and wait for the whale icon to appear in the system tray.

**"Port 5432 already in use"**  
→ Another PostgreSQL is running on your machine. Stop it, or check Docker is not already running the container: `docker compose ps`

**"Cannot find module" or similar Node errors**  
→ You probably skipped `npm install`. Run it again from the `server/` folder.

**"PrismaClientInitializationError" or "Can't reach database"**  
→ The Docker container is not running. Run `docker compose up -d` from the project root, wait for it to say "healthy", then restart the server.

**Server crashes immediately on start**  
→ Check the `.env` file. Common issues: wrong `DATABASE_URL`, missing `JWT_SECRET`, missing `DEVELOPER_ADMIN_EMAIL` or `DEVELOPER_ADMIN_PASSWORD`.

**"EADDRINUSE: address already in use 0.0.0.0:5000"**  
→ Another process is already using port 5000. Either stop the old server or change `PORT=5001` in `.env`.

---

*Guide written for ARW Analytics local setup — May 2026*
