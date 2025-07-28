import React, { useState, useEffect } from 'react';
import { ScrollView, View, Image, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { databases } from '@/lib/appwrite';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Spacer from '@/components/Spacer';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryIconName, IoniconName } from '@/constants/categoryUtils';
import { Query } from 'appwrite';
import { Colors } from '@/constants/Colors';
import { Expense, Settlement } from '@/types';
import type { UserProfile } from '@/types/user';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';
const settlementsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_SETTLEMENTS_COLLECTION_ID ?? '';
const usersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? '';

export default function GroupHistoryPage() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // to sort dates
  const toggleSortOrder = () => setSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'));

  // to format dates
  const formatDate = (isoString: string)  =>
  new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  // Fetch all data on mount and when focused
  const fetchData = async () => {
    if (!groupId) return;
    setLoading(true);
    const [expRes, setRes] = await Promise.all([
      databases.listDocuments(databaseId, expensesCollectionId, [Query.equal('groupId', groupId)]),
      databases.listDocuments(databaseId, settlementsCollectionId, [Query.equal('groupId', groupId)]),
    ]);
    setExpenses(
      expRes.documents.map((doc: any) => ({
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
    setSettlements(
      setRes.documents.map((doc: any) => ({
        $id: doc.$id,
        groupId: doc.groupId,
        from: doc.from,
        to: doc.to,
        amount: doc.amount,
        $createdAt: doc.$createdAt,
      }))
    );

    // Collect all userIds
    const userIds = new Set<string>();
    expRes.documents.forEach(e => {
      userIds.add(e.paidBy);
      (e.splitBetween ?? []).forEach((uid: string) => userIds.add(uid));
    });
    setRes.documents.forEach(s => {
      userIds.add(s.from);
      userIds.add(s.to);
    });

    // Fetch all user profiles
    const profiles = await Promise.all(
      [...userIds].map((uid: string) =>
        databases
          .getDocument(databaseId, usersCollectionId, uid)
          .then(profile => ({
            userId: uid,
            username: profile.username,
            avatar: profile.avatar || null,
          }))
          .catch(() => ({ userId: uid, username: '(unknown)', avatar: null }))
      )
    );
    setUserProfiles(profiles);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [groupId])
  );

  const getUserProfile = (userId: string): UserProfile =>
    userProfiles.find(p => p.userId === userId) || { userId, username: userId, avatar: null };

  // Merge and sort by creation date
  // const activity = [
  //   ...expenses.map(e => ({ ...e, type: 'expense', date: e.$createdAt })),
  //   ...settlements.map(s => ({ ...s, type: 'settlement', date: s.$createdAt })),
  // ].sort((a, b) =>
  //   sortOrder === 'ASC'
  //     ? new Date(a.date) - new Date(b.date)
  //     : new Date(b.date) - new Date(a.date)
  // );

  type ActivityItem =
    | (Expense & { type: 'expense'; date: string })
    | (Settlement & { type: 'settlement'; date: string });

  const activity: ActivityItem[] = [
    ...expenses.map(e => ({ ...e, type: 'expense' as const, date: e.$createdAt })),
    ...settlements.map(s => ({ ...s, type: 'settlement' as const, date: s.$createdAt })),
  ].sort((a, b) =>
    sortOrder === 'ASC'
      ? new Date(a.date).getTime() - new Date(b.date).getTime()
      : new Date(b.date).getTime() - new Date(a.date).getTime()
  );


  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <Spacer height={30} />
      <TouchableOpacity testID = "back-button" accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 10 }}>
      <ThemedText type="title" style={{ marginBottom: 12, marginTop: 10 }}>Activity Log</ThemedText>
        <TouchableOpacity
          onPress={toggleSortOrder}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: '#f0f0f0'
          }}
        >
          <Ionicons name={sortOrder === 'ASC' ? 'arrow-up' : 'arrow-down'} size={16} color="#1976d2" />
          <Text style={{ color: '#1976d2', marginLeft: 4, fontWeight: 'bold' }}>
            {sortOrder === 'ASC' ? 'Oldest' : 'Newest'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView>
        {loading ? (
          <ThemedText>Loading...</ThemedText>
        ) : activity.length === 0 ? (
          <ThemedText>No activity yet.</ThemedText>
        ) : (
          activity.map((item: ActivityItem, idx: number) => {
            if (item.type === 'expense') {
              const profile = getUserProfile(item.paidBy);

              return (
              <View
                key={item.$id}
                testID={`activity-${item.$id}`}
                style={{
                  backgroundColor: '#f7f7f7',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 54,
                }}
              >
                {profile.avatar ? (
                  <Image
                    source={{ uri: profile.avatar }}
                    style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: '#fff' }}
                  />
                ) : (
                  <Ionicons name="person-circle" size={32} color="#888" style={{ marginRight: 10 }} />
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemedText style={{ fontWeight: 'bold', fontSize: 15 , color:'black'}}>
                    {profile.username}
                  </ThemedText>
                  <ThemedText
                    style={{
                      flexWrap: 'wrap',
                      fontSize: 14,
                      color: '#333',
                      marginTop: 2,
                    }}
                    numberOfLines={3}
                  >
                    paid{" "}
                    <Text style={{ color: '#1e88e5', fontWeight: 'bold'}}>
                      ${parseFloat(String(item.amount)).toFixed(2)}
                    </Text> 
                    {" "}for "{item.description}"
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
                    {formatDate(item.date)}
                  </ThemedText>
                </View>
                <Ionicons name={getCategoryIconName(item.category || 'Others') as IoniconName} size={22} color="#1976d2" />
              </View>
              );
            } else {
              const fromProfile = getUserProfile(item.from);
              const toProfile = getUserProfile(item.to);

              return (
              <View
                key={item.$id}
                testID={`activity-${item.$id}`}
                style={{
                  backgroundColor: '#eafbe7',
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 54,
                }}
              >
                {fromProfile.avatar ? (
                  <Image
                    source={{ uri: fromProfile.avatar }}
                    style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: '#fff' }}
                  />
                ) : (
                  <Ionicons name="person-circle" size={32} color="#888" style={{ marginRight: 10 }} />
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemedText style={{ fontWeight: 'bold', fontSize: 15 , color:'black'}}>
                    {fromProfile.username}
                  </ThemedText>
                  <ThemedText
                    style={{
                      flexWrap: 'wrap',
                      fontSize: 14,
                      color: '#333',
                      marginTop: 2,
                    }}
                    numberOfLines={3}
                  >
                    settled up with{' '}
                    <ThemedText style={{ fontWeight: 'bold' , color:'black'}}>
                      {toProfile.username}
                    </ThemedText>
                    {' '}for{' '}
                    <Text style={{ color: '#1e88e5', fontWeight: 'bold'}}>
                      ${parseFloat(String(item.amount)).toFixed(2)}
                    </Text>
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
                    {formatDate(item.date)}
                  </ThemedText>
                </View>
              </View>
              );
            }
          })
        )}
        <Spacer height={80}/>
      </ScrollView>
    </ThemedView>
  );
}
