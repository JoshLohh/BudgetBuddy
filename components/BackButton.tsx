import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function BackButton({ color = 'black', size = 24, style = {} }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} style={[{ padding: 10 }, style]}>
      <Ionicons name="arrow-back" size={size} color={color} />
    </Pressable>
  );
}
