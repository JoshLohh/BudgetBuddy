import React, { useCallback, useEffect, useRef, useContext} from 'react';
import { useGroups } from '@/hooks/useGroups';
import { useUser } from '@/hooks/useUser';
import { useGroupDetails } from '@/hooks/useGroupDetails';
import { GroupsContext } from '@/contexts/GroupsContext';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ActivityIndicator, FlatList, TouchableOpacity, StyleSheet, Pressable, View, Modal, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedButton } from '@/components/ThemedButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Spacer from '@/components/Spacer';
import ThemedCard from '@/components/ThemedCard';
import { Colors } from '@/constants/Colors';
import ThemedTextInput from '@/components/ThemedTextInput';
import { Ionicons } from '@expo/vector-icons';
import { databases } from '@/lib/appwrite';

const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const groupsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';

export default function GroupsScreen() {
  const { groups, fetchGroups } = useGroups();
  const { user } = useUser();
  const context = useContext(GroupsContext);
  const router = useRouter();
  const[loading, setLoading] = useState(false)
  const [search, setSearch] = useState('');
  const [filteredGroups, setFilteredGroups] = useState(groups);
  const [menuVisibleId, setMenuVisibleId] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = Colors[colorScheme].background;
  const headerBackgroundColor = { dark: '#222', light: '#fff' };
  

  useEffect(() => {
    fetchGroups();
  }, [user]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredGroups(groups);
    } else {
      setFilteredGroups(
        groups.filter(group =>
          group.title.toLowerCase().includes(search.trim().toLowerCase())
        )
      );
    }
  }, [search, groups]);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  const deleteGroupForUser = async (group) => {
    console.log('deleteGroupForUser called with group:', group);

    if (!group) {
      console.log('No group provided');
      return;
    }
    if (!user) {
      console.log('No user found');
      return;
    }
    if (!context) {
      console.log('GroupsContext is undefined');
      return;
    }

    const { deleteGroup } = context;

    if (group.members.length > 1) {
      console.log('More than one member, removing user:', user.$id);
      try {
        const updatedMembers = group.members.filter(id => id !== user.$id);
        await databases.updateDocument(
        databaseId,
        groupsCollectionId,
        group.id,
        { members: updatedMembers }
      );
        console.log('handleRemoveMember completed');
      } catch (error) {
        console.log('Error in handleRemoveMember:', error);
      }
    } else {
      console.log('Only one member, deleting group:', group.id);
      try {
        await deleteGroup(group.id);
        console.log('deleteGroup completed');
      } catch (error) {
        console.log('Error in deleteGroup:', error);
      }
    }
  };


  // FlatList renderItem
  const renderItem = ({ item }) => (
    <ThemedCard style={styles.card}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Pressable onPress={() => router.push(`/group/${item.id}`)}>
          <ThemedText type="subtitle">{item.title}</ThemedText>
          <ThemedText>{item.description}</ThemedText>
        </Pressable>
      </View>
      <Pressable
        onPress={() => setMenuVisibleId(item.id)}
        style={styles.menuButton}
      >
        <Ionicons name="ellipsis-vertical" size={22} color="#888" />
      </Pressable>
      {/* Simple Popup Menu at a fixed position */}
      {menuVisibleId === item.id && (
        <Modal
          transparent
          animationType="fade"
          visible={true}
          onRequestClose={() => setMenuVisibleId(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setMenuVisibleId(null)} />
          <View style={styles.centeredModalContainer}>
            {/* Close Button */}
            <Pressable
              style={styles.closeButton}
              onPress={() => setMenuVisibleId(null)}
              hitSlop={10}
            >
              <Ionicons name="close" size={22} color="#888" />
            </Pressable>
            {/* Group Info */}
            <View style={styles.groupInfoSection}>
              <Ionicons name="people-circle" size={40} color="#007AFF" style={{ marginBottom: 8 }} />
              <ThemedText type="subtitle" style={styles.groupTitleModal}>
                {item.title}
              </ThemedText>
              <ThemedText style={styles.groupDescModal}>{item.description}</ThemedText>
            </View>
            {/* Exit Group Action */}
            <Pressable
              style={styles.exitButton}
              onPress={() => {
                setMenuVisibleId(null);
                deleteGroupForUser(item);
              }}
            >
              <Ionicons name="exit-outline" size={20} color="#e53935" style={{ marginRight: 6 }} />
              <ThemedText style={styles.exitButtonText}>Leave & Exit Group</ThemedText>
            </Pressable>
          </View>
        </Modal>
      )}
    </ThemedCard>
  );

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <ThemedView style={{ flex: 1, backgroundColor }}>
      <View style={[styles.header, { backgroundColor: headerBackgroundColor[colorScheme] }]}>
	              <IconSymbol
	                size={350}
	                color="#0a7ea4"
	                name="person.3.sequence.fill"
	                style={styles.headerImage}
	              />
	    </View>
      <ThemedText type="title" style={{ marginLeft: 20}}>My Groups</ThemedText>
      <ThemedView style={{alignItems:'center'}}>
      <ThemedTextInput
						style={styles.searchBar}
						placeholder="Search groups..."
						value={search}
						onChangeText={setSearch}
						autoCorrect={false}
						autoCapitalize="none"
					/>
      </ThemedView>
      <Spacer height={10}/>
		<FlatList
			data={filteredGroups}
			keyExtractor={item => item.id}
			contentContainerStyle={styles.list}
			renderItem={renderItem}
			ListEmptyComponent={
				<ThemedText type='subtitle' style={{ textAlign: 'center' }}>
					No groups found. Create one!
				</ThemedText>
			}
			ListFooterComponent={
			<ThemedView style={{ alignItems:'center'}}>
				<ThemedButton 
	        onPress={() => router.push('/group/create')} 
	        style={styles.createBtn}
	      >
	        <ThemedText style={{ color: '#f2f2f2' , textAlign: 'center'}}>Create Group</ThemedText>
	      </ThemedButton>
        <Spacer height={110}/>
      </ThemedView>
      }
		/>
		</ThemedView>
    
  );
}

const styles = StyleSheet.create({
  headerImage: {
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  header: {
    height: 250,
    overflow: 'hidden',
    width: '100%',
  },
  list: {
    alignItems: 'center'
  },
  createBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
    width:'60%',
  },
  card: {
    width: 300,
    marginHorizontal: "5%",
    marginVertical: 10,
    padding: 10,
    paddingLeft: 14,
    borderLeftColor: Colors.primary,
    borderLeftWidth: 4,
    flexDirection: 'row',
  },
  searchBar: {
    width: 320,
    marginTop: 16,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
  },
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  centeredModalContainer: {
    position: 'absolute',
    bottom: 90,              // 90 pixels from the bottom edge
    left: '50%',             // Center horizontally
    transform: [{ translateX: -150 }], // Center the modal (half its width)
    width: 300,
    minHeight: 180,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    zIndex: 10,
  },
  groupInfoSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  groupTitleModal: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 4,
    textAlign: 'center',
  },
  groupDescModal: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 2,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeaea',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  exitButtonText: {
    color: '#e53935',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
