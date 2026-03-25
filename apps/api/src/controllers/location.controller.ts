import { z } from "zod";
import { asyncHandler } from "../utils/async-handler";
import { fetchDistanceAndDuration, fetchPlaceDetails, fetchPlaceSuggestions } from "../services/maps.service";
import { buildPricingBreakdown } from "../services/pricing.service";

const autocompleteSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({ q: z.string().min(2) })
});

const placeDetailsSchema = z.object({
  body: z.object({}),
  params: z.object({ placeId: z.string().min(1) }),
  query: z.object({})
});

const quoteSchema = z.object({
  body: z.object({
    pickup: z.object({
      address: z.string().min(2),
      lat: z.number(),
      lng: z.number(),
      landmark: z.string().optional()
    }),
    drop: z.object({
      address: z.string().min(2),
      lat: z.number(),
      lng: z.number(),
      landmark: z.string().optional()
    }),
    vehicleType: z.enum(["bike", "mini_truck", "pickup_truck"])
  }),
  params: z.object({}),
  query: z.object({})
});

export const locationValidators = {
  autocomplete: autocompleteSchema,
  placeDetails: placeDetailsSchema,
  quote: quoteSchema
};

export const autocomplete = asyncHandler(async (req, res) => {
  const suggestions = await fetchPlaceSuggestions(String(req.query.q));
  res.json({ suggestions });
});

export const placeDetails = asyncHandler(async (req, res) => {
  const place = await fetchPlaceDetails(String(req.params.placeId));
  res.json({ place });
});

export const getQuote = asyncHandler(async (req, res) => {
  const route = await fetchDistanceAndDuration(req.body.pickup, req.body.drop);
  const quote = await buildPricingBreakdown(req.body.vehicleType, route.distanceKm, route.durationMinutes);
  res.json({ quote });
});
