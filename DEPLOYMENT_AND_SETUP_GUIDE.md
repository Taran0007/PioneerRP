# Pioneer RP Live — Complete Installation, Deployment & Security Guide

This document contains full instructions on how **Pioneer RP Live** is built, how it functions under the hood, how to run it locally in VS Code, and how to deploy it to **Vercel**, **Railway/Docker**, or a **Linux VPS**. It also outlines manual steps, 15 suggested feature improvements, and cybersecurity hardening against hackers.

---

## 1. How It's Built & How It Works

### Architectural Overview
Pioneer RP Live is a modern full-stack web application designed for high performance, low latency, and real-time streaming integration:

1. **Frontend**:
   - Built with **React 19**, **TypeScript**, and **Tailwind CSS v4**.
   - Bundled with **Vite 8** for lightning-fast Hot Module Replacement (HMR) and optimized static production builds.
   - Fluid animations and interactive transitions using **Motion** (`motion/react`) and **Lucide React** iconography.
   - Built-in embedded Twitch interactive video and live chat player with toggleable theatre modes.
   - 3D perspective scrolling marquee highlighting active streamers and their "Last Live" timestamps.

2. **Backend**:
   - **Node.js** running **Express** with modular API route controllers.
   - Background polling daemon (`StreamSyncService`) that queries the official **Twitch Helix API** to automatically detect live broadcasts, viewer counts, stream titles, categories, and past VODs.
   - Dual-mode data persistence:
     - **Embedded File Database (`/data/pioneer_live.json`)**: Zero-configuration JSON document database with atomic writes (`fs.renameSync` with `.tmp` staging).
     - **PostgreSQL Database**: High-concurrency production database automatically activated whenever a `DATABASE_URL` is provided (compatible with Neon, Supabase, Vercel Postgres, AWS RDS).
     - **Vercel Serverless Ready**: Uses `/tmp/data` on serverless read-only filesystems or your connected PostgreSQL instance.
   - Authentication powered by **JWT (JSON Web Tokens)** and salted **Bcrypt** password hashing.

3. **Twitch API Integration**:
   - Connects to Twitch's OAuth2 Client Credentials flow.
   - Obtains an App Access Token to poll Twitch Helix `/helix/streams`, `/helix/users`, and `/helix/videos` in batched queries.
   - API keys can be provided either via environment variables (`TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`) OR entered directly in the Admin Panel without restarting the app.

---

