import { apiClient } from '../api/apiClient';
import { tokenStorage } from './tokenStorage';
import { ENV } from '@/src/utils/config/env';
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
    if (response.refresh_token) {
      await tokenStorage.setRefreshToken(response.refresh_token);
    }
    return response;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data, { requiresAuth: false });
    if (response.access_token) {
      tokenStorage.setAccessToken(response.access_token);
      if (response.refresh_token) {
        await tokenStorage.setRefreshToken(response.refresh_token);
      }
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
  
  async updateMyProfile(data: { full_name: string }): Promise<UserProfileResponse> {
    return apiClient.patch<UserProfileResponse>('/users/me', data);
  },
  
  async restoreSession(): Promise<AuthResponse | null> {
    const isWeb = process.env.EXPO_OS === 'web';
    const refreshToken = isWeb ? null : await tokenStorage.getRefreshToken();
    if (!isWeb && !refreshToken) return null;
    
    try {
      const headers = new Headers();
      if (isWeb) {
        headers.set('X-Platform', 'web');
      } else {
        headers.set('Content-Type', 'application/json');
      }

      const refreshConfig: RequestInit = {
        method: 'POST',
        headers,
        body: isWeb ? null : JSON.stringify({ refresh_token: refreshToken }),
      };

      if (isWeb) {
        refreshConfig.credentials = 'include';
      }

      const refreshResponse = await fetch(`${ENV.API_BASE_URL}/auth/refresh`, refreshConfig);
      if (!refreshResponse.ok) {
        await tokenStorage.clearTokens();
        return null;
      }

      const refreshResponseData: AuthResponse = await refreshResponse.json();
      tokenStorage.setAccessToken(refreshResponseData.access_token);
      if (refreshResponseData.refresh_token) {
        await tokenStorage.setRefreshToken(refreshResponseData.refresh_token);
      }
      return refreshResponseData;
    } catch {
      await tokenStorage.clearTokens();
      return null;
    }
  }
};
