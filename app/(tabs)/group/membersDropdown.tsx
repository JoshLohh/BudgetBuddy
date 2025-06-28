import React from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { ThemedButton } from '@/components/ThemedButton';
import Spacer from '@/components/Spacer';

type UserProfile = {
  userId: string;
  username: string;
};

interface MembersDropdownProps {
  group: any; // You can replace 'any' with your actual group type if available
  membersExpanded: boolean;
  setMembersExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  memberProfiles: UserProfile[];
  handleRemoveMember: (userId: string) => void;
  setSearchModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const MembersDropdown: React.FC<MembersDropdownProps> = ({
  group,
  membersExpanded,
  setMembersExpanded,
  memberProfiles,
  handleRemoveMember,
  setSearchModalVisible,
}) => {
  return (
    <>
      <View style={styles.headerRow}>
        <ThemedText style={styles.headerText}>Group Members</ThemedText>
        <TouchableOpacity onPress={() => setMembersExpanded(prev => !prev)} activeOpacity={0.7}>
          <Ionicons name={membersExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#1e88e5" />
        </TouchableOpacity>
      </View>
      {membersExpanded && (
        <View style={styles.dropdown}>
          {memberProfiles.length === 0 ? (
            <ThemedText>No members.</ThemedText>
          ) : (
            <FlatList<UserProfile>
              data={memberProfiles}
              keyExtractor={item => item.userId}
              renderItem={({ item }) => (
                <View style={styles.memberRow}>
                  <ThemedText style={styles.memberText}>{item.username}</ThemedText>
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(item.userId)}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="remove-circle" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 4 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              ListEmptyComponent={<ThemedText>No members.</ThemedText>}
            />
          )}
          <ThemedButton onPress={() => setSearchModalVisible(true)} style={styles.addMemberBtn}>
            <Ionicons name="person-add" size={18} color="#fff" />
            <Spacer width={6} />
            <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Add Member</ThemedText>
          </ThemedButton>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  dropdown: {
    maxHeight: 180,
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    elevation: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
  },
  memberText: {
    fontWeight: '500',
    color: '#333',
    fontSize: 15,
  },
  removeBtn: {
    marginLeft: 8,
    padding: 2,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e88e5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 10,
  },
});

export default MembersDropdown;
