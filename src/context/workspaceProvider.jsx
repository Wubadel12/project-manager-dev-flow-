import { useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import { workspaceApi } from "../services/workspaceApi";
import { WorkspaceContext } from "./WorkspaceContext";

export function WorkspaceProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user) { setWorkspaces([]); setActiveWorkspaceIdState(""); setLoading(false); return; }
    setLoading(true);
    try {
      const next = await workspaceApi.list();
      setWorkspaces(next);
      setActiveWorkspaceIdState((current) => {
        const stored = localStorage.getItem(`devflow-workspace-${user.id}`);
        const selected = stored || current;
        return next.some((item) => String(item.id) === String(selected)) ? String(selected) : String(next[0]?.id || "");
      });
      setError("");
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!authLoading) void Promise.resolve().then(refresh);
  }, [authLoading, refresh]);

  const setActiveWorkspaceId = useCallback((id) => {
    setActiveWorkspaceIdState(String(id));
    if (user) localStorage.setItem(`devflow-workspace-${user.id}`, String(id));
  }, [user]);

  const createWorkspace = useCallback(async (name) => {
    const workspace = await workspaceApi.create(name);
    setWorkspaces((current) => [...current, workspace]);
    setActiveWorkspaceId(workspace.id);
    return workspace;
  }, [setActiveWorkspaceId]);

  const addMember = useCallback(async (email) => {
    const workspace = await workspaceApi.addMember(activeWorkspaceId, email);
    setWorkspaces((current) => current.map((item) => item.id === workspace.id ? workspace : item));
    return workspace;
  }, [activeWorkspaceId]);

  const activeWorkspace = workspaces.find((item) => String(item.id) === String(activeWorkspaceId)) || null;
  const value = useMemo(() => ({ workspaces, activeWorkspace, activeWorkspaceId, setActiveWorkspaceId, loading, error, refresh, createWorkspace, addMember }), [workspaces, activeWorkspace, activeWorkspaceId, setActiveWorkspaceId, loading, error, refresh, createWorkspace, addMember]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
