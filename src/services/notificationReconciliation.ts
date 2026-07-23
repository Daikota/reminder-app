import type { Reminder } from '@/types/reminder';

export const REMINDER_NOTIFICATION_KIND = 'reminder';

type ReconciliationReminder = Pick<
  Reminder,
  'dueDate' | 'id' | 'isCompleted' | 'notificationId' | 'time'
>;

export type ScheduledNotificationSnapshot = {
  identifier: string;
  isReminderNotification: boolean;
  reminderId: string | null;
};

export function getReminderNotificationDate(
  reminder: Pick<Reminder, 'dueDate' | 'time'>,
  now = Date.now()
) {
  if (!reminder.time) {
    return null;
  }

  const [year, month, day] = reminder.dueDate.split('-').map(Number);
  const [hour, minute] = reminder.time.split(':').map(Number);

  if (
    ![year, month, day, hour, minute].every(Number.isInteger) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  const hasExpectedLocalParts =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute;

  return hasExpectedLocalParts && date.getTime() > now ? date : null;
}

export function shouldReminderHaveNotification(
  reminder: ReconciliationReminder,
  now = Date.now()
) {
  return !reminder.isCompleted && getReminderNotificationDate(reminder, now) !== null;
}

export function needsNotificationRepair(
  reminder: ReconciliationReminder,
  scheduledNotificationIds: ReadonlySet<string>,
  now = Date.now()
) {
  if (!shouldReminderHaveNotification(reminder, now)) {
    return false;
  }

  return (
    !reminder.notificationId ||
    !scheduledNotificationIds.has(reminder.notificationId)
  );
}

export function getReminderNotificationOwnership(data: unknown) {
  if (!data || typeof data !== 'object') {
    return {
      isReminderNotification: false,
      reminderId: null,
    };
  }

  const notificationData = data as Record<string, unknown>;
  const reminderId =
    typeof notificationData.reminderId === 'string'
      ? notificationData.reminderId
      : null;
  const notificationKind = notificationData.notificationKind;
  const isCurrentReminderNotification =
    notificationKind === REMINDER_NOTIFICATION_KIND;
  const isLegacyReminderNotification =
    notificationKind === undefined && reminderId !== null;

  return {
    isReminderNotification:
      isCurrentReminderNotification || isLegacyReminderNotification,
    reminderId,
  };
}

export function getOrphanedReminderNotificationIds(
  scheduledNotifications: readonly ScheduledNotificationSnapshot[],
  existingReminderIds: ReadonlySet<string>
) {
  return scheduledNotifications
    .filter(
      (notification) =>
        notification.isReminderNotification &&
        notification.reminderId !== null &&
        !existingReminderIds.has(notification.reminderId)
    )
    .map((notification) => notification.identifier);
}
