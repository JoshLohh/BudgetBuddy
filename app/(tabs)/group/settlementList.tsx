import React from 'react';
import { View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { ThemedButton } from '@/components/ThemedButton';

export default function SettlementList({
  settlements,
  settledSettlements,
  getUsername,
  settleUp,
}) {
  return (
    <View style={{ marginTop: 18 }}>
      <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 4 }}>Settlements</ThemedText>
      {settlements.length === 0 && settledSettlements.length === 0 ? (
        <ThemedText style={{ color: '#aaa', fontStyle: 'italic', marginLeft: 4 }}>
          No settlements needed.
        </ThemedText>
      ) : (
        <>
          {/* Unsettled settlements */}
          {settlements.map(({ from, to, amount }, idx) => (
            <ThemedView
              key={`${from}_${to}_${amount}_${idx}`}
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 16, color: '#333' }}>
                  {getUsername(from)} <Ionicons name="arrow-forward" size={16} /> {getUsername(to)}
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ThemedText style={{ fontWeight: 'bold', color: '#1e88e5', fontSize: 16, marginRight: 10 }}>
                  ${amount.toFixed(2)}
                </ThemedText>
                <ThemedButton
                  style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 }}
                  onPress={() => settleUp(from, to, amount)}
                >
                  <ThemedText style={{ color: '#fff' }}>Settle Up</ThemedText>
                </ThemedButton>
              </View>
            </ThemedView>
          ))}
          {/* Settled settlements (faded, with checkmark) */}
          {settledSettlements.map(({ from, to, amount }, idx) => (
            <ThemedView
              key={`${from}_${to}_${amount}_${idx}_settled`}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#e0e0e0',
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                opacity: 0.5,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ThemedText style={{ fontSize: 16, color: '#333' }}>
                  {getUsername(from)} <Ionicons name="arrow-forward" size={16} /> {getUsername(to)}
                </ThemedText>
                <Ionicons name="checkmark-circle" size={18} color="#4caf50" style={{ marginLeft: 8 }} />
              </View>
              <ThemedText style={{ fontWeight: 'bold', color: '#1e88e5', fontSize: 16 }}>
                ${amount.toFixed(2)}
              </ThemedText>
            </ThemedView>
          ))}
        </>
      )}
    </View>
  );
}
