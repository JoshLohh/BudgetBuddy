import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { ThemedButton } from '@/components/ThemedButton';
import Spacer from '@/components/Spacer';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';

export default function MembersDropdown({
  group,
  membersExpanded,
  setMembersExpanded,
  memberProfiles,
  handleRemoveMember,
  setSearchModalVisible,
}) {
  const router = useRouter();

  return (
    <View>
      {/* Header Row: Group Members and Show/Hide */}
      <View style={styles.headerRow}>
        <ThemedText style={{ fontWeight: 'bold', fontSize: 17 }}>Group Members</ThemedText>
        <TouchableOpacity
          onPress={() => setMembersExpanded(prev => !prev)}
          activeOpacity={0.7}
          style={styles.toggleBtn}
        >
          <ThemedText style={{ color: '#1e88e5', fontWeight: 'bold' }}>
            {membersExpanded ? 'Hide' : 'Show'} Members
          </ThemedText>
          <Ionicons
            name={membersExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#1e88e5"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>
      {membersExpanded && (
        <View style={styles.dropdownContent}>
          {memberProfiles.length === 0 ? (
            <ThemedText style={{ color: '#aaa', marginLeft: 4 }}>No members.</ThemedText>
          ) : (
            memberProfiles.map(item => {
              console.log('Member avatar:', item.username, item.avatar);
              return (
              <View key={item.userId} style={styles.memberRow}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/user/[userId]',
                      params: { userId: item.userId },
                    })
                  }
                  style={styles.avatarTouchable}
                >
                  <Image
                    source={
                      item.avatar && typeof item.avatar === 'string'
                        ? { uri: item.avatar }
                        : require('../../../assets/images/default-avatar.png')
                    }
                    style={styles.avatar}
                  />
                </TouchableOpacity>
                <ThemedText style={{ marginLeft: 12, flex: 1 }}>{item.username}</ThemedText>
                <TouchableOpacity
                  onPress={() => handleRemoveMember(item.userId)}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close-circle" size={20} color="#e57373" />
                </TouchableOpacity>
              </View>
            )})
          )}
          <View style={styles.addContainer}>
          <ThemedButton onPress={() => setSearchModalVisible(true)} style={styles.addBtn}>
            <ThemedText style={{ color: '#fff' , textAlign: 'center'}}>+ Add Member</ThemedText>
          </ThemedButton>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  dropdownContent: {
    marginTop: 6,
    marginBottom: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 4,
  },
  avatarTouchable: {
    marginRight: 0,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eee',
  },
  removeBtn: {
    marginLeft: 8,
    alignSelf: 'flex-end',
    padding: 2,
  },
  addBtn: {
    justifyContent: 'center',
    backgroundColor: '#005c99',
    marginTop: 8,
    alignSelf: 'flex-end',
    width: 150,
  },
  addContainer: {
    width: '100%',
    alignItems: 'center',
  }
});
