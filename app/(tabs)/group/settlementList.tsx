import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { Ionicons } from '@expo/vector-icons';

export default function SettlementList({
  settlements,
  settledSettlements,
  getUsername,
  settleUp,
}) {
  const [processing, setProcessing] = useState('');

  const handleSettleUp = (from, to, amount) => {
    Alert.alert(
      'Confirm Settle Up',
      `Are you sure you want to settle $${amount.toFixed(2)} from ${getUsername(from)} to ${getUsername(to)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setProcessing(`${from}_${to}_${amount}`);
            await settleUp(from, to, amount);
            setProcessing('');
          },
        },
      ]
    );
  };

  return (
    <View style={{ marginTop: 12 }}>
      <ThemedText type="subtitle" style={{ fontWeight: 'bold', marginBottom: 8 }}>Settlements</ThemedText>
      {settlements.length === 0 && settledSettlements.length === 0 ? (
        <ThemedText>No settlements needed.</ThemedText>
      ) : (
        <>
          {/* Unsettled suggested settlements */}
          {settlements.map(({ from, to, amount }) => (
            <View key={`${from}_${to}_${amount}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <ThemedText style={{ flex: 1 }}>
                {getUsername(from)} <Ionicons name="arrow-forward" size={16} color="#1976d2" /> {getUsername(to)}
              </ThemedText>
              <ThemedText style={{ width: 80 }}>${amount.toFixed(2)}</ThemedText>
              <ThemedButton
                onPress={() => handleSettleUp(from, to, amount)}
                disabled={processing === `${from}_${to}_${amount}`}
                style={{ marginLeft: 10, minWidth: 90 }}
              >
                <ThemedText style={{ color:"#fff" }}>Settle Up</ThemedText>
              </ThemedButton>
            </View>
          ))}
          {/* Settled settlements (show as ticked/faded) */}
          {settledSettlements.map(({ from, to, amount }) => (
            <View key={`settled_${from}_${to}_${amount}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, opacity: 0.5 }}>
              <Ionicons name="checkmark-circle" size={18} color="#4caf50" style={{ marginRight: 4 }} />
              <ThemedText style={{ flex: 1 }}>
                {getUsername(from)} <Ionicons name="arrow-forward" size={14} color="#1976d2" /> {getUsername(to)}
              </ThemedText>
              <ThemedText style={{ width: 80 }}>${amount.toFixed(2)}</ThemedText>
            </View>
          ))}
        </>
      )}
    </View>
  );
}
