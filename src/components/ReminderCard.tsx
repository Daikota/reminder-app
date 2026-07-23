import { SymbolView } from 'expo-symbols';
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
          <ThemedView type="surfaceMuted" style={[styles.metaPill, { borderColor: theme.border }]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {dueDateLabel}
            </ThemedText>
          </ThemedView>
          {reminder.time ? (
            <ThemedView type="surfaceMuted" style={[styles.metaPill, { borderColor: theme.border }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {reminder.time}
              </ThemedText>
            </ThemedView>
          ) : null}
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

      <View style={styles.actions}>
        {onComplete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Erinnerung erledigen"
            disabled={reminder.isCompleted || isActionPending}
            onPress={() => onComplete(reminder.id)}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              pressed && styles.pressed,
              (reminder.isCompleted || isActionPending) && styles.disabledAction,
            ]}>
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={18}
              weight="bold"
              tintColor={theme.textSecondary}
            />
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Erinnerung löschen"
          disabled={isActionPending}
          onPress={() => onDelete(reminder.id)}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            pressed && styles.pressed,
            isActionPending && styles.disabledAction,
          ]}>
          <SymbolView
            name={{ ios: 'trash', android: 'delete', web: 'delete' }}
            size={18}
            weight="regular"
            tintColor={theme.textSecondary}
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
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingRight: 78,
    gap: Spacing.three,
  },
  contentPressable: {
    gap: Spacing.two,
    minHeight: 44,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
    fontSize: 19,
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
  metaPill: {
    maxWidth: '100%',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actions: {
    position: 'absolute',
    right: Spacing.three,
    top: Spacing.three,
    gap: Spacing.two,
  },
  actionButton: {
    width: 44,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 22,
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
