import { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "./queryClient";
import type { User } from "@shared/schema";

type SafeUser = Omit<User, "password">;

interface AuthContextType {
  user: SafeUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<SafeUser>;
  register: (email: string, password: string, fullName: string, username: string) => Promise<SafeUser>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<SafeUser>) => Promise<SafeUser>;
  completeOnboarding: (data: any) => Promise<SafeUser>;
  sendLoginCode: (email: string) => Promise<{ message: string; _devCode?: string }>;
  verifyLoginOTP: (email: string, code: string) => Promise<SafeUser>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery<SafeUser>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, fullName, username }: { email: string; password: string; fullName: string; username: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", { email, password, fullName, username });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<SafeUser>) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const onboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/auth/onboarding", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const sendLoginCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/auth/send-code", { email, type: "login" });
      return res.json();
    },
  });

  const verifyLoginOTPMutation = useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      const res = await apiRequest("POST", "/api/auth/verify-login", { email, code });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const login = useCallback(async (email: string, password: string) => {
    return loginMutation.mutateAsync({ email, password });
  }, [loginMutation]);

  const register = useCallback(async (email: string, password: string, fullName: string, username: string) => {
    return registerMutation.mutateAsync({ email, password, fullName, username });
  }, [registerMutation]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const updateProfile = useCallback(async (data: Partial<SafeUser>) => {
    return updateProfileMutation.mutateAsync(data);
  }, [updateProfileMutation]);

  const completeOnboarding = useCallback(async (data: any) => {
    return onboardingMutation.mutateAsync(data);
  }, [onboardingMutation]);

  const sendLoginCode = useCallback(async (email: string) => {
    return sendLoginCodeMutation.mutateAsync(email);
  }, [sendLoginCodeMutation]);

  const verifyLoginOTP = useCallback(async (email: string, code: string) => {
    return verifyLoginOTPMutation.mutateAsync({ email, code });
  }, [verifyLoginOTPMutation]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        completeOnboarding,
        sendLoginCode,
        verifyLoginOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
