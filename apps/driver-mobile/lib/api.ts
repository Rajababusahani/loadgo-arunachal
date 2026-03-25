import { Linking } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:4000";
const DRIVER_TOKEN = process.env.EXPO_PUBLIC_DRIVER_TOKEN ?? "";

type JsonBody = Record<string, unknown> | undefined;

function getAuthHeaders() {
  if (!DRIVER_TOKEN) {
    throw new Error("Driver auth token is missing. Set EXPO_PUBLIC_DRIVER_TOKEN or wire Firebase phone auth.");
  }

  return { Authorization: `Bearer ${DRIVER_TOKEN}` };
}

async function request<T>(path: string, init?: RequestInit, body?: JsonBody): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(init?.headers ?? {})
    },
    body: body ? JSON.stringify(body) : init?.body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: JsonBody): Promise<T> {
  return request<T>(path, { method: "POST" }, body);
}

export function apiPatch<T>(path: string, body?: JsonBody): Promise<T> {
  return request<T>(path, { method: "PATCH" }, body);
}

export function getDriverToken() {
  return DRIVER_TOKEN;
}

export async function openGoogleMapsNavigation(lat: number, lng: number) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  await Linking.openURL(url);
}
