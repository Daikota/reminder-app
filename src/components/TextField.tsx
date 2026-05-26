import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
};

export function TextField({ label, style, placeholderTextColor, ...props }: TextFieldProps) {
  const theme = useTheme();

  return (
    <ThemedView type="surfaceMuted" style={[styles.container, { borderColor: theme.border }]}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        placeholderTextColor={placeholderTextColor ?? theme.placeholder}
        selectionColor={theme.accent}
        style={[styles.input, { color: theme.text }, style]}
        {...props}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
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
});
