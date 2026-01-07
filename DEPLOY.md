# Production Deployment Guide

This guide outlines the strategy and steps to deploy the SanChallenges application to production for free.

## Strategy Overview

We will use a "Best of Breed" free tier strategy:
- **Database**: **Neon** (Serverless Postgres) - Generous free tier, easy to use.
- **Backend**: **Render** (Docker) - Free tier for Dockerized apps.
- **Frontend/Mobile**: **Expo EAS** (Build & Update) - Free tier for building and updating mobile apps.

## Prerequisites

1.  **GitHub Account**: Your code must be pushed to a GitHub repository.
2.  **Neon Account**: [Sign up here](https://neon.tech/)
3.  **Render Account**: [Sign up here](https://render.com/)
4.  **Expo Account**: [Sign up here](https://expo.dev/)
5.  **EAS CLI**: Install globally: `npm install -g eas-cli`

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
    - **Dockerfile Path**: `server/Dockerfile` (Note: The build context is the root directory)
    - **Instance Type**: Free
    - **Health Check Path**: `/health` (This ensures Render knows when your app is ready)
5.  **Environment Variables**:
    - Scroll down to "Environment Variables".
    - Add Key: `DATABASE_URL`
    - Add Value: Paste the **Neon Connection String** from Step 1.
    - *Note: The server now uses modular routes and structured logging. The `prisma` folder is located inside `server/prisma`.*
    - *Note: You might need to append `?sslmode=require` to the connection string if it's not there, but Neon usually handles this.*
6.  Click **"Create Web Service"**.
7.  Wait for the build and deployment to finish.
    - Render will build the Docker image using the `server/Dockerfile`.
    - The container will start, run `npx prisma db push` to sync your database schema, and then start the server.
8.  **Copy the Backend URL**:
    - Once deployed, you will see a URL like `https://sanchallenges-api.onrender.com`.
    - **Save this**, you will need it for the Mobile App configuration.

---

## Step 3: Deploy Mobile App (EAS)

1.  **Configure Environment**:
    - Open `eas.json` in your project.
    - Under `build.production.env`, update `EXPO_PUBLIC_API_URL` with your **Render Backend URL** from Step 2.
    - *Example*:
      ```json
      "production": {
        "env": {
          "EXPO_PUBLIC_API_URL": "https://sanchallenges-api.onrender.com"
        }
      }
      ```

2.  **Login to EAS**:
    - Run `eas login` in your terminal and log in with your Expo account.

3.  **Build for Android**:
    - Run `eas build --profile production --platform android`.
    - Follow the prompts (you might need to generate a keystore, just say "yes" to let EAS handle it).
    - Wait for the build to finish (this happens in the cloud).

4.  **Download & Install**:
    - Once finished, EAS will provide a link to download the `.apk` (or `.aab` for Play Store).
    - Install it on your device to test.

## Verification

1.  Open the installed app on your phone.
2.  Try to create a user or challenge.
3.  If it works, the Mobile App -> Backend -> Database connection is successful!

## Troubleshooting

-   **Backend Connection**: If the app works but data isn't saving, double-check the `EXPO_PUBLIC_API_URL` in `eas.json` matches your active Render URL.
-   **Database**: Check Render logs to ensure the backend connected to Neon successfully.
