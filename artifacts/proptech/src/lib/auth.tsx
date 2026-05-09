import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/api-client";
import { useGetMe, setAuthTokenGetter } from "@/api-client";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));

  useEffect(() => {
    setAuthTokenGetter(() => token);
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }, [token]);

  const { data: user, isLoading, isError, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      staleTime: 0, // Don't cache
      cacheTime: 0, // Don't keep in cache
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  });

  useEffect(() => {
    if (user) {
      console.log("AuthProvider - User loaded successfully:", {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      });
    }
  }, [user]);

  useEffect(() => {
    if (isError) {
      console.error("AuthProvider - Auth error, clearing token");
      setToken(null);
    }
  }, [isError]);

  useEffect(() => {
    if (token && !isLoading && !user && !isError) {
      console.warn("AuthProvider - Token exists but no user data. Refetching...");
      refetch();
    }
  }, [token, isLoading, user, isError, refetch]);

  const login = (newToken: string) => {
    console.log("AuthProvider - Login called with new token");
    setToken(newToken);
    // Force refetch user data after setting token
    setTimeout(() => {
      refetch();
    }, 100);
  };

  const logout = () => {
    setToken(null);
  };

  const value = {
    user: user || null,
    isAuthenticated: !!user,
    isLoading: isLoading && !!token,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
