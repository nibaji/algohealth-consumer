export type AlertType = 'CLINICAL' | 'REMINDER' | 'SYSTEM';

export type AlertPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AlertItem {
  id: string;
  user_id: string;
  medical_record_id: string | null;
  title: string;
  message: string;
  type: AlertType;
  priority: AlertPriority;
  scheduled_date: string | null;
  recurrence_interval_months: number | null;
  is_read: boolean;
  email_sent_at: string | null;
  created_at: string;
}

export interface LinkedDevice {
  id: string;
  device_identifier: string;
}

export interface LinkedDeviceCreate {
  device_identifier: string;
}

export interface UnreadAlertCount {
  count: number;
}

export interface MarkAlertsReadResult {
  readIds: string[];
  failedCount: number;
}
