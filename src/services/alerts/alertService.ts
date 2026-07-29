import {
  AlertItem,
  LinkedDevice,
  LinkedDeviceCreate,
  MarkAlertsReadResult,
  UnreadAlertCount,
} from '@/src/features/alerts/alertTypes';
import { apiClient } from '@/src/services/api/apiClient';
import {
  parseAlert,
  parseAlerts,
  parseLinkedDevice,
  parseLinkedDevices,
  parseUnreadAlertCount,
} from '@/src/services/alerts/alertResponseParser';

const ALERT_PAGE_SIZE = 100;
const MARK_READ_BATCH_SIZE = 10;

export const alertService = {
  async listAlerts(skip = 0, limit = ALERT_PAGE_SIZE): Promise<AlertItem[]> {
    const response = await apiClient.get<unknown>(
      `/alerts/?skip=${skip}&limit=${limit}`
    );
    return parseAlerts(response);
  },

  async listAllAlerts(): Promise<AlertItem[]> {
    const alerts: AlertItem[] = [];
    let skip = 0;

    while (true) {
      const page = await alertService.listAlerts(skip, ALERT_PAGE_SIZE);
      alerts.push(...page);

      if (page.length < ALERT_PAGE_SIZE) {
        return alerts;
      }
      skip += ALERT_PAGE_SIZE;
    }
  },

  async getUnreadCount(): Promise<UnreadAlertCount> {
    const response = await apiClient.get<unknown>('/alerts/unread-count');
    return parseUnreadAlertCount(response);
  },

  async markAsRead(alertId: string): Promise<AlertItem> {
    const response = await apiClient.patch<unknown>(
      `/alerts/${encodeURIComponent(alertId)}/read`
    );
    return parseAlert(response);
  },

  async markAlertsAsRead(alertIds: string[]): Promise<MarkAlertsReadResult> {
    const readIds: string[] = [];

    for (
      let batchStart = 0;
      batchStart < alertIds.length;
      batchStart += MARK_READ_BATCH_SIZE
    ) {
      const batchIds = alertIds.slice(
        batchStart,
        batchStart + MARK_READ_BATCH_SIZE
      );
      const results = await Promise.allSettled(
        batchIds.map((alertId) => alertService.markAsRead(alertId))
      );
      results.forEach((result, index): void => {
        if (result.status === 'fulfilled') {
          readIds.push(batchIds[index]);
        }
      });
    }

    return {
      readIds,
      failedCount: alertIds.length - readIds.length,
    };
  },

  async linkDevice(deviceIdentifier: string): Promise<LinkedDevice> {
    const body: LinkedDeviceCreate = {
      device_identifier: deviceIdentifier,
    };
    const response = await apiClient.post<unknown>('/alerts/add-device', body);
    return parseLinkedDevice(response);
  },

  async listLinkedDevices(): Promise<LinkedDevice[]> {
    const response = await apiClient.get<unknown>('/alerts/linked-devices');
    return parseLinkedDevices(response);
  },

  async deleteLinkedDevice(deviceId: string): Promise<void> {
    await apiClient.delete<void>(
      `/alerts/linked-devices/${encodeURIComponent(deviceId)}`
    );
  },
};
