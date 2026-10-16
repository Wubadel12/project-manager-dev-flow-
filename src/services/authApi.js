async function request(path, options = {}) {
  const response = await fetch(`/api/auth${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const raw = await response.text();
  let body = {};
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      throw new Error("The server returned an invalid response.");
    }
  }
  if (!response.ok) {
    const error = new Error(body.error || "The request failed.");
    error.status = response.status;
    throw error;
  }
  return body;
}

export const authApi = {
  me: () => request("/me"),
  signup: (details) => request("/signup", { method: "POST", body: JSON.stringify(details) }),
  login: (details) => request("/login", { method: "POST", body: JSON.stringify(details) }),
  logout: () => request("/logout", { method: "POST" }),
};
