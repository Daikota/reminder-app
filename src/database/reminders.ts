import * as SQLite from 'expo-sqlite';

import {
  cancelReminderNotification,
  scheduleReminderNotification,
} from '@/services/notificationService';
import type {
  CreateReminderInput,
  Reminder,
  ReminderRepeatType,
  ReminderWeekday,
  UpdateReminderInput,
} from '@/types/reminder';
import {
  calculateInitialDueDate,
  calculateNextDueDateFromToday,
  calculateUpdatedDueDate,
  getTodayDateKey,
  isValidDateKey,
} from '@/utils/dueDate';
import {
  validateFutureOneTimeSchedule,
  validateRequiredTime,
} from '@/utils/reminderValidation';

const DATABASE_NAME = 'reminder-app.db';

type ReminderRow = {
  id: string;
  title: string;
  description: string | null;
  time: string | null;
  repeat_type: string;
  custom_interval_days: number | null;
  repeat_weekdays: string | null;
  due_date: string;
  notification_id: string | null;
  is_completed: number;
  created_at: string;
  updated_at: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initializationPromise: Promise<void> | null = null;

function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return databasePromise;
}

function isReminderRepeatType(value: string): value is ReminderRepeatType {
  return (
    value === 'once' ||
    value === 'daily' ||
    value === 'weekly' ||
    value === 'monthly' ||
    value === 'custom_days'
  );
}

function isReminderWeekday(value: unknown): value is ReminderWeekday {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 7
  );
}

function parseRepeatWeekdays(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(value);

    if (!Array.isArray(parsedValue)) {
      return null;
    }

    const weekdays = parsedValue.filter(isReminderWeekday);

    return weekdays.length > 0 ? weekdays : null;
  } catch {
    return null;
  }
}

function serializeRepeatWeekdays(repeatType: ReminderRepeatType, repeatWeekdays?: ReminderWeekday[] | null) {
  if (repeatType !== 'weekly' || !repeatWeekdays?.length) {
    return null;
  }

  return JSON.stringify(repeatWeekdays);
}

function mapReminderRow(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    time: row.time,
    repeatType: isReminderRepeatType(row.repeat_type) ? row.repeat_type : 'daily',
    customIntervalDays: row.custom_interval_days,
    repeatWeekdays: parseRepeatWeekdays(row.repeat_weekdays),
    dueDate: row.due_date,
    notificationId: row.notification_id,
    isCompleted: row.is_completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createReminderId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);

  return `${timestamp}-${randomPart}`;
}

