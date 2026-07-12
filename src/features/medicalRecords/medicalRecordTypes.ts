export interface VitalIn {
  name: string;
  value: string;
  unit?: string | null;
}

export interface VitalResponse {
  id: string;
  name: string;
  value: string;
  unit: string | null;
}

export interface DiagnosisIn {
  icd_code?: string | null;
  name: string;
  type?: string | null;
  notes?: string | null;
}

export interface DiagnosisResponse {
  id: string;
  icd_code: string | null;
  name: string;
  type: string | null;
  notes: string | null;
}

export interface MedicationIn {
  drug_name: string;
  generic_name?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  route?: string | null;
  duration?: string | null;
  notes?: string | null;
}

export interface MedicationResponse {
  id: string;
  drug_name: string;
  generic_name: string | null;
  custom_dosage?: string | null;
  dosage?: string | null;
  frequency: string | null;
  route: string | null;
  duration: string | null;
  notes: string | null;
}

export interface MedicalRecordCreate {
  family_member_id?: string | null;
  free_text?: string | null;
  visit_date?: string | null;
  primary_context?: string | null;
  chief_complaint?: string | null;
  notes?: string | null;
  vitals?: VitalIn[];
  diagnoses?: DiagnosisIn[];
  medications?: MedicationIn[];
  investigations?: unknown[];
  symptoms?: unknown[];
  ai_advice?: unknown[];
  allergies?: unknown[];
  current_medications?: unknown[];
  immunizations?: unknown[];
  medical_history?: unknown[];
  health_summary?: string | null;
}

export interface MedicalRecordUpdate {
  visit_date?: string | null;
  primary_context?: string | null;
  chief_complaint?: string | null;
  notes?: string | null;
  vitals?: VitalIn[] | null;
  diagnoses?: DiagnosisIn[] | null;
  medications?: MedicationIn[] | null;
  investigations?: unknown[] | null;
  symptoms?: unknown[] | null;
  ai_advice?: unknown[] | null;
  allergies?: unknown[] | null;
  current_medications?: unknown[] | null;
  immunizations?: unknown[] | null;
  medical_history?: unknown[] | null;
  ai_summary?: string | null;
  health_summary?: string | null;
}

export interface MedicalRecordFile {
  id: string;
  filename: string;
  stored_name: string | null;
  blob_name: string | null;
  bucket: string | null;
  url: string | null;
  mime_type: string | null;
  content_type: string | null;
  size: number | null;
  user_id: string;
  family_member_id: string | null;
  medical_record_id: string | null;
}

export interface MedicalRecordResponse {
  id: string;
  user_id: string;
  family_member_id: string | null;
  visit_date: string;
  primary_context: string | null;
  chief_complaint: string | null;
  notes: string | null;
  ai_summary: string | null;
  vitals?: VitalResponse[];
  diagnoses?: DiagnosisResponse[];
  medications?: MedicationResponse[];
  files?: MedicalRecordFile[];
  audio?: MedicalRecordFile[];
}

