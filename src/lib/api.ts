const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any)?.error || `请求失败 (${res.status})`);
  }
  return data as T;
}

export const api = {
  login: (password: string) =>
    request<{ ok: true }>("/auth/login", { method: "POST", body: JSON.stringify({ password }) }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  me: () => request<{ authenticated: boolean }>("/auth/me"),

  skills: () => request<{ skills: any[] }>("/skills"),

  listReports: (sort: "date" | "name" = "date", order: "asc" | "desc" = "desc") =>
    request<{ reports: any[] }>(`/reports?sort=${sort}&order=${order}`),

  getReport: (id: string) => request<{ report: any }>(`/reports/${id}`),

  deleteReport: (id: string) => request<{ ok: true }>(`/reports/${id}`, { method: "DELETE" }),

  generateReport: (skillId: string, ticker: string, provider?: string) =>
    request<{ id: string; title: string; status: string; content?: string; error?: string }>(
      "/reports",
      { method: "POST", body: JSON.stringify({ skillId, ticker, provider }) }
    )
};