export function initializeDatabase() {
  if (!initializationPromise) {
    initializationPromise = getDatabase().then(async (database) => {
      const today = getTodayDateKey();
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS reminders (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          time TEXT,
          repeat_type TEXT NOT NULL,
          custom_interval_days INTEGER,
          repeat_weekdays TEXT,
          due_date TEXT NOT NULL,
          notification_id TEXT,
          is_completed INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      const tableColumns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(reminders)');
      const hasDueDate = tableColumns.some((column) => column.name === 'due_date');
      const hasNotificationId = tableColumns.some((column) => column.name === 'notification_id');
      const hasRepeatWeekdays = tableColumns.some((column) => column.name === 'repeat_weekdays');

      if (!hasDueDate) {
        await database.execAsync(`ALTER TABLE reminders ADD COLUMN due_date TEXT NOT NULL DEFAULT '${today}'`);
      }

      if (!hasNotificationId) {
        await database.execAsync('ALTER TABLE reminders ADD COLUMN notification_id TEXT');
      }

      if (!hasRepeatWeekdays) {
        await database.execAsync('ALTER TABLE reminders ADD COLUMN repeat_weekdays TEXT');
      }
    });
  }

  return initializationPromise;
}

export async function createReminder(input: CreateReminderInput) {
  await initializeDatabase();

  const database = await getDatabase();
  const timeValidation = validateRequiredTime(input.time);

  if (!timeValidation.isValid) {
    throw new Error(timeValidation.error);
  }

  const now = new Date().toISOString();
  const title = input.title.trim();
  const description = input.description?.trim() ? input.description.trim() : null;
  const repeatType = input.repeatType ?? 'once';
  const time = timeValidation.value;
  const customIntervalDays =
    repeatType === 'custom_days' ? input.customIntervalDays ?? null : null;
  const repeatWeekdays = repeatType === 'weekly' ? input.repeatWeekdays ?? null : null;
  const dueDate =
    repeatType === 'once'
      ? input.dueDate
      : calculateInitialDueDate({
          repeatType,
          customIntervalDays,
          repeatWeekdays,
          time,
        });

  if (!dueDate || !isValidDateKey(dueDate)) {
    throw new Error('A valid due date is required for one-time reminders.');
  }

  if (repeatType === 'once') {
    const scheduleValidation = validateFutureOneTimeSchedule(dueDate, time);

    if (!scheduleValidation.isValid) {
      throw new Error(scheduleValidation.error);
    }
  }

  const reminder: Reminder = {
    id: createReminderId(),
    title,
    description,
    time,
    repeatType,
    customIntervalDays,
    repeatWeekdays,
    dueDate,
    notificationId: null,
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
  };

  await database.runAsync(
    `INSERT INTO reminders (
      id,
      title,
      description,
      time,
      repeat_type,
      custom_interval_days,
      repeat_weekdays,
      due_date,
      notification_id,
      is_completed,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reminder.id,
      reminder.title,
      reminder.description,
      reminder.time,
      reminder.repeatType,
      reminder.customIntervalDays,
      serializeRepeatWeekdays(reminder.repeatType, reminder.repeatWeekdays),
      reminder.dueDate,
      reminder.notificationId,
      reminder.isCompleted ? 1 : 0,
      reminder.createdAt,
      reminder.updatedAt,
    ]
  );

  const notificationId = await scheduleReminderNotification(reminder);
  let storedNotificationId: string | null = null;

  if (notificationId) {
    try {
      await database.runAsync('UPDATE reminders SET notification_id = ? WHERE id = ?', [
        notificationId,
        reminder.id,
      ]);
      storedNotificationId = notificationId;
    } catch (error) {
      console.warn(
        `[reminders] Notification-Verknüpfung für Erinnerung ${reminder.id} konnte nicht gespeichert werden.`,
        error
      );
      await cancelReminderNotification(notificationId);
    }
  }

  return {
    ...reminder,
    notificationId: storedNotificationId,
  };
}

export async function getReminders() {
  await initializeDatabase();

  const database = await getDatabase();
  const rows = await database.getAllAsync<ReminderRow>(
    `SELECT
      id,
      title,
      description,
      time,
      repeat_type,
      custom_interval_days,
      repeat_weekdays,
      due_date,
      notification_id,
      is_completed,
      created_at,
      updated_at
    FROM reminders
    ORDER BY is_completed ASC, created_at DESC`
  );

  return rows.map(mapReminderRow);
}

export async function getAllReminders() {
  await initializeDatabase();

  const database = await getDatabase();
  const rows = await database.getAllAsync<ReminderRow>(
    `SELECT
      id,
      title,
      description,
      time,
      repeat_type,
      custom_interval_days,
      repeat_weekdays,
      due_date,
      notification_id,
      is_completed,
      created_at,
      updated_at
    FROM reminders
    ORDER BY due_date ASC,
      CASE WHEN time IS NULL THEN 1 ELSE 0 END ASC,
      time ASC,
      created_at DESC`
  );

  return rows.map(mapReminderRow);
}

export async function getTodayReminders(today: string) {
  await initializeDatabase();

  const database = await getDatabase();
  const rows = await database.getAllAsync<ReminderRow>(
    `SELECT
      id,
      title,
      description,
      time,
      repeat_type,
      custom_interval_days,
      repeat_weekdays,
      due_date,
      notification_id,
      is_completed,
      created_at,
      updated_at
    FROM reminders
    WHERE due_date = ?
    ORDER BY is_completed ASC, created_at DESC`,
    [today]
  );

  return rows.map(mapReminderRow);
}

export async function getDueReminders(today: string) {
  await initializeDatabase();

  const database = await getDatabase();
  const rows = await database.getAllAsync<ReminderRow>(
    `SELECT
      id,
      title,
      description,
      time,
      repeat_type,
      custom_interval_days,
      repeat_weekdays,
      due_date,
      notification_id,
      is_completed,
      created_at,
      updated_at
    FROM reminders
    WHERE due_date <= ?
      AND is_completed = 0
    ORDER BY due_date ASC,
      CASE WHEN time IS NULL THEN 1 ELSE 0 END ASC,
      time ASC,
      created_at DESC`,
    [today]
  );

  return rows.map(mapReminderRow);
}

export async function getReminderById(id: string) {
  await initializeDatabase();

  const database = await getDatabase();
  const row = await database.getFirstAsync<ReminderRow>(
    `SELECT
      id,
      title,
      description,
      time,
      repeat_type,
      custom_interval_days,
      repeat_weekdays,
      due_date,
      notification_id,
      is_completed,
      created_at,
      updated_at
    FROM reminders
    WHERE id = ?`,
    [id]
  );

  return row ? mapReminderRow(row) : null;
}

export async function updateReminder(input: UpdateReminderInput) {
  await initializeDatabase();

  const database = await getDatabase();
  const existingReminder = await getReminderById(input.id);

  if (!existingReminder) {
    throw new Error('Reminder to update was not found.');
  }

  const timeValidation = validateRequiredTime(input.time);

  if (!timeValidation.isValid) {
    throw new Error(timeValidation.error);
  }

  const now = new Date().toISOString();
  const description = input.description?.trim() ? input.description.trim() : null;
  const time = timeValidation.value;
  const customIntervalDays =
    input.repeatType === 'custom_days' ? input.customIntervalDays ?? null : null;
  const repeatWeekdays = input.repeatType === 'weekly' ? input.repeatWeekdays ?? null : null;
  const dueDate = calculateUpdatedDueDate(existingReminder, {
    repeatType: input.repeatType,
    customIntervalDays,
    repeatWeekdays,
    time,
    dueDate: input.dueDate,
  });
  const oneTimeScheduleChanged =
    existingReminder.repeatType !== 'once' ||
    dueDate !== existingReminder.dueDate ||
    time !== existingReminder.time;

  if (input.repeatType === 'once') {
    if (!isValidDateKey(dueDate)) {
      throw new Error('A valid due date is required for one-time reminders.');
    }

    if (oneTimeScheduleChanged) {
      const scheduleValidation = validateFutureOneTimeSchedule(dueDate, time);

      if (!scheduleValidation.isValid) {
        throw new Error(scheduleValidation.error);
      }
    }
  }
  const updatedReminder: Reminder = {
    ...existingReminder,
    title: input.title.trim(),
    description,
    time,
    repeatType: input.repeatType,
    customIntervalDays,
    repeatWeekdays,
    dueDate,
    notificationId: null,
    updatedAt: now,
  };
  const serializedRepeatWeekdays = serializeRepeatWeekdays(
    input.repeatType,
    repeatWeekdays
  );
  const existingSerializedRepeatWeekdays = serializeRepeatWeekdays(
    existingReminder.repeatType,
    existingReminder.repeatWeekdays
  );
  const hasReminderChanges =
    input.title.trim() !== existingReminder.title ||
    description !== existingReminder.description ||
    time !== existingReminder.time ||
    input.repeatType !== existingReminder.repeatType ||
    customIntervalDays !== existingReminder.customIntervalDays ||
    serializedRepeatWeekdays !== existingSerializedRepeatWeekdays ||
    dueDate !== existingReminder.dueDate;
  let notificationId = existingReminder.notificationId;

  if (hasReminderChanges) {
    await cancelReminderNotification(existingReminder.notificationId);
    notificationId = await scheduleReminderNotification(updatedReminder);
  }

  await database.runAsync(
    `UPDATE reminders
      SET title = ?,
        description = ?,
        time = ?,
        repeat_type = ?,
        custom_interval_days = ?,
        repeat_weekdays = ?,
        due_date = ?,
        notification_id = ?,
        updated_at = ?
      WHERE id = ?`,
    [
      input.title.trim(),
      description,
      time,
      input.repeatType,
      customIntervalDays,
      serializedRepeatWeekdays,
      dueDate,
      notificationId,
      now,
      input.id,
    ]
  );
}

export async function updateReminderDueDate(id: string, dueDate: string) {
  await initializeDatabase();

  const database = await getDatabase();
  const now = new Date().toISOString();

  await database.runAsync(
    'UPDATE reminders SET due_date = ?, updated_at = ? WHERE id = ?',
    [dueDate, now, id]
  );
}

export async function updateReminderNotificationId(
  id: string,
  notificationId: string | null
) {
  await initializeDatabase();

  const database = await getDatabase();

  await database.runAsync(
    'UPDATE reminders SET notification_id = ? WHERE id = ?',
    [notificationId, id]
  );
}

export async function markReminderCompleted(id: string) {
  await initializeDatabase();

  const reminder = await getReminderById(id);

  if (!reminder) {
    throw new Error('Reminder to complete was not found.');
  }

  const database = await getDatabase();
  const now = new Date().toISOString();
  const nextDueDate = calculateNextDueDateFromToday(reminder);

  if (!nextDueDate) {
    await cancelReminderNotification(reminder.notificationId);
    await database.runAsync(
      'UPDATE reminders SET notification_id = NULL, is_completed = 1, updated_at = ? WHERE id = ?',
      [now, id]
    );
    return;
  }

  const nextReminder: Reminder = {
    ...reminder,
    dueDate: nextDueDate,
    notificationId: null,
    updatedAt: now,
  };

  await cancelReminderNotification(reminder.notificationId);
  const notificationId = await scheduleReminderNotification(nextReminder);

  await database.runAsync(
    'UPDATE reminders SET due_date = ?, notification_id = ?, is_completed = 0, updated_at = ? WHERE id = ?',
    [nextDueDate, notificationId, now, id]
  );
}

export async function deleteReminder(id: string) {
  await initializeDatabase();

  const database = await getDatabase();
  const reminder = await getReminderById(id);

  await cancelReminderNotification(reminder?.notificationId ?? null);

  await database.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
}

const weekdayLabels: Record<ReminderWeekday, string> = {
  1: 'Mo',
  2: 'Di',
  3: 'Mi',
  4: 'Do',
  5: 'Fr',
  6: 'Sa',
  7: 'So',
};

export function getRepeatLabel(
  repeatType: ReminderRepeatType,
  customIntervalDays?: number | null,
  repeatWeekdays?: ReminderWeekday[] | null
) {
  if (repeatType === 'once') {
    return 'Einmalig';
  }

  if (repeatType === 'weekly') {
    return repeatWeekdays?.length
      ? `Wöchentlich · ${repeatWeekdays.map((weekday) => weekdayLabels[weekday]).join(', ')}`
      : 'Wöchentlich';
  }

  if (repeatType === 'monthly') {
    return 'Monatlich';
  }

  if (repeatType === 'custom_days') {
    return customIntervalDays ? `Alle ${customIntervalDays} Tage` : 'Alle X Tage';
  }

  return 'Täglich';
}
