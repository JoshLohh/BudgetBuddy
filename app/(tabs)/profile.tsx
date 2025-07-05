import React, { useState, useEffect, useCallback, cache } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import ThemedTextInput from '@/components/ThemedTextInput';
import Spacer from '@/components/Spacer';
import { databases, client } from '@/lib/appwrite';
import { Query, Storage, ID } from 'appwrite';

const AVATAR_SIZE = 150;
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
const groupsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';
const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';
const avatarbucketId = process.env.EXPO_PUBLIC_APPWRITE_AVATAR_BUCKET_ID ?? 'avatars';
const storage = new Storage(client);

export default function Profile() {
  const { user, profile, updateProfile, logout, authChecked, refetchProfile } = useUser();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());

  // Statistics state
  const [groupsCount, setGroupsCount] = useState(0);
  const [userExpensesCount, setUserExpensesCount] = useState(0);
  const [userTotalSpent, setUserTotalSpent] = useState(0);

  const fetchStats = useCallback(() => {
    if (!user) return;

    databases
      .listDocuments(
        databaseId,
        groupsCollectionId,
        [Query.search('members', user.$id)]
      )
      .then(res => {
        setGroupsCount(res.documents.length);
        const groupIds = res.documents.map(doc => doc.$id);

        if (groupIds.length === 0) {
          setUserExpensesCount(0);
          setUserTotalSpent(0);
          return;
        }

        databases
          .listDocuments(
            databaseId,
            expensesCollectionId,
            [
              Query.equal('paidBy', user.$id),
              Query.equal('groupId', groupIds),
              Query.limit(100),
            ]
          )
          .then(expRes => {
            setUserExpensesCount(expRes.documents.length);
            const total = expRes.documents.reduce(
              (sum, doc) => sum + (parseFloat(doc.amount) || 0),
              0
            );
            setUserTotalSpent(total);
          })
          .catch(() => {
            setUserExpensesCount(0);
            setUserTotalSpent(0);
          });
      })
      .catch(() => {
        setGroupsCount(0);
        setUserExpensesCount(0);
        setUserTotalSpent(0);
      });
  }, [user]);


  // Sync form fields with profile when loaded
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setEmail(profile.email || user?.email || '');
      setBio(profile.bio || '');
    }
  }, [profile, user]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const handleAvatarChange = async () => {
    console.log("avatar pressed");
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
      console.log("picker result:", result);
      if (result.canceled) {
        setUploading(false);
        return;
      }
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
      });

      const endpoint = `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${avatarbucketId}/files`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-Appwrite-Project': process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
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
      await updateProfile({ avatar: viewUrl });
      if (typeof refetchProfile === 'function') {
        await refetchProfile();
      }
      setCacheBuster(Date.now());
    } catch (e) {
      alert("Error picking image");
    } finally {
      setUploading(false);
    }
  };

  // Handle logout and redirect to index
  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ username, email, bio });
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!profile) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={{ color: 'red' }}>
          No profile loaded. Please try logging out and back in, or contact support.
        </ThemedText>
        <Spacer height={12} />
        <ThemedButton onPress={handleLogout}>
          <ThemedText style={{ color: '#f2f2f2' , textAlign: 'center'}}>Logout</ThemedText>
        </ThemedButton>
      </ThemedView>
    );
  }

  // console.log('Rendering avatar:', profile?.avatar);

  return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ThemedView style={styles.container}>
          <Spacer />
          {/* Top: Avatar + Username */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={editing ? handleAvatarChange : undefined}>
              <Image
                key={profile?.avatar ? profile.avatar : 'default'}
                source={
                  profile?.avatar
                    ? { uri: profile.avatar + `&cb=${cacheBuster}`, cache: 'reload' }
                    : require('../../assets/images/default-avatar.png')
                }
                style={styles.avatar}
                transition={300}
              />
              {uploading && (
                <ActivityIndicator style={{ position: 'absolute', left: 24, top: 24 }} />
              )}
            </TouchableOpacity>

            <View style={styles.infoCol}>
              {!editing ? (
                <ThemedText type="title" style={styles.username}>
                  {profile.username || 'Unnamed'}
                </ThemedText>
              ) : (
                <ThemedTextInput
                  style={styles.editInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Username"
                  autoCapitalize="none"
                  autoFocus
                />
              )}
            </View>
          </View>
          {/* Show bio beneath Top (avatar + username) */}
          {!editing && profile.bio ? (
            <>
              <Spacer height={4} />
              <ThemedText style={styles.bio}>{profile.bio}</ThemedText>
            </>
          ) : null}
          <Spacer height={16} />

          {/* Statistics */}
          <View style={styles.statsCard}>
            <View style={styles.statBox}>
              <ThemedText style={styles.statValue}>{groupsCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Groups</ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText style={styles.statValue}>
                ${userTotalSpent.toFixed(2)}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total Spent</ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText style={styles.statValue}>{userExpensesCount}</ThemedText>
              <ThemedText style={styles.statLabel}># Expenses</ThemedText>
            </View>
          </View>

          {/* Edit Profile */}
          {editing ? (
            <>
              <ThemedTextInput
                style={styles.editInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <ThemedTextInput
                style={[styles.editInput, { height: 60 }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Bio"
                multiline
              />
              {error ? (
                <ThemedText style={{ color: 'red', marginBottom: 8 }}>{error}</ThemedText>
              ) : null}
              <ThemedButton onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                <ThemedText style={{ color: '#f2f2f2' }}>{saving ? 'Saving...' : 'Save Changes'}</ThemedText>
              </ThemedButton>
              <ThemedButton
                onPress={() => setEditing(false)}
                style={styles.cancelBtn}
              >
                <ThemedText style={{ color: '#222' }}>Cancel</ThemedText>
              </ThemedButton>
            </>
          ) : (
            <View style={{ alignItems: 'center'}}>
              <ThemedButton
                onPress={() => setEditing(true)}
                style={styles.editBtn}
              >
                <ThemedText style={{ color: '#f2f2f2' , textAlign: 'center'}}>Edit Profile</ThemedText>
              </ThemedButton>
            </View>
          )}

          <View style={styles.flexGrow} />

          {/* Logout Button at Bottom */}
          <View style={styles.logoutContainer}>
            <ThemedButton onPress={handleLogout} style={styles.logoutBtn}>
              <ThemedText style={{ color: '#f2f2f2', textAlign:'center' }}>Logout</ThemedText>
            </ThemedButton>
          </View>
        <Spacer height={100}/>
        </ThemedView>
      </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 16,
    justifyContent: 'flex-start',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  bio: {
    fontSize: 15,
    marginLeft: 2,
    marginBottom: 6,
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
  editBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
    width: '50%',
  },
  saveBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  cancelBtn: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
  },
  logoutContainer: {
    width: '100%',
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  logoutBtn: {
    backgroundColor: '#cb4d31',
    borderRadius: 8,
    paddingVertical: 12,
    width: '50%',
  },
  editInput: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 16,
    width: '100%',
  },
  flexGrow: { flex: 1 },
});
