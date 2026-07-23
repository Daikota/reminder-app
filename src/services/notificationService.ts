import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  getOrphanedReminderNotificationIds,
  getReminderNotificationDate,
  getReminderNotificationOwnership,
  needsNotificationRepair,
  REMINDER_NOTIFICATION_KIND,
  shouldReminderHaveNotification,
  type ScheduledNotificationSnapshot,
} from '@/services/notificationReconciliation';
import type { Reminder } from '@/types/reminder';

const REMINDER_CHANNEL_ID = 'reminders';

type NotificationReconciliationStore = {
  getReminders: () => Promise<Reminder[]>;
  updateNotificationId: (
    reminderId: string,
    notificationId: string | null
  ) => Promise<void>;
};

export type NotificationReconciliationResult = {
  canceled: number;
  repaired: number;
};

let reconciliationPromise: Promise<NotificationReconciliationResult> | null =
  null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureReminderChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Erinnerungen',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestNotificationPermission() {
  try {
    await ensureReminderChannel();

    const existingPermission = await Notifications.getPermissionsAsync();
    let finalStatus = existingPermission.status;

    if (finalStatus !== 'granted') {
      const requestedPermission = await Notifications.requestPermissionsAsync();
      finalStatus = requestedPermission.status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn(
      '[notifications] Berechtigungsstatus konnte nicht geprüft werden.',
      error
    );
    return false;
  }
}

export async function scheduleReminderNotification(reminder: Reminder) {
  try {
    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
      return null;
    }

    const notificationDate = getReminderNotificationDate(reminder);

    if (!notificationDate) {
      return null;
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.description ?? 'Deine Erinnerung ist fällig.',
        data: {
          notificationKind: REMINDER_NOTIFICATION_KIND,
          reminderId: reminder.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  } catch (error) {
    console.warn(
      `[notifications] Erinnerung ${reminder.id} konnte nicht geplant werden.`,
      error
    );
    return null;
  }
}

export async function cancelReminderNotification(notificationId: string | null) {
  if (!notificationId) {
    return true;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch (error) {
    console.warn(
      `[notifications] Geplante Notification ${notificationId} konnte nicht entfernt werden.`,
      error
    );
    return false;
  }
}

function toScheduledNotificationSnapshot(
  notification: Notifications.NotificationRequest
): ScheduledNotificationSnapshot {
  return {
    identifier: notification.identifier,
    ...getReminderNotificationOwnership(notification.content.data),
  };
}

async function persistNotificationId(
  store: NotificationReconciliationStore,
  reminderId: string,
  notificationId: string | null
) {
  try {
    await store.updateNotificationId(reminderId, notificationId);
    return true;
  } catch (error) {
    console.warn(
      `[notifications] Notification-ID für Erinnerung ${reminderId} konnte nicht gespeichert werden.`,
      error
    );
    return false;
  }
}

async function runReminderNotificationReconciliation(
  store: NotificationReconciliationStore
): Promise<NotificationReconciliationResult> {
  const [reminders, scheduledNotifications] = await Promise.all([
    store.getReminders(),
    Notifications.getAllScheduledNotificationsAsync(),
  ]);
  const now = Date.now();
  const snapshots = scheduledNotifications.map(toScheduledNotificationSnapshot);
  const existingReminderIds = new Set(reminders.map((reminder) => reminder.id));
  const remindersById = new Map(
    reminders.map((reminder) => [reminder.id, reminder])
  );
  const notificationIdsToCancel = new Set(
    getOrphanedReminderNotificationIds(snapshots, existingReminderIds)
  );

  for (const notification of snapshots) {
    if (!notification.isReminderNotification || !notification.reminderId) {
      continue;
    }

    const reminder = remindersById.get(notification.reminderId);

    if (reminder && !shouldReminderHaveNotification(reminder, now)) {
      notificationIdsToCancel.add(notification.identifier);
    }
  }

  const canceledNotificationIds = new Set<string>();

  for (const notificationId of notificationIdsToCancel) {
    const wasCanceled = await cancelReminderNotification(notificationId);

    if (wasCanceled) {
      canceledNotificationIds.add(notificationId);
    }
  }

  const scheduledNotificationIds = new Set(
    scheduledNotifications
      .map((notification) => notification.identifier)
      .filter(
        (notificationId) => !canceledNotificationIds.has(notificationId)
      )
  );
  let repaired = 0;

  for (const reminder of reminders) {
    if (!shouldReminderHaveNotification(reminder, now)) {
      if (
        reminder.notificationId &&
        (canceledNotificationIds.has(reminder.notificationId) ||
          !scheduledNotificationIds.has(reminder.notificationId))
      ) {
        await persistNotificationId(store, reminder.id, null);
      }

      continue;
    }

    if (!needsNotificationRepair(reminder, scheduledNotificationIds, now)) {
      continue;
    }

    const notificationId = await scheduleReminderNotification(reminder);

    if (!notificationId) {
      continue;
    }

    if (await persistNotificationId(store, reminder.id, notificationId)) {
      scheduledNotificationIds.add(notificationId);
      repaired += 1;
    } else {
      await cancelReminderNotification(notificationId);
    }
  }

  return {
    canceled: canceledNotificationIds.size,
    repaired,
  };
}

export function reconcileReminderNotifications(
  store: NotificationReconciliationStore
) {
  if (reconciliationPromise) {
    return reconciliationPromise;
  }

  const currentPromise = runReminderNotificationReconciliation(store).finally(
    () => {
      if (reconciliationPromise === currentPromise) {
        reconciliationPromise = null;
      }
    }
  );

  reconciliationPromise = currentPromise;

  return currentPromise;
}
