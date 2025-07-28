import { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { useFocusEffect } from 'expo-router';
import React from 'react';
import { calculateBalances, calculateSettlements } from './settlementUtils';
import type { MemberProfile, Group, Expense, Settlement } from '@/types';
import { Alert } from 'react-native';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const groupsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';
const usersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? '';
const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';
const settlementsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_SETTLEMENTS_COLLECTION_ID ?? '';

export function useGroupDetails(groupId: string | string[] | undefined) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [membersExpanded, setMembersExpanded] = useState<boolean>(false);
  const [memberProfiles, setMemberProfiles] = useState<MemberProfile[]>([]);
  const [searchModalVisible, setSearchModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MemberProfile[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState<boolean>(false);
  const [showAllExpenses, setShowAllExpenses] = useState<boolean>(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

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
          $id: doc.$id,
          title: doc.title,
          description: doc.description,
          members: doc.members ?? [],
          createdBy: doc.createdBy,
          avatar: doc.avatar, 
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
        setExpenses(
          (res.documents as any[]).map(doc => ({
            $id: doc.$id,
            amount: doc.amount,
            paidBy: doc.paidBy,
            splitBetween: doc.splitBetween,
            splitType: doc.splitType,
            customSplit: doc.customSplit,
            description: doc.description,
            groupId: doc.groupId,
            category: doc.category ?? 'Others',
            $createdAt: doc.$createdAt,
          }))
        );
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
        setSettlements(
          (res.documents as any[]).map(doc => ({
            $id: doc.$id,
            from: doc.from,
            to: doc.to,
            amount: doc.amount,
            groupId: doc.groupId,
            $createdAt: doc.$createdAt,
          }))
        );
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
          setExpenses(
            (res.documents as any[]).map(doc => ({
              $id: doc.$id,
              amount: doc.amount,
              paidBy: doc.paidBy,
              splitBetween: doc.splitBetween,
              splitType: doc.splitType,
              customSplit: doc.customSplit,
              description: doc.description,
              groupId: doc.groupId,
              category: doc.category ?? 'Others',
              $createdAt: doc.$createdAt,
            }))
          );
          setExpensesLoading(false);
        })
        .catch(() => setExpensesLoading(false));

      databases
        .listDocuments(databaseId, settlementsCollectionId, [Query.equal('groupId', groupId)])
        .then(res => {
          setSettlements(
            (res.documents as any[]).map(doc => ({
              $id: doc.$id,
              from: doc.from,
              to: doc.to,
              amount: doc.amount,
              groupId: doc.groupId,
              $createdAt: doc.$createdAt,
            }))
          );
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
      setMemberProfiles(profiles as MemberProfile[]);
      setLoading(false);
    });
  }, [group]);

  // Helper to get username
  const getUsername = (userId: string) => {
    const profile = memberProfiles.find(p => p.userId === userId);
    return profile ? profile.username : userId;
  };

  async function fetchUsernameById(userId: string) {
    try {
      const userDoc = await databases.getDocument(
        databaseId,
        usersCollectionId,
        userId
      );
      // Assuming your user document has a 'username' field
      return userDoc.username || "Unknown User";
    } catch (error) {
      console.error('Error fetching username:', error);
      return "Unknown User";
    }
  }

  // Calculate balances and suggested settlements
  const balances = group ? calculateBalances(group.members, expenses, settlements) : {};
  const allSettlements = group ? calculateSettlements(balances) : [];

  // Only show settlements that have not yet been recorded
  const existingSettleKeys = new Set(
    settlements.map(s => `${s.from}_${s.to}_${+parseFloat(String(s.amount)).toFixed(2)}`)
  );
  const suggestedSettlements = allSettlements.filter(
    s => !existingSettleKeys.has(`${s.from}_${s.to}_${+parseFloat(String(s.amount)).toFixed(2)}`)
  );

  // Settle up: create a new settlement in Appwrite and refetch
  const settleUp = async (from: string, to: string, amount: number) => {
    if (!group) return;
    await databases.createDocument(
      databaseId,
      settlementsCollectionId,
      ID.unique(),
      {
        groupId: group.$id,
        from,
        to,
        amount,
      }
    );
    // Refetch settlements to update the UI
    const res = await databases.listDocuments(databaseId, settlementsCollectionId, [Query.equal('groupId', group.$id)]);
    setSettlements(
      (res.documents as any[]).map(doc => ({
        $id: doc.$id,
        from: doc.from,
        to: doc.to,
        amount: doc.amount,
        groupId: doc.groupId,
        $createdAt: doc.$createdAt,
      }))
    );
  };

  // Total expenses
  const totalExpenses = expenses.reduce((sum, exp) => {
    const amt = parseFloat(String(exp.amount));
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  // User search
  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await databases.listDocuments(databaseId, usersCollectionId, [Query.limit(10000)]);
      const filtered = res.documents.filter(doc =>
        doc.username?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
      setSearchResults(
        filtered.map((doc: any) => ({
          userId: doc.$id,
          username: doc.username,
          avatar: doc.avatar || null,
        }))
      );
    } catch (e) {
      setSearchResults([]);
    }
    setSearching(false);
  };

  // Add member
  const handleAddMember = async (userId: string) => {
    if (!group) {
      console.log('handleAddMember: group is null or undefined');
      return;
    }
    if (group.members.includes(userId)) {
      console.log(`handleAddMember: userId ${userId} already in group.members`);
      return;
    }
    const updatedMembers = [...group.members, userId];
    console.log('handleAddMember: group.id =', group.$id);
    console.log('handleAddMember: updatedMembers =', updatedMembers);

    await databases.updateDocument(
      databaseId,
      groupsCollectionId,
      group.$id, // Check this value in your logs
      { members: updatedMembers }
    );

    setGroup({ ...group, members: updatedMembers });
    setSearchModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };



  // Remove member
  // const handleRemoveMember = async (userId: string) => {
  //   if (!group) return;
  //   const updatedMembers = group.members.filter(id => id !== userId);
  //   await databases.updateDocument(databaseId, groupsCollectionId, group.$id, { members: updatedMembers });
  //   setGroup({ ...group, members: updatedMembers });
  // };
  const handleRemoveMember = async (userId: string, skipAlert= false) => {
    if (!group) return;
    if (skipAlert) {
      // Remove directly without alert (for tests or internal logic)
      const updatedMembers = group.members.filter(id => id !== userId);
      await databases.updateDocument(databaseId, groupsCollectionId, group.$id, {
        members: updatedMembers,
      });
      setGroup({ ...group, members: updatedMembers });
      return;
    }
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${getUsername(userId)} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedMembers = group.members.filter(id => id !== userId);
            await databases.updateDocument(databaseId, groupsCollectionId, group.$id, { members: updatedMembers });
            setGroup({ ...group, members: updatedMembers });
          },
        },
      ]
    );
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
