import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env";

let memoryServer: MongoMemoryServer | null = null;

export async function connectDatabase(): Promise<void> {
  if (env.USE_IN_MEMORY_DB || !env.MONGODB_URI) {
    memoryServer = await MongoMemoryServer.create({ instance: { dbName: "loadgo-arunachal" } });
    await mongoose.connect(memoryServer.getUri());
    return;
  }

  await mongoose.connect(env.MONGODB_URI);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
