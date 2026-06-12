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

/**
 * Validates a date string in DD-MM-YYYY format
 */
export const validateDateString = (
  value: string,
  options: { required?: boolean; label?: string; maxToday?: boolean } = {}
): string | null => {
  const { required = true, label = 'Date', maxToday = true } = options;
  const trimmed = value.trim();

  if (!trimmed) {
    return required ? `${label} is required` : null;
  }

  const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
  if (!dateRegex.test(trimmed)) {
    return `${label} must be in DD-MM-YYYY format`;
  }

  const dateParts = trimmed.split('-');
  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10);
  const year = parseInt(dateParts[2], 10);

  if (year < 1900) {
    return 'Year must be 1900 or later';
  }

  const currentYear = new Date().getFullYear();
  if (year > currentYear + 100) {
    return 'Please enter a valid year';
  }

  const dateObj = new Date(year, month - 1, day);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return 'Please enter a valid calendar date';
  }

  if (maxToday) {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (dateObj > todayDate) {
      return `${label} cannot be in the future`;
    }
  }

  return null;
};

/**
 * Converts API date (YYYY-MM-DD) to input format (DD-MM-YYYY)
 */
export const apiDateToInputDate = (apiDateStr: string | null | undefined): string => {
  if (!apiDateStr) return '';
  const parts = apiDateStr.split('-');
  if (parts.length !== 3) return apiDateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

/**
 * Converts input format (DD-MM-YYYY) to API date (YYYY-MM-DD)
 */
export const inputDateToApiDate = (inputDateStr: string): string => {
  const trimmed = inputDateStr.trim();
  if (!trimmed) return '';
  const parts = trimmed.split('-');
  if (parts.length !== 3) return trimmed;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};
