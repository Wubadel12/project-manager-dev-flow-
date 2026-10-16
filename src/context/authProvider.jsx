import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import { authApi } from "../services/authApi";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    authApi.me()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch((requestError) => {
        if (requestError.status !== 401) setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const signup = useCallback(async (details) => {
    setError("");
    try {
      const result = await authApi.signup(details);
      setUser(result.user);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }, []);

  const login = useCallback(async (details) => {
    setError("");
    try {
      const result = await authApi.login(details);
      setUser(result.user);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setError("");
    try {
      await authApi.logout();
      setUser(null);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }, []);

  const value = useMemo(() => ({ user, loading, error, signup, login, logout }), [user, loading, error, signup, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
