import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenScaffoldProps = {
  children: ReactNode;
  footer?: ReactNode;
};

export function ScreenScaffold({ children, footer }: ScreenScaffoldProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>{children}</View>
          {footer ? (
            <View
              style={[
                styles.footer,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}>
              {footer}
            </View>
          ) : null}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.threeAndHalf,
    paddingTop: Spacing.three,
  },
  footer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.threeAndHalf,
    paddingTop: Spacing.twoAndHalf,
    paddingBottom: Spacing.three,
    borderTopWidth: 1,
  },
});
