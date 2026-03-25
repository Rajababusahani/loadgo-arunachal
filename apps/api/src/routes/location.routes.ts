import { Router } from "express";
import { autocomplete, getQuote, locationValidators, placeDetails } from "../controllers/location.controller";
import { validate } from "../middleware/validate";

export const locationRouter = Router();

locationRouter.get("/autocomplete", validate(locationValidators.autocomplete), autocomplete);
locationRouter.get("/place/:placeId", validate(locationValidators.placeDetails), placeDetails);
locationRouter.post("/quote", validate(locationValidators.quote), getQuote);
