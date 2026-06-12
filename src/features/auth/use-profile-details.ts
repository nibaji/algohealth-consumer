import { useCallback, useState } from 'react';
import { authService } from '@/src/services/auth/authService';

interface UseProfileDetailsReturn {
  fullName: string;
  loading: boolean;
  error: string | null;
  success: boolean;
  setFullName: (value: string) => void;
  saveProfile: () => Promise<void>;
}

export const useProfileDetails = (
  initialFullName: string | null | undefined,
  refreshProfile: () => Promise<unknown>,
): UseProfileDetailsReturn => {
  const [fullName, setFullName] = useState(initialFullName || '');
  const [prevInitialFullName, setPrevInitialFullName] = useState(initialFullName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (initialFullName !== prevInitialFullName) {
    setPrevInitialFullName(initialFullName);
    setFullName(initialFullName || '');
  }

  const saveProfile = useCallback(async (): Promise<void> => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      await authService.updateMyProfile({
        full_name: fullName.trim(),
      });
      await refreshProfile();
      setSuccess(true);
      setTimeout((): void => setSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fullName, refreshProfile]);

  return {
    fullName,
    loading,
    error,
    success,
    setFullName,
    saveProfile,
  };
};
