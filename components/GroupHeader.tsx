import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import { ThemedButton } from '@/components/ThemedButton';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { databases } from '@/lib/appwrite';
import { router } from 'expo-router';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const groupsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';

export default function GroupHeader({ group, totalExpenses, onGroupUpdated }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(group?.title || '');
  const [description, setDescription] = useState(group?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(group?.title || '');
    setDescription(group?.description || '');
  }, [group]);

  if (!group) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', minHeight: 80 }]}>
        <ActivityIndicator />
      </View>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await databases.updateDocument(databaseId, groupsCollectionId, group.id, {
        title,
        description,
      });
      setEditing(false);
      if (onGroupUpdated) {
        onGroupUpdated({ ...group, title, description });
      }
    } catch (e) {
      setError('Failed to update group details.');
    }
    setSaving(false);
  };

  if (editing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.leftCol}>
            <ThemedTextInput
              label="Group Name"
              value={title}
              onChangeText={setTitle}
              style={{ marginBottom: 8 }}
            />
            <ThemedTextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              style={{ marginBottom: 8 }}
            />
            {error ? (
              <ThemedText style={{ color: 'red', marginBottom: 8 }}>{error}</ThemedText>
            ) : null}
          </View>
          <View style={styles.rightCol}>
            <View style={styles.totalCard}>
              <ThemedText style={styles.totalLabel}>Total</ThemedText>
              <ThemedText style={styles.totalAmount}>${totalExpenses.toFixed(2)}</ThemedText>
            </View>
            <ThemedButton
              onPress={handleSave}
              disabled={saving}
              style={styles.editBtn}
            >
              <ThemedText style={{ color: '#fff' }}>
                {saving ? 'Saving...' : 'Save'}
              </ThemedText>
            </ThemedButton>
            <ThemedButton
              onPress={() => setEditing(false)}
              style={[styles.editBtn, { backgroundColor: '#e0e0e0', marginTop: 8 }]}
            >
              <ThemedText style={{ color: '#333' }}>Cancel</ThemedText>
            </ThemedButton>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <ThemedText type="title" style={styles.groupTitle}>{group.title}</ThemedText>
          {group.description ? (
            <ThemedText style={styles.groupDescription}>{group.description}</ThemedText>
          ) : null}
          <ThemedText style={styles.membersCount}>
            {group.members?.length ?? 0} member{(group.members?.length ?? 0) !== 1 ? 's' : ''}
          </ThemedText>
          <ThemedButton
            onPress={() => router.push({ pathname: '/group/[groupId]/history', params: { groupId: group.id } })}
            style={{
              marginTop: 4,           
              marginBottom: 4,        
              height: 32,             
              alignSelf: 'flex-start',    
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 0,
              paddingHorizontal: 14,
              minWidth: 200,
            }}
          >
            <ThemedText style={{ textAlign: 'center', fontSize: 12, color:'#fff' }}>View Activity Log</ThemedText>
          </ThemedButton>
        </View>
        <View style={styles.rightCol}>
          <View style={styles.totalCard}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalAmount}>${totalExpenses.toFixed(2)}</ThemedText>
          </View>
          <ThemedButton
            onPress={() => setEditing(true)}
            style={styles.editBtn}
          >
            <Ionicons name="pencil" size={18} color="#fff" />
          </ThemedButton>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff', 
    padding: 10,
    marginBottom: 10,
    borderRadius: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
    marginRight: 12,
  },
  rightCol: {
    alignItems: 'flex-end',
    minWidth: 110,
  },
  groupTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'black'
  },
  groupDescription: {
    fontSize: 15,
    color: '#555',
    marginBottom: 4,
  },
  membersCount: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  totalCard: {
    backgroundColor: '#b3e0ff', 
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    minWidth: 110,
    elevation: 2,
    marginBottom: 10,
    alignSelf: 'flex-end',
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
  editBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 0,
    width: 110,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
