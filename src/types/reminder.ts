export type ReminderRepeatType = 'daily' | 'weekly' | 'monthly' | 'custom_days';

export type Reminder = {
  id: string;
  title: string;
  description: string | null;
  time: string | null;
  repeatType: ReminderRepeatType;
  customIntervalDays: number | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateReminderInput = {
  title: string;
  description?: string | null;
  time?: string | null;
  repeatType?: ReminderRepeatType;
  customIntervalDays?: number | null;
};
