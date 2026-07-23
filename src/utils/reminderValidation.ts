import type { ReminderRepeatType, ReminderWeekday } from '@/types/reminder';
import { formatDateKey, getLocalDateTime, isValidDateKey } from './dueDate';

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const TIME_DIGITS_PATTERN = /^\d{1,4}$/;
const DATE_PATTERN = /^(\d{2})\.(\d{2})\.(\d{4})$/;
const DATE_DIGITS_PATTERN = /^\d{8}$/;

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

export function validateRequiredTime(value: string) {
  const normalizedTime = normalizeOptionalTime(value);

  if (normalizedTime === null) {
    return {
      isValid: false as const,
      error: 'Bitte füge eine Uhrzeit hinzu.',
    };
  }

  if (normalizedTime === undefined) {
    return {
      isValid: false as const,
      error: 'Bitte nutze z. B. 17, 1730 oder 17:30.',
    };
  }

  return {
    isValid: true as const,
    value: normalizedTime,
  };
}

export function normalizeGermanDate(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const dottedMatch = trimmedValue.match(DATE_PATTERN);
  const compactMatch = DATE_DIGITS_PATTERN.test(trimmedValue)
    ? [
        trimmedValue,
        trimmedValue.slice(0, 2),
        trimmedValue.slice(2, 4),
        trimmedValue.slice(4, 8),
      ]
    : null;
  const dateMatch = dottedMatch ?? compactMatch;

  if (!dateMatch) {
    return undefined;
  }

  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  const dateKey = `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

  return year >= 1 && isValidDateKey(dateKey) ? dateKey : undefined;
}

export function formatDateKeyForInput(dateKey: string) {
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match || !isValidDateKey(dateKey)) {
    return '';
  }

  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function validateRequiredDate(value: string) {
  const normalizedDate = normalizeGermanDate(value);

  if (normalizedDate === null) {
    return {
      isValid: false as const,
      error: 'Bitte füge ein Datum hinzu.',
    };
  }

  if (normalizedDate === undefined) {
    return {
      isValid: false as const,
      error: 'Bitte nutze das Format TT.MM.JJJJ.',
    };
  }

  return {
    isValid: true as const,
    value: normalizedDate,
  };
}

export function validateFutureOneTimeSchedule(
  dueDate: string,
  time: string,
  now = Date.now()
) {
  const today = formatDateKey(new Date(now));

  if (dueDate < today) {
    return {
      isValid: false as const,
      field: 'dueDate' as const,
      error: 'Das Datum darf nicht in der Vergangenheit liegen.',
    };
  }

  const scheduledDate = getLocalDateTime(dueDate, time);

  if (!scheduledDate) {
    return {
      isValid: false as const,
      field: 'time' as const,
      error: 'Diese Uhrzeit ist an diesem Datum nicht gültig.',
    };
  }

  if (scheduledDate.getTime() <= now) {
    return {
      isValid: false as const,
      field: 'time' as const,
      error: 'Bitte wähle eine Uhrzeit in der Zukunft.',
    };
  }

  return {
    isValid: true as const,
    value: scheduledDate,
  };
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
