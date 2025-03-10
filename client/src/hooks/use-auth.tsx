import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, WholesaleStatus, OnboardingStatus, UserRole } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, Omit<InsertUser, "role" | "referrerId">>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: Omit<InsertUser, "role" | "referrerId">) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }
      const userData = await res.json();

      // Prevent unapproved wholesale users from logging in
      if (userData.role === UserRole.WHOLESALE && userData.wholesaleStatus !== WholesaleStatus.APPROVED) {
        throw new Error("Your wholesale account is pending approval. You will be notified once approved.");
      }

      return userData;
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);

      // Handle post-login navigation based on user role and status
      if (user.role === UserRole.WHOLESALE) {
        if (user.onboardingStatus === OnboardingStatus.NOT_STARTED) {
          setLocation("/wholesale/onboarding");
        } else if (user.onboardingStatus === OnboardingStatus.COMPLETED) {
          setLocation("/wholesale");
        }
      } else if (user.role === UserRole.RETAIL) {
        setLocation("/shop");
      } else if (user.role === UserRole.ADMIN) {
        setLocation("/admin");
      } else if (user.role === UserRole.DISTRIBUTOR) {
        setLocation("/distributor");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      // For wholesale registrations, always set status to PENDING
      if (credentials.role === UserRole.WHOLESALE) {
        credentials = {
          ...credentials,
          wholesaleStatus: WholesaleStatus.PENDING,
          onboardingStatus: OnboardingStatus.NOT_STARTED
        };
      }

      const res = await apiRequest("POST", "/api/register", credentials);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // After registration, always redirect wholesale users to registration success page
      if (user.role === UserRole.WHOLESALE) {
        setLocation("/auth/registration-success");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setLocation("/auth");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}