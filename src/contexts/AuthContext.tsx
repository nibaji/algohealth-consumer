import React, { createContext, use, useState, useEffect, useCallback } from 'react';
import { UserProfileResponse, LoginRequest, RegisterRequest, AuthResponse } from '@/src/features/auth/authTypes';
import { authService } from '@/src/services/auth/authService';
import { familyService } from '@/src/services/family/familyService';

interface AuthContextType {
  user: UserProfileResponse | null;
  isLoading: boolean;
  login: typeof authService.login;
  register: typeof authService.register;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfileResponse | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const autoJoinInviteIfPending = async (response: AuthResponse): Promise<string | null> => {
    if (response.pending_invite && response.invite_family_id && response.invite_code) {
      try {
        await familyService.joinFamily({
          family_id: response.invite_family_id,
          invite_code: response.invite_code,
        });
        return response.invite_family_id;
      } catch (err) {
        console.error('Failed to auto-join family invite:', err);
      }
    }
    return null;
  };

  useEffect(() => {
    const restore = async () => {
      try {
        const response = await authService.restoreSession();
        if (response && response.user) {
          let familyId = response.user.family_id || response.family_id || null;
          if (response.pending_invite) {
            const joinedId = await autoJoinInviteIfPending(response);
            if (joinedId) familyId = joinedId;
          }
          setUser({
            ...response.user,
            family_id: familyId,
          });
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authService.login(data);
    if (response.user) {
      let familyId = response.user.family_id || response.family_id || null;
      if (response.pending_invite) {
        const joinedId = await autoJoinInviteIfPending(response);
        if (joinedId) familyId = joinedId;
      }
      setUser({
        ...response.user,
        family_id: familyId,
      });
    }
    return response;
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await authService.register(data);
    if (response.user) {
      let familyId = response.user.family_id || response.family_id || null;
      if (response.pending_invite) {
        const joinedId = await autoJoinInviteIfPending(response);
        if (joinedId) familyId = joinedId;
      }
      setUser({
        ...response.user,
        family_id: familyId,
      });
    } else {
      // Fetch user explicitly if register endpoint doesn't return user schema
      try {
        const profile = await authService.getMyProfile();
        setUser(profile);
      } catch {}
    }
    return response;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfileResponse | null> => {
    try {
      const profile = await authService.getMyProfile();
      setUser(profile);
      return profile;
    } catch {
      return null;
    }
  }, []);

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
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
