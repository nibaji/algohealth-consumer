import React, { createContext, use, useState, useEffect, useCallback } from 'react';
import { UserProfileResponse, LoginRequest, RegisterRequest } from '@/src/features/auth/authTypes';
import { authService } from '@/src/services/auth/authService';
import { familyService } from '@/src/services/family/familyService';
import { consultCache } from '@/src/utils/consultCache';

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
          let isPending = !!response.pending_invite;
          
          if (familyId) {
            try {
              const familyData = await familyService.getMyFamily();
              const selfMember = familyData.members.find(m => 
                m.user_id === response.user.id || 
                (m.email_id && response.user.email && m.email_id.toLowerCase() === response.user.email.toLowerCase())
              );
              if (selfMember && selfMember.invite_status === 'pending') {
                isPending = true;
              }
            } catch (err) {
              console.error('Failed to double check pending family membership on restore:', err);
            }
          }
          
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
      setIsFamilyPending(!!response.pending_invite);
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
      setIsFamilyPending(!!response.pending_invite);
      setUser({
        ...response.user,
        family_id: familyId,
      });
    } else {
      try {
        const profile = await authService.getMyProfile();
        let isPending = false;
        if (profile.family_id) {
          try {
            const family = await familyService.getMyFamily();
            const selfMember = family.members.find(m => 
              m.user_id === profile.id || 
              (m.email_id && profile.email && m.email_id.toLowerCase() === profile.email.toLowerCase())
            );
            if (selfMember && selfMember.invite_status === 'pending') {
              isPending = true;
            }
          } catch {}
        }
        setIsFamilyPending(isPending);
        setUser(profile);
      } catch {}
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
      let isPending = false;
      if (profile.family_id) {
        try {
          const family = await familyService.getMyFamily();
          const selfMember = family.members.find(m => 
            m.user_id === profile.id || 
            (m.email_id && profile.email && m.email_id.toLowerCase() === profile.email.toLowerCase())
          );
          if (selfMember && selfMember.invite_status === 'pending') {
            isPending = true;
          }
        } catch {}
      }
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
