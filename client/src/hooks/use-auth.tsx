import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string | null;
  role: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  phone: string | null;
  company: string | null;
  preferredLanguage?: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  emailVerified: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isClient: boolean;
  isPartner: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const login = () => {
    window.location.href = "/login";
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  };

  const isAuthenticated = !!user && !error;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isAuthenticated,
        isLoading,
        isAdmin: user?.role === "admin",
        isClient: user?.role === "client",
        isPartner: user?.role === "partner",
        login,
        logout,
      }}
    >
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
