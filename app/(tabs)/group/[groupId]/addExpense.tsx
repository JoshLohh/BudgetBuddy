import React, { useState, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databases } from '@/lib/appwrite';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import { ThemedButton } from '@/components/ThemedButton';
import Spacer from '@/components/Spacer';
import { ID } from 'appwrite';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';
const groupsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';
const usersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? '';

const SPLIT_TYPES = [
  { label: 'Split Equally', value: 'equal' },
  { label: 'Exact Amounts', value: 'exact' },
  { label: '% Percentages', value: 'percentage' },
];

export default function AddExpenseScreen() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<any[]>([]);
  const [splitType, setSplitType] = useState('equal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch group members and their profiles
  useEffect(() => {
    if (!groupId) return;
    databases.getDocument(databaseId, groupsCollectionId, groupId as string)
      .then(doc => {
        setMembers(doc.members ?? []);
        setPaidBy(doc.members?.[0] ?? '');
        // Fetch user profiles for display
        Promise.all(
          (doc.members ?? []).map((userId: string) =>
            databases
              .getDocument(databaseId, usersCollectionId, userId)
              .then(profile => ({
                userId,
                username: profile.username,
                avatar: profile.avatar || null,
              }))
              .catch(() => ({ userId, username: '(unknown)', avatar: null }))
          )
        ).then(setMemberProfiles);
      });
  }, [groupId]);

  const handleAddExpense = async () => {
    setLoading(true);
    setError('');
    try {
        await databases.createDocument(
            databaseId,
            expensesCollectionId,
            ID.unique(),
            {
            groupId,
            description,
            amount: parseFloat(amount),
            paidBy,
            splitBetween: members,
            splitType,
            customSplit: '', // Not used for now
            }
      );
      router.back(); // Go back to group page after adding
    } catch (e: any) {
      setError(e.message || 'Failed to add expense');
    }
    setLoading(false);
  };

  // Format amount with dollar sign (display only)
  const formatAmount = (val: string) => {
    if (!val) return '';
    const num = Number(val.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '';
    return `$${num}`;
  };

  return (
    <ThemedView style={{ flex: 1, padding: 20 }}>
      <Spacer  />
      <ThemedText type="title" style={{ marginBottom: 12 }}>Add Expense</ThemedText>
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* Description */}
        <ThemedText type='subtitle' style={{ marginBottom:2 }}>Description*</ThemedText>
        <ThemedTextInput
          placeholder="E.g., Dinner, Taxi, etc."
          value={description}
          onChangeText={setDescription}
          style={{ marginBottom: 14 }}
        />
        {/* Amount with $ */}
        <ThemedText type='subtitle' style={{ marginBottom:2 }}>Amount*</ThemedText>
        <ThemedTextInput
          placeholder="$ 0.00"
          value={amount}
          onChangeText={val => setAmount(val.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          style={{ marginBottom: 14 }}
          leftIcon={<ThemedText style={{ fontWeight: 'bold' }}>$</ThemedText>}
        />
        {/* Paid By */}
        <ThemedText type='subtitle'>Paid By</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
          {memberProfiles.map(m => (
            <ThemedButton
              key={m.userId}
              onPress={() => setPaidBy(m.userId)}
              style={{
                backgroundColor: paidBy === m.userId ? '#1e88e5' : undefined,
                borderColor: '#ccc',
                borderWidth: 1,
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 14,
                marginRight: 8,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                minWidth: 90,
              }}
            >
              <ThemedText type='default'>
                {m.username}
              </ThemedText>
            </ThemedButton>
          ))}
        </View>
        {/* Split Type */}
        <ThemedText type='subtitle'>Split Type</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
          {SPLIT_TYPES.map(opt => (
            <ThemedButton
              key={opt.value}
              onPress={() => setSplitType(opt.value)}
              style={{
                backgroundColor: splitType === opt.value ? '#1e88e5' : undefined,
                borderColor: '#ccc',
                borderWidth: 1,
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 14,
                marginRight: 8,
                marginBottom: 8,
                minWidth: 120,
              }}
              type={splitType === opt.value ? undefined : 'secondary'}
            >
              <ThemedText type='default'>
                {opt.label}
              </ThemedText>
            </ThemedButton>
          ))}
        </View>
        {/* Error */}
        {error ? <ThemedText style={{ color: 'red', marginTop: 8 }}>{error}</ThemedText> : null}
        {/* Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 }}>
          <ThemedButton
            style={{ marginRight: 10, minWidth: 90 , backgroundColor: 'grey'}}
            onPress={() => router.navigate(`/group/${groupId}`)}
          >
            <ThemedText style={{ color: '#fff' }}>Cancel</ThemedText>
          </ThemedButton>
          <ThemedButton
            onPress={handleAddExpense}
            disabled={loading || !description || !amount || !paidBy}
            style={{ minWidth: 120 }}
          >
            <ThemedText style={{ color: '#fff' }}>{loading ? 'Saving...' : 'Save Expense'}</ThemedText>
          </ThemedButton>
        </View>
        <Spacer height={24} />
      </ScrollView>
    </ThemedView>
  );
}
