import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  actionLabel?: string;
  onAction?: () => void;
};

export function ScreenHeader({
  title,
  onBack,
  actionLabel,
  onAction,
}: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zurück"
          onPress={onBack}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            weight="bold"
            tintColor={theme.text}
          />
        </Pressable>
      ) : null}

      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>

      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Alle Erinnerungen anzeigen"
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <SymbolView
            name={{ ios: 'list.bullet', android: 'list', web: 'list' }}
            size={17}
            weight="regular"
            tintColor={theme.textSecondary}
          />
          <ThemedText type="smallBold" themeColor="textSecondary">
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    marginBottom: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoAndHalf,
  },
  title: {
    flex: 1,
    ...Typography.screenTitle,
  },
  iconButton: {
    width: 44,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radii.control,
    paddingHorizontal: Spacing.twoAndHalf,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.72,
  },
});
