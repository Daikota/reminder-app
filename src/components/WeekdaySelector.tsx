import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ReminderWeekday } from '@/types/reminder';

type WeekdaySelectorProps = {
  value: ReminderWeekday[];
  error?: string | null;
  onChange: (value: ReminderWeekday[]) => void;
};

const weekdays: { label: string; value: ReminderWeekday }[] = [
  { label: 'Mo', value: 1 },
  { label: 'Di', value: 2 },
  { label: 'Mi', value: 3 },
  { label: 'Do', value: 4 },
  { label: 'Fr', value: 5 },
  { label: 'Sa', value: 6 },
  { label: 'So', value: 7 },
];

export function WeekdaySelector({ value, error, onChange }: WeekdaySelectorProps) {
  const theme = useTheme();

  function toggleWeekday(weekday: ReminderWeekday) {
    if (value.includes(weekday)) {
      onChange(value.filter((selectedWeekday) => selectedWeekday !== weekday));
      return;
    }

    onChange([...value, weekday].sort((first, second) => first - second));
  }

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.container, { borderColor: error ? theme.error : theme.border }]}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Wochentage
      </ThemedText>
      <View style={styles.options}>
        {weekdays.map((weekday) => {
          const isSelected = value.includes(weekday.value);

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={weekday.value}
              onPress={() => toggleWeekday(weekday.value)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: isSelected ? theme.accent : theme.surfaceMuted,
                  borderColor: isSelected ? theme.accent : theme.border,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}>
              <ThemedText
                type="smallBold"
                themeColor={isSelected ? 'accentText' : 'textSecondary'}>
                {weekday.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <ThemedText type="smallBold" themeColor="error" style={styles.errorText}>
          {error}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: Radii.field,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  option: {
    width: 44,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    lineHeight: 18,
  },
});
