import React, { useState, useEffect } from 'react';
import { ScrollView, View, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { databases } from '@/lib/appwrite';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Spacer from '@/components/Spacer';
import { Ionicons } from '@expo/vector-icons';
import { Query } from 'appwrite';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';
const settlementsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_SETTLEMENTS_COLLECTION_ID ?? '';
const usersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? '';

export default function GroupHistoryPage() {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [userProfiles, setUserProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount and when focused
  const fetchData = async () => {
    if (!groupId) return;
    setLoading(true);
    const [expRes, setRes] = await Promise.all([
      databases.listDocuments(databaseId, expensesCollectionId, [Query.equal('groupId', groupId)]),
      databases.listDocuments(databaseId, settlementsCollectionId, [Query.equal('groupId', groupId)]),
    ]);
    setExpenses(expRes.documents);
    setSettlements(setRes.documents);

    // Collect all userIds
    const userIds = new Set();
    expRes.documents.forEach(e => {
      userIds.add(e.paidBy);
      (e.splitBetween ?? []).forEach(uid => userIds.add(uid));
    });
    setRes.documents.forEach(s => {
      userIds.add(s.from);
      userIds.add(s.to);
    });

    // Fetch all user profiles
    const profiles = await Promise.all(
      [...userIds].map(uid =>
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

  const getUserProfile = userId =>
    userProfiles.find(p => p.userId === userId) || { username: userId, avatar: null };

  // Merge and sort by creation date
  const activity = [
    ...expenses.map(e => ({ ...e, type: 'expense', date: e.$createdAt })),
    ...settlements.map(s => ({ ...s, type: 'settlement', date: s.$createdAt })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <Spacer height={30} />
      <TouchableOpacity onPress={() => router.navigate(`/group/${groupId}`)}>
        <Ionicons name="arrow-back" size={24} color="#1976d2" />
      </TouchableOpacity>
      <ThemedText type="title" style={{ marginBottom: 12, marginTop: 10 }}>Activity Log</ThemedText>
      <ScrollView>
        {loading ? (
          <ThemedText>Loading...</ThemedText>
        ) : activity.length === 0 ? (
          <ThemedText>No activity yet.</ThemedText>
        ) : (
          activity.map((item, idx) =>
            item.type === 'expense' ? (
              <View
                key={item.$id}
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
                {getUserProfile(item.paidBy).avatar ? (
                  <Image
                    source={{ uri: getUserProfile(item.paidBy).avatar }}
                    style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: '#fff' }}
                  />
                ) : (
                  <Ionicons name="person-circle" size={32} color="#888" style={{ marginRight: 10 }} />
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemedText style={{ fontWeight: 'bold', fontSize: 15 , color:'black'}}>
                    {getUserProfile(item.paidBy).username}
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
                    paid ${parseFloat(item.amount).toFixed(2)} for "{item.description}"
                  </ThemedText>
                </View>
              </View>
            ) : (
              <View
                key={item.$id}
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
                {getUserProfile(item.from).avatar ? (
                  <Image
                    source={{ uri: getUserProfile(item.from).avatar }}
                    style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: '#fff' }}
                  />
                ) : (
                  <Ionicons name="person-circle" size={32} color="#888" style={{ marginRight: 10 }} />
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemedText style={{ fontWeight: 'bold', fontSize: 15 , color:'black'}}>
                    {getUserProfile(item.from).username}
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
                      {getUserProfile(item.to).username}
                    </ThemedText>
                    {' '}for ${parseFloat(item.amount).toFixed(2)}
                  </ThemedText>
                </View>
              </View>
            )
          )
        )}
        <Spacer height={80}/>
      </ScrollView>
    </ThemedView>
  );
}
