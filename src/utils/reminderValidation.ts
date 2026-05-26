import type { ReminderRepeatType } from '@/types/reminder';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function normalizeOptionalTime(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return TIME_PATTERN.test(trimmedValue) ? trimmedValue : undefined;
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
