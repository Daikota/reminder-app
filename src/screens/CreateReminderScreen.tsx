import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { RepeatSelector } from '@/components/RepeatSelector';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { TimeInput } from '@/components/TimeInput';
import { Spacing } from '@/constants/theme';
import { createReminder } from '@/database/reminders';
import type { ReminderRepeatType } from '@/types/reminder';
import { normalizeOptionalTime, parseCustomIntervalDays } from '@/utils/reminderValidation';

export default function CreateReminderScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [repeatType, setRepeatType] = useState<ReminderRepeatType>('daily');
  const [customIntervalDays, setCustomIntervalDays] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setErrorMessage('Bitte gib einen Titel ein.');
      return;
    }

    const normalizedTime = normalizeOptionalTime(time);

    if (normalizedTime === undefined) {
      setErrorMessage('Uhrzeit bitte als HH:mm eingeben.');
      return;
    }

    const parsedCustomIntervalDays = parseCustomIntervalDays(customIntervalDays, repeatType);

    if (parsedCustomIntervalDays === undefined) {
      setErrorMessage('Intervall muss mindestens 1 Tag sein.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      await createReminder({
        title: normalizedTitle,
        description,
        time: normalizedTime,
        repeatType,
        customIntervalDays: parsedCustomIntervalDays,
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
      footer={<PrimaryButton label={isSaving ? 'Speichert...' : 'Speichern'} disabled={isSaving} onPress={handleSave} />}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Neue Erinnerung
          </ThemedText>
        </View>

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
          <TimeInput
            value={time}
            onChangeText={(value) => {
              setTime(value);
              if (errorMessage) {
                setErrorMessage(null);
              }
            }}
          />
          <RepeatSelector
            value={repeatType}
            onChange={(value) => {
              setRepeatType(value);
              if (value !== 'custom_days') {
                setCustomIntervalDays('');
              }
              if (errorMessage) {
                setErrorMessage(null);
              }
            }}
          />
          {repeatType === 'custom_days' ? (
            <TextField
              label="Tage"
              placeholder="7"
              keyboardType="number-pad"
              value={customIntervalDays}
              onChangeText={(value) => {
                setCustomIntervalDays(value);
                if (errorMessage) {
                  setErrorMessage(null);
                }
              }}
            />
          ) : null}
          {errorMessage ? (
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.errorText}>
              {errorMessage}
            </ThemedText>
          ) : null}
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  header: {
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
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
});
