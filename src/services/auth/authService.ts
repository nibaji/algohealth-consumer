import { apiClient } from '../api/apiClient';
import { tokenStorage } from './tokenStorage';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  UserProfileResponse
} from '@/src/features/auth/authTypes';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data, { requiresAuth: false });
    tokenStorage.setAccessToken(response.access_token);
    await tokenStorage.setRefreshToken(response.refresh_token);
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data, { requiresAuth: false });
    if (response.access_token) {
      tokenStorage.setAccessToken(response.access_token);
      await tokenStorage.setRefreshToken(response.refresh_token);
    }
    return response;
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiClient.post('/auth/forgot-password', data, { requiresAuth: false });
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post('/auth/reset-password', data, { requiresAuth: false });
  },

  async logout(): Promise<void> {
    await tokenStorage.clearTokens();
  },

  async getMyProfile(): Promise<UserProfileResponse> {
    return apiClient.get<UserProfileResponse>('/users/me');
  },
  
  async restoreSession(): Promise<UserProfileResponse | null> {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) return null;
    
    try {
      const refreshResponse = await apiClient.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken }, { requiresAuth: false });
      tokenStorage.setAccessToken(refreshResponse.access_token);
      await tokenStorage.setRefreshToken(refreshResponse.refresh_token);
      return refreshResponse.user;
    } catch (error) {
      await tokenStorage.clearTokens();
      return null;
    }
  }
};
