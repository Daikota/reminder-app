import type { Reminder, ReminderRepeatType, ReminderWeekday } from '@/types/reminder';

type DueDateInput = Pick<
  Reminder,
  'repeatType' | 'customIntervalDays' | 'repeatWeekdays' | 'time'
> & {
  dueDate?: string;
};

function padDatePart(value: number) {
  return value.toString().padStart(2, '0');
}

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function getTodayDateKey() {
  return formatDateKey(new Date());
}

export function getWeekdayFromDate(date: Date): ReminderWeekday {
  const weekday = date.getDay();

  return (weekday === 0 ? 7 : weekday) as ReminderWeekday;
}

export function getTodayWeekday() {
  return getWeekdayFromDate(new Date());
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day);
}

export function getLocalDateTime(dateKey: string, time: string) {
  const dateMatch = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = time.match(/^(\d{2}):(\d{2})$/);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (
    year < 1 ||
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

  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, 0, 0);

  const hasExpectedLocalParts =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute;

  return hasExpectedLocalParts ? date : null;
}

export function isValidDateKey(dateKey: string) {
  return getLocalDateTime(dateKey, '12:00') !== null;
}

function addDays(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);

  return formatDateKey(date);
}

function addOneMonth(dateKey: string) {
  const date = parseDateKey(dateKey);
  const sourceDay = date.getDate();
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + 1;
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  return formatDateKey(
    new Date(targetYear, targetMonth, Math.min(sourceDay, lastDayOfTargetMonth))
  );
}

function getRepeatIntervalDays(repeatType: ReminderRepeatType, customIntervalDays: number | null) {
  if (repeatType === 'weekly') {
    return 7;
  }

  if (repeatType === 'custom_days') {
    return customIntervalDays && customIntervalDays >= 1 ? customIntervalDays : 1;
  }

  return 1;
}

function isTimeAlreadyPastToday(time: string | null) {
  if (!time) {
    return false;
  }

  const [hour, minute] = time.split(':').map(Number);
  const now = new Date();
  const scheduledDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0
  );

  return scheduledDate.getTime() <= now.getTime();
}

function getNextSelectedWeekdayDate(dateKey: string, weekdays: ReminderWeekday[]) {
  if (weekdays.length === 0) {
    return addDays(dateKey, 7);
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = parseDateKey(dateKey);
    candidate.setDate(candidate.getDate() + offset);

    if (weekdays.includes(getWeekdayFromDate(candidate))) {
      return formatDateKey(candidate);
    }
  }

  return addDays(dateKey, 7);
}

function calculateInitialWeeklyDueDate(input: DueDateInput, today: string) {
  const weekdays = input.repeatWeekdays ?? [];

  if (weekdays.length === 0) {
    return isTimeAlreadyPastToday(input.time) ? addDays(today, 1) : today;
  }

  const todayWeekday = getTodayWeekday();

  if (weekdays.includes(todayWeekday) && !isTimeAlreadyPastToday(input.time)) {
    return today;
  }

  return getNextSelectedWeekdayDate(today, weekdays);
}

export function calculateInitialDueDate(input: DueDateInput, today = getTodayDateKey()) {
  if (input.repeatType === 'once') {
    return input.dueDate ?? today;
  }

  if (input.repeatType === 'weekly') {
    return calculateInitialWeeklyDueDate(input, today);
  }

  if (!isTimeAlreadyPastToday(input.time)) {
    return today;
  }

  if (input.repeatType === 'monthly') {
    return addOneMonth(today);
  }

  if (input.repeatType === 'custom_days') {
    return addDays(today, getRepeatIntervalDays(input.repeatType, input.customIntervalDays));
  }

  return addDays(today, 1);
}

export function getNextDueDate(
  reminder: Pick<Reminder, 'dueDate' | 'repeatType' | 'customIntervalDays' | 'repeatWeekdays'>,
  fromDate = reminder.dueDate
) {
  if (reminder.repeatType === 'once') {
    return null;
  }

  if (reminder.repeatType === 'weekly' && reminder.repeatWeekdays?.length) {
    return getNextSelectedWeekdayDate(fromDate, reminder.repeatWeekdays);
  }

  if (reminder.repeatType === 'monthly') {
    return addOneMonth(fromDate);
  }

  return addDays(
    fromDate,
    getRepeatIntervalDays(reminder.repeatType, reminder.customIntervalDays)
  );
}

export function calculateNextDueDateFromToday(
  reminder: Pick<Reminder, 'dueDate' | 'repeatType' | 'customIntervalDays' | 'repeatWeekdays'>
) {
  return getNextDueDate(reminder, getTodayDateKey());
}

function haveSameWeekdays(
  first: ReminderWeekday[] | null | undefined,
  second: ReminderWeekday[] | null | undefined
) {
  const firstWeekdays = [...(first ?? [])].sort((left, right) => left - right);
  const secondWeekdays = [...(second ?? [])].sort((left, right) => left - right);

  return (
    firstWeekdays.length === secondWeekdays.length &&
    firstWeekdays.every((weekday, index) => weekday === secondWeekdays[index])
  );
}

export function calculateUpdatedDueDate(
  existingReminder: Pick<Reminder, 'dueDate' | 'repeatType' | 'repeatWeekdays'>,
  input: DueDateInput,
  today = getTodayDateKey()
) {
  if (input.repeatType === 'once') {
    return input.dueDate ?? existingReminder.dueDate;
  }

  const repeatTypeChanged = existingReminder.repeatType !== input.repeatType;
  const weeklySelectionChanged =
    input.repeatType === 'weekly' &&
    !haveSameWeekdays(existingReminder.repeatWeekdays, input.repeatWeekdays);

  if (!repeatTypeChanged && !weeklySelectionChanged) {
    return existingReminder.dueDate;
  }

  return calculateInitialDueDate(input, today);
}

export function isDueDateOnOrBefore(dueDate: string, referenceDate: string) {
  return dueDate <= referenceDate;
}

export function getDueDateLabel(dueDate: string, today = getTodayDateKey()) {
  if (isDueDateOnOrBefore(dueDate, today) && dueDate !== today) {
    return `Überfällig seit: ${dueDate}`;
  }

  if (dueDate === today) {
    return 'Fällig: Heute';
  }

  return `Fällig: ${dueDate}`;
}
