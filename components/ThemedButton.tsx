import React from 'react';
import { Pressable, StyleSheet, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Text } from 'react-native';

type ThemedButtonProps = PressableProps & {
  lightColor?: string;
  darkColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  type?: 'secondary' | 'primary'; // Add more variants as needed
};

export function ThemedButton({
  style,
  lightColor,
  darkColor,
  children,
  type,
  ...otherprops
}: ThemedButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        type === 'secondary' && styles.secondary,
        pressed && styles.pressed,
        style,
      ]}
      {...otherprops}
    >
      {/* Always wrap children in a Text component if they are strings */}
      {typeof children === 'string' ? (
        <Text>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 6,
    marginVertical: 10,
  },
  secondary: {
    backgroundColor: '#eee', // Or any color for secondary
  },
  pressed: {
    opacity: 0.6,
  },
});
