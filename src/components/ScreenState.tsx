import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenStateProps = {
  message: string;
  loading?: boolean;
  tone?: 'default' | 'error';
  iconName?: SymbolViewProps['name'];
};

export function ScreenState({
  message,
  loading = false,
  tone = 'default',
  iconName = { ios: 'tray', android: 'inbox', web: 'inbox' },
}: ScreenStateProps) {
  const theme = useTheme();
  const foregroundColor = tone === 'error' ? theme.error : theme.textSecondary;

  return (
    <ThemedView
      type={tone === 'error' ? 'errorSurface' : 'surface'}
      style={[styles.container, { borderColor: tone === 'error' ? theme.error : theme.border }]}>
      <ThemedView type="backgroundElement" style={styles.icon}>
        {loading ? (
          <ActivityIndicator color={theme.accent} />
        ) : (
          <SymbolView name={iconName} size={19} weight="regular" tintColor={foregroundColor} />
        )}
      </ThemedView>
      <ThemedText style={styles.message} themeColor={tone === 'error' ? 'error' : 'text'}>
        {message}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: Radii.card,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: Radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: 700,
  },
});
