import { getApiBase } from "./api-base";

const BASE = getApiBase();

if (import.meta.env.DEV) {
  console.info("[api] BASE:", BASE);
}

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T = any>(method: string, path: string, options?: { params?: Record<string, string | undefined>; data?: unknown }): Promise<{ data: T }> {
  let url = `${BASE}${path}`;
  if (import.meta.env.DEV) {
    console.info(`[api] ${method}`, url);
  }

  if (options?.params) {
    const qs = new URLSearchParams();
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.set(k, v);
    });
    const str = qs.toString();
    if (str) url += `?${str}`;
  }

  const res = await fetch(url, {
    method,
    headers: getHeaders(),
    ...(options?.data !== undefined ? { body: JSON.stringify(options.data) } : {}),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMessage = data.error || data.message || `HTTP ${res.status}`;
    console.error(`API Error [${res.status}]:`, errorMessage, data);
    throw new Error(errorMessage);
  }
  return { data };
}

export const api = {
  get: <T = any>(path: string, options?: { params?: Record<string, string | undefined> }) => request<T>("GET", path, options),
  post: <T = any>(path: string, data?: unknown) => request<T>("POST", path, { data }),
  patch: <T = any>(path: string, data?: unknown) => request<T>("PATCH", path, { data }),
  put: <T = any>(path: string, data?: unknown) => request<T>("PUT", path, { data }),
  delete: <T = any>(path: string) => request<T>("DELETE", path),
};
