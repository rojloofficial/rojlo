# Rojlo Hostinger Deployment

## Stack
Next.js + Node.js + TypeScript

- Framework: Next.js 16.3.4 (App Router)
- Runtime: Node.js (>= 20.9.0 LTS recommended, Node 20.x or 22.x)
- Language: TypeScript 5
- Database: MariaDB / MySQL (via Prisma ORM 6.4.1) & MongoDB (fallback)
- Production Server: Node.js standalone server / Next.js production server

## Repository
https://github.com/rojloofficial/rojlo

## Branch
main

## Hostinger Application Type
Node.js Web App

*(Do NOT use standard PHP Web Hosting / Composer Git deployment).*

## Node.js Version
Node.js 20.x LTS (minimum `>= 20.9.0` required by Next.js 16.3.4). Node 22.x LTS is also compatible.

## Framework
Next.js

## Root Directory
`/home/<user>/domains/rojlo.in/public_html` (or repository root configured in Hostinger Node.js Web App manager)

## Install Command
`npm install`

*(Automatically triggers `postinstall: prisma generate` to build the Prisma client).*

## Build Command
`npm run build`

*(Compiles the Next.js production application with Turbopack and builds `.next/standalone`).*

## Start Command
`npm start`

*(Or if using PM2 / standalone runner: `node .next/standalone/server.js`).*

## Environment Variables
Set the following environment variable names in the Hostinger Node.js Web App configuration:

### Server-Only Variables (Confidential)
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
*(Must be set before running `npm run build` so Next.js can inline them into static bundles)*
- `NEXT_PUBLIC_SITE_NAME=Rojlo`
- `NEXT_PUBLIC_SITE_URL=https://rojlo.in`
- `NEXT_PUBLIC_VIP_URL=https://rojlo.in/vip/login`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Google Analytics Measurement ID

## Database
Required production configuration:
- Database System: MariaDB / MySQL on Hostinger.
- Connection String format:
  ```text
  DATABASE_URL="mysql://u123456789_user:YourSecretPassword@localhost:3306/u123456789_rojlo"
  ```
- Schema Initialization: Run `npx prisma db push` via Hostinger SSH Terminal to create all 22 relational tables according to `prisma/schema.prisma`.
- No database migration was forced, and existing models preserve MongoDB/in-memory fallback when MariaDB is not yet connected.

## Domain
https://rojlo.in

- Free Let's Encrypt SSL active under Hostinger hPanel &rarr; Security &rarr; SSL.
- Force HTTPS enabled.
- Canonical URLs and sitemap resolve to `https://rojlo.in`.

## 403 Root Cause
### Confirmed Cause:
1. Hostinger's standard "Git" deployment tool under shared hosting defaults to deploying **PHP / Composer** applications.
2. The deployment log confirmed this behavior:
   ```text
   INFO: Installing Composer dependencies
   INFO: Publishing
   INFO: Publishing completed
   ```
3. Hostinger published the repository into `public_html` expecting an `index.php` or `index.html`.
4. Because Next.js is a Node.js server application with no static `index.html` or `index.php` in the root folder, Apache/LiteSpeed attempted to display a directory index.
5. Because directory browsing is disabled on Hostinger servers for security, the server returned:
   ```text
   403 Forbidden - Access to this resource on the server is denied!
   ```
6. The Node.js server was **never started**, `npm install` was never executed, and `npm run build` was never called by Hostinger.
7. **Conclusion**: The application source code is NOT broken. The 403 error is 100% caused by Hostinger deployment type/configuration.

## Hostinger Fix
### Step-by-Step Instructions to Deploy via Hostinger Node.js Web App:
1. Log into **Hostinger hPanel** (`hpanel.hostinger.com`).
2. Go to **Websites** &rarr; select **`rojlo.in`**.
3. In the sidebar or search bar, look for **Node.js** (under *Advanced* or *Websites*).
   *(If your plan is shared hosting without the Node.js menu, use SSH/VPS access or upgrade to Cloud/VPS hosting).*
4. Under Node.js application management, click **Create Application**:
   - **Node.js version**: Choose `20.x` LTS.
   - **Application mode**: `Production`.
   - **Application root**: Path to repository files (e.g. `/home/uXXXXX/domains/rojlo.in/public_html`).
   - **Application startup file**: `node_modules/next/dist/bin/next` with argument `start` OR configure scripts:
     - Install command: `npm install`
     - Build command: `npm run build`
     - Start command: `npm start`
5. Click **Environment Variables** and enter the production variables listed above.
6. Click **Run Build** (`npm run build`).
7. Click **Start / Restart Application**.

### Alternative Fix via SSH / PM2 (VPS / Cloud / Business Plan with Terminal):
1. Connect via SSH:
   ```bash
   ssh uXXXXXX@rojlo.in -p 65002
   ```
2. Navigate to project root:
   ```bash
   cd ~/domains/rojlo.in/public_html
   ```
3. Pull latest code:
   ```bash
   git pull origin main
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Build production bundle:
   ```bash
   npm run build
   ```
6. Start cluster with PM2:
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   ```

## Redeployment
To redeploy when pushing new changes to GitHub:
1. Push your changes to `https://github.com/rojloofficial/rojlo` branch `main`.
2. In Hostinger Node.js Web App dashboard, click **Redeploy** or **Restart**.
3. If using SSH / terminal, run:
   ```bash
   git pull origin main && npm install && npm run build && pm2 reload ecosystem.config.cjs
   ```
