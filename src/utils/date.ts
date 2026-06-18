/**
 * date.ts
 *
 * Centralized pure functions for date formatting, conversion, and validation.
 * Complies with strict dd-mm-yyyy formatting rules in engineering standards.
 */

/**
 * Formats a Date object, string, or number to DD-MM-YYYY format
 */
export const formatDateToDDMMYYYY = (date: Date | string | number): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Formats an epoch timestamp (milliseconds) to DD-MM-YYYY format
 */
export const formatEpochToDDMMYYYY = (epochMillis: number): string => {
  return formatDateToDDMMYYYY(epochMillis);
};

/**
 * Checks if a string is a valid Date (e.g. valid calendar date)
 */
export const isValidDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (year < 1900 || year > new Date().getFullYear() + 100) return false;

  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
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
