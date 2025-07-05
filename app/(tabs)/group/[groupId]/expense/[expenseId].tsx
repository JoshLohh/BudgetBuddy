import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { databases } from '@/lib/appwrite';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import { ThemedButton } from '@/components/ThemedButton';
import { ActivityIndicator, Alert } from 'react-native';
import Spacer from '@/components/Spacer';
import BackButton from '@/components/BackButton';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';

export default function ExpenseDetailScreen() {
  const { groupId, expenseId } = useLocalSearchParams();
  const router = useRouter();

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    databases.getDocument(databaseId, expensesCollectionId, expenseId)
      .then(doc => {
        setExpense(doc);
        setDescription(doc.description);
        setAmount(String(doc.amount));
        setLoading(false);
      })
      .catch(() => {
        setError('Expense not found');
        setLoading(false);
      });
  }, [expenseId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await databases.updateDocument(databaseId, expensesCollectionId, expenseId, {
        description,
        amount: parseFloat(amount),
      });
      Alert.alert('Success', 'Expense updated');
      router.back();
    } catch (e) {
      setError('Failed to update expense');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await databases.deleteDocument(databaseId, expensesCollectionId, expenseId);
            Alert.alert('Deleted', 'Expense deleted');
            router.replace({ pathname: '/group/[groupId]', params: { groupId } });
          } catch (e) {
            setError('Failed to delete expense');
          }
        }
      }
    ]);
  };

  if (loading) return <ActivityIndicator />;
  if (error) return <ThemedText style={{ color: 'red' }}>{error}</ThemedText>;

  return (
    <ThemedView style={{ flex: 1, padding: 20 }}>
        <Spacer height={30}/>
        <BackButton color="#1976d2" />
        <Spacer height={80}/>
        
      <ThemedText type="title" style={{ marginBottom: 16 }}>Edit Expense</ThemedText>
      <ThemedTextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        style={{ marginBottom: 12 }}
      />
      <ThemedTextInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={{ marginBottom: 12 }}
      />
      {error ? <ThemedText style={{ color: 'red', marginBottom: 8 }}>{error}</ThemedText> : null}
      <ThemedButton onPress={handleSave} disabled={saving}>
        <ThemedText style={{ color: '#fff' }}>{saving ? 'Saving...' : 'Save Changes'}</ThemedText>
      </ThemedButton>
      <ThemedButton onPress={handleDelete} style={{ backgroundColor: '#e57373', marginTop: 16 }}>
        <ThemedText style={{ color: '#fff' }}>Delete Expense</ThemedText>
      </ThemedButton>
    </ThemedView>
  );
}
