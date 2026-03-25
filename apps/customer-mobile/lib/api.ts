import auth from "@react-native-firebase/auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:4000";

type JsonBody = Record<string, unknown> | undefined;

async function getAuthHeaders() {
  const token = await auth().currentUser?.getIdToken();
  if (!token) {
    throw new Error("Customer auth token is missing. Sign in again.");
  }

  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, init?: RequestInit, body?: JsonBody): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
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

export async function getCustomerToken() {
  return auth().currentUser?.getIdToken() ?? null;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: JsonBody): Promise<T> {
  return request<T>(path, { method: "POST" }, body);
}
