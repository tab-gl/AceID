import * as WebBrowser from 'expo-web-browser';
import { useCallback } from 'react';
import { useToast } from '@/components/Overlays';
import { webUrl } from './config';

/** Hosted pages for security controls the app does not implement natively. */
export const WEB = {
  security: '/account/security',
  devices: '/account/devices',
  danger: '/account/danger',
  privacy: '/privacy',
  terms: '/terms',
} as const;

/** Opens a hosted Ace ID page in the system browser. */
export function useOpenWeb() {
  const toast = useToast();
  return useCallback(
    (path: string) => {
      WebBrowser.openBrowserAsync(webUrl(path)).catch(() => toast.show('Could not open the Ace ID site.'));
    },
    [toast],
  );
}
