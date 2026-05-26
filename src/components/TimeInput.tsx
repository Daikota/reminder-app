import { TextField } from '@/components/TextField';

type TimeInputProps = {
  value: string;
  error?: string | null;
  onChangeText: (value: string) => void;
};

export function TimeInput({ value, error, onChangeText }: TimeInputProps) {
  return (
    <TextField
      label="Uhrzeit"
      placeholder="7, 1730 oder 17:30"
      keyboardType="number-pad"
      maxLength={5}
      value={value}
      error={error}
      onChangeText={onChangeText}
    />
  );
}
