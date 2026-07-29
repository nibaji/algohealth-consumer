import { theme } from '@/constants/theme';
import { alertService } from '@/src/services/alerts/alertService';
import { linkedDeviceStorage } from '@/src/services/alerts/linkedDeviceStorage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

const ALERTS_CHANNEL_ID = 'alerts';
let currentDeviceSync: Promise<void> | null = null;

Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const isPermissionGranted = (
  permission: Notifications.NotificationPermissionsStatus
): boolean => {
  if (permission.granted) {
    return true;
  }

  const iosStatus = permission.ios?.status;
  return (
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED
    || iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL
    || iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
};

const configureAndroidChannel = async (): Promise<void> => {
  if (process.env.EXPO_OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ALERTS_CHANNEL_ID, {
    name: 'Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: theme.colors.primary.DEFAULT,
  });
};

const getProjectId = (): string | null => {
  const easProjectId: unknown = Constants.easConfig?.projectId;
  if (typeof easProjectId === 'string') {
    return easProjectId;
  }

  const configuredProjectId: unknown =
    Constants.expoConfig?.extra?.eas?.projectId;
  return typeof configuredProjectId === 'string' ? configuredProjectId : null;
};

const getPushToken = async (): Promise<string | null> => {
  await configureAndroidChannel();

  const existingPermission = await Notifications.getPermissionsAsync();
  let finalPermission = existingPermission;
  if (!isPermissionGranted(existingPermission)) {
    if (!existingPermission.canAskAgain) {
      return null;
    }
    finalPermission = await Notifications.requestPermissionsAsync();
  }

  if (!isPermissionGranted(finalPermission)) {
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('EAS project ID is missing from the Expo configuration');
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
};

const performDeviceSync = async (userId: string): Promise<void> => {
  const pushToken = await getPushToken();
  if (!pushToken) {
    return;
  }

  const [storedDevice, linkedDevices] = await Promise.all([
    linkedDeviceStorage.get(),
    alertService.listLinkedDevices(),
  ]);

  if (
    storedDevice?.userId === userId
    && storedDevice.pushToken !== pushToken
    && linkedDevices.some((device) => device.id === storedDevice.deviceId)
  ) {
    await alertService.deleteLinkedDevice(storedDevice.deviceId);
  }

  if (storedDevice && storedDevice.userId !== userId) {
    await linkedDeviceStorage.clear();
  }

  const existingDevice = linkedDevices.find(
    (device) => device.device_identifier === pushToken
  );
  const linkedDevice = existingDevice
    ?? await alertService.linkDevice(pushToken);

  try {
    await linkedDeviceStorage.set({
      userId,
      deviceId: linkedDevice.id,
      pushToken,
    });
  } catch (error: unknown) {
    await Promise.allSettled([
      alertService.deleteLinkedDevice(linkedDevice.id),
      Notifications.unregisterForNotificationsAsync(),
    ]);
    throw error;
  }
};

export const pushNotificationService = {
  async syncLinkedDevice(userId: string): Promise<void> {
    if (currentDeviceSync) {
      await currentDeviceSync.catch((): void => undefined);
    }

    const sync = performDeviceSync(userId);
    currentDeviceSync = sync;
    try {
      await sync;
    } finally {
      if (currentDeviceSync === sync) {
        currentDeviceSync = null;
      }
    }
  },

  async unlinkCurrentDevice(userId: string): Promise<void> {
    if (currentDeviceSync) {
      await currentDeviceSync.catch((): void => undefined);
    }

    const storedDevice = await linkedDeviceStorage.get();
    if (!storedDevice) {
      await Notifications.unregisterForNotificationsAsync();
      return;
    }
    if (storedDevice.userId !== userId) {
      await Notifications.unregisterForNotificationsAsync();
      await linkedDeviceStorage.clear();
      return;
    }

    let unlinkedFromServer = false;
    try {
      const linkedDevices = await alertService.listLinkedDevices();
      if (linkedDevices.some((device) => device.id === storedDevice.deviceId)) {
        await alertService.deleteLinkedDevice(storedDevice.deviceId);
      }
      unlinkedFromServer = true;
    } finally {
      await Notifications.unregisterForNotificationsAsync();
      if (unlinkedFromServer) {
        await linkedDeviceStorage.clear();
      }
    }
  },

  subscribeToReceived(listener: () => void): () => void {
    const subscription = Notifications.addNotificationReceivedListener(
      (): void => listener()
    );
    return (): void => subscription.remove();
  },

  subscribeToResponses(listener: () => void): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (): void => {
        Notifications.clearLastNotificationResponse();
        listener();
      }
    );
    return (): void => subscription.remove();
  },

  consumeInitialResponse(): boolean {
    if (!Notifications.getLastNotificationResponse()) {
      return false;
    }

    Notifications.clearLastNotificationResponse();
    return true;
  },
};
