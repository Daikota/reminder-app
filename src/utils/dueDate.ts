import type { Reminder, ReminderRepeatType } from '@/types/reminder';

function padDatePart(value: number) {
  return value.toString().padStart(2, '0');
}

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function getTodayDateKey() {
  return formatDateKey(new Date());
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(year, month - 1, day);
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

export function getNextDueDate(
  reminder: Pick<Reminder, 'dueDate' | 'repeatType' | 'customIntervalDays'>,
  fromDate = reminder.dueDate
) {
  if (reminder.repeatType === 'monthly') {
    return addOneMonth(fromDate);
  }

  return addDays(
    fromDate,
    getRepeatIntervalDays(reminder.repeatType, reminder.customIntervalDays)
  );
}

export function getDueDateLabel(dueDate: string, today = getTodayDateKey()) {
  if (dueDate < today) {
    return `Überfällig seit: ${dueDate}`;
  }

  if (dueDate === today) {
    return 'Heute';
  }

  return dueDate;
}
