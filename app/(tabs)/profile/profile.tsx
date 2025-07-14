import React, { useState, useEffect, useCallback } from 'react';
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
import { useUser } from '@/hooks/useUser';
import { useFocusEffect, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import ThemedTextInput from '@/components/ThemedTextInput';
import Spacer from '@/components/Spacer';
import { client } from '@/lib/appwrite';
import { Storage } from 'appwrite';
import { Ionicons } from '@expo/vector-icons';
import { useStats } from '@/contexts/StatsContext';
import { useNavigationState } from '@react-navigation/native';

const AVATAR_SIZE = 150;
// const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '';
// const groupsCollectionId = process.env.EXPO_PUBLIC_APPWRITE_GROUPS_COLLECTION_ID ?? '';
// const expensesCollectionId = process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_COLLECTION_ID ?? '';
const avatarbucketId = process.env.EXPO_PUBLIC_APPWRITE_AVATAR_BUCKET_ID ?? 'avatars';
// const storage = new Storage(client);

export default function Profile() {
  const { user, profile, updateProfile, logout, authChecked, refetchProfile } = useUser();
  const { groupsCount, userExpensesCount, userTotalSpent, loading: statsLoading, refetchStats } = useStats(); // Use stats context
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileLoadTimedOut, setProfileLoadTimedOut] = useState(false);

  // Sync form fields with profile when loaded
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setEmail(profile.email || user?.email || '');
      setBio(profile.bio || '');
    }
  }, [profile, user]);

  // Manual reload function
  const reloadProfile = useCallback(async () => {
    setLoadingProfile(true);
    await refetchProfile();
    refetchStats();
    setLoadingProfile(false);
  }, [refetchProfile, refetchStats]);

  // refetch profile every 1.5 seconds if profile is not loaded.=
  useEffect(() => {
    if (!profile && authChecked) {
      const interval = setInterval(() => {
        refetchProfile();
      }, 1500); // Poll every 1.5 seconds

      // Stop polling when profile is loaded
      if (profile) {
        clearInterval(interval);
      }
      return () => clearInterval(interval);
    }
  }, [profile, authChecked, refetchProfile]);

  // start a 30-second timer when loading profile. If the profile loads before the timeout, clear the timer. if not, show the reload button
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (!profile && authChecked) {
      setProfileLoadTimedOut(false); // Reset timeout state
      timeout = setTimeout(() => {
        setProfileLoadTimedOut(true);
      }, 30000); // 30 seconds
    }

    if (profile) {
      setProfileLoadTimedOut(false);
      if (timeout) clearTimeout(timeout);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [profile, authChecked]);

  // Avatar change handler
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
        } as any
      );
      const endpoint = `${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${avatarbucketId}/files`;
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

  // Logout handler
  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  // Save profile changes
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

  if (!authChecked || loadingProfile || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText>Loading profile...</ThemedText>
        <ThemedText style={{ color: 'red' , textAlign: 'center', justifyContent: 'center'}}>
          If you just created a new account, please wait a moment for your profile to load.
        </ThemedText>
        {profileLoadTimedOut && (
        <>
          <ThemedText style={{ marginTop: 16, color: '#cb4d31' }}>
            Still loading? Tap reload below.
          </ThemedText>
          <ThemedButton onPress={reloadProfile} style={{ marginTop: 12 }}>
            Reload
          </ThemedButton>
        </>
      )}
      </View>
    );
  }


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={styles.container}>
        <Spacer />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
            <TouchableOpacity onPress={() => router.push('/profile/settings')}>
              <Ionicons name="settings" size={28} color="#0a7ea4" />
            </TouchableOpacity>
          </View>
        {/* Top: Avatar + Username */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={handleAvatarChange} disabled={uploading}>
            <Image
              source={profile.avatar || require('@/assets/images/default-avatar.png')}
              style={[styles.avatar, uploading && { opacity: 0.5 }]}
              contentFit="cover"
              key={cacheBuster}
            />
            {uploading && (
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  borderRadius: AVATAR_SIZE / 2,
                }}
              >
                <ActivityIndicator size="large" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.infoCol}>
            {!editing ? (
              <ThemedText type="title" style={styles.username}>
                {profile.username || 'Unnamed'}
              </ThemedText>
            ) : (
              <ThemedTextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                style={styles.editInput}
                autoCapitalize="none"
              />
            )}
          </View>
        </View>

        {/* Show bio beneath Top (avatar + username) */}
        {!editing && profile.bio ? (
          <View>
            <ThemedText style={styles.bio}>{profile.bio}</ThemedText>
            <Spacer height={8} />
          </View>
        ) : null}

        {statsLoading ? (
          <ActivityIndicator size="large" />
        ) : (
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
              <ThemedText style={styles.statLabel}># Expenses</ThemedText>
            </View>
          </View>
        )}

        {/* Edit Profile */}
        {editing ? (
          <>
            {/* <ThemedTextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              style={styles.editInput}
              autoCapitalize="none"
              keyboardType="email-address"
            /> */}
            <ThemedText
              // value={email}
              // onChangeText={setEmail}
              // placeholder="Email"
              style={styles.editInput}
              // autoCapitalize="none"
              // keyboardType="email-address"
            >{email}</ThemedText>
            <ThemedTextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Bio"
              style={styles.editInput}
              multiline
            />
            {error ? (
              <ThemedText style={styles.error}>{error}</ThemedText>
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
        <Spacer height={75}/>
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
    marginLeft: 12,
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
  error: {
    color: '#cb4d31',
    padding: 10,
    backgroundColor: '#f5c1c8',
    borderColor: '#cb4d31',
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 10,
    marginBottom: 6,
  },
  flexGrow: { flex: 1 },
});
