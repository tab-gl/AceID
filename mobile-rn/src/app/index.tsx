import { Redirect } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';

/** Entry point: send the person to the right place for their session state. */
export default function Index() {
  const { status } = useAuth();
  if (status === 'loading') return null;
  return <Redirect href={status === 'signedIn' ? '/(tabs)' : '/sign-in'} />;
}
