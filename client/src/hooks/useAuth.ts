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
  address: string | null;
  city: string | null;
  postalCode: string | null;
  emailVerified: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isClient: user?.role === "client",
    isPartner: user?.role === "partner",
    error,
    refetch,
  };
}
