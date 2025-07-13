import React, { useEffect, useState } from 'react';
import { View, Modal, Alert, TouchableOpacity, TextInput } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '@/hooks/useUser';
import Spacer from '@/components/Spacer';
import { Account, Client } from 'react-native-appwrite';
import { Colors } from '@/constants/Colors';
import { useNavigationState } from '@react-navigation/native';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

const account = new Account(client);

export default function SettingsPage() {
    const router = useRouter();
    const { logout } = useUser();

    // Change password modal state
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changePwLoading, setChangePwLoading] = useState(false);
    const [changePwError, setChangePwError] = useState('');
    const [changePwSuccess, setChangePwSuccess] = useState('');

    const navigationState = useNavigationState(state => state);

    useEffect(() => {
        console.log('Settings navigation state:', navigationState);
    }, [navigationState]);

    // Handle password change
    const handleChangePassword = async () => {
        setChangePwError('');
        setChangePwSuccess('');
        if (newPassword.length < 8) {
        setChangePwError('New password must be at least 8 characters.');
        return;
        }
        setChangePwLoading(true);
        try {
        await account.updatePassword(newPassword, currentPassword);
        setChangePwSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        } catch (e: any) {
        setChangePwError(e?.message || 'Failed to change password.');
        }
        setChangePwLoading(false);
    };

    return (
        <ThemedView style={{ flex: 1, padding: 20 }}>
            <Spacer />
            <View style={{ flexDirection: 'row', marginBottom: 18 }}>
                <TouchableOpacity onPress={() => router.back()}>
2                <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <ThemedText type="title" style={{ marginLeft: 12 }}>Settings</ThemedText>
            </View>
            <Spacer />

            {/* Change Password Section */}
            <View style={{ marginBottom: 18 , alignSelf:'center'}}>
                {/* <ThemedText style={{ fontWeight: 'bold', marginBottom: 8 , textAlign:'center'}}>Forgot your password?</ThemedText> */}
                <ThemedButton
                onPress={() => setShowChangePassword(true)}
                style={{
                    width: 200,
                    alignSelf: 'flex-start',
                    paddingVertical: 8,
                    borderRadius: 8,
                    marginBottom: 6,
                    
                }}
                >
                <ThemedText style={{ color:'#fff', textAlign:'center' }}>Change Password</ThemedText>
                </ThemedButton>
            </View>

            {/* Logout Section */}
            <View style={{ marginBottom: 18 , alignSelf:'center'}}>
                <ThemedButton
                onPress={logout}
                style={{
                    width: 200,
                    alignSelf: 'flex-start',
                    paddingVertical: 8,
                    borderRadius: 8,
                }}
                >
                <ThemedText style={{ color:'#fff', textAlign:'center' }}>Logout</ThemedText>
                </ThemedButton>
            </View>

            {/* (Optional) Delete Account */}
            <View style={{ marginBottom: 18 , alignSelf:'center'}}>
                <ThemedButton
                onPress={() => Alert.alert('Delete Account', 'This feature is not implemented yet.')}
                style={{
                    width: 160,
                    alignSelf: 'flex-start',
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: '#e53935',
                }}
                >
                <ThemedText style={{ color:'#fff', textAlign:'center' }}>Delete Account</ThemedText>
                </ThemedButton>
            </View>

            {/* Change Password Modal */}
            <Modal visible={showChangePassword} animationType="slide" transparent>
            <View style={{
                flex: 1, backgroundColor: 'rgba(0,0,0,0.3)',
                justifyContent: 'center', alignItems: 'center'
            }}>
                <View style={{
                backgroundColor: '#fff', borderRadius: 10, padding: 24, width: '85%',
                shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8
                }}>
                <ThemedText style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Change Password</ThemedText>
                <Spacer height={8} />
                <ThemedText style={{ marginBottom: 4 }}>Current Password</ThemedText>
                <TextInput
                    secureTextEntry
                    placeholder="Current Password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    style={{
                    backgroundColor: '#f4f4f4',
                    borderRadius: 6,
                    marginBottom: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    fontSize: 16,
                    width: '100%',
                    }}
                />
                <ThemedText style={{ marginBottom: 4 }}>New Password</ThemedText>
                <TextInput
                    secureTextEntry
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    style={{
                    backgroundColor: '#f4f4f4',
                    borderRadius: 6,
                    marginBottom: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    fontSize: 16,
                    width: '100%',
                    }}
                />
                {changePwError ? (
                    <ThemedText style={{ color: '#e53935', marginBottom: 8 }}>{changePwError}</ThemedText>
                ) : null}
                {changePwSuccess ? (
                    <ThemedText style={{ color: '#388e3c', marginBottom: 8 }}>{changePwSuccess}</ThemedText>
                ) : null}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                    <ThemedButton
                    onPress={handleChangePassword}
                    disabled={changePwLoading}
                    style={{ marginRight: 10, paddingHorizontal: 16, paddingVertical: 8 }}
                    >
                    <ThemedText style={{ color:'#fff', textAlign:'center' }}>Save</ThemedText>
                    </ThemedButton>
                    <ThemedButton
                    onPress={() => {
                        setShowChangePassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setChangePwError('');
                        setChangePwSuccess('');
                    }}
                    style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'grey' }}
                    >
                    <ThemedText style={{ color:'#fff', textAlign:'center' }}>Cancel</ThemedText>
                    </ThemedButton>
                </View>
                </View>
            </View>
            </Modal>

        </ThemedView>
    );
}
