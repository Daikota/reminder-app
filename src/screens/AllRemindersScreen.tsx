import { SymbolView } from 'expo-symbols';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ReminderCard } from '@/components/ReminderCard';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { deleteReminder, getAllReminders } from '@/database/reminders';
import { useTheme } from '@/hooks/use-theme';
import type { Reminder } from '@/types/reminder';
import { getDueDateLabel } from '@/utils/dueDate';

export default function AllRemindersScreen() {
  const theme = useTheme();
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
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Erinnerungen
          </ThemedText>
        </View>

        {status === 'loading' ? (
          <ThemedView type="surface" style={[styles.emptyCard, { borderColor: theme.border }]}>
            <ThemedView type="backgroundElement" style={styles.emptyIcon}>
              <SymbolView
                name={{ ios: 'hourglass', android: 'hourglass_empty', web: 'hourglass_empty' }}
                size={18}
                tintColor={theme.textSecondary}
              />
            </ThemedView>
            <ThemedText style={styles.emptyTitle}>Erinnerungen werden geladen.</ThemedText>
          </ThemedView>
        ) : null}

        {status === 'error' ? (
          <ThemedView type="surface" style={[styles.emptyCard, { borderColor: theme.border }]}>
            <ThemedView type="backgroundElement" style={styles.emptyIcon}>
              <SymbolView
                name={{ ios: 'exclamationmark', android: 'priority_high', web: 'priority_high' }}
                size={18}
                tintColor={theme.textSecondary}
              />
            </ThemedView>
            <ThemedText style={styles.emptyTitle}>Erinnerungen konnten nicht geladen werden.</ThemedText>
          </ThemedView>
        ) : null}

        {status === 'ready' && reminders.length === 0 ? (
          <ThemedView type="surface" style={[styles.emptyCard, { borderColor: theme.border }]}>
            <ThemedView type="backgroundElement" style={styles.emptyIcon}>
              <SymbolView
                name={{ ios: 'tray', android: 'inbox', web: 'inbox' }}
                size={18}
                tintColor={theme.textSecondary}
              />
            </ThemedView>
            <ThemedText style={styles.emptyTitle}>Noch keine Erinnerungen erstellt.</ThemedText>
          </ThemedView>
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
    paddingBottom: Spacing.six,
  },
  header: {
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: 700,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 32,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.three,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: 700,
  },
  reminderList: {
    gap: Spacing.three,
  },
});
