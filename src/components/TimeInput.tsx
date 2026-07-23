import { TextField } from '@/components/TextField';
import { normalizeOptionalTime } from '@/utils/reminderValidation';

type TimeInputProps = {
  value: string;
  error?: string | null;
  onChangeText: (value: string) => void;
};

export function TimeInput({ value, error, onChangeText }: TimeInputProps) {
  function handleBlur() {
    const normalizedTime = normalizeOptionalTime(value);

    if (typeof normalizedTime === 'string' && normalizedTime !== value) {
      onChangeText(normalizedTime);
    }
  }

  return (
    <TextField
      label="Uhrzeit *"
      placeholder="HH:mm · auch 17 oder 1730"
      keyboardType="number-pad"
      maxLength={5}
      value={value}
      error={error}
      onBlur={handleBlur}
      onChangeText={onChangeText}
    />
  );
}
