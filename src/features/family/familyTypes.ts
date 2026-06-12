export interface CreateFamilyRequest {
  family_name: string;
  gender?: string | null;
  date_of_birth?: string | null;
  height?: number | null;
  height_unit?: string | null;
  weight?: number | null;
  weight_unit?: string | null;
  blood_group?: string | null;
  mobile_no?: string | null;
  country_code?: string | null;
}

export interface JoinFamilyRequest {
  family_id?: string | null;
  invite_code?: string | null;
}

export interface FamilyMemberCreate {
  name: string;
  relation: string;
  gender: string;
  date_of_birth: string; // YYYY-MM-DD
  height?: number | null;
  height_unit?: string | null;
  weight?: number | null;
  weight_unit?: string | null;
  blood_group?: string | null;
  mobile_no?: string | null;
  country_code?: string | null;
  email_id?: string | null;
  health_summary?: string | null;
  profile_picture_url?: string | null;
}

export interface FamilyMemberOut {
  id: string;
  name: string;
  relation: string;
  user_id?: string | null;
  email_id?: string | null;
  invite_status?: string | null;
}

export interface FamilyOut {
  id: string;
  name: string;
  invite_code: string;
  owner_id?: string | null;
  members: FamilyMemberOut[];
}

export interface FamilyMemberResponse {
  id: string;
  user_id: string;
  family_id: string | null;
  name: string;
  relation: string;
  gender: string;
  date_of_birth: string;
  height: number | null;
  height_unit: string | null;
  weight: number | null;
  weight_unit: string | null;
  blood_group: string | null;
  mobile_no: string | null;
  country_code: string | null;
  email_id: string | null;
  health_summary: string | null;
  invite_status?: string | null;
  profile_picture_url: string | null;
}

export interface FamilyMemberUpdate {
  name?: string;
  relation?: string;
  gender?: string;
  date_of_birth?: string;
  height?: number | null;
  height_unit?: string | null;
  weight?: number | null;
  weight_unit?: string | null;
  blood_group?: string | null;
  mobile_no?: string | null;
  country_code?: string | null;
  email_id?: string | null;
  health_summary?: string | null;
}
