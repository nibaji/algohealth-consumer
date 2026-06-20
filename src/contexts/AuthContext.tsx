import { LoginRequest, RegisterRequest, UserProfileResponse } from '@/src/features/auth/authTypes';
import { authService } from '@/src/services/auth/authService';
import { familyService } from '@/src/services/family/familyService';
import { consultCache } from '@/src/utils/consultCache';
import React, { createContext, use, useCallback, useEffect, useState } from 'react';

interface AuthContextType {
  user: UserProfileResponse | null;
  isLoading: boolean;
  login: typeof authService.login;
  register: typeof authService.register;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfileResponse | null>;
  isFamilyPending: boolean;
  setIsFamilyPending: (val: boolean) => void;
  hasSkippedOnboarding: boolean;
  setHasSkippedOnboarding: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const checkIfFamilyPending = async (
  user: UserProfileResponse,
  familyId: string | null,
  pendingInviteFromResponse: boolean
): Promise<boolean> => {
  if (!familyId) return false;

  try {
    const members = await familyService.getFamilyMembers();
    const selfMember = members.find(m =>
      m.email_id !== null && m.email_id !== undefined && m.email_id.toLowerCase() === user.email.toLowerCase()
    ) || members.find(m =>
      m.user_id !== null && m.user_id !== undefined && m.user_id === user.id
    );
    if (selfMember) {
      return selfMember.invite_status === 'pending';
    }
  } catch (err) {
    console.error('Failed to check pending family membership:', err);
  }

  return pendingInviteFromResponse;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFamilyPending, setIsFamilyPending] = useState(false);
  const [hasSkippedOnboarding, setHasSkippedOnboarding] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        consultCache.clear();
        const response = await authService.restoreSession();
        if (response && response.user) {
          const familyId = response.user.family_id || response.family_id || response.invite_family_id || null;
          const isPending = await checkIfFamilyPending(response.user, familyId, !!response.pending_invite);

          setIsFamilyPending(isPending);
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
      const familyId = response.user.family_id || response.family_id || response.invite_family_id || null;
      const isPending = await checkIfFamilyPending(response.user, familyId, !!response.pending_invite);
      setIsFamilyPending(isPending);
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
      const familyId = response.user.family_id || response.family_id || response.invite_family_id || null;
      const isPending = await checkIfFamilyPending(response.user, familyId, !!response.pending_invite);
      setIsFamilyPending(isPending);
      setUser({
        ...response.user,
        family_id: familyId,
      });
    } else {
      try {
        const profile = await authService.getMyProfile();
        const isPending = await checkIfFamilyPending(profile, profile.family_id || null, false);
        setIsFamilyPending(isPending);
        setUser(profile);
      } catch { }
    }
    return response;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    consultCache.clear();
    setIsFamilyPending(false);
    setHasSkippedOnboarding(false);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfileResponse | null> => {
    try {
      const profile = await authService.getMyProfile();
      const isPending = await checkIfFamilyPending(profile, profile.family_id || null, false);
      setIsFamilyPending(isPending);
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
    isFamilyPending,
    setIsFamilyPending,
    hasSkippedOnboarding,
    setHasSkippedOnboarding,
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
