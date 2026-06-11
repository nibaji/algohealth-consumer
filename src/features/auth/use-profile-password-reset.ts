import { useCallback, useState } from 'react';
import { authService } from '@/src/services/auth/authService';

interface UseProfilePasswordResetReturn {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
  resetEmailLoading: boolean;
  passwordResetLoading: boolean;
  passwordResetError: string | null;
  passwordResetSuccess: string | null;
  setResetToken: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  sendResetEmail: () => Promise<void>;
  resetPassword: () => Promise<void>;
}

export const useProfilePasswordReset = (
  profileEmail?: string | null,
): UseProfilePasswordResetReturn => {
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmailLoading, setResetEmailLoading] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState<string | null>(null);

  const sendResetEmail = useCallback(async (): Promise<void> => {
    const email = profileEmail?.trim();
    if (!email) {
      setPasswordResetError('Your profile email is required to send a reset code');
      return;
    }

    setPasswordResetError(null);
    setPasswordResetSuccess(null);
    setResetEmailLoading(true);

    try {
      await authService.forgotPassword({ email });
      setPasswordResetSuccess('Reset code sent to your email.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset code';
      setPasswordResetError(message);
    } finally {
      setResetEmailLoading(false);
    }
  }, [profileEmail]);

  const resetPassword = useCallback(async (): Promise<void> => {
    if (!resetToken.trim()) {
      setPasswordResetError('Reset token is required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordResetError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordResetError('Passwords do not match');
      return;
    }

    setPasswordResetError(null);
    setPasswordResetSuccess(null);
    setPasswordResetLoading(true);

    try {
      await authService.resetPassword({
        token: resetToken.trim(),
        new_password: newPassword,
      });
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordResetSuccess('Password reset successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setPasswordResetError(message);
    } finally {
      setPasswordResetLoading(false);
    }
  }, [confirmPassword, newPassword, resetToken]);

  return {
    resetToken,
    newPassword,
    confirmPassword,
    resetEmailLoading,
    passwordResetLoading,
    passwordResetError,
    passwordResetSuccess,
    setResetToken,
    setNewPassword,
    setConfirmPassword,
    sendResetEmail,
    resetPassword,
  };
};
