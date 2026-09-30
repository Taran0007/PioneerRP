# 📂 GitHub, VS Code, and Supabase Database Sync Guide

This guide explains how to keep your Pioneer RP Live Hub project synchronized between AI Studio, VS Code, and GitHub, and how to link a persistent external database like **Supabase** or **Vercel Postgres** so that admins, streamers, and settings persist permanently across all serverless deployments.

---

## Part 1: Syncing with GitHub & VS Code

### Step 1: Export Your Project to GitHub
1. Create a new repository on [GitHub.com](https://github.com) (e.g., `pioneer-rp-live-hub`).
2. Open your terminal in VS Code (or your local environment after downloading the code):
   ```bash
   git init
   git remote add origin https://github.com/<your-username>/pioneer-rp-live-hub.git
   git branch -M main
   git add .
   git commit -m "Initial Pioneer RP Live Hub commit"
   git push -u origin main
   ```

### Step 2: Continuous Sync Workflow
- **From VS Code / Local to GitHub**:
  Whenever you make changes locally in VS Code:
  ```bash
  git add .
  git commit -m "Describe your update"
  git push origin main
  ```
- **Deploying to Vercel**:
  If connected to Vercel, every `git push origin main` automatically triggers a zero-downtime production deployment on Vercel!

---

## Part 2: Linking Supabase or Vercel Postgres for Permanent Persistence

By default, the app runs on a local JSON file store (`data/pioneer_live.json`). On serverless platforms like Vercel, filesystem writes are ephemeral (reset on cold start). To make sure newly added admins, streamers, and settings stay saved permanently across all deploys, you can link a **Supabase** or **Vercel Postgres** database in under 2 minutes:

### Step 1: Create a Free Supabase Database
1. Go to [Supabase.com](https://supabase.com) and create a new project.
2. Go to **Project Settings ➔ Database** and copy your **Connection String (URI)**:
   ```env
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

### Step 2: Link Supabase in Vercel & Environment Variables
1. **Locally / Vercel Environment Variables**:
   Add the following environment variable to your `.env` file (and in your Vercel project settings):
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
2. **Automatic Table Initialization**:
   When `DATABASE_URL` is configured, the application automatically creates all required SQL tables (`creators`, `platform_accounts`, `live_streams`, `admin_users`, `settings`, `clips`, `audit_logs`) and seeds them with your current data on startup!

---

## Part 3: Verifying Admin Persistence
Once Supabase or Vercel Postgres is linked:
1. Log into your Admin Panel at `/admin` using `Trnjeet@gmail.com` / `Taran@&007`.
2. Go to **Admin Users** tab and create a secondary admin.
3. Because the data is now stored in Supabase, that admin account will remain permanently saved across all deployments, serverless cold starts, and device sessions!
