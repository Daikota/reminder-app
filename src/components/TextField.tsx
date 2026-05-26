import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
};

export function TextField({ label, error, style, placeholderTextColor, ...props }: TextFieldProps) {
  const theme = useTheme();

  return (
    <ThemedView
      type="surfaceMuted"
      style={[styles.container, { borderColor: error ? theme.accent : theme.border }]}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        placeholderTextColor={placeholderTextColor ?? theme.placeholder}
        selectionColor={theme.accent}
        style={[styles.input, { color: theme.text }, style]}
        {...props}
      />
      {error ? (
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.errorText}>
          {error}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  input: {
    minHeight: 32,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: 500,
    padding: 0,
    textAlignVertical: 'top',
  },
  errorText: {
    lineHeight: 18,
  },
});
