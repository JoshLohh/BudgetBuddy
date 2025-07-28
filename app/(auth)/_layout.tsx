import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useUser } from '@/hooks/useUser';
import GuestOnly from '@/components/auth/GuestOnly';


export default function AuthLayout({ children }: { children?: React.ReactNode }) {

    const { user } = useUser()

    //console.log(user)
    const colorScheme = useColorScheme();
    
    return (
        <GuestOnly>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                    <Stack
                    screenOptions={{
                    headerShown: false,
                    animation: 'none',
                    }}>
                        {children}
                    </Stack>
                <StatusBar style="auto" />
            </ThemeProvider>
        </GuestOnly>
    )
}