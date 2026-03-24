import { Router } from "express";
import { getMe, meValidators, updateMe } from "../controllers/profile.controller";
import { validate } from "../middleware/validate";

export const profileRouter = Router();

profileRouter.get("/me", getMe);
profileRouter.patch("/me", validate(meValidators.update), updateMe);
