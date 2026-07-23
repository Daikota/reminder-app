import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { RepeatSelector } from '@/components/RepeatSelector';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { TimeInput } from '@/components/TimeInput';
import { WeekdaySelector } from '@/components/WeekdaySelector';
import { Spacing } from '@/constants/theme';
import { createReminder } from '@/database/reminders';
import { useTheme } from '@/hooks/use-theme';
import type { ReminderRepeatType, ReminderWeekday } from '@/types/reminder';
import { getTodayWeekday } from '@/utils/dueDate';
import {
  normalizeRepeatWeekdays,
  parseCustomIntervalDays,
  validateRequiredTime,
} from '@/utils/reminderValidation';

type FormErrors = {
  title?: string;
  time?: string;
  customIntervalDays?: string;
  repeatWeekdays?: string;
  form?: string;
};

export default function CreateReminderScreen() {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isNoteVisible, setIsNoteVisible] = useState(false);
  const [time, setTime] = useState('');
  const [repeatType, setRepeatType] = useState<ReminderRepeatType>('daily');
  const [repeatWeekdays, setRepeatWeekdays] = useState<ReminderWeekday[]>([getTodayWeekday()]);
  const [customIntervalDays, setCustomIntervalDays] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  function clearError(errorKey: keyof FormErrors) {
    if (errors[errorKey]) {
      setErrors((currentErrors) => ({ ...currentErrors, [errorKey]: undefined, form: undefined }));
    }
  }

  async function handleSave() {
    const normalizedTitle = title.trim();
    const timeValidation = validateRequiredTime(time);
    const parsedCustomIntervalDays = parseCustomIntervalDays(customIntervalDays, repeatType);
    const normalizedWeekdays = normalizeRepeatWeekdays(repeatType, repeatWeekdays);
    const nextErrors: FormErrors = {};

    if (!normalizedTitle) {
      nextErrors.title = 'Titel fehlt.';
    }

    if (!timeValidation.isValid) {
      nextErrors.time = timeValidation.error;
    }

    if (parsedCustomIntervalDays === undefined) {
      nextErrors.customIntervalDays = 'Mindestens 1 Tag.';
    }

    if (normalizedWeekdays === undefined) {
      nextErrors.repeatWeekdays = 'Bitte mindestens einen Tag wählen.';
    }

    if (Object.keys(nextErrors).length > 0 || !timeValidation.isValid) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});
      await createReminder({
        title: normalizedTitle,
        description,
        time: timeValidation.value,
        repeatType,
        customIntervalDays: parsedCustomIntervalDays,
        repeatWeekdays: normalizedWeekdays,
      });
      router.replace('/reminders');
    } catch {
      setErrors({ form: 'Speichern ist fehlgeschlagen.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScreenScaffold
      footer={
        <PrimaryButton
          label={isSaving ? 'Speichert...' : 'Speichern'}
          iconName={{ ios: 'checkmark', android: 'check', web: 'check' }}
          disabled={isSaving}
          onPress={handleSave}
        />
      }>
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
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            Details
          </ThemedText>
          <TextField
            label="Titel"
            placeholder="z. B. Wasser trinken"
            returnKeyType="next"
            value={title}
            error={errors.title}
            onChangeText={(value) => {
              setTitle(value);
              clearError('title');
            }}
          />

          {isNoteVisible ? (
            <TextField
              label="Notiz"
              placeholder="Optionaler Hinweis"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
              style={styles.descriptionInput}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsNoteVisible(true)}
              style={({ pressed }) => [
                styles.noteButton,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Notiz hinzufügen
              </ThemedText>
            </Pressable>
          )}

          <TimeInput
            value={time}
            error={errors.time}
            onChangeText={(value) => {
              setTime(value);
              clearError('time');
            }}
          />
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            Rhythmus
          </ThemedText>
          <RepeatSelector
            value={repeatType}
            onChange={(value) => {
              setRepeatType(value);
              if (value === 'weekly' && repeatWeekdays.length === 0) {
                setRepeatWeekdays([getTodayWeekday()]);
              }
              if (value !== 'custom_days') {
                setCustomIntervalDays('');
              }
              setErrors((currentErrors) => ({
                ...currentErrors,
                customIntervalDays: undefined,
                repeatWeekdays: undefined,
                form: undefined,
              }));
            }}
          />
          {repeatType === 'weekly' ? (
            <WeekdaySelector
              value={repeatWeekdays}
              error={errors.repeatWeekdays}
              onChange={(value) => {
                setRepeatWeekdays(value);
                clearError('repeatWeekdays');
              }}
            />
          ) : null}
          {repeatType === 'custom_days' ? (
            <TextField
              label="Intervall"
              placeholder="z. B. 7"
              keyboardType="number-pad"
              value={customIntervalDays}
              error={errors.customIntervalDays}
              onChangeText={(value) => {
                setCustomIntervalDays(value);
                clearError('customIntervalDays');
              }}
            />
          ) : null}
          {errors.form ? (
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.formError}>
              {errors.form}
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
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: 700,
  },
  form: {
    gap: 10,
  },
  sectionLabel: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  descriptionInput: {
    minHeight: 82,
  },
  noteButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 999,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  formError: {
    paddingHorizontal: Spacing.one,
  },
});
