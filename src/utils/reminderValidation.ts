import type { ReminderRepeatType, ReminderWeekday } from '@/types/reminder';

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const TIME_DIGITS_PATTERN = /^\d{1,4}$/;

function formatTime(hour: number, minute: number) {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export function normalizeOptionalTime(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const timeMatch = trimmedValue.match(TIME_PATTERN);

  if (timeMatch) {
    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);

    return hour <= 23 ? formatTime(hour, minute) : undefined;
  }

  if (!TIME_DIGITS_PATTERN.test(trimmedValue)) {
    return undefined;
  }

  if (trimmedValue.length <= 2) {
    const hour = Number(trimmedValue);

    return hour <= 23 ? formatTime(hour, 0) : undefined;
  }

  const paddedValue = trimmedValue.padStart(4, '0');
  const hour = Number(paddedValue.slice(0, 2));
  const minute = Number(paddedValue.slice(2, 4));

  return hour <= 23 && minute <= 59 ? formatTime(hour, minute) : undefined;
}

export function parseCustomIntervalDays(value: string, repeatType: ReminderRepeatType) {
  if (repeatType !== 'custom_days') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!/^\d+$/.test(trimmedValue)) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);

  return parsedValue >= 1 ? parsedValue : undefined;
}

export function normalizeRepeatWeekdays(
  repeatType: ReminderRepeatType,
  repeatWeekdays: ReminderWeekday[]
) {
  if (repeatType !== 'weekly') {
    return null;
  }

  return repeatWeekdays.length > 0 ? repeatWeekdays : undefined;
}
