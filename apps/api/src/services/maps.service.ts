import { demoLocations, type LocationPoint, type PlaceDetails } from "@loadgo/shared";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";
import { haversineDistanceKm } from "../utils/geo";

function getMockPlaces() {
  return demoLocations.map((location, index) => ({
    placeId: `mock-${index}`,
    primaryText: location.address,
    secondaryText: "Arunachal Pradesh",
    description: `${location.address}, Arunachal Pradesh`
  }));
}

export async function fetchPlaceSuggestions(query: string) {
  if (env.USE_MOCK_SERVICES || !env.GOOGLE_MAPS_API_KEY) {
    return getMockPlaces().filter((place) => place.description.toLowerCase().includes(query.toLowerCase()));
  }

  const params = new URLSearchParams({
    input: query,
    key: env.GOOGLE_MAPS_API_KEY,
    components: "country:in",
    location: "27.0844,93.6053",
    radius: "150000"
  });

  const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError(502, "Failed to fetch Google Places suggestions");
  }

  const payload = await response.json();
  return (payload.predictions ?? []).map((prediction: any) => ({
    placeId: prediction.place_id,
    primaryText: prediction.structured_formatting?.main_text ?? prediction.description,
    secondaryText: prediction.structured_formatting?.secondary_text ?? "",
    description: prediction.description
  }));
}

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails> {
  if (env.USE_MOCK_SERVICES || !env.GOOGLE_MAPS_API_KEY) {
    const index = Number(placeId.replace("mock-", ""));
    const location = demoLocations[index];
    if (!location) {
      throw new ApiError(404, "Location not found");
    }

    return {
      placeId,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      landmark: location.landmark
    };
  }

  const params = new URLSearchParams({
    place_id: placeId,
    key: env.GOOGLE_MAPS_API_KEY,
    fields: "formatted_address,name,geometry"
  });

  const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError(502, "Failed to fetch Google Place details");
  }

  const payload = await response.json();
  if (payload.status !== "OK" || !payload.result?.geometry?.location) {
    throw new ApiError(400, "Unable to resolve the selected place");
  }

  return {
    placeId,
    address: payload.result.formatted_address ?? payload.result.name,
    lat: payload.result.geometry.location.lat,
    lng: payload.result.geometry.location.lng
  };
}

export async function fetchDistanceAndDuration(pickup: LocationPoint, drop: LocationPoint) {
  if (env.USE_MOCK_SERVICES || !env.GOOGLE_MAPS_API_KEY) {
    const distanceKm = Number(haversineDistanceKm(pickup.lat, pickup.lng, drop.lat, drop.lng).toFixed(2));
    return {
      distanceKm,
      durationMinutes: Math.max(5, Math.ceil((distanceKm / 25) * 60))
    };
  }

  const params = new URLSearchParams({
    origins: `${pickup.lat},${pickup.lng}`,
    destinations: `${drop.lat},${drop.lng}`,
    key: env.GOOGLE_MAPS_API_KEY,
    units: "metric"
  });

  const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError(502, "Failed to fetch distance matrix data");
  }

  const payload = await response.json();
  const element = payload.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") {
    throw new ApiError(400, "Unable to calculate route between the selected locations");
  }

  return {
    distanceKm: Number((element.distance.value / 1000).toFixed(2)),
    durationMinutes: Math.ceil(element.duration.value / 60)
  };
}
