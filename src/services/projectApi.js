async function request(path, workspaceId, options = {}) {
  const response = await fetch(`/api/projects${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "X-Workspace-Id": String(workspaceId || ""), ...options.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "The request failed.");
  return body;
}

export const projectApi = {
  list: (workspaceId) => request("", workspaceId),
  create: (project, workspaceId) => request("", workspaceId, { method: "POST", body: JSON.stringify(project) }),
  update: (project, workspaceId) => request(`/${project.id}`, workspaceId, { method: "PUT", body: JSON.stringify(project) }),
  remove: (id, workspaceId) => request(`/${id}`, workspaceId, { method: "DELETE" }),
  addTask: (projectId, task, workspaceId) => request(`/${projectId}/tasks`, workspaceId, { method: "POST", body: JSON.stringify(task) }),
  updateTask: (projectId, taskId, changes, workspaceId) => request(`/${projectId}/tasks/${encodeURIComponent(taskId)}`, workspaceId, { method: "PATCH", body: JSON.stringify(changes) }),
  removeTask: (projectId, taskId, workspaceId) => request(`/${projectId}/tasks/${encodeURIComponent(taskId)}`, workspaceId, { method: "DELETE" }),
};
