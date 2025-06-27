// SettlementList.tsx

import React from 'react';
import { View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

export default function SettlementList({ settlements, getUsername }) {
  return (
    <View style={{ marginTop: 18 }}>
      <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 4 }}>Settlements</ThemedText>
      {settlements.length === 0 ? (
        <ThemedText style={{ color: '#aaa', fontStyle: 'italic', marginLeft: 4 }}>
          No settlements needed.
        </ThemedText>
      ) : (
        settlements.map(({ from, to, amount }, idx) => (
          <ThemedView
            key={idx}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f2f2f2',
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
            }}
          >
            <ThemedText style={{ fontSize: 16, color: '#333' }}>
              {getUsername(from)} <Ionicons name="arrow-forward" size={16} /> {getUsername(to)}
            </ThemedText>
            <ThemedText style={{ fontWeight: 'bold', color: '#1e88e5', fontSize: 16 }}>
              ${amount.toFixed(2)}
            </ThemedText>
          </ThemedView>
        ))
      )}
    </View>
  );
}
