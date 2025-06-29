import React, { createContext, useContext, useCallback, useState } from 'react';
import { databases } from '@/lib/appwrite'; 
import { ID, Query } from 'react-native-appwrite';

type Expense = {
  $id: string;
  groupId: string;
  amount: number;
  description: string;
  paidBy: string;
  split: Record<string, number>; // userId -> share
  createdAt: string;
};

type ExpensesContextType = {
  expenses: Expense[];
  loading: boolean;
  fetchExpenses: (groupId: string) => Promise<void>;
  addExpense: (
    groupId: string,
    amount: number,
    description: string,
    paidBy: string,
    split: Record<string, number>
  ) => Promise<void>;
};

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export const ExpensesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  // Make sure these env vars are set in your .env and app.config.js
  const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
  const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';

  // Fetch all expenses for a group
  const fetchExpenses = useCallback(async (groupId: string) => {
    setLoading(true);
    try {
      const res = await databases.listDocuments(
        databaseId,
        expensesCollectionId,
        [Query.equal('groupId', groupId), Query.orderDesc('$createdAt')]
      );
      // Map each document to your Expense type
      setExpenses(
        res.documents.map((doc: any) => ({
          $id: doc.$id,
          groupId: doc.groupId,
          amount: doc.amount,
          description: doc.description,
          paidBy: doc.paidBy,
          split: doc.split,
          createdAt: doc.createdAt,
        }))
      );
    } catch (e) {
      setExpenses([]);
    }
    setLoading(false);
  }, [databaseId, expensesCollectionId]);

  // Add a new expense
  const addExpense = useCallback(
    async (
      groupId: string,
      amount: number,
      description: string,
      paidBy: string,
      split: Record<string, number>
    ) => {
      setLoading(true);
      try {
        const doc = await databases.createDocument(
          databaseId,
          expensesCollectionId,
          ID.unique(),
          {
            groupId,
            amount,
            description,
            paidBy,
            split,
            createdAt: new Date().toISOString(),
          }
        );
        setExpenses(prev => [
          {
            $id: doc.$id,
            groupId: doc.groupId,
            amount: doc.amount,
            description: doc.description,
            paidBy: doc.paidBy,
            split: doc.split,
            createdAt: doc.createdAt,
          },
          ...prev,
        ]);
      } finally {
        setLoading(false);
      }
    },
    [databaseId, expensesCollectionId]
  );

  return (
    <ExpensesContext.Provider value={{ expenses, loading, fetchExpenses, addExpense }}>
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = () => {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpensesProvider');
  return ctx;
};
