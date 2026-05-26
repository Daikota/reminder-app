import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type OptionPlaceholderProps = {
  label: string;
  value: string;
};

export function OptionPlaceholder({ label, value }: OptionPlaceholderProps) {
  const theme = useTheme();

  return (
    <ThemedView type="surfaceMuted" style={[styles.container, { borderColor: theme.border }]}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    justifyContent: 'center',
    gap: Spacing.one,
  },
  value: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: 600,
  },
});
