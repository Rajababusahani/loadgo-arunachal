import type { UserRole } from "@loadgo/shared";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        firebaseUid: string;
        userId: string;
        role: UserRole;
        phone?: string;
      };
    }
  }
}

export {};
