import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "apps/api/.env"), override: false });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().optional(),
  APP_PORT: z.coerce.number().optional(),
  MONGODB_URI: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_DATABASE_URL: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  USE_MOCK_SERVICES: z.string().optional(),
  USE_IN_MEMORY_DB: z.string().optional(),
  JWT_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  JWT_RATE_LIMIT_MAX: z.coerce.number().default(100),
  MATCHING_RADIUS_KM: z.coerce.number().default(15),
  DRIVER_OFFER_TIMEOUT_SECONDS: z.coerce.number().default(20),
  TRACKING_STALE_SECONDS: z.coerce.number().default(30)
});

const parsed = envSchema.parse(process.env);

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value === "true" || value === "1";
}

export const env = {
  ...parsed,
  APP_PORT: parsed.PORT ?? parsed.APP_PORT ?? 4000,
  USE_MOCK_SERVICES: parseBoolean(parsed.USE_MOCK_SERVICES, parsed.NODE_ENV === "development"),
  USE_IN_MEMORY_DB: parseBoolean(parsed.USE_IN_MEMORY_DB, parsed.NODE_ENV === "development" && !parsed.MONGODB_URI)
};
