import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { OptionPlaceholder } from '@/components/OptionPlaceholder';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { createReminder } from '@/database/reminders';

export default function CreateReminderScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setErrorMessage('Bitte gib einen Titel ein.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      await createReminder({
        title: normalizedTitle,
        description,
        time: null,
        repeatType: 'daily',
        customIntervalDays: null,
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
          <OptionPlaceholder label="Uhrzeit" value="Noch nicht ausgewählt" />
          <OptionPlaceholder label="Wiederholung" value="Keine Wiederholung" />
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
});
