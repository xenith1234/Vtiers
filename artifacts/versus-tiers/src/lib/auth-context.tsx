import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, useLogin, useLogout } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@workspace/api-client-react/src/generated/api.schemas";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("vt_token"));
  const qc = useQueryClient();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const { data: user, isLoading } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("vt_token", token);
      setAuthTokenGetter(() => token);
    } else {
      localStorage.removeItem("vt_token");
      setAuthTokenGetter(null);
    }
  }, [token]);

  const login = async (data: { email: string; password: string }) => {
    const res = await loginMutation.mutateAsync({ data });
    setToken(res.token);
    localStorage.setItem("vt_token", res.token);
    setAuthTokenGetter(() => res.token);
    qc.invalidateQueries();
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // ignore
    } finally {
      setToken(null);
      localStorage.removeItem("vt_token");
      setAuthTokenGetter(null);
      qc.clear();
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const isModerator = isAdmin || user?.role === "moderator";

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, isAdmin, isModerator, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
