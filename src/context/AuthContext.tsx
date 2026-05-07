import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import { authApi } from "../api/services";
import type { User } from "../api/types";

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("rrims.user");
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const me = await authApi.me();
      setUser(me);
      localStorage.setItem("rrims.user", JSON.stringify(me));
    } catch {
      setUser(null);
      localStorage.removeItem("rrims.user");
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("rrims.accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser().finally(() => setLoading(false));
  }, []);

  async function login(identifier: string, password: string) {
    const result = await authApi.login(identifier, password);
    if (result.user) {
      setUser(result.user);
      localStorage.setItem("rrims.user", JSON.stringify(result.user));
      return;
    }
    await refreshUser();
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      localStorage.removeItem("rrims.user");
    }
  }

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
