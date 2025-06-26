import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, FlatList, useColorScheme } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { databases } from '@/lib/appwrite';
import { Group } from '@/contexts/GroupsContext';
import Constants from 'expo-constants';
import { Colors } from '@/constants/Colors'; // adjust path if needed

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const collectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    const groupId = Array.isArray(id) ? id[0] : id;
    databases
      .getDocument(databaseId, collectionId, groupId)
      .then(doc => {
        setGroup({
          id: doc.$id,
          title: doc.title,
          description: doc.description,
          members: doc.members,
          createdBy: doc.createdBy,
        });
        setLoading(false);
      })
      .catch(err => {
        setError('Group not found.');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ThemedText style={{ color: theme.text }}>{error}</ThemedText>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ThemedText style={{ color: theme.text }}>No group data.</ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.uiBackGround ?? theme.background }]}>
        <ThemedText style={[styles.title, { color: theme.text }]}>{group.title}</ThemedText>
        <ThemedText style={[styles.description, { color: theme.text }]}>{group.description}</ThemedText>
        <View style={styles.metaRow}>
          <ThemedText style={{ color: theme.icon, fontSize: 14 }}>
            Created by:{' '}
            <ThemedText style={{ color: theme.tint }}>{group.createdBy}</ThemedText>
          </ThemedText>
        </View>
        <View style={styles.membersSection}>
          <ThemedText style={[styles.membersTitle, { color: theme.text }]}>Members:</ThemedText>
          <FlatList
            data={group.members}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.memberPill, { backgroundColor: theme.tint + '22' }]}>
                <ThemedText style={{ color: theme.tint }}>{item}</ThemedText>
              </View>
            )}
          />
        </View>
      </View>
      {/* Add ExpenseList and AddExpenseForm here */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  membersSection: {
    marginTop: 10,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  memberPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 4,
  },
});
