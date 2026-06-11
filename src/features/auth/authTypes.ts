export interface UserProfileResponse {
  id: string;
  email: string;
  full_name?: string | null;
  family_id?: string | null;
  is_active?: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  family_id?: string | null;
  family_member_id?: string | null;
  pending_invite?: boolean;
  user: UserProfileResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}
