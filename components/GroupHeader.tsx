// GroupHeader.tsx

import React from 'react';
import { View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function GroupHeader({ group, totalExpenses }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <View style={{ flex: 1 }}>
        <ThemedText type="title" style={{ fontSize: 28, fontWeight: '700' }}>{group.title}</ThemedText>
        {group.description ? (
          <ThemedText style={{ fontSize: 15, color: '#555', marginBottom: 4 }}>{group.description}</ThemedText>
        ) : null}
        <Ionicons name="people-outline" size={18} color={Colors.primary} />
        <ThemedText style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
          {group.members?.length ?? 0} member{(group.members?.length ?? 0) !== 1 ? 's' : ''}
        </ThemedText>
      </View>
      <ThemedView style={{
        backgroundColor: '#e3f2fd',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 18,
        alignItems: 'center',
        minWidth: 90,
        elevation: 2,
      }}>
        <ThemedText style={{ fontSize: 13, color: '#1976d2', fontWeight: 'bold' }}>Total</ThemedText>
        <ThemedText style={{ fontSize: 18, color: '#1976d2', fontWeight: 'bold', marginTop: 2 }}>
          ${totalExpenses.toFixed(2)}
        </ThemedText>
      </ThemedView>
    </View>
  );
}
