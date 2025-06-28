// GroupDetailScreen.tsx
import Spacer from '@/components/Spacer';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, TextInput, TouchableOpacity, TouchableWithoutFeedback, View , ScrollView} from 'react-native';
import GroupHeader from '../../../components/GroupHeader';
import { useGroupDetails } from '../../../hooks/useGroupDetails';
import ExpenseList from './expenseList';
import MembersDropdown from './membersDropdown';
import SettlementList from './settlementList';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams();
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
    //searchResults,
    handleSearch,
    searching,
    handleAddMember,
    handleRemoveMember,
    expenses,
    // expensesToShow,
    expensesLoading,
    // hasMoreExpenses,
    // showAllExpenses,
    // setShowAllExpenses,
    settlements,
    getUsername,
    totalExpenses,
  } = useGroupDetails(groupId);

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

  // For see more/less
  const [showAllExpenses, setShowAllExpenses] = React.useState(false);
  const EXPENSES_PREVIEW_COUNT = 5;
  //const expensesToShow = showAllExpenses ? expenses : expenses.slice(0, EXPENSES_PREVIEW_COUNT);
  const expensesToShow: Expense[] = showAllExpenses ? expenses : expenses.slice(0, EXPENSES_PREVIEW_COUNT);
  const hasMoreExpenses = expenses.length > EXPENSES_PREVIEW_COUNT;
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </ThemedView>
    );
  }
  if (error) {
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
        <Spacer height={70} />
        <GroupHeader group={group} totalExpenses={totalExpenses} />
        <MembersDropdown
          group={group}
          membersExpanded={membersExpanded}
          setMembersExpanded={setMembersExpanded}
          memberProfiles={memberProfiles}
          handleRemoveMember={handleRemoveMember}
          setSearchModalVisible={setSearchModalVisible}
        />
        <ThemedButton onPress={() => router.push(`/group/${groupId}/addExpense`)}>
          <ThemedText style={{ color: '#fff', textAlign: 'center' }}>Add Expense</ThemedText>
        </ThemedButton>
        <SettlementList settlements={settlements} getUsername={getUsername} />

        {/* Expenses Section */}
        <View style={{ marginTop: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 4 }}>Expenses</ThemedText>
            {showAllExpenses && hasMoreExpenses && (
              <TouchableOpacity onPress={() => setShowAllExpenses(false)}>
                <ThemedText style={{ color: '#1e88e5', fontWeight: 'bold' }}>See Less</ThemedText>
              </TouchableOpacity>
            )}
          </View>
          {expensesLoading ? (
            <ActivityIndicator />
          ) : expensesToShow.length === 0 ? (
            <ThemedText style={{ color: '#aaa', fontStyle: 'italic', marginLeft: 4 }}>No expenses yet.</ThemedText>
          ) : (
            expensesToShow.map(item => (
              <ThemedView
                key={item.$id}
                style={{
                  backgroundColor: '#f2f2f2',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <ThemedText style={{ fontSize: 16, fontWeight: '600', marginBottom: 4, color: 'black' }}>{item.description}</ThemedText>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ThemedText style={{ fontSize: 13, color: '#888' }}>
                    Paid by: <ThemedText style={{ fontWeight: 'bold', color: '#444' }}>{getUsername(item.paidBy)}</ThemedText>
                  </ThemedText>
                  <ThemedText style={{ fontSize: 16, fontWeight: 'bold', color: '#1e88e5' }}>
                    ${item.amount.toFixed(2)}
                  </ThemedText>
                </View>
              </ThemedView>
            ))
          )}
          {!showAllExpenses && hasMoreExpenses && (
            <ThemedButton onPress={() => setShowAllExpenses(true)} style={{ marginTop: 8, backgroundColor: 'grey' }}>
              <ThemedText style={{ color: '#fff', textAlign: 'center' }}>See More</ThemedText>
            </ThemedButton>
          )}
        </View>
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