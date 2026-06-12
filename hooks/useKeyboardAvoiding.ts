import { useKeyboardVisibility } from './useKeyboardVisibility';

export const useKeyboardAvoiding = (): boolean => {
  const isKeyboardVisible = useKeyboardVisibility();

  if (process.env.EXPO_OS === 'web') {
    return false;
  }
  if (process.env.EXPO_OS === 'ios') {
    return true;
  }
  return isKeyboardVisible;
};
