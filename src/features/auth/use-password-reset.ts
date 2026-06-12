import { useCallback, useState, useTransition } from 'react';
import { authService } from '@/src/services/auth/authService';

interface UsePasswordResetReturn {
  email: string;
  setEmail: (value: string) => void;
  resetToken: string;
  newPassword: string;

  resetEmailLoading: boolean;
  passwordResetLoading: boolean;
  passwordResetError: string | null;
  passwordResetSuccess: string | null;
  setResetToken: (value: string) => void;
  setNewPassword: (value: string) => void;

  sendResetEmail: () => void;
  resetPassword: () => void;
}

export const usePasswordReset = (
  initialEmail?: string | null,
): UsePasswordResetReturn => {
  const [email, setEmail] = useState(initialEmail || '');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [resetEmailPending, startResetEmailTransition] = useTransition();
  const [passwordResetPending, startPasswordResetTransition] = useTransition();
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState<string | null>(null);

  const sendResetEmail = useCallback((): void => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setPasswordResetError('Email is required to send a reset code');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setPasswordResetError('Please enter a valid email address');
      return;
    }

    setPasswordResetError(null);
    setPasswordResetSuccess(null);

    startResetEmailTransition(async () => {
      try {
        await authService.forgotPassword({ email: trimmedEmail });
        setPasswordResetSuccess('Reset code sent to your email.');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to send reset code';
        setPasswordResetError(message);
      }
    });
  }, [email]);

  const resetPassword = useCallback((): void => {
    if (!resetToken.trim()) {
      setPasswordResetError('Reset token is required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordResetError('New password must be at least 6 characters long');
      return;
    }

    setPasswordResetError(null);
    setPasswordResetSuccess(null);

    startPasswordResetTransition(async () => {
      try {
        await authService.resetPassword({
          token: resetToken.trim(),
          new_password: newPassword,
        });
        setResetToken('');
        setNewPassword('');
        setPasswordResetSuccess('Password reset successfully.');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to reset password';
        setPasswordResetError(message);
      }
    });
  }, [newPassword, resetToken]);

  return {
    email,
    setEmail,
    resetToken,
    newPassword,
    resetEmailLoading: resetEmailPending,
    passwordResetLoading: passwordResetPending,
    passwordResetError,
    passwordResetSuccess,
    setResetToken,
    setNewPassword,
    sendResetEmail,
    resetPassword,
  };
};
