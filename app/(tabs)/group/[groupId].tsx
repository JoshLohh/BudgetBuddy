import React, { useEffect, useState, useCallback } from 'react';
import { Query } from 'appwrite'; 
import {
  View,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { databases } from '@/lib/appwrite';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Spacer from '@/components/Spacer';
import { ThemedButton } from '@/components/ThemedButton';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const groupsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';
const usersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? '';
const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [membersExpanded, setMembersExpanded] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [settlements, setSettlements] = useState<any[]>([]);
  const router = useRouter();

  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const EXPENSES_PREVIEW_COUNT = 2;

  // Fetch group info
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    setError('');
    const id = Array.isArray(groupId) ? groupId[0] : groupId;
    databases
      .getDocument(databaseId, groupsCollectionId, id)
      .then(doc => {
        setGroup({
          id: doc.$id,
          title: doc.title,
          description: doc.description,
          members: doc.members ?? [],
          createdBy: doc.createdBy,
        });
        setLoading(false);
      })
      .catch(() => {
        setError('Group not found.');
        setLoading(false);
      });
  }, [groupId]);

  // Fetch group expenses
  useEffect(() => {
  if (!groupId) return;
  setExpensesLoading(true);
  databases
    .listDocuments(
      databaseId,
      expensesCollectionId,
      [Query.equal('groupId', groupId)]
    )
    .then(res => {
      setExpenses(res.documents);
      setExpensesLoading(false);
    })
    .catch(() => setExpensesLoading(false));
}, [groupId]);

  // calculate the groups total expenses
  const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);


  // Fetch member profiles when group changes or members change
  useEffect(() => {
    if (!group || !group.members.length) {
      setMemberProfiles([]);
      return;
    }
    setLoading(true);
    Promise.all(
      group.members.map(userId =>
        databases
          .getDocument(databaseId, usersCollectionId, userId)
          .then(profile => ({ userId, username: profile.username }))
          .catch(() => ({ userId, username: '(unknown)' }))
      )
    ).then(profiles => {
      setMemberProfiles(profiles);
      setLoading(false);
    });
  }, [group]);

  // Helper to get username from userId
  const getUsername = (userId: string) => {
    const profile = memberProfiles.find(p => p.userId === userId);
    return profile ? profile.username : userId;
  };

  // Search for users by username
  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await databases.listDocuments(
        databaseId,
        usersCollectionId,
        []
      );
      const filtered = res.documents.filter(doc =>
        doc.username?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
      setSearchResults(filtered);
    } catch (e) {
      setSearchResults([]);
    }
    setSearching(false);
  };

  // Add member to group
  const handleAddMember = async userId => {
    if (!group) return;
    if (group.members.includes(userId)) return;
    const updatedMembers = [...group.members, userId];
    await databases.updateDocument(
      databaseId,
      groupsCollectionId,
      group.id,
      { members: updatedMembers }
    );
    setGroup({ ...group, members: updatedMembers });
    setSearchModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove member from group
  const handleRemoveMember = async userId => {
    if (!group) return;
    const updatedMembers = group.members.filter(id => id !== userId);
    await databases.updateDocument(
      databaseId,
      groupsCollectionId,
      group.id,
      { members: updatedMembers }
    );
    setGroup({ ...group, members: updatedMembers });
  };

  // To reload expenses
  useFocusEffect(
    useCallback(() => {
      setExpensesLoading(true);
      databases.listDocuments(
        databaseId,
        expensesCollectionId,
        [Query.equal('groupId', groupId)]
      ).then(res => {
        setExpenses(res.documents);
        setExpensesLoading(false);
      }).catch(() => setExpensesLoading(false));
    }, [groupId])
  );
  const expensesToShow = showAllExpenses ? expenses : expenses.slice(0, EXPENSES_PREVIEW_COUNT);
  const hasMoreExpenses = expenses.length > EXPENSES_PREVIEW_COUNT;

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={{ color: 'red' }}>{error}</ThemedText>
      </ThemedView>
    );
  }

  if (!group) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>No group data.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={expensesToShow}
        keyExtractor={item => item.$id}
        renderItem={({ item }) => (
          <ThemedView style={styles.expenseCard}>
            <ThemedText style={styles.expenseDesc}>{item.description}</ThemedText>
            <View style={styles.expenseMetaRow}>
              <ThemedText style={styles.expenseMeta}>
                Paid by: <ThemedText style={styles.expenseMetaBold}>{getUsername(item.paidBy)}</ThemedText>
              </ThemedText>
              <ThemedText style={styles.expenseAmount}>
                ${parseFloat(item.amount).toFixed(2)}
              </ThemedText>
            </View>
          </ThemedView>
        )}
        ListHeaderComponent={
          <>
            <Spacer height={70} />
            {/* Group Title, Description, Total */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="title" style={styles.groupName}>{group.title}</ThemedText>
                  <Spacer height={10}/>
                  {group.description ? (
                    <ThemedText style={styles.description}>{group.description}</ThemedText>
                  ) : null}
                </View>
                <ThemedView style={styles.totalCard}>
                  <ThemedText style={styles.totalLabel}>Total</ThemedText>
                  <ThemedText style={styles.totalAmount}>${totalExpenses.toFixed(2)}</ThemedText>
                </ThemedView>
              </View>

              {/* Group Meta: Member Count */}
              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={18} color={Colors.primary} />
                <ThemedText style={styles.metaText}>
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </ThemedText>
              </View>

              {/* Members Dropdown */}
              <TouchableOpacity
                style={styles.dropdownHeader}
                onPress={() => setMembersExpanded(prev => !prev)}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.membersTitle}>Group Members</ThemedText>
                <Ionicons
                  name={membersExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.primary}
                />
              </TouchableOpacity>
              {membersExpanded && (
                <View style={styles.membersDropdown}>
                  <FlatList
                    data={memberProfiles}
                    keyExtractor={item => item.userId}
                    renderItem={({ item }) => (
                      <View style={styles.memberRow}>
                        <ThemedText style={styles.memberText}>{item.username}</ThemedText>
                        <TouchableOpacity
                          onPress={() => handleRemoveMember(item.userId)}
                          style={styles.removeBtn}
                        >
                          <Ionicons name="close-circle" size={18} color="#e57373" />
                        </TouchableOpacity>
                      </View>
                    )}
                    style={styles.membersList}
                    contentContainerStyle={{ paddingBottom: 4 }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    ListEmptyComponent={<ThemedText style={{ color: '#aaa' }}>No members.</ThemedText>}
                  />
                  <Spacer height={8} />
                  {/* Add member search */}
                  <TouchableOpacity
                    style={styles.addMemberBtn}
                    onPress={() => setSearchModalVisible(true)}
                  >
                    <Ionicons name="person-add" size={18} color="#fff" />
                    <ThemedText style={{ color: '#fff', marginLeft: 6 }}>Add Member</ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              {/* Add Expense Button */}
              <ThemedButton
                onPress={() => router.push(`/group/${group.id}/addExpense`)}
              >
                <ThemedText style={{ color: '#fff', textAlign: 'center' }}>Add Expense</ThemedText>
              </ThemedButton>
              
            {/* Settlements Section (mapped, NOT FlatList) */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Settlements</ThemedText>
              {settlements.length === 0 ? (
                <ThemedText style={styles.placeholder}>No settlements yet.</ThemedText>
              ) : (
                settlements.map(settlement => (
                  <ThemedView style={styles.settlementCard}>
                    <ThemedText style={styles.settlementTitle}>Suggested Settlements</ThemedText>
                    {settlements.length === 0 ? (
                      <ThemedText>No settlements yet.</ThemedText>
                    ) : (
                      settlements.map(({ from, to, amount }) => (
                        <View key={from + to} style={styles.settlementRow}>
                          <ThemedText>{getUsername(from)} → {getUsername(to)}</ThemedText>
                          <ThemedText style={{ color: 'red' }}>${amount.toFixed(2)}</ThemedText>
                        </View>
                      ))
                    )}
                  </ThemedView>
                ))
              )}
            </View>
            <Spacer height={8}/>
            {/* Expenses Section Title and See Less button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <ThemedText style={styles.sectionTitle}>Expenses</ThemedText>
              {showAllExpenses && hasMoreExpenses && (
                <TouchableOpacity onPress={() => setShowAllExpenses(false)}>
                  <ThemedText style={{ color: Colors.primary, fontWeight: 'bold' }}>See Less</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </>
        }
        ListFooterComponent={
          <>
            {!showAllExpenses && hasMoreExpenses && (
              <ThemedButton onPress={() => setShowAllExpenses(true)} style={{ marginTop: 8 , backgroundColor: 'grey'}}>
                <ThemedText style={{ color: '#fff' }}>See More</ThemedText>
              </ThemedButton>
            )}
            <Spacer height={24} />
          </>
        }
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        ListEmptyComponent={
          expensesLoading ? (
            <ActivityIndicator />
          ) : (
            <ThemedText style={styles.placeholder}>No expenses yet.</ThemedText>
          )
        }
      />
      {/* Add Member Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>Add Member</ThemedText>
              <TextInput
                style={styles.searchInput}
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
                      style={styles.searchResultRow}
                      onPress={() => handleAddMember(item.$id)}
                    >
                      <ThemedText style={styles.searchResultText}>{item.username}</ThemedText>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <ThemedText style={{ color: '#aaa', textAlign: 'center' }}>
                      {searchQuery ? 'No users found.' : 'Enter a username to search.'}
                    </ThemedText>
                  }
                  keyboardShouldPersistTaps="handled"
                />
              )}
              <Spacer height={8} />
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setSearchModalVisible(false)}
              >
                <ThemedText style={{ color: '#fff' }}>Close</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  description: { fontSize: 15, color: '#555', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  metaText: { fontSize: 14, color: '#888', marginLeft: 4 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupName: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    marginTop: 8,
    paddingVertical: 8,
  },
  membersTitle: { fontSize: 18, fontWeight: '600' },
  membersDropdown: {
    maxHeight: 180,
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    elevation: 2,
  },
  membersList: { maxHeight: 120 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
  },
  memberText: { fontWeight: '500', color: '#333', fontSize: 15 },
  removeBtn: { marginLeft: 8, padding: 2 },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 4,
  },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  placeholder: { color: '#aaa', fontStyle: 'italic', marginLeft: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  searchResultRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  searchResultText: { fontSize: 16, color: '#333' },
  closeModalBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  expenseCard: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  expenseDesc: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: 'black',
  },
  expenseMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseMeta: {
    fontSize: 13,
    color: '#888',
  },
  expenseMetaBold: {
    fontWeight: 'bold',
    color: '#444',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e88e5',
  },
  totalCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    minWidth: 90,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 13,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    color: '#1976d2',
    fontWeight: 'bold',
    marginTop: 2,
  },
});
