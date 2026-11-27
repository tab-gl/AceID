import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toaster, toast as beuiToast } from '@/components/toast';
import { haptic } from './haptics';

type Tone = 'neutral' | 'success' | 'danger';

interface ToastValue {
  show: (message: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

/** Mounts beUI's animated Toaster and exposes Ace ID's useToast() API. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, tone: Tone = 'neutral') => {
    if (tone === 'success') {
      haptic.success();
      beuiToast.success(message, { duration: 3000 });
      return;
    }
    if (tone === 'danger') {
      haptic.warning();
      beuiToast.error(message, { duration: 3500 });
      return;
    }
    beuiToast(message, { status: 'neutral', duration: 3000 });
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster position="bottom" bottomInset={insets.bottom + 84} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}
