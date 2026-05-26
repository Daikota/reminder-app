import * as SQLite from 'expo-sqlite';

import type { CreateReminderInput, Reminder, ReminderRepeatType } from '@/types/reminder';

const DATABASE_NAME = 'reminder-app.db';

type ReminderRow = {
  id: string;
  title: string;
  description: string | null;
  time: string | null;
  repeat_type: string;
  custom_interval_days: number | null;
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
  return value === 'daily' || value === 'weekly' || value === 'monthly' || value === 'custom_days';
}

function mapReminderRow(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    time: row.time,
    repeatType: isReminderRepeatType(row.repeat_type) ? row.repeat_type : 'daily',
    customIntervalDays: row.custom_interval_days,
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
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS reminders (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          time TEXT,
          repeat_type TEXT NOT NULL,
          custom_interval_days INTEGER,
          is_completed INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
    });
  }

  return initializationPromise;
}

export async function createReminder(input: CreateReminderInput) {
  await initializeDatabase();

  const database = await getDatabase();
  const now = new Date().toISOString();
  const title = input.title.trim();
  const description = input.description?.trim() ? input.description.trim() : null;
  const reminder: Reminder = {
    id: createReminderId(),
    title,
    description,
    time: input.time ?? null,
    repeatType: input.repeatType ?? 'daily',
    customIntervalDays: input.customIntervalDays ?? null,
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
      is_completed,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reminder.id,
      reminder.title,
      reminder.description,
      reminder.time,
      reminder.repeatType,
      reminder.customIntervalDays,
      reminder.isCompleted ? 1 : 0,
      reminder.createdAt,
      reminder.updatedAt,
    ]
  );

  return reminder;
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
      is_completed,
      created_at,
      updated_at
    FROM reminders
    ORDER BY created_at DESC`
  );

  return rows.map(mapReminderRow);
}

export function getRepeatLabel(repeatType: ReminderRepeatType) {
  if (repeatType === 'weekly') {
    return 'Wöchentlich';
  }

  if (repeatType === 'monthly') {
    return 'Monatlich';
  }

  if (repeatType === 'custom_days') {
    return 'Individuell';
  }

  return 'Täglich';
}
