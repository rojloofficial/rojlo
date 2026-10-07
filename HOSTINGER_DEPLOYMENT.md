# Rojlo Hostinger Deployment Guide

## Stack
- **Framework**: Next.js 16.3.4 (App Router)
- **Runtime**: Node.js (>= 20.9.0 LTS recommended, Node 20.x or 22.x)
- **Language**: TypeScript 5
- **Database**: MariaDB / MySQL (via Prisma ORM 6.4.1) & MongoDB (fallback)
- **Production Server**: Node.js standalone server / Next.js production server

## Repository
`https://github.com/rojloofficial/rojlo`

## Branch
`main`

## Node.js Version
- **Recommended**: **Node.js 20 LTS** (minimum `>= 20.9.0` required by Next.js 16.3.4).
- Alternatively: Node.js 22 LTS.
- Defined in `package.json`: `"engines": { "node": ">=20.9.0" }`.

## Application Type
**Hostinger Node.js Web App**  
*(Do NOT use standard PHP Web Hosting / Composer Git deployment).*

## Root Directory
- **Application Root**: `/home/<user>/domains/rojlo.in/public_html` (or subfolder path configured in Hostinger Node.js Web App manager, e.g., `/home/<user>/public_html` or repository root).

## Install Command
```bash
npm install
```
*(Automatically triggers `postinstall: prisma generate` to build Prisma client).*

## Build Command
```bash
npm run build
```
*(Compiles the Next.js production application with Turbopack and builds `.next/standalone`).*

## Start Command
```bash
npm start
```
*(Or if using PM2 / standalone server: `node .next/standalone/server.js`).*

## Port Handling
- Next.js automatically listens on `process.env.PORT` when started via `npm start` or `node .next/standalone/server.js`.
- If Hostinger dynamically assigns an internal port (e.g. `PORT=3000` or random unprivileged port for reverse-proxying via LiteSpeed / Nginx), the application automatically binds to that port.
- In `ecosystem.config.cjs`, `PORT: process.env.PORT || 3000` is configured.

## Environment Variables
Set the following environment variables in the Hostinger Node.js Web App settings:

### Server-Only Variables (Private)
- `NODE_ENV=production`
- `PORT=3000` (or assigned port)
- `DATABASE_URL` — MariaDB connection string: `mysql://DB_USER:DB_PASSWORD@localhost:3306/DB_NAME`
- `MONGODB_URI` — Optional/fallback MongoDB connection string
- `MONGODB_DB=rojlo`
- `JWT_SECRET` — Strong random secret (min 32 characters)
- `JWT_TOKEN_EXPIRY=30d`
- `OTP_HASH_SECRET` — Optional random secret for OTP hashing
- `ADMIN_EMAIL` — Master admin email
- `ADMIN_PASSWORD` — Master admin password
- `ADMIN_TOKEN` — Master admin token
- `VIP_LOGIN_URL=https://rojlo.in/vip/login`
- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- `CLOUDINARY_API_KEY` — Cloudinary API key
- `CLOUDINARY_API_SECRET` — Cloudinary API secret
- `SMTP_HOST` — SMTP host (e.g. `smtp.hostinger.com`)
- `SMTP_PORT` — SMTP port (e.g. `465`)
- `SMTP_USER` — SMTP email address
- `SMTP_PASS` — SMTP email password
- `SMTP_FROM="Rojlo <noreply@rojlo.in>"`
- `DEFAULT_UPI_ID` — Fallback UPI ID
- `DEFAULT_UPI_NAME` — Fallback UPI Name
- `DEFAULT_UPI_QR` — Fallback UPI QR image URL

### Client-Exposed Variables (`NEXT_PUBLIC_*`)
*(Note: These must be set before running `npm run build` so Next.js can inline them into static chunks)*
- `NEXT_PUBLIC_SITE_NAME=Rojlo`
- `NEXT_PUBLIC_SITE_URL=https://rojlo.in`
- `NEXT_PUBLIC_VIP_URL=https://rojlo.in/vip/login`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Google Analytics Measurement ID

