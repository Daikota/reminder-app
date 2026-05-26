import { TextField } from '@/components/TextField';

type TimeInputProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function TimeInput({ value, onChangeText }: TimeInputProps) {
  return (
    <TextField
      label="Uhrzeit"
      placeholder="08:30"
      keyboardType="numbers-and-punctuation"
      maxLength={5}
      value={value}
      onChangeText={onChangeText}
    />
  );
}
