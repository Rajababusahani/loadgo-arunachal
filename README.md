# LoadGo Arunachal

Monorepo for the LoadGo Arunachal MVP:

- `apps/api`: Express + MongoDB backend
- `apps/customer-mobile`: Expo React Native customer app
- `apps/driver-mobile`: Expo React Native driver app
- `apps/admin-web`: React + Vite admin dashboard
- `packages/shared`: shared enums, DTOs, and helper constants

## Getting Started

1. Install Node.js 20+ and npm 10+.
2. Copy `.env.example` into per-app `.env` files.
3. Run `npm install` from the repo root.
4. Start the backend with `npm run dev --workspace @loadgo/api`.
5. Start each frontend from its workspace after setting env values.

## Deployment Modes

- `render.yaml`: production-first Render blueprint for the real app
- `render.demo.yaml`: demo-only Render blueprint with mock services enabled

## Mobile Auth

The Android apps now use native Firebase phone authentication.

Required local files:
- `apps/customer-mobile/google-services.json`
- `apps/driver-mobile/google-services.json`

Expo Go is not supported for these apps anymore. Use dev-client or an Android build.

See `docs/deployment.md` for deployment details and environment setup.
See `docs/local-dev.md` for the local mock-mode workflow and dev tokens.
