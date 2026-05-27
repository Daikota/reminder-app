import { SymbolView } from 'expo-symbols';
import { type ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PrimaryButtonProps = PressableProps & {
  label: string;
  iconName?: ComponentProps<typeof SymbolView>['name'];
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, iconName, style, disabled, ...props }: PrimaryButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.accent,
          opacity: disabled ? 0.54 : pressed ? 0.86 : 1,
        },
        style,
      ]}
      {...props}>
      <View style={styles.content}>
        {iconName ? (
          <SymbolView name={iconName} size={19} weight="bold" tintColor={theme.accentText} />
        ) : null}
        <ThemedText themeColor="accentText" style={styles.label}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 60,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  label: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: 700,
  },
});
