import { useAuth } from '@/src/contexts/AuthContext';
import { alertService } from '@/src/services/alerts/alertService';
import { pushNotificationService } from '@/src/services/alerts/pushNotificationService';
import { Href, useRouter } from 'expo-router';
import React, {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

interface UnreadState {
  userId: string;
  count: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const router = useRouter();
  const [unreadState, setUnreadState] = useState<UnreadState | null>(null);
  const unreadCount = unreadState?.userId === userId
    ? unreadState.count
    : 0;

  const refreshUnreadCount = useCallback(async (): Promise<void> => {
    if (!userId) {
      return;
    }

    try {
      const response = await alertService.getUnreadCount();
      setUnreadState({
        userId,
        count: Math.max(0, response.count),
      });
    } catch {
      console.error('Failed to refresh unread alerts');
    }
  }, [userId]);

  useEffect((): (() => void) | undefined => {
    if (!userId) {
      return undefined;
    }

    const unreadRefreshTimer = setTimeout((): void => {
      refreshUnreadCount();
    }, 0);
    pushNotificationService.syncLinkedDevice(userId).catch(() => {
      console.error('Failed to sync the push notification device');
    });

    const openAlerts = (): void => {
      refreshUnreadCount();
      router.push('/alerts' as Href);
    };
    const unsubscribeReceived =
      pushNotificationService.subscribeToReceived(refreshUnreadCount);
    const unsubscribeResponses =
      pushNotificationService.subscribeToResponses(openAlerts);

    if (pushNotificationService.consumeInitialResponse()) {
      openAlerts();
    }

    return (): void => {
      clearTimeout(unreadRefreshTimer);
      unsubscribeReceived();
      unsubscribeResponses();
    };
  }, [refreshUnreadCount, router, userId]);

  const value = useMemo<NotificationContextType>(() => ({
    unreadCount,
    refreshUnreadCount,
  }), [refreshUnreadCount, unreadCount]);

  return (
    <NotificationContext value={value}>
      {children}
    </NotificationContext>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = use(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};
