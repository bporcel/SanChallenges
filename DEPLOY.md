# Deployment Guide

This guide covers how to deploy the SanChallenges backend and build the frontend for production.

## Backend Deployment

The backend is a Node.js Express server that can be containerized using Docker.

### Prerequisites
- Docker installed on your machine or server.
- A hosting provider (e.g., DigitalOcean, AWS, Render, Railway).

### Steps

1. **Build the Docker Image**
   ```bash
   docker build -t sanchallenges-server -f server/Dockerfile .
   ```

2. **Run the Container**
   You can run the container locally or on a server.
   ```bash
   docker run -d -p 3000:3000 --name sanchallenges-server sanchallenges-server
   ```

   **Persisting Data:**
   To persist the `data.json` file (so you don't lose data on restart), mount a volume:
   ```bash
   docker run -d -p 3000:3000 -v $(pwd)/server-data:/app/server/data.json sanchallenges-server
   ```
   *Note: You might need to ensure the `server-data` file exists on the host first.*

3. **Environment Variables**
   The server defaults to port 3000. You can override it:
   ```bash
   docker run -d -p 8080:8080 -e PORT=8080 sanchallenges-server
   ```

### Cloud Deployment (Example: Railway/Render)
Most modern PaaS providers support deploying from a Dockerfile.
1. Connect your repository.
2. Point the service to the `server` directory or root (since Dockerfile is in `server/Dockerfile`, you might need to specify the context).
   *Actually, our Dockerfile is in `server/Dockerfile` but expects context to be root.*
   **Command to build if specifying file:** `docker build -f server/Dockerfile .`

## Frontend Build

The frontend is an Expo app. We use EAS (Expo Application Services) for building.

### Prerequisites
- EAS CLI installed: `npm install -g eas-cli`
- Expo account logged in: `eas login`

### Configuration
1. **Update API URL**
   In `eas.json`, update the `EXPO_PUBLIC_API_URL` under the `production` profile to point to your deployed backend URL.
   ```json
   "production": {
     "env": {
       "EXPO_PUBLIC_API_URL": "https://your-deployed-backend.com"
     }
   }
   ```

2. **Build for Android/iOS**
   ```bash
   eas build --profile production --platform android
   # or
   eas build --profile production --platform ios
   ```

3. **Submit to Stores**
   Once built, you can submit to the app stores using `eas submit`.

## First Deploy Checklist

1. [ ] Deploy Server to a public URL (e.g., `https://api.sanchallenges.com`).
2. [ ] Update `eas.json` with the public Server URL.
3. [ ] Run `eas build --profile production --platform android` (or ios).
4. [ ] Install the build on your device to verify connection.
