import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { ThemedButton } from '@/components/ThemedButton';

type Settlement = {
  from: string;
  to: string;
  amount: number;
};

interface SettlementListProps {
  settlements: Settlement[];
  settledSettlements: Settlement[];
  getUsername: (userId: string) => string;
  settleUp: (from: string, to: string, amount: number) => void;
}

const SettlementList: React.FC<SettlementListProps> = ({
  settlements,
  settledSettlements,
  getUsername,
  settleUp,
}) => {
  return (
    <View style={{ marginTop: 18 }}>
      <ThemedText style={styles.header}>Settlements</ThemedText>
      {settlements.length === 0 && settledSettlements.length === 0 ? (
        <ThemedText style={styles.placeholder}>No settlements needed.</ThemedText>
      ) : (
        <>
          {/* Unsettled settlements */}
          {settlements.map(({ from, to, amount }, idx) => (
            <ThemedView key={`unsettled-${idx}`} style={styles.settlementRow}>
              <Ionicons name="swap-horizontal" size={18} color="#1e88e5" style={{ marginRight: 8 }} />
              <ThemedText>
                {getUsername(from)} → {getUsername(to)}
              </ThemedText>
              <ThemedText style={styles.amount}>${amount.toFixed(2)}</ThemedText>
              <ThemedButton
                style={styles.settleBtn}
                type="secondary"
                onPress={() => settleUp(from, to, amount)}
              >
                <ThemedText>Settle Up</ThemedText>
              </ThemedButton>
            </ThemedView>
          ))}

          {/* Settled settlements (faded, with checkmark) */}
          {settledSettlements.map(({ from, to, amount }, idx) => (
            <ThemedView key={`settled-${idx}`} style={[styles.settlementRow, styles.settled]}>
              <Ionicons name="checkmark-circle" size={18} color="#6fcf97" style={{ marginRight: 8 }} />
              <ThemedText style={styles.settledText}>
                {getUsername(from)} → {getUsername(to)}
              </ThemedText>
              <ThemedText style={[styles.amount, styles.settledText]}>${amount.toFixed(2)}</ThemedText>
            </ThemedView>
          ))}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  placeholder: { color: '#aaa', fontStyle: 'italic', marginLeft: 4 },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  amount: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  settleBtn: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  settled: {
    opacity: 0.5,
  },
  settledText: {
    textDecorationLine: 'line-through',
  },
});

export default SettlementList;
