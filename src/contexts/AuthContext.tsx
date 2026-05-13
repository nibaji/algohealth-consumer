import React, { createContext, use, useState, useEffect, useCallback } from 'react';
import { UserProfileResponse } from '@/src/features/auth/authTypes';
import { authService } from '@/src/services/auth/authService';

interface AuthContextType {
  user: UserProfileResponse | null;
  isLoading: boolean;
  login: typeof authService.login;
  register: typeof authService.register;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authService.restoreSession()
      .then((restoredUser) => {
        setUser(restoredUser);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (...args: Parameters<typeof authService.login>) => {
    const response = await authService.login(...args);
    setUser(response.user);
    return response;
  }, []);

  const register = useCallback(async (...args: Parameters<typeof authService.register>) => {
    const response = await authService.register(...args);
    if (response.user) {
      setUser(response.user);
    } else {
      // Fetch user explicitly if register endpoint doesn't return user schema
      try {
        const profile = await authService.getMyProfile();
        setUser(profile);
      } catch (e) {}
    }
    return response;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
