const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:4000";
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN ?? "";

function getAuthHeaders() {
  if (!ADMIN_TOKEN) {
    throw new Error("Admin auth token is missing. Set VITE_ADMIN_TOKEN or wire Firebase admin auth.");
  }

  return { Authorization: `Bearer ${ADMIN_TOKEN}` };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchJson<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function postJson<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body ?? {})
  });
}

export function putJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}
