import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { DateInput } from '@/components/DateInput';
import { RepeatSelector } from '@/components/RepeatSelector';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { TimeInput } from '@/components/TimeInput';
import { WeekdaySelector } from '@/components/WeekdaySelector';
import { Radii, Spacing } from '@/constants/theme';
import { createReminder } from '@/database/reminders';
import { useTheme } from '@/hooks/use-theme';
import type { ReminderRepeatType, ReminderWeekday } from '@/types/reminder';
import { getTodayDateKey, getTodayWeekday } from '@/utils/dueDate';
import {
  formatDateKeyForInput,
  normalizeRepeatWeekdays,
  parseCustomIntervalDays,
  validateFutureOneTimeSchedule,
  validateRequiredDate,
  validateRequiredTime,
} from '@/utils/reminderValidation';

type FormErrors = {
  title?: string;
  dueDate?: string;
  time?: string;
  customIntervalDays?: string;
  repeatWeekdays?: string;
};

export default function CreateReminderScreen() {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isNoteVisible, setIsNoteVisible] = useState(false);
  const [dueDate, setDueDate] = useState(() => formatDateKeyForInput(getTodayDateKey()));
  const [time, setTime] = useState('');
  const [repeatType, setRepeatType] = useState<ReminderRepeatType>('once');
  const [repeatWeekdays, setRepeatWeekdays] = useState<ReminderWeekday[]>([getTodayWeekday()]);
  const [customIntervalDays, setCustomIntervalDays] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  function clearError(errorKey: keyof FormErrors) {
    if (errors[errorKey]) {
      setErrors((currentErrors) => ({ ...currentErrors, [errorKey]: undefined }));
    }
  }

  async function handleSave() {
    if (isSavingRef.current) {
      return;
    }

    const normalizedTitle = title.trim();
    const timeValidation = validateRequiredTime(time);
    const dateValidation =
      repeatType === 'once' ? validateRequiredDate(dueDate) : null;
    const parsedCustomIntervalDays = parseCustomIntervalDays(customIntervalDays, repeatType);
    const normalizedWeekdays = normalizeRepeatWeekdays(repeatType, repeatWeekdays);
    const nextErrors: FormErrors = {};

    if (!normalizedTitle) {
      nextErrors.title = 'Titel fehlt.';
    }

    if (!timeValidation.isValid) {
      nextErrors.time = timeValidation.error;
    }

    if (dateValidation && !dateValidation.isValid) {
      nextErrors.dueDate = dateValidation.error;
    }

    if (parsedCustomIntervalDays === undefined) {
      nextErrors.customIntervalDays = 'Mindestens 1 Tag.';
    }

    if (normalizedWeekdays === undefined) {
      nextErrors.repeatWeekdays = 'Bitte mindestens einen Tag wählen.';
    }

    if (
      repeatType === 'once' &&
      dateValidation?.isValid &&
      timeValidation.isValid
    ) {
      const scheduleValidation = validateFutureOneTimeSchedule(
        dateValidation.value,
        timeValidation.value
      );

      if (!scheduleValidation.isValid) {
        nextErrors[scheduleValidation.field] = scheduleValidation.error;
      }
    }

    if (
      Object.keys(nextErrors).length > 0 ||
      !timeValidation.isValid ||
      (repeatType === 'once' && !dateValidation?.isValid)
    ) {
      setErrors(nextErrors);
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setErrors({});

    try {
      await createReminder({
        title: normalizedTitle,
        description,
        time: timeValidation.value,
        dueDate: dateValidation?.isValid ? dateValidation.value : undefined,
        repeatType,
        customIntervalDays: parsedCustomIntervalDays,
        repeatWeekdays: normalizedWeekdays,
      });
      router.replace('/reminders');
    } catch (error) {
      console.warn('[reminders] Erstellen der Erinnerung ist fehlgeschlagen.', error);
      Alert.alert(
        'Speichern fehlgeschlagen',
        'Die Erinnerung konnte nicht gespeichert werden. Bitte versuche es erneut.'
      );
    } finally {
      isSavingRef.current = false;
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
        <ScreenHeader title="Neue Erinnerung" onBack={() => router.back()} />

        <View style={styles.form}>
          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              Details
            </ThemedText>
            <View style={styles.fields}>
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
                  <SymbolView
                    name={{ ios: 'plus', android: 'add', web: 'add' }}
                    size={17}
                    weight="bold"
                    tintColor={theme.textSecondary}
                  />
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    Notiz hinzufügen
                  </ThemedText>
                </Pressable>
              )}

              {repeatType === 'once' ? (
                <DateInput
                  value={dueDate}
                  error={errors.dueDate}
                  onChangeText={(value) => {
                    setDueDate(value);
                    clearError('dueDate');
                  }}
                />
              ) : null}

              <TimeInput
                value={time}
                error={errors.time}
                onChangeText={(value) => {
                  setTime(value);
                  clearError('time');
                }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              Rhythmus
            </ThemedText>
            <View style={styles.fields}>
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
                    dueDate: undefined,
                    customIntervalDays: undefined,
                    repeatWeekdays: undefined,
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
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  form: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.twoAndHalf,
  },
  fields: {
    gap: Spacing.twoAndHalf,
  },
  sectionLabel: {
    paddingHorizontal: Spacing.one,
  },
  descriptionInput: {
    minHeight: 82,
  },
  noteButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radii.control,
    alignSelf: 'flex-start',
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
