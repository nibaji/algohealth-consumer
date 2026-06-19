export enum GenderType {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other',
  Unknown = 'Unknown',
}

export enum RelationType {
  Spouse = 'Spouse',
  Child = 'Child',
  Parent = 'Parent',
  Sibling = 'Sibling',
  Grandparent = 'Grandparent',
  Other = 'Other',
  Self = 'Self',
}

export enum BloodGroup {
  APositive = 'A+',
  ANegative = 'A-',
  BPositive = 'B+',
  BNegative = 'B-',
  ABPositive = 'AB+',
  ABNegative = 'AB-',
  OPositive = 'O+',
  ONegative = 'O-',
}

export enum InviteStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
}

export enum HeightUnit {
  Cm = 'cm',
  In = 'in',
}

export enum WeightUnit {
  Kg = 'kg',
  Lbs = 'lbs',
}

export interface CreateFamilyRequest {
  family_name: string;
  gender?: GenderType | null;
  date_of_birth?: string | null;
  height?: number | null;
  height_unit?: HeightUnit | null;
  weight?: number | null;
  weight_unit?: WeightUnit | null;
  blood_group?: BloodGroup | null;
  mobile_no?: string | null;
  country_code?: string | null;
}

export interface JoinFamilyRequest {
  family_id?: string | null;
  invite_code?: string | null;
}

export interface FamilyMemberCreate {
  name: string;
  relation: RelationType | string;
  gender: GenderType;
  date_of_birth: string; // YYYY-MM-DD
  height?: number | null;
  height_unit?: HeightUnit | null;
  weight?: number | null;
  weight_unit?: WeightUnit | null;
  blood_group?: BloodGroup | null;
  mobile_no?: string | null;
  country_code?: string | null;
  email_id?: string | null;
  health_summary?: string | null;
  profile_picture_url?: string | null;
}

export interface FamilyMemberOut {
  id: string;
  name: string;
  relation: RelationType | string;
  user_id?: string | null;
  email_id?: string | null;
  invite_status?: InviteStatus | null;
  health_summary?: string | null;
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
  relation: RelationType | string;
  gender: GenderType;
  date_of_birth: string;
  height: number | null;
  height_unit: HeightUnit | null;
  weight: number | null;
  weight_unit: WeightUnit | null;
  blood_group: BloodGroup | null;
  mobile_no: string | null;
  country_code: string | null;
  email_id: string | null;
  health_summary: string | null;
  invite_status?: InviteStatus | null;
  profile_picture_url: string | null;
}

export interface FamilyMemberUpdate {
  name?: string;
  relation?: RelationType | string;
  gender?: GenderType;
  date_of_birth?: string;
  height?: number | null;
  height_unit?: HeightUnit | null;
  weight?: number | null;
  weight_unit?: WeightUnit | null;
  blood_group?: BloodGroup | null;
  mobile_no?: string | null;
  country_code?: string | null;
  email_id?: string | null;
  health_summary?: string | null;
}
