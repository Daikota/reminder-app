import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ReminderCard } from '@/components/ReminderCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { ScreenState } from '@/components/ScreenState';
import { Spacing } from '@/constants/theme';
import { deleteReminder, getAllReminders } from '@/database/reminders';
import type { Reminder } from '@/types/reminder';
import { getDueDateLabel } from '@/utils/dueDate';

export default function AllRemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pendingActionIds, setPendingActionIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const pendingActionIdsRef = useRef(new Set<string>());

  const beginReminderAction = useCallback((id: string) => {
    if (pendingActionIdsRef.current.has(id)) {
      return false;
    }

    const nextPendingActionIds = new Set(pendingActionIdsRef.current);
    nextPendingActionIds.add(id);
    pendingActionIdsRef.current = nextPendingActionIds;
    setPendingActionIds(nextPendingActionIds);
    return true;
  }, []);

  const finishReminderAction = useCallback((id: string) => {
    const nextPendingActionIds = new Set(pendingActionIdsRef.current);
    nextPendingActionIds.delete(id);
    pendingActionIdsRef.current = nextPendingActionIds;
    setPendingActionIds(nextPendingActionIds);
  }, []);

  const loadReminders = useCallback(async () => {
    try {
      setStatus('loading');
      const storedReminders = await getAllReminders();
      setReminders(storedReminders);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReminders();
    }, [loadReminders])
  );

  const handleDeleteReminder = useCallback(
    (id: string) => {
      if (!beginReminderAction(id)) {
        return;
      }

      let isDeleteConfirmed = false;

      Alert.alert(
        'Erinnerung löschen?',
        'Diese Erinnerung wird dauerhaft entfernt.',
        [
          {
            text: 'Abbrechen',
            style: 'cancel',
            onPress: () => finishReminderAction(id),
          },
          {
            text: 'Löschen',
            style: 'destructive',
            onPress: () => {
              isDeleteConfirmed = true;
              void deleteReminder(id)
                .then(loadReminders)
                .catch((error) => {
                  console.warn(
                    '[reminders] Löschen der Erinnerung ist fehlgeschlagen.',
                    error
                  );
                  Alert.alert(
                    'Löschen fehlgeschlagen',
                    'Die Erinnerung konnte nicht gelöscht werden. Bitte versuche es erneut.'
                  );
                })
                .finally(() => finishReminderAction(id));
            },
          },
        ],
        {
          cancelable: true,
          onDismiss: () => {
            if (!isDeleteConfirmed) {
              finishReminderAction(id);
            }
          },
        }
      );
    },
    [beginReminderAction, finishReminderAction, loadReminders]
  );

  const handleOpenReminder = useCallback((id: string) => {
    router.push({
      pathname: '/reminders/[id]',
      params: { id },
    });
  }, []);

  return (
    <ScreenScaffold>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Erinnerungen" onBack={() => router.back()} />

        {status === 'loading' ? (
          <ScreenState message="Erinnerungen werden geladen." loading />
        ) : null}

        {status === 'error' ? (
          <ScreenState
            message="Erinnerungen konnten nicht geladen werden."
            tone="error"
            iconName={{
              ios: 'exclamationmark',
              android: 'priority_high',
              web: 'priority_high',
            }}
          />
        ) : null}

        {status === 'ready' && reminders.length === 0 ? (
          <ScreenState message="Noch keine Erinnerungen erstellt." />
        ) : null}

        {status === 'ready' && reminders.length > 0 ? (
          <View style={styles.reminderList}>
            {reminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                dueDateLabel={getDueDateLabel(reminder.dueDate)}
                isActionPending={pendingActionIds.has(reminder.id)}
                onDelete={handleDeleteReminder}
                onOpen={handleOpenReminder}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  reminderList: {
    gap: Spacing.three,
  },
});
