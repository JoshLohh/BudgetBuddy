import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { databases } from '@/lib/appwrite';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Spacer from '@/components/Spacer';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const groupsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';
const usersCollectionId = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID ?? '';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [membersExpanded, setMembersExpanded] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

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

  // Fetch member profiles when group changes or members change
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

  // Search for users by username
  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await databases.listDocuments(
        databaseId,
        usersCollectionId,
        []
      );
      const filtered = res.documents.filter(doc =>
        doc.username?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
      setSearchResults(filtered);
    } catch (e) {
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

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={{ color: 'red' }}>{error}</ThemedText>
      </ThemedView>
    );
  }

  if (!group) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>No group data.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ThemedView style={styles.container}>
          <Spacer/>
          {/* Group Title and Description */}
          <ThemedText type="title" style={styles.title}>{group.title}</ThemedText>
          {group.description ? (
            <ThemedText style={styles.description}>{group.description}</ThemedText>
          ) : null}

          {/* Group Meta: Member Count */}
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={18} color={Colors.primary} />
            <ThemedText style={styles.metaText}>
              {group.members.length} member{group.members.length !== 1 ? 's' : ''}
            </ThemedText>
          </View>

          {/* Members Dropdown (compact, scrollable) */}
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setMembersExpanded(prev => !prev)}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.membersTitle}>Group Members</ThemedText>
            <Ionicons
              name={membersExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.primary}
            />
          </TouchableOpacity>
          {membersExpanded && (
            <View style={styles.membersDropdown}>
              <FlatList
                data={memberProfiles}
                keyExtractor={item => item.userId}
                renderItem={({ item }) => (
                  <View style={styles.memberRow}>
                    <ThemedText style={styles.memberText}>{item.username}</ThemedText>
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(item.userId)}
                      style={styles.removeBtn}
                    >
                      <Ionicons name="close-circle" size={18} color="#e57373" />
                    </TouchableOpacity>
                  </View>
                )}
                style={styles.membersList}
                contentContainerStyle={{ paddingBottom: 4 }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                ListEmptyComponent={<ThemedText style={{ color: '#aaa' }}>No members.</ThemedText>}
              />
              <Spacer height={8} />
              {/* Add member search */}
              <TouchableOpacity
                style={styles.addMemberBtn}
                onPress={() => setSearchModalVisible(true)}
              >
                <Ionicons name="person-add" size={18} color="#fff" />
                <ThemedText style={{ color: '#fff', marginLeft: 6 }}>Add Member</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Expenses and Settlements Sections */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Expenses</ThemedText>
            <ThemedText style={styles.placeholder}>No expenses yet.</ThemedText>
          </View>
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Settlements</ThemedText>
            <ThemedText style={styles.placeholder}>No settlements yet.</ThemedText>
          </View>

          {/* Add Member Modal */}
          <Modal
            visible={searchModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setSearchModalVisible(false)}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <ThemedText style={styles.modalTitle}>Add Member</ThemedText>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search username..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    autoFocus
                  />
                  <Spacer height={8} />
                  {searching ? (
                    <ActivityIndicator />
                  ) : (
                    <FlatList
                      data={searchResults}
                      keyExtractor={item => item.$id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.searchResultRow}
                          onPress={() => handleAddMember(item.$id)}
                        >
                          <ThemedText style={styles.searchResultText}>{item.username}</ThemedText>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={
                        <ThemedText style={{ color: '#aaa', textAlign: 'center' }}>
                          {searchQuery ? 'No users found.' : 'Enter a username to search.'}
                        </ThemedText>
                      }
                      keyboardShouldPersistTaps="handled"
                    />
                  )}
                  <Spacer height={8} />
                  <TouchableOpacity
                    style={styles.closeModalBtn}
                    onPress={() => setSearchModalVisible(false)}
                  >
                    <ThemedText style={{ color: '#fff' }}>Close</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </ThemedView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { marginBottom: 4 },
  description: { fontSize: 15, color: '#555', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  metaText: { fontSize: 14, color: '#888', marginLeft: 4 },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    marginTop: 8,
    paddingVertical: 8,
  },
  membersTitle: { fontSize: 16, fontWeight: '600' },
  membersDropdown: {
    maxHeight: 180,
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    elevation: 2,
  },
  membersList: { maxHeight: 120 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
  },
  memberText: { fontWeight: '500', color: '#333', fontSize: 15 },
  removeBtn: { marginLeft: 8, padding: 2 },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 4,
  },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  placeholder: { color: '#aaa', fontStyle: 'italic', marginLeft: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  searchResultRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  searchResultText: { fontSize: 16, color: '#333' },
  closeModalBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
});
