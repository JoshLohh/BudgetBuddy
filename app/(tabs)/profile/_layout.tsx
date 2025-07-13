import UserOnly from '@/components/auth/UserOnly';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <UserOnly>
        <Stack
        screenOptions={{
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            headerShown: false,
        }}
        />
    </UserOnly>
  );
}
