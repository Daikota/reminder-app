import { SymbolView } from 'expo-symbols';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { DateInput } from '@/components/DateInput';
import { RepeatSelector } from '@/components/RepeatSelector';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { ScreenState } from '@/components/ScreenState';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { TimeInput } from '@/components/TimeInput';
import { WeekdaySelector } from '@/components/WeekdaySelector';
import { Radii, Spacing } from '@/constants/theme';
import { getReminderById, updateReminder } from '@/database/reminders';
import { useTheme } from '@/hooks/use-theme';
import type { Reminder, ReminderRepeatType, ReminderWeekday } from '@/types/reminder';
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

export default function EditReminderScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const reminderId = typeof params.id === 'string' ? params.id : null;
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isNoteVisible, setIsNoteVisible] = useState(false);
  const [dueDate, setDueDate] = useState(() => formatDateKeyForInput(getTodayDateKey()));
  const [time, setTime] = useState('');
  const [repeatType, setRepeatType] = useState<ReminderRepeatType>('daily');
  const [repeatWeekdays, setRepeatWeekdays] = useState<ReminderWeekday[]>([getTodayWeekday()]);
  const [customIntervalDays, setCustomIntervalDays] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  function clearError(errorKey: keyof FormErrors) {
    if (errors[errorKey]) {
      setErrors((currentErrors) => ({ ...currentErrors, [errorKey]: undefined }));
    }
  }

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
        setIsNoteVisible(Boolean(storedReminder.description));
        setDueDate(formatDateKeyForInput(storedReminder.dueDate));
        setTime(storedReminder.time ?? '');
        setRepeatType(storedReminder.repeatType);
        setRepeatWeekdays(storedReminder.repeatWeekdays ?? [getTodayWeekday()]);
        setCustomIntervalDays(storedReminder.customIntervalDays?.toString() ?? '');
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

    if (!reminder || !normalizedTitle) {
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
      reminder &&
      repeatType === 'once' &&
      dateValidation?.isValid &&
      timeValidation.isValid
    ) {
      const oneTimeScheduleChanged =
        reminder.repeatType !== 'once' ||
        dateValidation.value !== reminder.dueDate ||
        timeValidation.value !== reminder.time;

      if (oneTimeScheduleChanged) {
        const scheduleValidation = validateFutureOneTimeSchedule(
          dateValidation.value,
          timeValidation.value
        );

        if (!scheduleValidation.isValid) {
          nextErrors[scheduleValidation.field] = scheduleValidation.error;
        }
      }
    }

    if (
      Object.keys(nextErrors).length > 0 ||
      !reminder ||
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
      await updateReminder({
        id: reminder.id,
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
      console.warn('[reminders] Bearbeiten der Erinnerung ist fehlgeschlagen.', error);
      Alert.alert(
        'Speichern fehlgeschlagen',
        'Die Änderungen konnten nicht gespeichert werden. Bitte versuche es erneut.'
      );
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <ScreenScaffold
      footer={
        status === 'ready' ? (
          <PrimaryButton
            label={isSaving ? 'Speichert...' : 'Speichern'}
            iconName={{ ios: 'checkmark', android: 'check', web: 'check' }}
            disabled={isSaving}
            onPress={handleSave}
          />
        ) : null
      }>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Bearbeiten" onBack={() => router.back()} />

        {status === 'loading' ? (
          <ScreenState message="Erinnerung wird geladen." loading />
        ) : null}

        {status === 'missing' ? (
          <ScreenState
            message="Erinnerung wurde nicht gefunden."
            tone="error"
            iconName={{ ios: 'exclamationmark', android: 'priority_high', web: 'priority_high' }}
          />
        ) : null}

        {status === 'error' ? (
          <ScreenState
            message="Erinnerung konnte nicht geladen werden."
            tone="error"
            iconName={{ ios: 'exclamationmark', android: 'priority_high', web: 'priority_high' }}
          />
        ) : null}

        {status === 'ready' && reminder ? (
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
        ) : null}
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
