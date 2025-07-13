import { StyleSheet, Text, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';

import { useGroups } from '@/hooks/useGroups';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useUser } from "@/hooks/useUser";

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ThemedTextInput from '@/components/ThemedTextInput';
import { ThemedButton } from '../../components/ThemedButton';
import Spacer from '@/components/Spacer';
import { ID } from 'react-native-appwrite';


const Create = () => {
    const [title, setTitle] = useState("")
    const [createdBy, setAdmin] = useState("")
    const [description, setDescription] = useState("")
    const[loading, setLoading] = useState(false)
    
    const { createGroup } = useGroups()
    const router = useRouter()
    const { user } = useUser()

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Validation', 'Group title is required.');
            return;
        }

        setLoading(true);

        try {
            await createGroup({ title, description });

            // Reset form
            setTitle("");
            setDescription("");

            //redirect
            router.replace("/group/groups");
        } catch (error) {
            console.error("Create group failed:", error);
            alert("Failed to create group. Please try again.");
        } finally {
            // reset loading state
            setLoading(false);
        }
    }

        return (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ThemedView style={styles.container}>
                <ThemedText type="title">
                    Create a New Group
                </ThemedText>
            <Spacer />

            <ThemedTextInput
                style={styles.input}
                placeholder='Group Name'
                value={title}
                onChangeText={setTitle}
            />
            <Spacer />

            <ThemedTextInput
                style={styles.multiline}
                placeholder='Description (Optional)'
                value={description}
                onChangeText={setDescription}
                multiline={true}
            />
            <Spacer />

            <ThemedButton onPress={handleSubmit} disabled={loading}>
                <Text style={{color: '#fff' }}>
                    {loading ? "Saving..." : "Create Group"}
                </Text>
            </ThemedButton>

            </ThemedView>
            </TouchableWithoutFeedback>
        )
}

export default Create


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    padding: 20,
    borderRadius: 6,
    alignSelf: 'stretch' ,
    marginHorizontal: 40,
  },
  multiline: {
    padding: 20,
    borderRadius: 6,
    alignSelf: 'stretch' ,
    marginHorizontal: 40,
    marginVertical: 8,
    minHeight: 100,
  }
});
