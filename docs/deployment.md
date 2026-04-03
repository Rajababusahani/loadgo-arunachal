# Deployment Guide

## Render Blueprints

This repo now includes two Render blueprints:

- [render.yaml](C:/buildstartup/render.yaml): production-first deploy for the real app
- [render.demo.yaml](C:/buildstartup/render.demo.yaml): demo-only deploy with mock services enabled

Render blueprint references were verified against Render's current docs:
- [Blueprint YAML Reference](https://render.com/docs/blueprint-spec)
- [Monorepo Support](https://render.com/docs/monorepo-support)
- [Static Sites](https://render.com/docs/static-sites)
- [Web Services](https://render.com/docs/web-services)

## What The Production Blueprint Deploys

### API service

- Builds from the repo root so npm workspaces and `@loadgo/shared` resolve correctly
- Runs `node apps/api/dist/apps/api/src/server.js`
- Uses `/health` as the health check
- Binds to Render's `PORT` environment variable
- Starts with `USE_MOCK_SERVICES=false`
- Starts with `USE_IN_MEMORY_DB=false`

### Admin site

- Builds from the repo root so shared workspace code is available
- Publishes `apps/admin-web/dist`
- Requires `VITE_API_URL` and `VITE_ADMIN_TOKEN`

## Required Production Secrets

Provide these values in Render during the first production deploy:

- `MONGODB_URI` for MongoDB Atlas
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_DATABASE_URL`
- `GOOGLE_MAPS_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `VITE_API_URL` for the admin static site
- `VITE_ADMIN_TOKEN` only until Firebase-backed admin sign-in is wired on the web client

## Mobile Firebase OTP Setup

The customer and driver Android apps now use native Firebase phone authentication via `@react-native-firebase/auth`.

Before building either app:

1. Create two Android apps in Firebase:
   - `com.loadgo.customer`
   - `com.loadgo.driver`
2. Download each `google-services.json` file.
3. Place them here:
   - `apps/customer-mobile/google-services.json`
   - `apps/driver-mobile/google-services.json`
4. Enable Phone Authentication in Firebase Console.
5. Enable Firebase Realtime Database.
6. Add your Android SHA-1 and SHA-256 fingerprints in Firebase for both apps.
7. Set `EXPO_PUBLIC_API_URL=https://your-api.onrender.com` in both mobile app `.env` files.

Important:
- These apps now require a development build or release APK. Expo Go will not work because native Firebase Auth is used.
- For the driver app, the backend now preserves the server-side role once the driver profile is created, even if the Firebase token has no custom role claim.

## Preflight Check

Run this before production deployment:

- `npm run preflight`

It checks for:
- required backend env values
- mobile `.env` files
- admin `.env` file
- both `google-services.json` files

## Deploy Steps For The Real App

1. In Render, create a Blueprint from the repo.
2. Select branch `codex/loadgo-arunachal`.
3. Use blueprint path `render.yaml`.
4. Enter all env vars marked `sync: false`.
5. Complete the deploy.
6. After the backend gets its public URL, set that exact URL as `VITE_API_URL` for the admin site if you did not supply it during creation.
7. Set `EXPO_PUBLIC_API_URL=https://your-api.onrender.com` in both mobile apps before building Android APKs.
8. Run `npm run preflight` from the repo root and resolve any missing items.

## Android Build Commands

Customer app local Android build:
- `npm run android --workspace @loadgo/customer-mobile`

Driver app local Android build:
- `npm run android --workspace @loadgo/driver-mobile`

For local development with native Firebase Auth:
- `npm run dev --workspace @loadgo/customer-mobile`
- `npm run dev --workspace @loadgo/driver-mobile`

These start Expo in dev-client mode.

## EAS Build Profiles

Each mobile app now includes an `eas.json` file with:
- `development`: dev client build
- `preview`: internal distribution build
- `production`: production build profile

## Demo Deploy

If you only want a demo deployment without external services:

1. Create a Blueprint from the same repo.
2. Select branch `codex/loadgo-arunachal`.
3. Use blueprint path `render.demo.yaml`.

## Notes

- MongoDB Atlas is external to Render in this setup.
- The backend is currently CORS-open for MVP simplicity. Tighten this before production launch.
