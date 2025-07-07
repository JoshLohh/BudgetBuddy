// GroupDetailScreen.tsx
import Spacer from '@/components/Spacer';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, TextInput, TouchableOpacity, TouchableWithoutFeedback, View , ScrollView} from 'react-native';
import GroupHeader from '../../../components/GroupHeader';
import { useGroupDetails } from '../../../hooks/useGroupDetails';
import ExpenseList from './expenseList';
import MembersDropdown from './membersDropdown';
import SettlementList from './settlementList';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/hooks/useUser';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const {
    group,
    loading,
    error,
    membersExpanded,
    setMembersExpanded,
    memberProfiles,
    searchModalVisible,
    setSearchModalVisible,
    searchQuery,
    setSearchQuery,
    searchResults,
    handleSearch,
    searching,
    handleAddMember,
    handleRemoveMember,
    expenses,
    expensesToShow,
    expensesLoading,
    hasMoreExpenses,
    showAllExpenses,
    setShowAllExpenses,
    suggestedSettlements,
    settleUp,
    getUsername,
    totalExpenses,
  } = useGroupDetails(groupId);

  const [currentGroup, setCurrentGroup] = useState(group);

  useEffect(() => {
    setCurrentGroup(group);
  }, [group]);

  type Expense = {
    $id: string;
    description: string;
    paidBy: string;
    amount: number;
  };

  type UserProfile = {
    $id: string;
    username: string;
  };

  // const EXPENSES_PREVIEW_COUNT = 5;
  //const expensesToShow = showAllExpenses ? expenses : expenses.slice(0, EXPENSES_PREVIEW_COUNT);
  // const expensesToShow: Expense[] = showAllExpenses ? expenses : expenses.slice(0, EXPENSES_PREVIEW_COUNT);
  // const hasMoreExpenses = expenses.length > EXPENSES_PREVIEW_COUNT;

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </ThemedView>
    );
  }
  if (error) {
    console.log(error)
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText style={{ color: 'red' }}>{error}</ThemedText>
      </ThemedView>
    );
  }
  if (!group) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>No group data.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Spacer height={30} />
        <TouchableOpacity onPress={() => router.navigate('/group/groups')}>
            <Ionicons name="arrow-back" size={24} color="#0a7ea4" />
        </TouchableOpacity>
        <Spacer height={10} />
        <GroupHeader
          group={currentGroup}
          totalExpenses={totalExpenses}
          onGroupUpdated={setCurrentGroup}
        />
        <MembersDropdown
          group={group}
          membersExpanded={membersExpanded}
          setMembersExpanded={setMembersExpanded}
          memberProfiles={memberProfiles}
          handleRemoveMember={handleRemoveMember}
          setSearchModalVisible={setSearchModalVisible}
        />
        <ThemedButton onPress={() => router.push({ pathname: '/group/[groupId]/addExpense', params: { groupId } })}>
          <ThemedText style={{ color: '#fff', textAlign: 'center' }}>Add Expense</ThemedText>
        </ThemedButton>
        <SettlementList
          suggestedSettlements={suggestedSettlements}
          // settledSettlements={settledSettlements}
          getUsername={getUsername}
          settleUp={settleUp}
          currentUserId={user.$id}
        />

        {/* Expenses Section */}
        <ExpenseList
          expenses={expenses}
          expensesLoading={expensesLoading}
          hasMoreExpenses={hasMoreExpenses}
          showAllExpenses={showAllExpenses}
          setShowAllExpenses={setShowAllExpenses}
          getUsername={getUsername}
        />
        
        <Modal
          visible={searchModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setSearchModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.13)',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <View style={{
                width: '88%',
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 18,
                elevation: 5,
              }}>
                <ThemedText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Add Member</ThemedText>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 16,
                    backgroundColor: '#fafafa',
                  }}
                  placeholder="Search username..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoFocus
                />
                <Spacer height={8} />
                {searching ? (
                  <ActivityIndicator />
                ) : (
                  <FlatList
                    data={searchResults}
                    keyExtractor={item => item.$id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          borderBottomWidth: 0.5,
                          borderBottomColor: '#eee',
                        }}
                        onPress={() => handleAddMember(item.$id)}
                      >
                        <ThemedText style={{ fontSize: 16, color: '#333' }}>{item.username}</ThemedText>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <ThemedText style={{ color: '#aaa', textAlign: 'center' }}>
                        {searchQuery ? 'No users found.' : 'Enter a username to search.'}
                      </ThemedText>
                    }
                    keyboardShouldPersistTaps="handled"
                    style={{ maxHeight: 250 }}
                  />
                )}
                <Spacer height={8} />
                <TouchableOpacity
                  style={{
                    backgroundColor: '#1e88e5',
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                    marginTop: 6,
                  }}
                  onPress={() => setSearchModalVisible(false)}
                >
                  <ThemedText style={{ color: '#fff' }}>Close</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}