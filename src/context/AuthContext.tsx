import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import { authExpiredEvent, clearApiAuth } from "../api/client";
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
      clearApiAuth();
    }
  }

  useEffect(() => {
    async function restoreSession() {
      try {
        const result = await authApi.refresh();
        if (result.user) {
          setUser(result.user);
          return;
        }
        await refreshUser();
      } catch {
        setUser(null);
        clearApiAuth();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  useEffect(() => {
    function onAuthExpired() {
      setUser(null);
      clearApiAuth();
      if (window.location.pathname.startsWith("/app")) {
        window.location.assign("/login");
      }
    }

    window.addEventListener(authExpiredEvent, onAuthExpired);
    return () => window.removeEventListener(authExpiredEvent, onAuthExpired);
  }, []);

  async function login(identifier: string, password: string) {
    const result = await authApi.login(identifier, password);
    if (result.user) {
      setUser(result.user);
      return;
    }
    await refreshUser();
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      clearApiAuth();
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
