import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import { ThemedButton } from '@/components/ThemedButton';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { databases } from '@/lib/appwrite';
import { router } from 'expo-router';
import type { Group } from '@/types/group'
import * as ImagePicker from 'expo-image-picker';
import { Storage } from 'appwrite';
import { Image } from 'expo-image';


const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const groupsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';
const avatarbucketId = process.env.EXPO_PUBLIC_APPWRITE_AVATAR_BUCKET_ID ?? 'avatars';

interface GroupHeaderProps {
  group: Group;
  totalExpenses: number;
  onGroupUpdated?: (group: Group) => void; // Replace 'any' with your group type if available
}

export default function GroupHeader({ group, totalExpenses, onGroupUpdated }: GroupHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(group?.title || '');
  const [description, setDescription] = useState(group?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatar, setAvatar] = useState(group?.avatar || '');
  const [uploading, setUploading] = useState(false);

  console.log('Fetched group:', group);

  useEffect(() => {
    setTitle(group?.title || '');
    setDescription(group?.description || '');
    setAvatar(group?.avatar || ''); 
  }, [group]);

  if (!group) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', minHeight: 80 }]}>
        <ActivityIndicator />
      </View>
    );
  }

  const handleAvatarChange = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Permission to access gallery is required!');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled) return;

      setUploading(true);
      const asset = result.assets[0];
      const uri = asset.uri;
      const fileName = uri.split('/').pop();
      const fileId = Math.random().toString(36).substring(2, 18);
      const formData = new FormData();
      formData.append('fileId', fileId);
      formData.append('file', {
          uri,
          name: fileName,
          type: asset.mimeType || 'image/jpeg',
        } as any
      );
      const endpoint = `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${avatarbucketId}/files`;
      console.log('Uploading avatar to:', endpoint);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-Appwrite-Project': process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? '',
        },
        body: formData,
      });
      let fileRes;
      try {
        fileRes = await response.json();
      } catch (e) {
        setUploading(false);
        alert('Upload failed: invalid response from server.');
        return;
      }
      if (!response.ok) {
        setUploading(false);
        alert('Upload failed: ' + (fileRes?.message || response.status));
        return;
      }
      const viewUrl = `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${avatarbucketId}/files/${fileRes.$id}/view?project=${process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID}&t=${Date.now()}`;
      console.log('Avatar uploaded, viewUrl:', viewUrl);

      // Update the group in Appwrite
      const updateRes = await databases.updateDocument(
        databaseId,
        groupsCollectionId,
        group.$id,
        { avatar: viewUrl }
      );
      console.log('Group document updated:', updateRes);

      setAvatar(viewUrl);
      if (onGroupUpdated) {
        console.log('Calling onGroupUpdated with avatar:', viewUrl);
        onGroupUpdated({ ...group, avatar: viewUrl });
      }
    } catch (e) {
      alert('Error updating avatar');
      console.error('Error in handleAvatarChange:', e);
    } finally {
      setUploading(false);
    }
  };


  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await databases.updateDocument(databaseId, groupsCollectionId, group.$id, {
        title,
        description,
        avatar: group.avatar, // Always include avatar to avoid overwriting
      });
      // Fetch the updated group document
      // const updatedGroup = await databases.getDocument(databaseId, groupsCollectionId, group.id);
      setEditing(false);
      if (onGroupUpdated) {
        onGroupUpdated({
          ...group,
          title,
          description,
          avatar, // group.avatar (already present)
        });
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
            <ThemedText style={{ fontWeight: 'bold', marginBottom: 4 , marginLeft: 4 }}>Title</ThemedText>
            <ThemedTextInput
              value={title}
              onChangeText={setTitle}
              style={{ marginBottom: 8 }}
            />
            <ThemedText style={{ fontWeight: 'bold', marginBottom: 4 , marginLeft: 4 }}>Description</ThemedText>
            <ThemedTextInput
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
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleAvatarChange} style={styles.avatarEditContainer}>
              {avatar ? (
                <Image source={ avatar } style={styles.groupAvatarLarge} />
              ) : (
                <Ionicons name="people-circle" size={60} color="#007AFF" />
              )}
            </TouchableOpacity>
            <View style={styles.headerTextCol}>
              <ThemedText type="title" style={styles.groupTitle}>{group.title}</ThemedText>
              {group.description ? (
                <ThemedText style={styles.groupDescription}>{group.description}</ThemedText>
              ) : null}
            </View>
          </View>
          <ThemedText style={styles.membersCount}>
            {group.members?.length ?? 0} member{(group.members?.length ?? 0) !== 1 ? 's' : ''}
          </ThemedText>
          <ThemedButton
            onPress={() => router.push({ pathname: '/group/[groupId]/history', params: { groupId: group.$id } })}
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
          <TouchableOpacity onPress={() => router.push({ pathname: '/group/[groupId]/report', params: { groupId: group.$id } })}>
          <View style={styles.totalCard}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalAmount}>${totalExpenses.toFixed(2)}</ThemedText>
          </View>
          </TouchableOpacity>
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
    // backgroundColor: '#fff', 
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
    // color: 'black'
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
  avatarEditContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  groupAvatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
});
