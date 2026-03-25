import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@loadgo/shared";
import { env } from "../config/env";
import { getFirebaseAdmin } from "../config/firebase";
import { UserModel } from "../models/User";
import { ApiError } from "../utils/api-error";

async function ensureUser(params: { firebaseUid: string; phone?: string; name?: string; role?: UserRole }) {
  let user = await UserModel.findOne({ firebaseUid: params.firebaseUid });
  if (!user) {
    user = await UserModel.create({
      firebaseUid: params.firebaseUid,
      phone: params.phone ?? "",
      name: params.name ?? "LoadGo User",
      role: params.role ?? "customer"
    });
  } else {
    if (params.phone && params.phone !== user.phone) {
      user.phone = params.phone;
    }

    if (params.name && params.name !== user.name) {
      user.name = params.name;
    }

    if (params.role && params.role !== user.role) {
      user.role = params.role;
    }

    await user.save();
  }

  return user;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Missing Bearer token");
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (env.USE_MOCK_SERVICES) {
      const role = token === "dev-admin" ? "admin" : token === "dev-driver" ? "driver" : "customer";
      const user = await ensureUser({
        firebaseUid: token,
        phone: "+919999999999",
        name: role === "admin" ? "Dev Admin" : role === "driver" ? "Dev Driver" : "Dev Customer",
        role
      });

      req.auth = {
        firebaseUid: token,
        userId: user._id.toString(),
        role: user.role,
        phone: user.phone
      };
      next();
      return;
    }

    const decoded = await getFirebaseAdmin().auth().verifyIdToken(token);
    const claimedRole = typeof decoded.role === "string" ? (decoded.role as UserRole) : undefined;
    const user = await ensureUser({
      firebaseUid: decoded.uid,
      phone: decoded.phone_number,
      name: decoded.name,
      role: claimedRole
    });

    req.auth = {
      firebaseUid: decoded.uid,
      userId: user._id.toString(),
      role: user.role,
      phone: decoded.phone_number
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(new ApiError(403, "You do not have permission to access this resource"));
      return;
    }

    next();
  };
}
