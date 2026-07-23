import { SymbolView } from 'expo-symbols';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing, Typography } from '@/constants/theme';
import { getRepeatLabel } from '@/database/reminders';
import { useTheme } from '@/hooks/use-theme';
import type { Reminder } from '@/types/reminder';

type ReminderCardProps = {
  reminder: Reminder;
  dueDateLabel?: string;
  isActionPending?: boolean;
  onComplete?: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
};

function ReminderCardComponent({
  reminder,
  dueDateLabel = 'Fällig: Heute',
  isActionPending = false,
  onComplete,
  onDelete,
  onOpen,
}: ReminderCardProps) {
  const theme = useTheme();
  const isOverdue = dueDateLabel.startsWith('Überfällig');

  return (
    <ThemedView
      type="surface"
      style={[styles.card, { borderColor: isOverdue ? theme.error : theme.border }]}>
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
          {reminder.time ? (
            <ThemedView
              type="backgroundSelected"
              style={[styles.timePill, { borderColor: theme.accent }]}>
              <SymbolView
                name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
                size={15}
                weight="bold"
                tintColor={theme.accent}
              />
              <ThemedText type="smallBold" style={styles.timeText}>
                {reminder.time}
              </ThemedText>
            </ThemedView>
          ) : null}
          <ThemedView
            type={isOverdue ? 'errorSurface' : 'surfaceMuted'}
            style={[
              styles.metaPill,
              { borderColor: isOverdue ? theme.error : theme.border },
            ]}>
            <ThemedText
              type="smallBold"
              themeColor={isOverdue ? 'error' : 'textSecondary'}>
              {dueDateLabel}
            </ThemedText>
          </ThemedView>
          <ThemedView type="surfaceMuted" style={[styles.metaPill, { borderColor: theme.border }]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {getRepeatLabel(
                reminder.repeatType,
                reminder.customIntervalDays,
                reminder.repeatWeekdays
              )}
            </ThemedText>
          </ThemedView>
        </View>
      </Pressable>

      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        {onComplete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Erinnerung erledigen"
            disabled={reminder.isCompleted || isActionPending}
            onPress={() => onComplete(reminder.id)}
            style={({ pressed }) => [
              styles.completeButton,
              { backgroundColor: theme.backgroundSelected, borderColor: theme.accent },
              pressed && styles.pressed,
              (reminder.isCompleted || isActionPending) && styles.disabledAction,
            ]}>
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={18}
              weight="bold"
              tintColor={theme.accent}
            />
            <ThemedText type="smallBold">
              Erledigen
            </ThemedText>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Erinnerung löschen"
          disabled={isActionPending}
          onPress={() => onDelete(reminder.id)}
          style={({ pressed }) => [
            styles.deleteButton,
            { backgroundColor: theme.errorSurface, borderColor: theme.error },
            pressed && styles.pressed,
            isActionPending && styles.disabledAction,
          ]}>
          <SymbolView
            name={{ ios: 'trash', android: 'delete', web: 'delete' }}
            size={18}
            weight="regular"
            tintColor={theme.error}
          />
        </Pressable>
      </View>
    </ThemedView>
  );
}

export const ReminderCard = memo(ReminderCardComponent);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radii.card,
    overflow: 'hidden',
  },
  contentPressable: {
    gap: Spacing.twoAndHalf,
    minHeight: 44,
    padding: Spacing.threeAndHalf,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
    ...Typography.cardTitle,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: Radii.pill,
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
  metaPill: {
    maxWidth: '100%',
    borderWidth: 1,
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timePill: {
    maxWidth: '100%',
    borderWidth: 1,
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 15,
    lineHeight: 20,
  },
  actions: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.threeAndHalf,
    paddingVertical: Spacing.twoAndHalf,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  completeButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radii.control,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  deleteButton: {
    width: 48,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  disabledAction: {
    opacity: 0.58,
  },
});
