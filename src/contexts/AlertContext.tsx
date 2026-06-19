import React, { createContext, useState, useCallback, use } from 'react';
import { AlertModal, AlertButton } from '@/components/ui/AlertModal';

export interface AlertOptions {
  title: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'error';
  buttons?: AlertButton[];
}

export interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertOptions>({
    title: '',
    message: '',
    variant: 'info',
    buttons: [],
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setConfig({
      title: options.title,
      message: options.message,
      variant: options.variant || 'info',
      buttons: options.buttons || [],
    });
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <AlertContext value={{ showAlert, hideAlert }}>
      {children}
      <AlertModal
        visible={visible}
        title={config.title}
        message={config.message}
        variant={config.variant}
        buttons={config.buttons}
        onClose={hideAlert}
      />
    </AlertContext>
  );
};

export const useAlert = (): AlertContextType => {
  const context = use(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
