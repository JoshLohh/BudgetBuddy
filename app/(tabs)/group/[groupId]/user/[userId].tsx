import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import Spacer from '@/components/Spacer';
import { User, UserProfile } from '@/types';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const groupsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';
const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';
const usersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? '';


export default function UserProfileScreen() {
  const { groupId, userId } = useLocalSearchParams<{ groupId: string; userId: string }>();
  const router = useRouter();

  const [profile, setProfile] = useState<User | null>(null);
  const [groupsCount, setGroupsCount] = useState(0);
  const [userExpensesCount, setUserExpensesCount] = useState(0);
  const [userTotalSpent, setUserTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndStats = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const userDoc = await databases.getDocument(
        databaseId,
        usersCollectionId,
        userId,
      );
      const user: User = {
        $id: userDoc.$id,
        email: userDoc.email,
        username: userDoc.username,
        avatar: userDoc.avatar,
        bio: userDoc.bio,
      };
      setProfile(user);

      // Fetch group count
      const groupsRes = await databases.listDocuments(
        databaseId,
        groupsCollectionId,
        [Query.search('members', userId)]
      );
      setGroupsCount(groupsRes.documents.length);

      const groupIds = groupsRes.documents.map(doc => doc.$id);
      if (groupIds.length === 0) {
        setUserExpensesCount(0);
        setUserTotalSpent(0);
      } else {
        // Fetch expenses
        const expensesRes = await databases.listDocuments(
          databaseId,
          expensesCollectionId,
          [
            Query.equal('paidBy', userId),
            Query.equal('groupId', groupIds),
            Query.limit(100),
          ]
        );
        setUserExpensesCount(expensesRes.documents.length);
        const total = expensesRes.documents.reduce(
          (sum, doc) => sum + (parseFloat(doc.amount) || 0),
          0
        );
        setUserTotalSpent(total);
      }
    } catch (e) {
      setProfile(null);
      setGroupsCount(0);
      setUserExpensesCount(0);
      setUserTotalSpent(0);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfileAndStats();
  }, [fetchProfileAndStats]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText>User not found.</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Ionicons name="arrow-back" size={24} color="#1976d2" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Spacer/>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
      {/* <TouchableOpacity onPress={() => router.navigate(`/group/${groupId}`)} style={styles.backBtn}> */}
        <Ionicons name="arrow-back" size={24} color="#1976d2" />
      </TouchableOpacity>
      <View style={styles.topRow}>
        <Image
          source={
            profile.avatar
              ? { uri: profile.avatar }
              : require('@/assets/images/default-avatar.png')
          }
          style={styles.avatar}
        />
        <View style={styles.infoCol}>
          <ThemedText type="title" style={styles.username}>
            {profile.username || 'Unnamed'}
          </ThemedText>
        </View>
      </View>
      {profile.bio ? (
        <ThemedText style={{ fontSize: 15, marginLeft: 15, marginBottom: 20 }}>
          {profile.bio}
        </ThemedText>
      ) : null}
      <View style={styles.statsCard}>
        <View style={styles.statBox}>
          <ThemedText style={styles.statValue}>{groupsCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Groups</ThemedText>
        </View>
        <View style={styles.statBox}>
          <ThemedText style={styles.statValue}>${userTotalSpent.toFixed(2)}</ThemedText>
          <ThemedText style={styles.statLabel}>Total Spent</ThemedText>
        </View>
        <View style={styles.statBox}>
          <ThemedText style={styles.statValue}>{userExpensesCount}</ThemedText>
          <ThemedText style={styles.statLabel}>Expenses</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const AVATAR_SIZE = 100;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 16,
    justifyContent: 'flex-start',
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 10,
    zIndex: 10,
    padding: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 24,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginRight: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    marginBottom: 0,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
