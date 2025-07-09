import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useUser } from '@/hooks/useUser';

type StatsContextType = {
  groupsCount: number;
  userExpensesCount: number;
  userTotalSpent: number;
  loading: boolean;
  refetchStats: () => Promise<void>;
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [groupsCount, setGroupsCount] = useState(0);
  const [userExpensesCount, setUserExpensesCount] = useState(0);
  const [userTotalSpent, setUserTotalSpent] = useState(0);
  const [loading, setLoading] = useState(false);

  const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
  const groupsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';
  const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';

  const fetchStats = useCallback(async () => {
    if (!user) {
      setGroupsCount(0);
      setUserExpensesCount(0);
      setUserTotalSpent(0);
      return;
    }
    setLoading(true);
    try {
      const groupsRes = await databases.listDocuments(
        databaseId,
        groupsCollectionId,
        [Query.contains('members', user.$id)]
      );
      setGroupsCount(groupsRes.documents.length);
      const groupIds = groupsRes.documents.map((doc: any) => doc.$id);

      if (groupIds.length === 0) {
        setUserExpensesCount(0);
        setUserTotalSpent(0);
        setLoading(false);
        return;
      }

      const expensesRes = await databases.listDocuments(
        databaseId,
        expensesCollectionId,
        [
          Query.equal('paidBy', user.$id),
          Query.equal('groupId', groupIds),
          Query.limit(100),
        ]
      );
      setUserExpensesCount(expensesRes.documents.length);
      const total = expensesRes.documents.reduce((sum: number, doc: any) => {
        const amt = parseFloat(String(doc.amount));
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);
      setUserTotalSpent(Number(total.toFixed(2)));
    } catch (error) {
      setGroupsCount(0);
      setUserExpensesCount(0);
      setUserTotalSpent(0);
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user, databaseId, groupsCollectionId, expensesCollectionId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <StatsContext.Provider
      value={{
        groupsCount,
        userExpensesCount,
        userTotalSpent,
        loading,
        refetchStats: fetchStats,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats must be used within StatsProvider');
  return ctx;
};
