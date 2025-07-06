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
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, getCategoryIconName } from '@/constants/categoryUtils';

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
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [customSplit, setCustomSplit] = useState<{ [userId: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('Others');

  useEffect(() => {
    if (!groupId) return;
    databases.getDocument(databaseId, groupsCollectionId, groupId as string).then(doc => {
      setMembers(doc.members ?? []);
      setPaidBy(doc.members?.[0] ?? '');
      setSplitBetween(doc.members ?? []);
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
      if (!description.trim()) {
        setError('Please enter a description.');
        setLoading(false);
        return;
      }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setError('Please enter a valid amount.');
        setLoading(false);
        return;
      }
      if (!paidBy) {
        setError('Please select who paid.');
        setLoading(false);
        return;
      }
      if (!splitBetween.length) {
        setError('Please select at least one member to split between.');
        setLoading(false);
        return;
      }
      if (splitType === 'exact') {
        const total = splitBetween.reduce(
          (sum, uid) => sum + parseFloat(customSplit[uid] || '0'),
          0
        );
        if (Math.abs(total - parseFloat(amount)) > 0.01) {
          setError('Exact amounts must sum to the total amount.');
          setLoading(false);
          return;
        }
      }
      if (splitType === 'percentage') {
        const total = splitBetween.reduce(
          (sum, uid) => sum + parseFloat(customSplit[uid] || '0'),
          0
        );
        if (Math.abs(total - 100) > 0.01) {
          setError('Percentages must sum to 100%.');
          setLoading(false);
          return;
        }
      }

      await databases.createDocument(
        databaseId,
        expensesCollectionId,
        ID.unique(),
        {
          groupId,
          description,
          amount: parseFloat(amount),
          paidBy,
          splitBetween,
          splitType,
          customSplit: splitType === 'equal' ? '' : JSON.stringify(customSplit),
          category,
        }
      );
      router.replace({ pathname: '/group/[groupId]', params: { groupId } });
    } catch (e: any) {
      setError(e.message || 'Failed to add expense');
    }
    setLoading(false);
  };

  return (
    <ThemedView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
      <Spacer/>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <ThemedText type="title" style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
          Add Expense
        </ThemedText>
        <Spacer height={10} />

        {/* Description */}
        <ThemedText style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 16 }}>Description*</ThemedText>
        <ThemedTextInput
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Lunch at cafe"
          style={{ marginBottom: 14 }}
        />

        {/* Amount */}
        <ThemedText style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 16 }}>Amount*</ThemedText>
        <ThemedTextInput
          value={amount}
          onChangeText={val => setAmount(val.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="$0.00"
          leftIcon="$"
          style={{ marginBottom: 14 }}
        />

        {/* Category */}
        <ThemedText style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 16 }}>Category</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
          {CATEGORIES.map(cat => (
            <ThemedButton
              key={cat.value}
              onPress={() => setCategory(cat.value)}
              style={[
                selectorButtonStyles.base,
                category === cat.value ? selectorButtonStyles.active : selectorButtonStyles.inactive,
                { flexDirection: 'row', alignItems: 'center', minWidth: 120 }
              ]}
              type={category === cat.value ? undefined : 'secondary'}
            >
              <Ionicons name={getCategoryIconName(cat.value)} size={22} color={category === cat.value ? "#fff" : '#1976d2'}/>
              <ThemedText style={category === cat.value ? selectorButtonStyles.textActive : selectorButtonStyles.textInactive}>
                {" "}{cat.label}
              </ThemedText>
            </ThemedButton>
          ))}
        </View>

        {/* Paid By */}
        <ThemedText style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 16 }}>Paid By</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, marginTop: 2 }}>
          {memberProfiles.map(m => {
            const isActive = paidBy === m.userId;
            return (
              <ThemedButton
                key={m.userId}
                onPress={() => setPaidBy(m.userId)}
                style={[
                  selectorButtonStyles.base,
                  isActive ? selectorButtonStyles.active : selectorButtonStyles.inactive,
                  { flexDirection: 'row', alignItems: 'center' }, // align avatar and text horizontally
                ]}
                type={isActive ? undefined : 'secondary'}
              >
                {m.avatar ? (
                  <Image
                    source={{ uri: m.avatar }}
                    style={{ width: 20, height: 20, borderRadius: 10, marginRight: 8, backgroundColor: '#fff' }}
                  />
                ) : null}
                <ThemedText style={isActive ? selectorButtonStyles.textActive : selectorButtonStyles.textInactive}>
                  {m.username}
                </ThemedText>
              </ThemedButton>
            );
          })}
        </View>


        {/* Split Between */}
        <ThemedText style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 16 }}>Split Between</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, marginTop: 2 }}>
          <ThemedButton
            onPress={() => setSplitBetween(members)}
            style={[
              selectorButtonStyles.base,
              splitBetween.length === members.length ? selectorButtonStyles.active : selectorButtonStyles.inactive,
              { flexDirection: 'row', alignItems: 'center' },
            ]}
            type={splitBetween.length === members.length ? undefined : 'secondary'}
          >
            <ThemedText style={splitBetween.length === members.length ? selectorButtonStyles.textActive : selectorButtonStyles.textInactive}>
              Everyone
            </ThemedText>
          </ThemedButton>
          {memberProfiles.map(m => {
            const isSelected = splitBetween.includes(m.userId);
            return (
              <ThemedButton
                key={m.userId}
                onPress={() => {
                  setSplitBetween(prev =>
                    prev.includes(m.userId)
                      ? prev.filter(uid => uid !== m.userId)
                      : [...prev, m.userId]
                  );
                }}
                style={[
                  selectorButtonStyles.base,
                  isSelected ? selectorButtonStyles.active : selectorButtonStyles.inactive,
                  { flexDirection: 'row', alignItems: 'center' },
                ]}
                type={isSelected ? undefined : 'secondary'}
              >
                {m.avatar ? (
                  <Image
                    source={{ uri: m.avatar }}
                    style={{ width: 20, height: 20, borderRadius: 10, marginRight: 8, backgroundColor: '#fff' }}
                  />
                ) : null}
                <ThemedText style={isSelected ? selectorButtonStyles.textActive : selectorButtonStyles.textInactive}>
                  {m.username}
                </ThemedText>
              </ThemedButton>
            );
          })}
        </View>


        {/* Split Type */}
        <ThemedText style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 16 }}>Split Type</ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, marginTop: 2 }}>
          {SPLIT_TYPES.map(opt => (
            <ThemedButton
              key={opt.value}
              onPress={() => setSplitType(opt.value)}
              style={[
                selectorButtonStyles.base,
                selectorButtonStyles.splitTypeMinWidth,
                splitType === opt.value ? selectorButtonStyles.active : selectorButtonStyles.inactive,
              ]}
              type={splitType === opt.value ? undefined : 'secondary'}
            >
              <ThemedText style={splitType === opt.value ? selectorButtonStyles.textActive : selectorButtonStyles.textInactive}>
                {opt.label}
              </ThemedText>
            </ThemedButton>
          ))}
        </View>

        {/* Custom Split Inputs */}
        {(splitType === 'exact' || splitType === 'percentage') && (
          <View style={{ marginBottom: 10 }}>
            {splitBetween.map(userId => {
              const user = memberProfiles.find(m => m.userId === userId);
              return (
                <View key={userId} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <ThemedText style={{ width: 90, fontSize: 15 }}>
                    {user?.username || userId}
                  </ThemedText>
                  <ThemedTextInput
                    value={customSplit[userId] || ''}
                    onChangeText={val =>
                      setCustomSplit(prev => ({
                        ...prev,
                        [userId]: val.replace(/[^0-9.]/g, ''),
                      }))
                    }
                    keyboardType="decimal-pad"
                    placeholder={splitType === 'exact' ? 'Amount' : 'Percent'}
                    style={{
                      width: 100,
                      height: 32,
                      fontSize: 15,
                      marginLeft: 6,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                    }}
                  />
                  {splitType === 'percentage' && (
                    <ThemedText style={{ marginLeft: 4 }}>%</ThemedText>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Error */}
        {error ? (
          <ThemedText style={{ color: '#e53935', marginBottom: 12, marginTop: 4, fontWeight: 'bold', fontSize: 15 }}>
            {error}
          </ThemedText>
        ) : null}

        {/* Buttons */}
        <View style={{ flexDirection:'row', marginTop: 16, justifyContent: 'flex-end'}}>
          <ThemedButton
            style={{ marginRight: 10, minWidth: 90 , backgroundColor: 'grey'}}
            onPress={() => router.navigate(`/group/${groupId}`)}
          >
            <ThemedText style={{ color: '#fff' }}>Cancel</ThemedText>
          </ThemedButton>
          <ThemedButton
            onPress={handleAddExpense}
            style={{ flex: 1 , maxWidth: 200 }}
            disabled={loading}
          >
            <ThemedText style={{ color: '#fff' , textAlign: 'center'}}>
              {loading ? 'Saving...' : 'Save Expense'}
            </ThemedText>
          </ThemedButton>
        </View>
        <Spacer />
      </ScrollView>
    </ThemedView>
  );
}

// --- Button styling for Paid By, Split Between, Split Type ---
const selectorButtonStyles = {
  base: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 90,
    borderWidth: 1,
    borderColor: '#ccc', 
  },
  active: {
    backgroundColor: '#1e88e5',
  },
  inactive: {
    backgroundColor: undefined,
  },
  textActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  textInactive: {
    color: '#1e88e5',
    fontWeight: 'bold',
  },
  splitTypeMinWidth: {
    minWidth: 120,
  },
};