import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  safe?: boolean;
  testID?: string;
};

export function ThemedView({ style, safe = false,  lightColor, darkColor, ...otherProps }: ThemedViewProps,) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  if (!safe) return (
  <View testID="themed-view" style={[{ backgroundColor }, style]} {...otherProps} />
  )

  const insets = useSafeAreaInsets()

  return (
    <View 
    testID="themed-view"
    style={[{
      backgroundColor,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      }, style]} 
       {...otherProps} />
  )
}
