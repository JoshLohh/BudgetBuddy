import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { Ionicons } from '@expo/vector-icons';

export default function SettlementList({
  suggestedSettlements,
  getUsername,
  settleUp,
  currentUserId,
}) {
  
  // Filter settlements for this user
  const userSettlements = suggestedSettlements.filter(
    s => s.from === currentUserId || s.to === currentUserId
  );

  // Calculate net balance
  let netBalance = 0;
  suggestedSettlements.forEach(s => {
    if (s.to === currentUserId) netBalance += s.amount;
    else if (s.from === currentUserId) netBalance -= s.amount;
  });

  // Helper for owed/owing statement
  let statement = '';
  if (userSettlements.length === 0) {
    statement = 'No settlements needed.';
  } else if (netBalance > 0) {
    statement = `You are owed $${netBalance.toFixed(2)}`;
  } else if (netBalance < 0) {
    statement = `You owe $${Math.abs(netBalance).toFixed(2)}`;
  } else {
    statement = 'No settlements needed.';
  }

  // Determine Statement Colour
  let statementColor = '#888'; // default grey
  if (netBalance > 0) {
    statementColor = '#00b359'; // green
  } else if (netBalance < 0) {
    statementColor = '#ff5050'; // red
  }

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
      <ThemedText type="subtitle" style={{ fontWeight: 'bold', marginBottom: 8 }}>
        Suggested Settlements
      </ThemedText>
      <ThemedText style={{ fontWeight:'bold', color: statementColor }}>
        {statement}
      </ThemedText>
      {userSettlements.length === 0 ? (
        // <ThemedText>No settlements needed.</ThemedText>
        <></>
      ) : (
        userSettlements.map(({ from, to, amount }) => (
          <View
            key={`${from}_${to}_${amount}`}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
          >
            <ThemedText style={{ flex: 1 , fontWeight:'bold'}}>
              {getUsername(from)} <Ionicons name="arrow-forward" size={16} color="#1976d2" /> {getUsername(to)}
            </ThemedText>
            <ThemedText style={{ width: 80 , color: '#1e88e5', fontWeight: 'bold'}}>${amount.toFixed(2)}</ThemedText>
            <ThemedButton
              onPress={() => handleSettleUp(from, to, amount)}
              disabled={processing === `${from}_${to}_${amount}`}
              style={{ marginLeft: 10, minWidth: 90 }}
            >
              <ThemedText style={{ color: '#fff' }}>Settle Up</ThemedText>
            </ThemedButton>
          </View>
        ))
      )} 
    </View>
  );
}
