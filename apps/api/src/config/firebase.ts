import admin from "firebase-admin";
import { env } from "./env";

let app: admin.app.App | undefined;

export function getFirebaseAdmin(): admin.app.App {
  if (env.USE_MOCK_SERVICES) {
    throw new Error("Firebase Admin is disabled in mock mode");
  }

  if (!app) {
    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_DATABASE_URL) {
      throw new Error("Firebase credentials are missing");
    }

    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      }),
      databaseURL: env.FIREBASE_DATABASE_URL
    });
  }

  return app;
}

export function getFirebaseDatabase(): admin.database.Database {
  return getFirebaseAdmin().database();
}
