# Deployment Guide

This guide covers how to deploy the SanChallenges backend to **Render** with **PostgreSQL** and build the frontend with **Expo EAS**.

## 1. Backend Deployment (Render)

We will deploy the Node.js server using Docker on Render, connected to a managed PostgreSQL database.

### Prerequisites
- A [Render](https://render.com) account.
- This repository pushed to GitHub/GitLab.

### Steps

#### A. Create Database
1. Go to Render Dashboard and click **New +** -> **PostgreSQL**.
2. **Name**: `sanchallenges-db`
3. **Region**: Same as your web service (e.g., Frankfurt).
4. **Plan**: Free (for testing) or Standard.
5. Click **Create Database**.
6. Once created, copy the **Internal Connection String** (starts with `postgres://...`).

#### B. Create Web Service
1. Click **New +** -> **Web Service**.
2. Connect your repository.
3. **Name**: `sanchallenges-api`
4. **Runtime**: `Docker`
5. **Region**: Same as database.
6. **Branch**: `main`
7. **Root Directory**: Leave empty.
8. **Dockerfile Path**: `./server/Dockerfile`

#### C. Environment Variables
Add the following environment variables to the Web Service:
- `PORT`: `3000`
- `DATABASE_URL`: Paste the **Internal Connection String** from the database.

#### D. Deploy
1. Click **Create Web Service**.
2. The service will build, run migrations, and start.
3. **Copy the URL** (e.g., `https://sanchallenges-api.onrender.com`).

### Data Migration (Optional)
If you have a backup of your old `data.json` and want to migrate it:
1. Ensure your local machine has `Node.js` installed.
2. Create a `.env` file in the root with `DATABASE_URL=<External Connection String>`.
3. Place your `data.json` in the `server/` directory.
4. Run:
   ```bash
   npm install
   npx prisma db push
   node prisma/seed.js
   ```

---

## 2. Frontend Build (Expo EAS)

We will build the React Native app using Expo Application Services (EAS).

### Prerequisites
- EAS CLI installed: `npm install -g eas-cli`
- Expo account logged in: `eas login`

### Steps
1. **Configure API URL**
   - Open `eas.json` in your project.
   - Update the `EXPO_PUBLIC_API_URL` under the `production` profile with your Render URL.

   ```json
   "production": {
     "env": {
       "EXPO_PUBLIC_API_URL": "https://sanchallenges-api.onrender.com"
     }
   }
   ```

2. **Build the App**
   Run the build command for your target platform.

   **For Android:**
   ```bash
   eas build --profile production --platform android
   ```

   **For iOS:**
   ```bash
   eas build --profile production --platform ios
   ```

3. **Install & Test**
   - Once the build is complete, download the `.apk` (Android) or install via TestFlight (iOS).
   - Open the app and verify it connects to your Render backend.

4. **Submit to Stores (Optional)**
   When you are ready to publish to the Google Play Store or Apple App Store:
   ```bash
   eas submit --platform android
   # or
   eas submit --platform ios
   ```

## Summary Checklist

1. [ ] **Render DB**: Database created and connection string copied.
2. [ ] **Render App**: Service deployed with `DATABASE_URL`.
3. [ ] **Code**: `eas.json` updated with Render URL.
4. [ ] **Expo**: `eas build` ran successfully.
5. [ ] **Device**: App installed and verified.
