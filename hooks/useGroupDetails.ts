import { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { useFocusEffect } from 'expo-router';
import React from 'react';
import { calculateBalances, calculateSettlements } from './settlementUtils';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const groupsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';
const usersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? '';
const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';
const settlementsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_SETTLEMENTS_COLLECTION_ID ?? '';

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
  const [settlements, setSettlements] = useState([]);

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
      .listDocuments(databaseId, expensesCollectionId, [Query.equal('groupId', groupId)])
      .then(res => {
        setExpenses(res.documents);
        setExpensesLoading(false);
      })
      .catch(() => setExpensesLoading(false));
  }, [groupId]);

  // Fetch settlements
  useEffect(() => {
    if (!groupId) return;
    databases
      .listDocuments(databaseId, settlementsCollectionId, [Query.equal('groupId', groupId)])
      .then(res => {
        setSettlements(res.documents);
      })
      .catch(() => setSettlements([]));
  }, [groupId]);

  // Refetch expenses and settlements on focus
  useFocusEffect(
    React.useCallback(() => {
      if (!groupId) return;
      setExpensesLoading(true);
      databases
        .listDocuments(databaseId, expensesCollectionId, [Query.equal('groupId', groupId)])
        .then(res => {
          setExpenses(res.documents);
          setExpensesLoading(false);
        })
        .catch(() => setExpensesLoading(false));

      databases
        .listDocuments(databaseId, settlementsCollectionId, [Query.equal('groupId', groupId)])
        .then(res => {
          setSettlements(res.documents);
        })
        .catch(() => setSettlements([]));
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
          .then(profile => ({
            userId: profile.$id,
            username: profile.username,
            avatar: profile.avatar || null,
          }))
          .catch(() => ({ userId, username: '(unknown)', avatar: null }))
      )
    ).then(profiles => {
      setMemberProfiles(profiles);
      setLoading(false);
    });
  }, [group]);

  // Helper to get username
  const getUsername = userId => {
    const profile = memberProfiles.find(p => p.userId === userId);
    return profile ? profile.username : userId;
  };

  // Calculate balances and suggested settlements
  const balances = group ? calculateBalances(group.members, expenses, settlements) : {};
  const allSettlements = group ? calculateSettlements(balances) : [];
  // Only show settlements that have not yet been recorded
  const existingSettleKeys = new Set(
    settlements.map(s => `${s.from}_${s.to}_${+parseFloat(s.amount).toFixed(2)}`)
  );
  const suggestedSettlements = allSettlements.filter(
    s => !existingSettleKeys.has(`${s.from}_${s.to}_${+parseFloat(s.amount).toFixed(2)}`)
  );

  // Settle up: create a new settlement in Appwrite and refetch
  const settleUp = async (from, to, amount) => {
    await databases.createDocument(
      databaseId,
      settlementsCollectionId,
      ID.unique(),
      {
        groupId: group.id,
        from,
        to,
        amount,
      }
    );
    // Refetch settlements to update the UI
    const res = await databases.listDocuments(databaseId, settlementsCollectionId, [Query.equal('groupId', group.id)]);
    setSettlements(res.documents);
  };

  // Total expenses
  const totalExpenses = expenses.reduce((sum, exp) => {
    const amt = parseFloat(exp.amount);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  // User search
  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await databases.listDocuments(databaseId, usersCollectionId, [Query.limit(100)]);
      const filtered = res.documents.filter(doc =>
        doc.username?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
      setSearchResults(filtered);
    } catch (e) {
      setSearchResults([]);
    }
    setSearching(false);
  };

  // Add member
  const handleAddMember = async userId => {
    if (!group) return;
    if (group.members.includes(userId)) return;
    const updatedMembers = [...group.members, userId];
    await databases.updateDocument(databaseId, groupsCollectionId, group.id, { members: updatedMembers });
    setGroup({ ...group, members: updatedMembers });
    setSearchModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove member
  const handleRemoveMember = async userId => {
    if (!group) return;
    const updatedMembers = group.members.filter(id => id !== userId);
    await databases.updateDocument(databaseId, groupsCollectionId, group.id, { members: updatedMembers });
    setGroup({ ...group, members: updatedMembers });
  };

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
    expensesToShow: showAllExpenses ? expenses : expenses.slice(0, EXPENSES_PREVIEW_COUNT),
    hasMoreExpenses: expenses.length > EXPENSES_PREVIEW_COUNT,
    showAllExpenses,
    setShowAllExpenses,
    settlements, // for history page
    suggestedSettlements, // for settlement list
    settleUp,
    getUsername,
    totalExpenses,
  };
}
