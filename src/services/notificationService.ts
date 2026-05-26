import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Reminder } from '@/types/reminder';

const REMINDER_CHANNEL_ID = 'reminders';

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
  } catch {
    return false;
  }
}

function getReminderNotificationDate(reminder: Reminder) {
  if (!reminder.time) {
    return null;
  }

  const [year, month, day] = reminder.dueDate.split('-').map(Number);
  const [hour, minute] = reminder.time.split(':').map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  // A past local timestamp cannot be scheduled meaningfully; keep saving the reminder without a notification.
  if (date.getTime() <= Date.now()) {
    return null;
  }

  return date;
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
          reminderId: reminder.id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelReminderNotification(notificationId: string | null) {
  if (!notificationId) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Already-delivered or missing scheduled notifications should not block reminder changes.
  }
}
