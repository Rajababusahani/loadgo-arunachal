const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:4000";
const CUSTOMER_TOKEN = process.env.EXPO_PUBLIC_CUSTOMER_TOKEN ?? "dev-customer";

type JsonBody = Record<string, unknown> | undefined;

async function request<T>(path: string, init?: RequestInit, body?: JsonBody): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CUSTOMER_TOKEN}`,
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

export function getCustomerToken() {
  return CUSTOMER_TOKEN;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: JsonBody): Promise<T> {
  return request<T>(path, { method: "POST" }, body);
}
