# Deployment Guide

## Render Blueprint

This repo includes a Render blueprint in [render.yaml](C:/buildstartup/render.yaml) that defines:

- a Node web service for `apps/api`
- a static site for `apps/admin-web`

Render blueprint references were verified against Render's current docs:
- [Blueprint YAML Reference](https://render.com/docs/blueprint-spec)
- [Monorepo Support](https://render.com/docs/monorepo-support)
- [Static Sites](https://render.com/docs/static-sites)
- [Web Services](https://render.com/docs/web-services)

## What The Blueprint Deploys

### API service

- Builds from the repo root so npm workspaces and `@loadgo/shared` resolve correctly
- Runs `node apps/api/dist/apps/api/src/server.js`
- Uses `/health` as the health check
- Binds to Render's `PORT` environment variable

### Admin site

- Builds from the repo root so shared workspace code is available
- Publishes `apps/admin-web/dist`
- Requires `VITE_API_URL` to be set to your deployed backend URL during initial blueprint creation

## Required Production Secrets

You still need to provide these values in Render during the first blueprint deploy:

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

## Deploy Steps

1. Push this repo to GitHub, GitLab, or Bitbucket.
2. In Render, click `New` -> `Blueprint`.
3. Connect the repo and select the branch.
4. Render will detect `render.yaml` at the repo root.
5. Enter values for every env var marked `sync: false`.
6. Complete the deploy.
7. After the backend gets its `onrender.com` URL, set that exact public URL as `VITE_API_URL` for the admin site if you did not supply it during creation.

## Mobile Apps

The customer and driver apps are not part of the Render deploy. They should continue to run through Expo/EAS and point to the deployed backend using:

- `EXPO_PUBLIC_API_URL=https://your-api.onrender.com`

## Notes

- MongoDB Atlas is external to Render in this setup.
- The local mock mode in `apps/api/.env` is for development only and is disabled in the production blueprint.
- The backend is currently CORS-open for MVP simplicity. Tighten this before production launch.