## Database Configuration (MariaDB on Hostinger)
1. In Hostinger hPanel, go to **Databases** &rarr; **Management**.
2. Create a new MySQL/MariaDB database (e.g., `u123456789_rojlo`).
3. Create a database user and assign a secure password.
4. Note your database credentials:
   - Host: `localhost` (or `127.0.0.1:3306`)
   - User: `u123456789_user`
   - Password: `YourSecretPassword`
   - Database name: `u123456789_rojlo`
5. Construct the `DATABASE_URL`:
   ```text
   mysql://u123456789_user:YourSecretPassword@localhost:3306/u123456789_rojlo
   ```
6. Push the Prisma schema tables to MariaDB using the Hostinger SSH Terminal:
   ```bash
   npx prisma db push
   ```

## Production Domain
- Domain: **`https://rojlo.in`**
- SSL: Ensure Free Let's Encrypt SSL is active in Hostinger hPanel under **Security** &rarr; **SSL**.
- Force HTTPS enabled.

## Deployment Procedure (Step-by-Step in Hostinger)

### Option A: Using Hostinger "Node.js" Application Manager (hPanel)
1. Log in to Hostinger hPanel for `rojlo.in`.
2. Navigate to **Websites** &rarr; select `rojlo.in` &rarr; locate **Node.js** under **Advanced** or **Websites**.
3. Create or Configure the Node.js application:
   - **Node.js version**: Choose `20.x` LTS.
   - **Application mode**: `Production`.
   - **Application root**: Path to repository files (e.g. `/home/uXXXX/domains/rojlo.in/public_html`).
   - **Application startup file**: `node_modules/next/dist/bin/next` or point to a custom startup runner / PM2 `ecosystem.config.cjs`.
   - Or configure NPM Scripts:
     - Install: `npm install`
     - Build: `npm run build`
     - Start: `npm start`
4. Set the **Environment Variables** in the Node.js app dashboard or in `.env.production`.
5. Run Build and Start the application.

### Option B: Using Hostinger VPS / Cloud or SSH Terminal (PM2)
If your Hostinger plan includes SSH/Terminal access:
1. SSH into the server:
   ```bash
   ssh uXXXXXX@rojlo.in -p 65002
   ```
2. Navigate to your website folder:
   ```bash
   cd ~/domains/rojlo.in/public_html
   ```
3. Pull the latest code:
   ```bash
   git pull origin main
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Build the application:
   ```bash
   npm run build
   ```
6. Start or restart using PM2:
   ```bash
   pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs
   pm2 save
   ```

## Git Deployment (Automated Redeployment)
1. Every push to GitHub branch `main` updates `git@github.com:rojloofficial/rojlo.git`.
2. In Hostinger Git deployment or via a GitHub Actions webhook / SSH action:
   - Set the webhook to pull the latest commit from `main`.
   - Ensure the post-receive hook executes:
     ```bash
     npm install
     npm run build
     pm2 reload ecosystem.config.cjs
     ```

## Troubleshooting: Root Cause of 403 Forbidden
### The Observed Problem:
When you initially deployed via Hostinger's Git tool, the log showed:
```text
INFO: Cloning https://github.com/rojloofficial/rojlo.git (branch: main)
INFO: Cloning completed
INFO: Installing Composer dependencies
INFO: Installing completed
INFO: Publishing
INFO: Publishing completed
Result: 403 Forbidden
```

### Confirmed Cause:
1. **Wrong Application Engine**: Hostinger's standard "Git" tool under the shared hosting panel defaults to **PHP/Composer** hosting.
2. It looked for PHP files, attempted to run `composer install`, and published the source tree directly to `public_html` without starting a Node process.
3. Because Next.js is a server-rendered JavaScript application with no `index.php` or static `index.html` in the root folder, Apache/LiteSpeed web server was requested to serve an empty directory index.
4. Since directory listing is disabled on Hostinger for security, the web server returned **`403 Forbidden`**.
5. **Conclusion**: The repository source code was NOT broken. The 403 was 100% caused by Hostinger deploying this project as a PHP application instead of a **Node.js Web App**.
