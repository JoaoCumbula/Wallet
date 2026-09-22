const BASE_URL = "/api";

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    // Diz ao browser para incluir cookies neste pedido, mesmo sendo
    // origens diferentes (5173 → 4000 em desenvolvimento). Sem isto,
    // o cookie httpOnly nunca seria enviado, mesmo já existindo.
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Erro na requisição");
  }

  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  logout: () => request("/auth/logout", { method: "POST" }),
  getAccount: () => request("/accounts/me"),
  getTransactions: () => request("/transactions"),
  transfer: (payload) => request("/transactions/transfer", { method: "POST", body: payload }),
};