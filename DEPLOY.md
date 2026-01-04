# Deployment Guide

This guide covers how to deploy the SanChallenges backend to **Render** and build the frontend with **Expo EAS**.

## 1. Backend Deployment (Render)

We will deploy the Node.js server using Docker on Render.

### Prerequisites
- A [Render](https://render.com) account.
- This repository pushed to GitHub/GitLab.

### Steps
1. **Create a New Web Service**
   - Go to the Render Dashboard and click **New +** -> **Web Service**.
   - Connect your repository.

2. **Configure the Service**
   - **Name**: `sanchallenges-api` (or similar)
   - **Runtime**: `Docker`
   - **Region**: Choose the one closest to you.
   - **Branch**: `main` (or your working branch)
   - **Root Directory**: Leave empty (defaults to `.`)
   - **Dockerfile Path**: `./server/Dockerfile`

3. **Environment Variables**
   - Add the following environment variable:
     - `PORT`: `3000` (Render usually sets this automatically, but good to be explicit)

4. **Deploy**
   - Click **Create Web Service**.
   - Wait for the build to finish.
   - **Copy the URL** provided by Render (e.g., `https://sanchallenges-api.onrender.com`). You will need this for the frontend.

   > **Note on Data Persistence:**
   > By default, Render Web Services are ephemeral. If the service restarts, the `data.json` file will be reset.
   > To persist data, you should use a **Render Disk** (paid feature) mounted to `/app/server/data.json`, or upgrade the app to use a real database (PostgreSQL/MongoDB) in the future.

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

1. [ ] **Render**: Service deployed and URL copied.
2. [ ] **Code**: `eas.json` updated with Render URL.
3. [ ] **Expo**: `eas build` ran successfully.
4. [ ] **Device**: App installed and verified.
