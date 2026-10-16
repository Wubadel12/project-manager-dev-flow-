async function request(path = "", options = {}) {
  const response = await fetch(`/api/workspaces${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "The request failed.");
  return body;
}

export const workspaceApi = {
  list: () => request(),
  create: (name) => request("", { method: "POST", body: JSON.stringify({ name }) }),
  addMember: (workspaceId, email) => request(`/${workspaceId}/members`, { method: "POST", body: JSON.stringify({ email }) }),
};
