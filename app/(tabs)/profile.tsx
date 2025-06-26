import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Text,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Image } from 'expo-image';

import { useUser } from '@/hooks/useUser';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import Spacer from '@/components/Spacer';

const AVATAR_SIZE = 72;

export default function Profile() {
  const { user, profile, updateProfile, logout, authChecked } = useUser();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form fields with profile when loaded
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setEmail(profile.email || user?.email || '');
      setBio(profile.bio || '');
    }
  }, [profile, user]);

  // Placeholder stats, replace with real data as needed
  const groups = profile?.groups ?? 0;
  const totalExpenses = profile?.totalExpenses ?? 0;
  const numExpenses = profile?.numExpenses ?? 0;

  const avatarSource = profile?.avatar
    ? { uri: profile.avatar }
    : require('../../assets/images/default-avatar.png'); // Adjust path as needed

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ username, email, bio });
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'red' }}>
          No profile loaded. Please try logging out and back in, or contact support.
        </Text>
        <ThemedButton onPress={logout}>
          <Text style={{ color: '#f2f2f2' }}> Logout </Text>
        </ThemedButton>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Spacer/>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ThemedView style={styles.container}>
          {/* Top: Avatar + Username */}
          
          <View style={styles.topRow}>
            <Image
              source={avatarSource}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.infoCol}>
              {!editing ? (
                <ThemedText style={styles.username} numberOfLines={1}>
                  {profile.username || 'Unnamed'}
                </ThemedText>
              ) : (
                <TextInput
                  style={styles.editInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Username"
                  autoCapitalize="none"
                  autoFocus
                  editable
                />
              )}
            </View>
          </View>

          <Spacer height={16} />

          {/* Statistics */}
          <View style={styles.statsCard}>
            <View style={styles.statBox}>
              <ThemedText style={styles.statValue}>{groups}</ThemedText>
              <ThemedText style={styles.statLabel}>Groups</ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText style={styles.statValue}>{totalExpenses}</ThemedText>
              <ThemedText style={styles.statLabel}>Total Expenses</ThemedText>
            </View>
            <View style={styles.statBox}>
              <ThemedText style={styles.statValue}>{numExpenses}</ThemedText>
              <ThemedText style={styles.statLabel}># Expenses</ThemedText>
            </View>
          </View>

          <Spacer height={16} />

          {/* Edit Profile */}
          {editing ? (
            <>
              <TextInput
                style={styles.editInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable
              />
              <TextInput
                style={[styles.editInput, { height: 60 }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Bio"
                multiline
                editable
              />
              {error ? (
                <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>
              ) : null}
              <ThemedButton onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                <Text style={{ color: '#f2f2f2' }}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </ThemedButton>
              <ThemedButton
                onPress={() => setEditing(false)}
                style={styles.cancelBtn}
              >
                <Text style={{ color: '#222' }}>Cancel</Text>
              </ThemedButton>
            </>
          ) : (
            <ThemedButton
              onPress={() => setEditing(true)}
              style={styles.editBtn}
            >
              <Text style={{ color: '#f2f2f2' }}>Edit Profile</Text>
            </ThemedButton>
          )}

          <View style={styles.flexGrow} />

          {/* Logout Button at Bottom */}
          <View style={styles.logoutContainer}>
            <ThemedButton onPress={logout} style={styles.logoutBtn}>
              <Text style={{ color: '#f2f2f2' }}>Logout</Text>
            </ThemedButton>
          </View>
        </ThemedView>
      </TouchableWithoutFeedback>
      <Spacer/>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafbfc',
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#fafbfc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 16,
    backgroundColor: '#fafbfc',
    justifyContent: 'flex-start',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#eaeaea',
    marginRight: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  editBtn: {
    backgroundColor: '#1e88e5',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
  },
  saveBtn: {
    backgroundColor: '#1e88e5',
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
    backgroundColor: '#e53935',
    borderRadius: 8,
    paddingVertical: 12,
    width: '90%',
  },
  editInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 16,
    color: '#222',
    width: '100%',
  },
  flexGrow: { flex: 1 },
});
