import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getRepeatLabel } from '@/database/reminders';
import { useTheme } from '@/hooks/use-theme';
import type { Reminder } from '@/types/reminder';

type ReminderCardProps = {
  reminder: Reminder;
  dueDateLabel?: string;
  onComplete?: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
};

function ReminderCardComponent({
  reminder,
  dueDateLabel = 'Fällig: Heute',
  onComplete,
  onDelete,
  onOpen,
}: ReminderCardProps) {
  const theme = useTheme();

  return (
    <ThemedView type="surface" style={[styles.card, { borderColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onOpen(reminder.id)}
        style={({ pressed }) => [
          styles.contentPressable,
          { opacity: reminder.isCompleted ? 0.68 : pressed ? 0.78 : 1 },
        ]}>
        <View style={styles.titleRow}>
          <ThemedText style={[styles.title, reminder.isCompleted && styles.completedTitle]}>
            {reminder.title}
          </ThemedText>
          {reminder.isCompleted ? (
            <ThemedView type="surfaceMuted" style={[styles.statusPill, { borderColor: theme.border }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Erledigt
              </ThemedText>
            </ThemedView>
          ) : null}
        </View>

        {reminder.description ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
            {reminder.description}
          </ThemedText>
        ) : null}

        <View style={styles.metaRow}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {dueDateLabel}
          </ThemedText>
          {reminder.time ? (
            <ThemedText type="smallBold" themeColor="textSecondary">
              {reminder.time}
            </ThemedText>
          ) : null}
          <ThemedText type="smallBold" themeColor="textSecondary">
            {getRepeatLabel(reminder.repeatType, reminder.customIntervalDays)}
          </ThemedText>
        </View>
      </Pressable>

      <View style={styles.actions}>
        {onComplete ? (
          <Pressable
            accessibilityRole="button"
            disabled={reminder.isCompleted}
            onPress={() => onComplete(reminder.id)}
            style={({ pressed }) => [
              styles.actionButton,
              { borderColor: theme.border },
              pressed && styles.pressed,
              reminder.isCompleted && styles.disabledAction,
            ]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {reminder.isCompleted ? 'Erledigt' : 'Erledigt markieren'}
            </ThemedText>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => onDelete(reminder.id)}
          style={({ pressed }) => [
            styles.actionButton,
            { borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Löschen
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

export const ReminderCard = memo(ReminderCardComponent);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  contentPressable: {
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: 700,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  description: {
    fontWeight: 500,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  actionButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    flex: 1,
  },
  pressed: {
    opacity: 0.72,
  },
  disabledAction: {
    opacity: 0.58,
  },
});
