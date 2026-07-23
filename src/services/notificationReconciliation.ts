import type { Reminder } from '@/types/reminder';
import { getLocalDateTime } from '../utils/dueDate';

export const REMINDER_NOTIFICATION_KIND = 'reminder';

type ReconciliationReminder = Pick<
  Reminder,
  'dueDate' | 'id' | 'isCompleted' | 'notificationId' | 'time'
>;

export type ScheduledNotificationSnapshot = {
  channelId: string | null;
  identifier: string;
  isReminderNotification: boolean;
  reminderId: string | null;
};

export function getNotificationTriggerChannelId(trigger: unknown) {
  if (!trigger || typeof trigger !== 'object') {
    return null;
  }

  const channelId = (trigger as Record<string, unknown>).channelId;

  return typeof channelId === 'string' ? channelId : null;
}

export function isStaleReminderNotification(
  notification: ScheduledNotificationSnapshot,
  reminder: Pick<Reminder, 'id' | 'notificationId'>
) {
  return (
    notification.isReminderNotification &&
    notification.reminderId === reminder.id &&
    notification.identifier !== reminder.notificationId
  );
}

export function getReminderNotificationDate(
  reminder: Pick<Reminder, 'dueDate' | 'time'>,
  now = Date.now()
) {
  if (!reminder.time) {
    return null;
  }

  const date = getLocalDateTime(reminder.dueDate, reminder.time);

  return date && date.getTime() > now ? date : null;
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
