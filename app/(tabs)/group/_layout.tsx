import UserOnly from '@/components/auth/UserOnly';
import { Stack } from 'expo-router';
import { ReactNode } from 'react';


export default function GroupLayout({ children }: { children: ReactNode }) {
  return (
    <UserOnly>
        <Stack
        screenOptions={{
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            headerShown: false,
        }}
        >
        {children}
        </ Stack>
    </UserOnly>
  );
}
