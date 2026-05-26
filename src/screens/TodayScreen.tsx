import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getReminders, getRepeatLabel } from '@/database/reminders';
import { useTheme } from '@/hooks/use-theme';
import type { Reminder } from '@/types/reminder';

export default function TodayScreen() {
  const theme = useTheme();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const loadReminders = useCallback(async () => {
    try {
      setStatus('loading');
      const storedReminders = await getReminders();
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

  return (
    <ScreenScaffold
      footer={<PrimaryButton label="Neue Erinnerung" onPress={() => router.push('/create-reminder')} />}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Heute
          </ThemedText>
        </View>

        {status === 'loading' ? (
          <ThemedView type="surface" style={[styles.emptyCard, { borderColor: theme.border }]}>
            <ThemedText style={styles.emptyTitle}>Erinnerungen werden geladen.</ThemedText>
          </ThemedView>
        ) : null}

        {status === 'error' ? (
          <ThemedView type="surface" style={[styles.emptyCard, { borderColor: theme.border }]}>
            <ThemedText style={styles.emptyTitle}>Erinnerungen konnten nicht geladen werden.</ThemedText>
          </ThemedView>
        ) : null}

        {status === 'ready' && reminders.length === 0 ? (
          <ThemedView type="surface" style={[styles.emptyCard, { borderColor: theme.border }]}>
            <ThemedText style={styles.emptyTitle}>Heute stehen keine Erinnerungen an.</ThemedText>
          </ThemedView>
        ) : null}

        {status === 'ready' && reminders.length > 0 ? (
          <View style={styles.reminderList}>
            {reminders.map((reminder) => (
              <ThemedView
                key={reminder.id}
                type="surface"
                style={[styles.reminderCard, { borderColor: theme.border }]}>
                <ThemedText style={styles.reminderTitle}>{reminder.title}</ThemedText>
                {reminder.description ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.reminderDescription}>
                    {reminder.description}
                  </ThemedText>
                ) : null}
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {getRepeatLabel(reminder.repeatType)}
                </ThemedText>
              </ThemedView>
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
  header: {
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: 700,
  },
  reminderList: {
    gap: Spacing.three,
  },
  reminderCard: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  reminderTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: 700,
  },
  reminderDescription: {
    fontWeight: 500,
  },
});
