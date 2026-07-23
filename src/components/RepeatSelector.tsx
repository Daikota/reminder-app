import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ReminderRepeatType } from '@/types/reminder';

type RepeatSelectorProps = {
  value: ReminderRepeatType;
  onChange: (value: ReminderRepeatType) => void;
};

const repeatOptions: { label: string; value: ReminderRepeatType }[] = [
  { label: 'Einmalig', value: 'once' },
  { label: 'Täglich', value: 'daily' },
  { label: 'Wöchentlich', value: 'weekly' },
  { label: 'Monatlich', value: 'monthly' },
  { label: 'Alle X Tage', value: 'custom_days' },
];

export function RepeatSelector({ value, onChange }: RepeatSelectorProps) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={[styles.container, { borderColor: theme.border }]}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Wiederholung
      </ThemedText>
      <View style={styles.options}>
        {repeatOptions.map((option) => {
          const isSelected = option.value === value;

          return (
            <Pressable
              accessibilityRole="button"
              key={option.value}
              onPress={() => onChange(option.value)}
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
                themeColor={isSelected ? 'accentText' : 'textSecondary'}
                style={styles.optionLabel}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
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
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 44,
    minWidth: 112,
    borderWidth: 1,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  optionLabel: {
    lineHeight: 18,
    textAlign: 'center',
  },
});
