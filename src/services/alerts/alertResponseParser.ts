import {
  AlertItem,
  AlertPriority,
  AlertType,
  LinkedDevice,
  UnreadAlertCount,
} from '@/src/features/alerts/alertTypes';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => (
  typeof value === 'object' && value !== null
);

const isNullableString = (value: unknown): value is string | null => (
  typeof value === 'string' || value === null
);

const isAlertType = (value: unknown): value is AlertType => (
  value === 'CLINICAL' || value === 'REMINDER' || value === 'SYSTEM'
);

const isAlertPriority = (value: unknown): value is AlertPriority => (
  value === 'LOW'
  || value === 'MEDIUM'
  || value === 'HIGH'
  || value === 'CRITICAL'
);

export const parseAlert = (value: unknown): AlertItem => {
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.user_id !== 'string'
    || typeof value.title !== 'string'
    || typeof value.message !== 'string'
    || typeof value.is_read !== 'boolean'
    || typeof value.created_at !== 'string'
  ) {
    throw new Error('The alerts API returned an invalid alert');
  }

  return {
    id: value.id,
    user_id: value.user_id,
    title: value.title,
    message: value.message,
    is_read: value.is_read,
    created_at: value.created_at,
    type: isAlertType(value.type) ? value.type : 'SYSTEM',
    priority: isAlertPriority(value.priority) ? value.priority : 'MEDIUM',
    medical_record_id: isNullableString(value.medical_record_id)
      ? value.medical_record_id
      : null,
    scheduled_date: isNullableString(value.scheduled_date)
      ? value.scheduled_date
      : null,
    recurrence_interval_months:
      typeof value.recurrence_interval_months === 'number'
        ? value.recurrence_interval_months
        : null,
    email_sent_at: isNullableString(value.email_sent_at)
      ? value.email_sent_at
      : null,
  };
};

export const parseAlerts = (value: unknown): AlertItem[] => {
  if (!Array.isArray(value)) {
    throw new Error('The alerts API returned an invalid list');
  }
  return value.map(parseAlert);
};

export const parseLinkedDevice = (value: unknown): LinkedDevice => {
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.device_identifier !== 'string'
  ) {
    throw new Error('The alerts API returned an invalid linked device');
  }
  return {
    id: value.id,
    device_identifier: value.device_identifier,
  };
};

export const parseLinkedDevices = (value: unknown): LinkedDevice[] => {
  if (!Array.isArray(value)) {
    throw new Error('The alerts API returned an invalid device list');
  }
  return value.map(parseLinkedDevice);
};

export const parseUnreadAlertCount = (value: unknown): UnreadAlertCount => {
  if (!isRecord(value) || typeof value.count !== 'number') {
    throw new Error('The alerts API returned an invalid unread count');
  }
  return { count: value.count };
};
