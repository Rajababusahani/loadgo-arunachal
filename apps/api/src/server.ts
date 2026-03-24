import { app } from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { getFirebaseAdmin } from "./config/firebase";
import { seedDefaultPricing } from "./seeds/defaultPricing";

async function bootstrap() {
  await connectDatabase();
  if (!env.USE_MOCK_SERVICES) {
    getFirebaseAdmin();
  }
  await seedDefaultPricing();

  app.listen(env.APP_PORT, () => {
    console.log(`LoadGo API running on port ${env.APP_PORT}${env.USE_MOCK_SERVICES ? " [mock mode]" : ""}`);
  });
}

void bootstrap();
