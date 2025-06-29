import { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useFocusEffect } from 'expo-router';
import { calculateBalances, calculateSettlements } from './settlementUtils';
import React from 'react';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const groupsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';
const usersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? '';
const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';

export function useGroupDetails(groupId) {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [membersExpanded, setMembersExpanded] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);

  // Settled settlements for this group (in-memory, not persisted)
  const [settledIds, setSettledIds] = useState<string[]>([]);

  const EXPENSES_PREVIEW_COUNT = 10;

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

  // Fetch expenses
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

  // Refetch expenses on focus
  useFocusEffect(
    React.useCallback(() => {
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
    }, [groupId])
  );

  // Fetch member profiles
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

  // Helper to get username
  const getUsername = (userId) => {
    const profile = memberProfiles.find(p => p.userId === userId);
    return profile ? profile.username : userId;
  };

  // Search for users by username
  const handleSearch = async () => {
    setSearching(true);
    try {
      // const queries = searchQuery.trim()
      //   ? [Query.search('username', searchQuery.trim())]
      //   : [];
      // const res = await databases.listDocuments(
      //   databaseId,
      //   usersCollectionId,
      //   queries
      // );
      // setSearchResults(res.documents);
      const res = await databases.listDocuments(databaseId, usersCollectionId, [Query.limit(100)]);
      console.log('[handleSearch] Fetched users:', res.documents.map(doc => doc.username));
      const filtered = res.documents.filter(doc =>
        doc.username?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
      console.log('[handleSearch] Filtered users:', filtered.map(doc => doc.username));
      setSearchResults(filtered);

    } catch (e) {
      console.error('[handleSearch] Error:', e);
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

  // Expenses preview logic
  const expensesToShow = showAllExpenses ? expenses : expenses.slice(0, EXPENSES_PREVIEW_COUNT);
  const hasMoreExpenses = expenses.length > EXPENSES_PREVIEW_COUNT;

  // Calculate settlements (exclude settled)
  const balances = group ? calculateBalances(group.members, expenses) : {};
  const allSettlements = calculateSettlements(balances);

  // Only show settlements that have NOT been settled
  const settlements = allSettlements.filter(
    (s, idx) => !settledIds.includes(`${s.from}_${s.to}_${s.amount}`)
  );
  const settledSettlements = allSettlements.filter(
    (s, idx) => settledIds.includes(`${s.from}_${s.to}_${s.amount}`)
  );

  // Mark a settlement as settled (in-memory)
  const settleUp = (from: string, to: string, amount: number) => {
    setSettledIds(prev => [...prev, `${from}_${to}_${amount}`]);
  };

  // Reset settledIds when expenses or members change (new expense = new round of settlements)
  useEffect(() => {
    setSettledIds([]);
  }, [expenses.length, group?.members?.length]);

  // Total expenses
  const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

  return {
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
    expensesLoading,
    expensesToShow,
    hasMoreExpenses,
    showAllExpenses,
    setShowAllExpenses,
    settlements,
    settledSettlements,
    settleUp,
    getUsername,
    totalExpenses,
  };
}
