import { useNotifications } from '@/src/contexts/NotificationContext';
import { AlertItem } from '@/src/features/alerts/alertTypes';
import { alertService } from '@/src/services/alerts/alertService';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

interface UseAlertsReturn {
  alerts: AlertItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  readWarning: string | null;
  refresh: () => void;
  retry: () => void;
}

export const useAlerts = (): UseAlertsReturn => {
  const { refreshUnreadCount } = useNotifications();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readWarning, setReadWarning] = useState<string | null>(null);

  const loadAlerts = useCallback(async (refresh = false): Promise<void> => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    setReadWarning(null);

    try {
      const nextAlerts = await alertService.listAllAlerts();
      setAlerts(nextAlerts);

      const unreadIds = nextAlerts
        .filter((alert) => !alert.is_read)
        .map((alert) => alert.id);
      if (unreadIds.length > 0) {
        const result = await alertService.markAlertsAsRead(unreadIds);
        const readIds = new Set(result.readIds);
        setAlerts((current) => current.map((alert) => (
          readIds.has(alert.id) ? { ...alert, is_read: true } : alert
        )));

        if (result.failedCount > 0) {
          setReadWarning(
            `${result.failedCount} ${result.failedCount === 1 ? 'alert was' : 'alerts were'} not marked as read. Pull to refresh to retry.`
          );
        }
      }

      await refreshUnreadCount();
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : 'Failed to load alerts'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [refreshUnreadCount]);

  useFocusEffect(useCallback((): void => {
    loadAlerts();
  }, [loadAlerts]));

  const refresh = useCallback((): void => {
    loadAlerts(true);
  }, [loadAlerts]);

  const retry = useCallback((): void => {
    loadAlerts();
  }, [loadAlerts]);

  return {
    alerts,
    isLoading,
    isRefreshing,
    error,
    readWarning,
    refresh,
    retry,
  };
};
