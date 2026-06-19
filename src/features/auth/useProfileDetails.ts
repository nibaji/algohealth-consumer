import { useCallback, useState, useTransition } from 'react';
import { authService } from '@/src/services/auth/authService';
import { refreshTracker } from '@/src/utils/refreshTracker';

interface UseProfileDetailsReturn {
  fullName: string;
  loading: boolean;
  error: string | null;
  success: boolean;
  setFullName: (value: string) => void;
  saveProfile: () => void;
}

export const useProfileDetails = (
  initialFullName: string | null | undefined,
  refreshProfile: () => Promise<unknown>,
): UseProfileDetailsReturn => {
  const [fullName, setFullName] = useState(initialFullName || '');
  const [prevInitialFullName, setPrevInitialFullName] = useState(initialFullName);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (initialFullName !== prevInitialFullName) {
    setPrevInitialFullName(initialFullName);
    setFullName(initialFullName || '');
  }

  const saveProfile = useCallback((): void => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await authService.updateMyProfile({
          full_name: fullName.trim(),
        });
        await refreshProfile();
        refreshTracker.setNeedsRefresh('family', true);
        setSuccess(true);
        setTimeout((): void => setSuccess(false), 3000);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        setError(message);
      }
    });
  }, [fullName, refreshProfile]);

  return {
    fullName,
    loading: isPending,
    error,
    success,
    setFullName,
    saveProfile,
  };
};
