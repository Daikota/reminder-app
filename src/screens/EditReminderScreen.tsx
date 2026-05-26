import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { OptionPlaceholder } from '@/components/OptionPlaceholder';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getReminderById, getRepeatLabel, updateReminder } from '@/database/reminders';
import type { Reminder } from '@/types/reminder';

export default function EditReminderScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const reminderId = typeof params.id === 'string' ? params.id : null;
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReminder() {
      if (!reminderId) {
        setStatus('missing');
        return;
      }

      try {
        setStatus('loading');
        const storedReminder = await getReminderById(reminderId);

        if (!isMounted) {
          return;
        }

        if (!storedReminder) {
          setStatus('missing');
          return;
        }

        setReminder(storedReminder);
        setTitle(storedReminder.title);
        setDescription(storedReminder.description ?? '');
        setStatus('ready');
      } catch {
        if (isMounted) {
          setStatus('error');
        }
      }
    }

    void loadReminder();

    return () => {
      isMounted = false;
    };
  }, [reminderId]);

  async function handleSave() {
    const normalizedTitle = title.trim();

    if (!reminder || !normalizedTitle) {
      setErrorMessage('Bitte gib einen Titel ein.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      await updateReminder({
        id: reminder.id,
        title: normalizedTitle,
        description,
      });
      router.replace('/');
    } catch {
      setErrorMessage('Speichern ist fehlgeschlagen.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScreenScaffold
      footer={
        status === 'ready' ? (
          <PrimaryButton
            label={isSaving ? 'Speichert...' : 'Speichern'}
            disabled={isSaving}
            onPress={handleSave}
          />
        ) : null
      }>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Erinnerung bearbeiten
          </ThemedText>
        </View>

        {status === 'loading' ? (
          <ThemedText style={styles.statusText}>Erinnerung wird geladen.</ThemedText>
        ) : null}

        {status === 'missing' ? (
          <ThemedText style={styles.statusText}>Erinnerung wurde nicht gefunden.</ThemedText>
        ) : null}

        {status === 'error' ? (
          <ThemedText style={styles.statusText}>Erinnerung konnte nicht geladen werden.</ThemedText>
        ) : null}

        {status === 'ready' && reminder ? (
          <View style={styles.form}>
            <TextField
              label="Titel"
              placeholder="Titel"
              returnKeyType="next"
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                if (errorMessage) {
                  setErrorMessage(null);
                }
              }}
            />
            <TextField
              label="Beschreibung"
              placeholder="Beschreibung"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              style={styles.descriptionInput}
            />
            <OptionPlaceholder label="Uhrzeit" value={reminder.time ?? 'Noch nicht ausgewählt'} />
            <OptionPlaceholder label="Wiederholung" value={getRepeatLabel(reminder.repeatType)} />
            {errorMessage ? (
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.errorText}>
                {errorMessage}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  header: {
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  form: {
    gap: Spacing.three,
  },
  descriptionInput: {
    minHeight: 96,
  },
  errorText: {
    paddingHorizontal: Spacing.one,
  },
  statusText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: 700,
  },
});
