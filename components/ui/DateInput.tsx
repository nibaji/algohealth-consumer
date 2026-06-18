import React, { useCallback } from 'react';
import { TextInput, TextInputProps } from './TextInput';

interface DateInputProps extends Omit<TextInputProps, 'onChangeText' | 'keyboardType' | 'maxLength'> {
  value: string; // Expected to be in DD-MM-YYYY format
  onChangeText: (text: string) => void;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChangeText,
  ...props
}) => {
  const handleChangeText = useCallback((text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    
    // Check if user is deleting
    const isDeleting = text.length < value.length;
    
    if (isDeleting) {
      if (cleaned.length > 2 && cleaned.length <= 4) {
        formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
      } else if (cleaned.length > 4) {
        formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 8)}`;
      }
    } else {
      if (cleaned.length === 2) {
        formatted = `${cleaned}-`;
      } else if (cleaned.length > 2 && cleaned.length < 4) {
        formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
      } else if (cleaned.length === 4) {
        formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-`;
      } else if (cleaned.length > 4) {
        formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 8)}`;
      }
    }
    
    // Call parent onChangeText with formatted value
    onChangeText(formatted);
  }, [value, onChangeText]);

  return (
    <TextInput
      value={value}
      onChangeText={handleChangeText}
      maxLength={10}
      keyboardType="numeric"
      placeholder="DD-MM-YYYY"
      {...props}
    />
  );
};

export { validateDateString, apiDateToInputDate, inputDateToApiDate } from '@/src/utils/date';