## 2. Dependencies & Prerequisites

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ LTS recommended)
- **npm**: v9.0.0 or higher (or `pnpm` / `yarn`)
- **Git** installed on your system
- **Twitch Developer Account** (Free from [dev.twitch.tv/console](https://dev.twitch.tv/console))

### Core Dependencies (`package.json`)
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `react` & `react-dom` | `^19.0.1` | User interface rendering |
| `vite` | `^8.3.0` | Development server and frontend builder |
| `express` | `^4.21.2` | REST API routing and server middleware |
| `typescript` | `^7.0.2` | End-to-end type safety |
| `tailwindcss` | `^4.3.3` | Utility-first responsive styling |
| `jsonwebtoken` | `^9.0.3` | Admin authentication tokens |
| `bcryptjs` | `^3.0.3` | Secure password hashing |
| `pg` | `^8.23.0` | PostgreSQL client for production storage |
| `cookie-parser` | `^1.4.7` | HTTP-only cookie parsing |
| `lucide-react` | `^0.546.0` | UI icons |
| `motion` | `^12.23.24` | 3D animations and page transitions |

---

## 3. Running on Localhost with VS Code

Follow these steps to run the application on your computer:

### Step 1: Open the Project in VS Code
1. Clone or download the project files to a folder on your computer:
   ```bash
   git clone <your-repository-url> pioneer-rp-live
   cd pioneer-rp-live
   ```
2. Launch Visual Studio Code:
   ```bash
   code .
   ```

### Step 2: Install Dependencies
Open the integrated terminal in VS Code (`Ctrl + ~` or `Cmd + ~` on Mac) and run:
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a file named `.env` in the root folder:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=super_secret_pioneer_rp_jwt_key_change_in_production_2026

# Twitch API Keys (Get these free from https://dev.twitch.tv/console)
TWITCH_CLIENT_ID=gp762nuuoqcoxypju8c569th9wz7q5
TWITCH_CLIENT_SECRET=your_twitch_client_secret_here

# Pioneer RP Links
PIONEER_DISCORD_URL=https://discord.gg/pioneerrp
PIONEER_STORE_URL=https://pioneer-rp-18.tebex.io/
PIONEER_JOIN_URL=fivem://connect/cfx.re/join/pioneer-rp

# Optional: PostgreSQL Database (leave empty to use local embedded JSON DB)
# DATABASE_URL=postgresql://user:password@localhost:5432/pioneerrp
```

### Step 4: Start the Development Server
In your VS Code terminal, run:
```bash
npm run dev
```
You will see:
```
[Server] Initializing database...
[DB] Loaded embedded database with 4 creators.
[Server] Starting Twitch Stream Sync Service...
[Server] Mounting Vite dev middleware...
[PIONEER RP LIVE] Server active on http://0.0.0.0:3000
```

### Step 5: Open in Your Browser
- Visit: `http://localhost:3000`
- Access the Admin Panel: `http://localhost:3000/admin`
  - **Email**: `Trnjeet@gmail.com` (or username `TJSINGH`)
  - **Password**: `Taran@&007`

---

## 4. Hosting on Vercel

The repository is pre-configured with `vercel.json` and a serverless API handler (`api/index.ts`).

### Step 1: Push Code to GitHub / GitLab
1. Initialize a git repository and commit your files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Pioneer RP Live"
   ```
2. Create a repository on [GitHub](https://github.com/new) and push:
   ```bash
   git remote add origin https://github.com/<your-username>/pioneer-rp-live.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Vercel
1. Log into your account at [vercel.com](https://vercel.com).
2. Click **"Add New..."** -> **"Project"**.
3. Import your GitHub repository.
4. Set the project configuration:
   - **Framework Preset**: `Vite`
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `JWT_SECRET`: A long random secret string.
   - `TWITCH_CLIENT_ID`: Your Twitch Client ID.
   - `TWITCH_CLIENT_SECRET`: Your Twitch Client Secret.
6. Click **Deploy**. Vercel will build the frontend and deploy the serverless functions in `/api` automatically!

---

### Step 3: Link Your Database in Vercel (3 Easy Methods)

#### Method 1: Automatic Zero-Config Bundled Database (No setup required!)
The current database file (`data/pioneer_live.json`) is committed into your Git repository.
When your Vercel site runs:
- It automatically seeds `/tmp/data/pioneer_live.json` with all 4 streamers (TJ SINGH, ApocalypticSith, ithebunny, Moxie Moses), their Twitch user IDs, avatars, and your admin account (`Trnjeet@gmail.com`).
- Anyone with your Vercel link can visit the site and watch live streams immediately without setting up any external database!

#### Method 2: Vercel Postgres / Neon Storage (Recommended for 100% cloud persistence)
Because Vercel serverless functions are ephemeral, linking Vercel Postgres ensures any new streamers or settings you change in `/admin` persist permanently:
1. In your **Vercel Project Dashboard**, click the **"Storage"** tab at the top.
2. Click **"Connect Database"** (or **"Create Database"**) and choose **"Postgres"** (powered by Neon).
3. Choose a region close to your users (e.g. `Washington D.C. (iad1)` or `Frankfurt (fra1)`) and click **Create**.
4. In the dialog, select your project and click **Connect**.
5. Vercel will automatically set the `POSTGRES_URL` and `DATABASE_URL` environment variables for your project!
6. Click **Redeploy**.
7. Done! The backend automatically detects the PostgreSQL connection, creates the SQL tables (`creators`, `platform_accounts`, `settings`, `admin_users`), and connects seamlessly!

#### Method 3: Using Google Cloud Firestore (`ai-studio-2e2977be-c16d-457c-80f2-891921653f5c`)
If you want to use the included Google Cloud Firestore database:
1. In Vercel Project Settings -> **Environment Variables**, add:
   - `FIREBASE_PROJECT_ID`: `gen-lang-client-0356159766`
   - `FIRESTORE_DATABASE_ID`: `ai-studio-2e2977be-c16d-457c-80f2-891921653f5c`
2. You can also import and export full database JSON backups at any time via the **Admin Panel -> Settings** tab!

---

## 5. Hosting on a Linux VPS (Ubuntu / Debian) with PM2 & Nginx

If you prefer a dedicated server or VPS (DigitalOcean, Linode, AWS EC2, Hetzner):

### Step 1: Install Node.js & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git
sudo npm install -g pm2
```

### Step 2: Clone and Build
```bash
cd /var/www
sudo git clone https://github.com/<your-username>/pioneer-rp-live.git
cd pioneer-rp-live
sudo npm install
sudo npm run build
```

### Step 3: Run with PM2
```bash
pm2 start dist/server.js --name "pioneer-rp-live"
pm2 save
pm2 startup
```

### Step 4: Configure Nginx & SSL
Create `/etc/nginx/sites-available/pioneerrp.conf`:
```nginx
server {
    server_name live.pioneerrp.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable the site and install free SSL with Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/pioneerrp.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d live.pioneerrp.com
```

---

## 6. What You Have To Do Manually

1. **Obtain Twitch API Credentials**:
   - Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps).
   - Click **"Register Your Application"**.
   - Name: `Pioneer RP Live Hub`.
   - OAuth Redirect URLs: `http://localhost:3000/api/auth/twitch/callback` (and your live domain).
   - Category: `Website Integration`.
   - Copy the **Client ID** and generate a **New Secret**.
   - Paste them into your `.env` or save them in the **Admin Panel -> Settings** tab.

2. **Change the Default Admin Password**:
   - Log in at `/admin` with `Trnjeet@gmail.com` / `Taran@&007`.
   - Create a secondary admin or update your password to a private 16+ character passphrase.

3. **Add Community Streamers**:
   - In the Admin Panel, click **"Add Streamer"**.
   - Enter their Twitch username (e.g. `TJ_SINGH007`, `apocalypticsith`, `ithebunny`, `moxiemoses`).
   - The system automatically syncs their live status, profile photo, and past VODs.

---

## 7. 15 High-Impact Improvements & Features to Add

1. **Multi-Stream Squad View (Grid Mode)**: Allow viewers to watch 2, 3, or 4 Pioneer RP streamers side-by-side simultaneously with synchronized audio switching.
2. **Interactive Los Santos Live Map**: Integrate an interactive Leaflet/Mapbox map of the GTA V / FiveM map showing approximate streamer locations based on their current faction or district.
3. **FiveM Server Real-Time Player Count**: Query the FiveM server endpoint (`http://<ip>:<port>/dynamic.json` or CFX API) to display the live player count (e.g., `124/128 Players in Los Santos`) directly in the header banner.
4. **Stream Clip Submissions**: A community submission portal where viewers can submit notable Twitch clips from past heists, police chases, or comedic moments for admin approval.
5. **Discord Webhook Live Notifications**: Automatically send an embedded message to a dedicated `#streamer-announcements` Discord channel whenever a registered creator goes live.
6. **Creator Tier & Faction Badging**: Tag creators with their in-game roles (e.g., `Police / LSPD`, `EMS / Pillbox Medical`, `DOJ / Judges`, `Underworld / Syndicate`, `Civilian`).
7. **Schedule & Event Calendar**: A community calendar displaying scheduled server events (court cases, gang wars, car meets, server wipe dates).
8. **Creator Code Analytics**: Track click-through rates and referrals for streamer Tebex codes to reward the top community advocates.
9. **Dark/Light Theme & Custom Accent Colors**: Allow users to toggle between Neon Purple, Cyber Cyan, and Emerald Green server themes.
10. **Push Notifications**: Web push notifications (via Service Worker) letting fans subscribe to their favorite streamer and get alerted when they go live.
11. **Mobile Progressive Web App (PWA)**: Add installability (`manifest.json` and service worker) so mobile users can add the hub directly to their Android / iOS home screen.
12. **Twitch Chat Integration with Badges**: Show custom Pioneer RP VIP / Supporter badges next to usernames in the live chat window.
13. **VOD Bookmarks & Timestamps**: Allow community editors to add timestamps for memorable moments inside long past broadcasts.
14. **Custom FiveM Join Launcher (One-Click)**: A button that triggers `fivem://connect/...` directly with automatic copy-to-clipboard for the server IP.
15. **Audit Log Export & Automated Backups**: Download weekly JSON/CSV backups of creator profiles, settings, and audit trails with one click.

---

## 8. Security Hardening Against Hackers

To make this site virtually impenetrable against unauthorized access, follow these security practices:

### 1. Brute-Force & Rate Limiting Protection
- Install `express-rate-limit` to restrict failed login attempts on `/api/auth/login` to a maximum of 5 attempts per 15 minutes per IP:
  ```bash
  npm install express-rate-limit
  ```
  ```ts
  import rateLimit from 'express-rate-limit';
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  });
  app.use('/api/auth/login', loginLimiter);
  ```

### 2. HTTP Security Headers with Helmet
- Use `helmet` to set secure HTTP headers (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`):
  ```bash
  npm install helmet
  ```
  ```ts
  import helmet from 'helmet';
  app.use(helmet({
    contentSecurityPolicy: false, // Adjusted for Twitch iframes
  }));
  ```

### 3. Cross-Site Scripting (XSS) Sanitization
- Never render user-supplied strings via `dangerouslySetInnerHTML`.
- All text rendered in React is automatically sanitized.
- Server-side inputs in `/api/admin/creators` strip out HTML tags using `validator.escape()`.

### 4. Cross-Origin Resource Sharing (CORS) Restriction
- In production, restrict API access only to your authorized frontend domain:
  ```ts
  import cors from 'cors';
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : true,
    credentials: true,
  }));
  ```

### 5. Multi-Factor Authentication (2FA) for Admin
- Implement Time-based One-Time Password (TOTP) using `speakeasy` and `qrcode` so admins must provide a 6-digit code from Google Authenticator or 1Password during login.

### 6. Session Security & JWT Hardening
- Rotate `JWT_SECRET` regularly.
- Ensure JWT expiration is kept reasonable (e.g. 24 hours to 7 days).
- Store JWT tokens in `HttpOnly`, `SameSite=Strict`, `Secure` cookies rather than `localStorage` to completely prevent JavaScript token theft via malicious browser extensions.

### 7. DDoS Protection & DNS Proxying (Cloudflare)
- Point your custom domain's nameservers to **Cloudflare** (Free plan).
- Enable **Cloudflare Proxy (Orange Cloud)** to hide your server's true IP address.
- Enable **Bot Fight Mode** and **Web Application Firewall (WAF)** to block automated vulnerability scanners and malicious scrapers.
