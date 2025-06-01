import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useUser } from '@/hooks/useUser';

export default function AuthLayout() {

    const { user } = useUser()

    console.log(user)
    const colorScheme = useColorScheme();
    
    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack
                  screenOptions={{
                  headerShown: false,
                  animation: 'none',
      }}  />
              <StatusBar style="auto" />
        </ThemeProvider>
    )
}