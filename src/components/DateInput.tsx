import { TextField } from '@/components/TextField';
import {
  formatDateKeyForInput,
  normalizeGermanDate,
} from '@/utils/reminderValidation';

type DateInputProps = {
  value: string;
  error?: string | null;
  onChangeText: (value: string) => void;
};

export function DateInput({ value, error, onChangeText }: DateInputProps) {
  function handleBlur() {
    const normalizedDate = normalizeGermanDate(value);

    if (typeof normalizedDate === 'string') {
      const formattedDate = formatDateKeyForInput(normalizedDate);

      if (formattedDate !== value) {
        onChangeText(formattedDate);
      }
    }
  }

  return (
    <TextField
      label="Datum *"
      placeholder="TT.MM.JJJJ · auch 23072026"
      keyboardType="number-pad"
      maxLength={10}
      value={value}
      error={error}
      onBlur={handleBlur}
      onChangeText={onChangeText}
    />
  );
}
