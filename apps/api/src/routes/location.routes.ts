import { Router } from "express";
import { autocomplete, getQuote, locationValidators } from "../controllers/location.controller";
import { validate } from "../middleware/validate";

export const locationRouter = Router();

locationRouter.get("/autocomplete", validate(locationValidators.autocomplete), autocomplete);
locationRouter.post("/quote", validate(locationValidators.quote), getQuote);
