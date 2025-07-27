import React from 'react';
import { Pressable, StyleSheet, PressableProps, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type ThemedButtonProps = PressableProps & {
  lightColor?: string;
  darkColor?: string;
  style?: any;
  children?: React.ReactNode;
  testID?: string;
};

export function ThemedButton({
  style,
  lightColor,
  darkColor,
  children,
  testID,
  ...otherProps
}: ThemedButtonProps) {
  const theme = useColorScheme();

  const backgroundColor =
    theme === 'light' ? lightColor ?? Colors.primary : darkColor ?? Colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor },
        pressed && styles.pressed,
        style,
      ]}
      {...otherProps}
    >
      {typeof children === 'string' ? <Text>{children}</Text> : children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 18,
    borderRadius: 6,
    marginVertical: 10,
  },
  pressed: {
    opacity: 0.6,
  },
});
