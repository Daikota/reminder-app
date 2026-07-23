import { SymbolView } from 'expo-symbols';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ReminderCard } from '@/components/ReminderCard';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { deleteReminder, getDueReminders, markReminderCompleted } from '@/database/reminders';
import { useTheme } from '@/hooks/use-theme';
import type { Reminder } from '@/types/reminder';
import { getDueDateLabel, getTodayDateKey } from '@/utils/dueDate';

export default function TodayScreen() {
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
      const storedReminders = await getDueReminders(getTodayDateKey());
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

  const handleCompleteReminder = useCallback(
    async (id: string) => {
      if (!beginReminderAction(id)) {
        return;
      }

      try {
        await markReminderCompleted(id);
        await loadReminders();
      } catch (error) {
        console.warn(
          '[reminders] Erledigen der Erinnerung ist fehlgeschlagen.',
          error
        );
        Alert.alert(
          'Änderung fehlgeschlagen',
          'Die Erinnerung konnte nicht als erledigt markiert werden. Bitte versuche es erneut.'
        );
      } finally {
        finishReminderAction(id);
      }
    },
    [beginReminderAction, finishReminderAction, loadReminders]
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
    <ScreenScaffold
      footer={
        <PrimaryButton
          label="Neue Erinnerung"
          iconName={{ ios: 'plus', android: 'add', web: 'add' }}
          onPress={() => router.push('/create-reminder')}
        />
      }>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Heute
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/reminders')}
            style={({ pressed }) => [
              styles.secondaryLink,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <View style={styles.secondaryIcon}>
              <SymbolView
                name={{ ios: 'list.bullet', android: 'list', web: 'list' }}
                size={17}
                weight="regular"
                tintColor={theme.textSecondary}
              />
            </View>
            <View style={styles.secondaryCopy}>
              <ThemedText style={styles.secondaryTitle}>Erinnerungen</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Heute, später, überfällig
              </ThemedText>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={16}
              weight="bold"
              tintColor={theme.textSecondary}
            />
          </Pressable>
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
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={18}
                tintColor={theme.textSecondary}
              />
            </ThemedView>
            <ThemedText style={styles.emptyTitle}>Heute stehen keine Erinnerungen an.</ThemedText>
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
                onComplete={handleCompleteReminder}
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
    marginBottom: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 42,
    lineHeight: 46,
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
  secondaryLink: {
    minHeight: 62,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: Spacing.three,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  secondaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCopy: {
    flex: 1,
    gap: 1,
  },
  secondaryTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.72,
  },
});
