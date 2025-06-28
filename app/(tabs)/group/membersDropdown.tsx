// MembersDropdown.tsx
import React from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { ThemedButton } from '@/components/ThemedButton';
import Spacer from '@/components/Spacer';

export default function MembersDropdown({
  group,
  membersExpanded,
  setMembersExpanded,
  memberProfiles,
  handleRemoveMember,
  setSearchModalVisible,
}) {
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, marginTop: 8, paddingVertical: 8 }}>
        <ThemedText style={{ fontSize: 18, fontWeight: '600' }}>Group Members</ThemedText>
        <TouchableOpacity onPress={() => setMembersExpanded(prev => !prev)} activeOpacity={0.7}>
          <Ionicons name={membersExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#1e88e5" />
        </TouchableOpacity>
      </View>
      {membersExpanded && (
        <View style={{
          maxHeight: 180,
          backgroundColor: '#f7f7f7',
          borderRadius: 10,
          padding: 8,
          marginBottom: 6,
          elevation: 2,
        }}>
            <View style={{ maxHeight: 120 }}>
                {memberProfiles.length === 0 ? (
                    <ThemedText style={{ color: '#aaa' }}>No members.</ThemedText>
                ) : (
                    memberProfiles.map(item => (
                    <View
                        key={item.userId}
                        style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                        borderBottomWidth: 0.5,
                        borderBottomColor: '#eee',
                        justifyContent: 'space-between',
                        }}
                    >
                        <ThemedText style={{ fontWeight: '500', color: '#333', fontSize: 15 }}>
                        {item.username}
                        </ThemedText>
                        <TouchableOpacity
                        onPress={() => handleRemoveMember(item.userId)}
                        style={{ marginLeft: 8, padding: 2 }}
                        >
                        <Ionicons name="close-circle" size={18} color="#e57373" />
                        </TouchableOpacity>
                    </View>
                    ))
                )}
            </View>
          <Spacer height={8} />
          <ThemedButton style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#1e88e5',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 16,
            alignSelf: 'center',
            marginTop: 4,
          }} onPress={() => setSearchModalVisible(true)}>
            <Ionicons name="person-add" size={18} color="#fff" />
            <ThemedText style={{ color: '#fff', marginLeft: 6 }}>Add Member</ThemedText>
          </ThemedButton>
        </View>
      )}
    </>
  );
}