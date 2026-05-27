import { SymbolView } from 'expo-symbols';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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
      Alert.alert('Erinnerung löschen?', 'Diese Erinnerung wird dauerhaft entfernt.', [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            void deleteReminder(id)
              .then(loadReminders)
              .catch(() => {
                setStatus('error');
              });
          },
        },
      ]);
    },
    [loadReminders]
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
