import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databases } from '@/lib/appwrite';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import { ThemedButton } from '@/components/ThemedButton';
import { ActivityIndicator, Alert, ScrollView, View, Image, TouchableOpacity } from 'react-native';
import Spacer from '@/components/Spacer';
import BackButton from '@/components/BackButton';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryIconName } from '@/constants/categoryUtils';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';
const usersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? '';

export default function ExpenseDetailScreen() {
  const { groupId, expenseId } = useLocalSearchParams();
  const router = useRouter();

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [splitType, setSplitType] = useState('equal');
  const [customSplit, setCustomSplit] = useState<{ [userId: string]: string }>({});
  const [error, setError] = useState('');
  const [userProfiles, setUserProfiles] = useState<any[]>([]);

  // reset state
  useEffect(() => {
    setSaving(false);
    setDeleting(false);
    setError('');
  }, []);

  // Fetch expense and user profiles
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');
    databases.getDocument(databaseId, expensesCollectionId, expenseId)
      .then(async doc => {
        if (!isMounted) return;
        setExpense(doc);
        setDescription(doc.description);
        setAmount(String(doc.amount));
        setSplitBetween(doc.splitBetween || []);
        setSplitType(doc.splitType || 'equal');
        if (doc.customSplit) {
          try {
            setCustomSplit(JSON.parse(doc.customSplit));
          } catch {
            setCustomSplit({});
          }
        } else {
          setCustomSplit({});
        }
        // Fetch user profiles for splitBetween
        const profiles = await Promise.all(
          (doc.splitBetween || []).map((userId: string) =>
            databases
              .getDocument(databaseId, usersCollectionId, userId)
              .then(profile => ({
                userId,
                username: profile.username,
                avatar: profile.avatar || null,
              }))
              .catch(() => ({ userId, username: '(unknown)', avatar: null }))
          )
        );
        setUserProfiles(profiles);
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setError('Expense not found');
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [expenseId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    // Validation
    if (!description.trim()) {
      setError('Please enter a description.');
      setSaving(false);
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount.');
      setSaving(false);
      return;
    }
    if (!splitBetween.length) {
      setError('Please select at least one member to split between.');
      setSaving(false);
      return;
    }
    if (splitType === 'exact') {
      const total = splitBetween.reduce(
        (sum, uid) => sum + parseFloat(customSplit[uid] || '0'),
        0
      );
      if (Math.abs(total - parseFloat(amount)) > 0.01) {
        setError('Exact amounts must sum to the total amount.');
        setSaving(false);
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
        setSaving(false);
        return;
      }
    }

    try {
      await databases.updateDocument(databaseId, expensesCollectionId, expenseId, {
        description,
        amount: parseFloat(amount),
        splitBetween,
        splitType,
        customSplit: splitType === 'equal' ? '' : JSON.stringify(customSplit),
      });
      Alert.alert('Success', 'Expense updated');
      router.replace({ pathname: '/group/[groupId]', params: { groupId } });
    } catch (e) {
      setError('Failed to update expense');
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await databases.deleteDocument(databaseId, expensesCollectionId, expenseId);
            Alert.alert('Deleted', 'Expense deleted');
            router.replace({ pathname: '/group/[groupId]', params: { groupId } });
          } catch (e) {
            setError('Failed to delete expense');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, padding: 20 }}>
      <Spacer height={30}/>
        <TouchableOpacity onPress={() => router.navigate(`/group/${groupId}`)}>
            <Ionicons name="arrow-back" size={24} color="#1976d2" />
        </TouchableOpacity>
      <ScrollView>
        <Spacer height={30}/>
        <ThemedText type="title" style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
          Edit Expense
        </ThemedText>

        <ThemedText style={{ fontWeight: 'bold', marginBottom: 4 }}>Description</ThemedText>
        <ThemedTextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Expense description"
          style={{ marginBottom: 14 }}
        />

        <ThemedText style={{ fontWeight: 'bold', marginBottom: 4 }}>Amount</ThemedText>
        <ThemedTextInput
          value={amount}
          onChangeText={val => setAmount(val.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="$0.00"
          style={{ marginBottom: 14 }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name={getCategoryIconName(expense.category)} size={22} color="#1976d2" />
          <ThemedText style={{ marginLeft: 8, fontWeight: 'bold', fontSize: 15 }}>
            {expense?.category || "Others"}
          </ThemedText>
        </View>
        <ThemedText style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
          Paid by: <ThemedText style={{ fontWeight: 'bold', color: '#1976d2' }}>
            {userProfiles.find(u => u.userId === expense?.paidBy)?.username || expense?.paidBy}
          </ThemedText>
        </ThemedText>


        <ThemedText style={{ fontWeight: 'bold', marginBottom: 4 }}>Split Between</ThemedText>
        <View style={{ flexWrap: 'wrap', flexDirection: 'row', marginBottom: 14 }}>
          {userProfiles.map(user => (
            <View
              key={user.userId}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: '#1e88e5',
                borderRadius: 20,
                marginRight: 8,
                marginBottom: 8,
              }}
            >
              {user.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={{ width: 24, height: 24, borderRadius: 12, marginRight: 6, backgroundColor: '#fff' }}
                />
              ) : (
                <View style={{
                  width: 24, height: 24, borderRadius: 12, marginRight: 6, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Ionicons name="person" size={16} color="#888" />
                </View>
              )}
              <ThemedText style={{ color: '#fff' }}>{user.username}</ThemedText>
            </View>
          ))}
        </View>

        <ThemedText style={{ fontWeight: 'bold', marginBottom: 4 }}>Split Type</ThemedText>
        <ThemedText style={{ marginBottom: 14 }}>{splitType}</ThemedText>

        {(splitType === 'exact' || splitType === 'percentage') && (
          <View style={{ marginBottom: 14 }}>
            <ThemedText style={{ fontWeight: 'bold', marginBottom: 6 }}>Custom Split</ThemedText>
            {userProfiles.map(user => (
              <View
                key={user.userId}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
              >
                {user.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    style={{ width: 24, height: 24, borderRadius: 12, marginRight: 6, backgroundColor: '#fff' }}
                  />
                ) : (
                  <View style={{
                    width: 24, height: 24, borderRadius: 12, marginRight: 6, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Ionicons name="person" size={16} color="#888" />
                  </View>
                )}
                <ThemedText style={{ width: 80 }}>{user.username}</ThemedText>
                <ThemedTextInput
                  value={customSplit[user.userId] || ''}
                  onChangeText={val =>
                    setCustomSplit(prev => ({ ...prev, [user.userId]: val.replace(/[^0-9.]/g, '') }))
                  }
                  keyboardType="decimal-pad"
                  placeholder={splitType === 'exact' ? 'Amount' : 'Percent'}
                  style={{ width: 100, height: 32, marginLeft: 6, paddingHorizontal: 8, borderRadius: 6 }}
                />
                {splitType === 'percentage' && <ThemedText style={{ marginLeft: 4 }}>%</ThemedText>}
              </View>
            ))}
          </View>
        )}

        {/* Inline error display */}
        {error ? (
          <ThemedText style={{ color: '#e53935', marginBottom: 12, fontWeight: 'bold' }}>
            {error}
          </ThemedText>
        ) : null}

        {saving ? (
          <ThemedButton disabled>
            <ThemedText>Saving...</ThemedText>
          </ThemedButton>
        ) : (
          <ThemedButton onPress={handleSave} style={{ marginBottom: 12}}>
            <ThemedText style={{ color: '#fff' , textAlign: 'center'}}>Save Changes</ThemedText>
          </ThemedButton>
        )}

        {deleting ? (
          <ThemedButton disabled type="secondary">
            <ThemedText>Deleting...</ThemedText>
          </ThemedButton>
        ) : (
          <ThemedButton onPress={handleDelete} style={{ backgroundColor: '#e57373', marginTop: 6 }}>
            <ThemedText style={{ color: '#fff' , textAlign: 'center'}}>Delete Expense</ThemedText>
          </ThemedButton>
        )}
      </ScrollView>
      <Spacer height={80}/>
    </ThemedView>
  );
}
