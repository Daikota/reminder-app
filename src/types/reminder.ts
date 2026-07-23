export type ReminderRepeatType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom_days';
export type ReminderWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Reminder = {
  id: string;
  title: string;
  description: string | null;
  time: string | null;
  repeatType: ReminderRepeatType;
  customIntervalDays: number | null;
  repeatWeekdays: ReminderWeekday[] | null;
  dueDate: string;
  notificationId: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateReminderInput = {
  title: string;
  description?: string | null;
  time: string;
  dueDate?: string;
  repeatType?: ReminderRepeatType;
  customIntervalDays?: number | null;
  repeatWeekdays?: ReminderWeekday[] | null;
};

export type UpdateReminderInput = {
  id: string;
  title: string;
  description?: string | null;
  time: string;
  dueDate?: string;
  repeatType: ReminderRepeatType;
  customIntervalDays?: number | null;
  repeatWeekdays?: ReminderWeekday[] | null;
};
