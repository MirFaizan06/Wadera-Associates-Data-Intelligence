# Wadera Associates — MySQL → PostgreSQL + Docker Migration

Migrating the backend database from MySQL 8 to PostgreSQL 16 running in Docker.
Same pattern as PASH-PEMA LMIS. Already using Prisma, so this is mostly config changes.

**Current:** MySQL 8 (hosted) + Prisma  
**Target:** PostgreSQL 16 (Docker, local dev) + Prisma — same ORM, different driver

---

## Why This Is Simpler Than It Sounds

Prisma already abstracts the database. The bulk of the migration is:
1. Swap the Docker container (MySQL → Postgres)
2. Change `DATABASE_URL` format
3. Change `provider = "mysql"` to `provider = "postgresql"` in schema.prisma
4. Remove MySQL-specific `@db.*` type annotations from the schema
5. Wipe and re-migrate (or export/import existing data)

No service files, controllers, or query logic needs to change. Prisma's query API is identical across databases.

---

## Pre-Migration Checklist

- [ ] Docker Desktop installed and running
- [ ] Existing MySQL data exported if you want to migrate it (see [Data Migration](#data-migration) section)
- [ ] Server is not in production — do this locally or in a dev branch
- [ ] Git branch created: `git checkout -b feat/postgres-migration`

---

## Step 1 — Add `docker-compose.yml` at Project Root

Create `docker-compose.yml` at the repo root (same level as `client/` and `server/`):

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: wadera-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB:       wadera_db
      POSTGRES_USER:     wadera_user
      POSTGRES_PASSWORD: wadera_pass
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U wadera_user -d wadera_db']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

Start it:

```bash
docker compose up -d
docker compose ps    # should show wadera-postgres as "healthy" after ~10s
```

**Essential commands:**

```bash
docker compose up -d          # start (background)
docker compose stop           # stop (keeps data)
docker compose down           # stop + remove containers (keeps data in volume)
docker compose down -v        # NUCLEAR — destroys all data, start fresh
docker compose logs postgres  # view logs if something breaks

# Open a psql shell inside the container
docker exec -it wadera-postgres psql -U wadera_user -d wadera_db
```

---

## Step 2 — Update `server/.env`

Change `DATABASE_URL` from MySQL format to PostgreSQL format:

```env
# OLD (MySQL)
DATABASE_URL="mysql://root:password@localhost:3306/wadera_db"

# NEW (PostgreSQL via Docker)
DATABASE_URL="postgresql://wadera_user:wadera_pass@localhost:5432/wadera_db"
```

Update `server/.env.example` the same way (safe to commit):

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/wadera_db"
```

The rest of the env vars (JWT, SMTP, AWS, Razorpay, etc.) stay exactly the same.

---

## Step 3 — Update `server/prisma/schema.prisma`

### 3a. Change the datasource provider

```prisma
// BEFORE
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// AFTER
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3b. Remove MySQL-specific `@db.*` type annotations

MySQL Prisma uses annotations like `@db.Text`, `@db.VarChar(255)`, `@db.TinyInt`, `@db.LongText` etc. PostgreSQL doesn't need these — its String type is already unlimited (no 255-char default), and it has native Boolean (not TinyInt).

**Find and remove/replace these throughout the schema:**

| MySQL annotation | PostgreSQL action |
|---|---|
| `@db.Text` | Remove entirely — PostgreSQL `String` is already unlimited |
| `@db.LongText` | Remove entirely |
| `@db.MediumText` | Remove entirely |
| `@db.VarChar(n)` | Remove if just limiting String; keep only if you want explicit constraint |
| `@db.TinyInt(1)` | Remove — `Boolean` is native in PostgreSQL |
| `@db.Char(n)` | Keep or remove depending on need |

**Quick search in VS Code:** `Ctrl+Shift+F` → search `@db.` in `server/prisma/schema.prisma` and review each one.

**Example transformation:**

```prisma
// BEFORE (MySQL)
model EmailTemplate {
  id       Int    @id @default(autoincrement())
  slug     String @unique @db.VarChar(100)
  subject  String @db.VarChar(255)
  body     String @db.LongText
  isActive Boolean @default(true) @db.TinyInt(1)
}

// AFTER (PostgreSQL)
model EmailTemplate {
  id       Int    @id @default(autoincrement())
  slug     String @unique
  subject  String
  body     String
  isActive Boolean @default(true)
}
```

All the models (User, TimeSeries, DataPoint, Purchase, etc.) just need these annotations stripped — the rest of the field definitions stay the same.

### 3c. JSON fields (no change needed)

`Json` type works identically in Prisma for both MySQL and PostgreSQL. The `Role.permissions` field and any other `Json` fields need no changes.

### 3d. Enums (no change needed)

Prisma enums work the same across both databases.

---

## Step 4 — Remove MySQL Driver, Install PostgreSQL Driver

Prisma's PostgreSQL driver is different from MySQL:

```bash
cd server

# Remove MySQL-specific package (if separately installed)
npm uninstall mysql2

# Install Postgres driver
npm install pg
npm install -D @types/pg

# Regenerate Prisma Client for the new provider
npx prisma generate
```

> **Note:** Many Prisma setups don't require explicit `pg` installation since Prisma bundles its own binary. If `prisma generate` and `prisma migrate` work without it, you don't need the `pg` package. Try without first.

---

## Step 5 — Drop Existing Migrations, Create Fresh Migration

Your existing `server/prisma/migrations/` folder was generated against MySQL. The SQL inside uses MySQL syntax and cannot be applied to PostgreSQL. Delete it and create a fresh migration.

```bash
cd server

# 1. Delete all existing migrations
rm -rf prisma/migrations

# 2. Make sure Docker postgres is running
docker compose up -d

# 3. Create the first PostgreSQL migration
npx prisma migrate dev --name initial_schema

# This:
# → generates fresh SQL for PostgreSQL in prisma/migrations/
# → applies it to your local Postgres container
# → regenerates the TypeScript Prisma Client
```

If there are any schema errors, fix them (usually leftover `@db.*` annotations) and re-run.

---

## Step 6 — Re-seed the Database

```bash
cd server
npm run seed
# or
npx prisma db seed
```

This re-creates the admin user, default roles, email templates, and any other seed data.

---

## Step 7 — Verify It Works

```bash
cd server
npm run dev
```

Test the key flows:
- [ ] Server starts without errors
- [ ] `GET /health` returns 200
- [ ] Admin login works
- [ ] Dataset listing works
- [ ] User registration + OTP flow works
- [ ] Prisma Studio opens and shows all tables: `npx prisma studio`

---

## Data Migration (If You Want to Preserve Existing MySQL Data)

If you need to migrate production data from MySQL to PostgreSQL, do this **before** running the Prisma migration:

### Option A — Use pgloader (recommended for full migration)

pgloader is a CLI tool that migrates entire MySQL databases to PostgreSQL automatically, including data type conversions.

```bash
# Install (on WSL/Linux)
sudo apt install pgloader

# Create a pgloader script: migrate.load
LOAD DATABASE
  FROM   mysql://root:password@localhost:3306/wadera_db
  INTO   postgresql://wadera_user:wadera_pass@localhost:5432/wadera_db

WITH include drop, create tables, create indexes, reset sequences

SET work_mem to '128 MB', maintenance_work_mem to '512 MB'

CAST type tinyint(1) to boolean using tinyint-to-boolean,
     type datetime  to timestamptz,
     type longtext  to text,
     type mediumtext to text;
```

```bash
pgloader migrate.load
```

pgloader handles the type conversions (datetime → timestamptz, tinyint → boolean, etc.) automatically.

### Option B — Manual export/import per table (for selective migration)

```bash
# In MySQL: export specific tables as CSV
mysqldump -u root -p wadera_db --tab=/tmp --fields-terminated-by=',' --fields-optionally-enclosed-by='"' TableName

# In PostgreSQL: import CSV
docker exec -it wadera-postgres psql -U wadera_user -d wadera_db \
  -c "\COPY \"TableName\" FROM '/tmp/TableName.txt' CSV HEADER"
```

### Option C — Start fresh (simplest if data is not critical)

If this is a dev/staging environment and the production MySQL DB stays live while you work:
- Just run `npx prisma migrate dev` and `npm run seed`
- Re-enter test data manually or write a more complete seed script

---

## Update `package.json` Scripts

Add convenience scripts in `server/package.json`:

```json
{
  "scripts": {
    "dev":        "tsx watch src/index.ts",
    "build":      "tsc",
    "start":      "npx prisma migrate deploy && node dist/index.js",
    "seed":       "npx prisma db seed",
    "db:up":      "docker compose -f ../docker-compose.yml up -d",
    "db:down":    "docker compose -f ../docker-compose.yml stop",
    "db:reset":   "docker compose -f ../docker-compose.yml down -v && docker compose -f ../docker-compose.yml up -d && npx prisma migrate deploy && npx prisma db seed",
    "db:studio":  "npx prisma studio",
    "db:migrate": "npx prisma migrate dev"
  }
}
```

`npm run db:reset` = nuclear option — wipes everything and starts fresh. Useful in development.

Note: `"start"` now runs `prisma migrate deploy` before the server — this means Railway and any other deployment platform will auto-apply pending migrations on every deploy. No manual DB setup needed.

---

## `server/.env` — Complete Reference After Migration

```env
# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://wadera_user:wadera_pass@localhost:5432/wadera_db"

# ── Auth ──────────────────────────────────────────────────────────────────────
JWT_SECRET="generate-with-node-crypto-randomBytes-32-hex"
JWT_EXPIRES_IN="7d"

# ── Email (Gmail SMTP) ────────────────────────────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-gmail@gmail.com"
SMTP_PASS="your-app-password-no-spaces"

# ── AWS S3 ────────────────────────────────────────────────────────────────────
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="..."
AWS_BUCKET_NAME="..."

# ── Payments ──────────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID="..."
RAZORPAY_KEY_SECRET="..."

# ── APIs ──────────────────────────────────────────────────────────────────────
EXCHANGE_RATE_API_KEY="..."
GEOLOCATION_API_KEY="..."

# ── App ───────────────────────────────────────────────────────────────────────
PORT=4000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
LOG_LEVEL="info"
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Railway Deployment (Production PostgreSQL)

When deploying to Railway:

1. Add a **PostgreSQL** service in Railway (not MySQL)
2. Railway injects `DATABASE_URL` automatically — reference it as `${{Postgres.DATABASE_URL}}`
3. Your `start` script (`prisma migrate deploy && node dist/index.js`) auto-migrates on every deploy
4. Delete the Railway MySQL service after confirming PostgreSQL works

For the env vars panel in Railway, copy everything except `DATABASE_URL` from your local `.env` (Railway's Postgres service provides its own connection string).

---

## Common Issues

**`P1001: Can't reach database server at localhost:5432`**
→ Docker container isn't running. Run `docker compose up -d` and wait for the healthcheck to pass (`docker compose ps`).

**`Error: SASL: SCRAM-CLIENT-FIRST-MESSAGE: client does not support channel binding`**
→ pg driver version mismatch. Update: `npm install pg@latest`.

**`unknown database type: tinyint(1)`**
→ You have a leftover MySQL `@db.TinyInt(1)` annotation. Search and remove all `@db.*` annotations.

**`PrismaClientInitializationError: Invalid database URL`**
→ `DATABASE_URL` still has `mysql://` prefix. Change to `postgresql://`.

**Migrations folder conflict**
→ If you get "migration already applied" errors, you likely have old MySQL migrations. Delete `server/prisma/migrations/` entirely and re-run `prisma migrate dev`.

**`npx prisma generate` fails on Windows with EPERM**
→ The server is running and holding the Prisma DLL. Stop the server, run generate, restart.

---

## Quick Reference: Full Migration Sequence

```bash
# 1. Create branch
git checkout -b feat/postgres-migration

# 2. Start Docker Postgres
docker compose up -d

# 3. Update server/.env  (DATABASE_URL format)

# 4. Edit server/prisma/schema.prisma
#    → provider = "postgresql"
#    → remove all @db.* annotations

# 5. Delete old MySQL migrations
rm -rf server/prisma/migrations

# 6. Fresh migration for PostgreSQL
cd server && npx prisma migrate dev --name initial_schema

# 7. Seed
npm run seed

# 8. Test
npm run dev
# curl http://localhost:4000/health

# 9. Commit
git add -A && git commit -m "feat: migrate database from MySQL to PostgreSQL + Docker"
```

---

*Written for Wadera Associates Data Intelligence — May 2026*  
*Pattern from: PASH-PEMA LMIS (same Prisma + PostgreSQL + Docker setup)*  
*Reference doc: Desktop/Development Notes/Docker + Prisma + PostgreSQL Setup.md*
