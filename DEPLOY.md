# Production Deployment Guide

This guide outlines the strategy and steps to deploy the SanChallenges application to production for free.

## Strategy Overview

We will use a "Best of Breed" free tier strategy:
- **Database**: **Neon** (Serverless Postgres) - Generous free tier, easy to use.
- **Backend**: **Render** (Web Service) - Free tier for Node.js apps.
- **Frontend**: **Vercel** (Static/SPA) - Excellent free tier for Expo Web.

## Prerequisites

1.  **GitHub Account**: Your code must be pushed to a GitHub repository.
2.  **Neon Account**: [Sign up here](https://neon.tech/)
3.  **Render Account**: [Sign up here](https://render.com/)
4.  **Vercel Account**: [Sign up here](https://vercel.com/)

---

## Step 1: Deploy Database (Neon)

1.  Log in to **Neon Console**.
2.  Click **"New Project"**.
3.  Name it `sanchallenges-db` (or similar).
4.  Select the region closest to you (or US East).
5.  Click **"Create Project"**.
6.  **Copy the Connection String**:
    - Look for the "Connection Details" section.
    - Copy the connection string (it looks like `postgres://user:password@host/neondb...`).
    - **Save this securely**, you will need it for the Backend deployment.

---

## Step 2: Deploy Backend (Render)

1.  Log in to **Render Dashboard**.
2.  Click **"New +"** -> **"Web Service"**.
3.  Connect your **GitHub repository**.
4.  **Configure the Service**:
    - **Name**: `sanchallenges-api`
    - **Region**: Same as your DB if possible.
    - **Branch**: `main` (or your production branch)
    - **Runtime**: **Docker**
    - **Root Directory**: `.` (This is the build context)
    - **Dockerfile Path**: `server/Dockerfile`
    - **Instance Type**: Free
    - **Health Check Path**: `/health` (This ensures Render knows when your app is ready)
5.  **Environment Variables**:
    - Scroll down to "Environment Variables".
    - Add Key: `DATABASE_URL`
    - Add Value: Paste the **Neon Connection String** from Step 1.
    - *Note: You might need to append `?sslmode=require` to the connection string if it's not there, but Neon usually handles this.*
6.  Click **"Create Web Service"**.
7.  Wait for the build and deployment to finish.
    - Render will build the Docker image using the `server/Dockerfile`.
    - The container will start, run `npx prisma db push` to sync your database schema, and then start the server.
8.  **Copy the Backend URL**:
    - Once deployed, you will see a URL like `https://sanchallenges-api.onrender.com`.
    - **Save this**, you will need it for the Frontend deployment.

---

## Step 3: Deploy Frontend (Vercel)

1.  Log in to **Vercel Dashboard**.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your **GitHub repository**.
4.  **Configure Project**:
    - **Framework Preset**: Vercel should automatically detect **Expo**. If not, select "Other" or "Create React App" but Expo is best.
    - **Root Directory**: `.`
    - **Build Command**: `npx expo export -p web` (Vercel might default to `expo export`, ensure `-p web` is used if needed, or just `npx expo export`).
        - *Correction*: The default `expo export` is usually fine for Expo Router.
    - **Output Directory**: `dist`
5.  **Environment Variables**:
    - Expand "Environment Variables".
    - Add Key: `EXPO_PUBLIC_API_URL`
    - Add Value: Paste the **Render Backend URL** from Step 2 (e.g., `https://sanchallenges-api.onrender.com`).
        - *Important*: Ensure no trailing slash `/` unless your code expects it (usually better without).
6.  Click **"Deploy"**.
7.  Wait for the build to complete.
8.  **Done!** Your app is now live.

## Verification

1.  Open your Vercel URL.
2.  Try to log in or view challenges.
3.  If data loads, the Frontend -> Backend -> Database connection is working!

## Troubleshooting

-   **CORS Issues**: If the frontend cannot talk to the backend, check the backend logs. You might need to configure CORS in `server/index.js` to allow the Vercel domain.
    -   *Quick Fix*: Allow all origins `*` in `cors()` options during initial testing, or add your Vercel domain to the allowed list.
-   **Database Connection**: If the backend fails to start, check the `DATABASE_URL` in Render. Ensure "SSL" is enabled if required by the provider.
