# 🚀 Step-by-Step Deployment Guide

This guide is designed for **college-level projects** where you need a **100% free, reliable public website** that your teachers, seniors, and friends can open on their mobile phones or laptops without installing anything.

---

## 🏗️ Architecture Summary
- **Frontend**: [Vercel](https://vercel.com) (React 18 + Vite SPA, ultra-fast CDN)
- **Backend**: [Render](https://render.com) (Spring Boot 3.3.4 Web Service, runs containerized Java 17)
- **Database**: [Supabase](https://supabase.com) (Free hosted PostgreSQL database)
- **File Storage**: Persistent database-backed storage in Supabase PostgreSQL (100% persistent across Render free-tier sleep cycles, $0 cost, zero S3 configuration required).

---

## 📋 Prerequisites
1. A GitHub account with your code pushed to `https://github.com/Namansingh68/cloud-based-file-storage-system`.
2. Free accounts on:
   - [Supabase](https://supabase.com) (Sign up with GitHub)
   - [Render](https://render.com) (Sign up with GitHub)
   - [Vercel](https://vercel.com) (Sign up with GitHub)

---

## 🗄️ Step 1: Create Free PostgreSQL Database on Supabase (2 Minutes)

1. Log in to [Supabase](https://supabase.com/) with your GitHub account.
2. Click **"New Project"**.
3. Fill in the project details:
   - **Name**: `cloud-file-storage`
   - **Database Password**: Choose a strong password (e.g., `MySecureStorage2026!`) and **copy it down**.
   - **Region**: Choose the closest region (e.g., *Central India / Singapore / US East*).
   - **Pricing Plan**: Free.
4. Click **"Create new project"** and wait ~1 minute for it to finish provisioning.
5. In your Supabase project dashboard:
   - In the left sidebar, click **Project Settings** (gear icon) -> **Database**.
   - Scroll down to the **Connection parameters** section:
     - **Host**: e.g., `db.abcdefghijklmn.supabase.co`
     - **Port**: `5432`
     - **Database name**: `postgres`
     - **User**: `postgres`
     - **Password**: *(The password you entered in step 3)*
   - Or under **Connection String** > **URI**, copy the URI:
     `postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmn.supabase.co:5432/postgres`

*(Keep this tab open for Step 2!)*

---

## ⚙️ Step 2: Deploy Backend to Render (3 Minutes)

1. Log in to [Render](https://render.com/) with your GitHub account.
2. In the Render Dashboard, click **"New +"** and select **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** and select your repository:  
   `Namansingh68/cloud-based-file-storage-system`
4. Configure the service settings:
   - **Name**: `cloud-file-storage-backend` *(or any unique name you like)*
   - **Region**: Choose the same or closest region as your Supabase database.
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add the following 5 variables:

| Key | Value | Notes |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `postgres` | Activates PostgreSQL cloud profile |
| `APP_STORAGE_TYPE` | `database` | Stores files persistently in Supabase DB |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<YOUR_HOST>:5432/postgres?sslmode=require` | Replace `<YOUR_HOST>` with your Supabase Host |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Your Supabase database user |
| `SPRING_DATASOURCE_PASSWORD` | `YOUR_SUPABASE_PASSWORD` | Your Supabase database password |
| `JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | 64-char secret key for JWT signing |

> [!TIP]
> You can also simply paste your entire Supabase URI directly into `SPRING_DATASOURCE_URL`:  
> `jdbc:postgresql://postgres:PASSWORD@db.abcdefghijklmn.supabase.co:5432/postgres?sslmode=require`  
> *(Our backend code will automatically normalize it if you paste `postgresql://`)*

6. Click **"Deploy Web Service"**.
7. Wait 2-3 minutes while Render builds the Docker container. Once it says **"Live"**, copy your Render URL at the top (e.g., `https://cloud-file-storage-backend.onrender.com`).
8. *(Optional)* Verify it works by opening:  
   `https://cloud-file-storage-backend.onrender.com/swagger-ui.html`

---

## 🎨 Step 3: Deploy Frontend to Vercel (2 Minutes)

1. Log in to [Vercel](https://vercel.com/) with your GitHub account.
2. Click **"Add New..."** > **"Project"**.
3. Find your repository `cloud-based-file-storage-system` and click **"Import"**.
4. Configure the project:
   - **Framework Preset**: `Vite` (auto-detected)
   - **Root Directory**: Click **"Edit"**, select **`frontend`**, and click **"Continue"**.
5. Expand the **Environment Variables** section and add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://<YOUR-RENDER-BACKEND-URL>.onrender.com/api`  
     *(Make sure to append `/api` at the end!)*
6. Click **"Deploy"**.
7. Within 45 seconds, Vercel will build your React application and present confetti 🎉 along with your public website link (e.g., `https://cloud-file-storage.vercel.app`)!

---

## 🎯 Step 4: Share Your Live Project with Your Teacher

You now have **ONE permanent, public URL** (your Vercel link, e.g., `https://your-project.vercel.app`):

- Anyone can open it on their mobile phone, tablet, or laptop.
- No one needs to install Node.js, Java, Maven, or a database.
- Every single feature works in real-time:
  - 📝 **Register** a new account or **Log in**.
  - 📁 **Create nested folders** and navigate with breadcrumbs.
  - 📤 **Upload documents, PDFs, and images** with drag-and-drop.
  - 👁️ **In-browser preview**: Click on any PDF or image to view it immediately inside the preview modal without downloading.
  - 🔗 **Shareable Links**: Generate sharing tokens with custom permissions (`VIEWER`/`EDITOR`) and expiry times.
  - 🗑️ **Trash & Restore**: Soft-delete items to the recycle bin and restore or purge them.
  - 📊 **Storage Quota**: Live progress meter displaying storage bytes used out of 500 MB.
  - 📜 **Audit History**: Timestamped drawer recording every action.

> [!NOTE]
> **Render Free Tier Cold Starts**: Render's free tier goes to sleep after 15 minutes of inactivity. When someone accesses the website after a period of inactivity, Render takes ~30-45 seconds to spin back up. Once awake, it runs at full speed! Because files are stored in Supabase PostgreSQL, all uploaded files are **100% permanently preserved**.
