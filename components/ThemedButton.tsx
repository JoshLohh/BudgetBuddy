import React from 'react';
import { Pressable, StyleSheet, PressableProps } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Text } from 'react-native'; 

type ThemedButtonProps = PressableProps & {
  lightColor?: string;
  darkColor?: string;
  style?: any;
  children?: React.ReactNode;
};

export function ThemedButton({ style, lightColor, darkColor, children, ...otherprops }: ThemedButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        pressed && styles.pressed,
        style
      ]}
      {...otherprops}
    >
      {/* Always wrap children in a Text component if they are strings */}
      {typeof children === 'string' ? (
        <Text style={{ color: '#fff', textAlign: 'center' }}>{children}</Text>
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
    marginVertical: 10
  },
  pressed: {
    opacity: 0.6
  }
});
