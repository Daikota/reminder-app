import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import {
  getAllReminders,
  initializeDatabase,
  updateReminderNotificationId,
} from '@/database/reminders';
import { reconcileReminderNotifications } from '@/services/notificationService';

const notificationReconciliationStore = {
  getReminders: getAllReminders,
  updateNotificationId: updateReminderNotificationId,
};

function reconcileNotifications() {
  return reconcileReminderNotifications(notificationReconciliationStore).catch(
    (error) => {
      console.warn(
        '[notifications] Abgleich geplanter Erinnerungen ist fehlgeschlagen.',
        error
      );
    }
  );
}

const navigationThemes = {
  light: {
    ...DefaultTheme,
    dark: false,
    colors: {
      ...DefaultTheme.colors,
      primary: Colors.light.accent,
      background: Colors.light.background,
      card: Colors.light.background,
      text: Colors.light.text,
      border: Colors.light.border,
      notification: Colors.light.accent,
    },
  },
  dark: {
    ...DarkTheme,
    dark: true,
    colors: {
      ...DarkTheme.colors,
      primary: Colors.dark.accent,
      background: Colors.dark.background,
      card: Colors.dark.background,
      text: Colors.dark.text,
      border: Colors.dark.border,
      notification: Colors.dark.accent,
    },
  },
} as const;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const [databaseStatus, setDatabaseStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;
    let isDatabaseReady = false;
    let currentAppState: AppStateStatus = AppState.currentState;

    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        const hasReturnedToForeground =
          (currentAppState === 'background' ||
            currentAppState === 'inactive') &&
          nextAppState === 'active';

        currentAppState = nextAppState;

        if (isDatabaseReady && hasReturnedToForeground) {
          void reconcileNotifications();
        }
      }
    );

    initializeDatabase()
      .then(() => {
        if (!isMounted) {
          return;
        }

        isDatabaseReady = true;
        setDatabaseStatus('ready');
        void reconcileNotifications();
      })
      .catch(() => {
        if (isMounted) {
          setDatabaseStatus('error');
        }
      });

    return () => {
      isMounted = false;
      appStateSubscription.remove();
    };
  }, []);

  return (
    <ThemeProvider value={navigationThemes[scheme]}>
      <AnimatedSplashOverlay />
      {databaseStatus === 'ready' ? (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors[scheme].background },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="create-reminder" />
          <Stack.Screen name="reminders/index" />
          <Stack.Screen name="reminders/[id]" />
        </Stack>
      ) : (
        <ThemedView style={styles.statusContainer}>
          <SafeAreaView style={styles.statusSafeArea}>
            <ThemedText type="smallBold">
              {databaseStatus === 'error'
                ? 'Erinnerungen konnten nicht geladen werden.'
                : 'Erinnerungen werden vorbereitet.'}
            </ThemedText>
          </SafeAreaView>
        </ThemedView>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  statusContainer: {
    flex: 1,
  },
  statusSafeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
