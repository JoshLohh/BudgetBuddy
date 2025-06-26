import { Keyboard, StyleSheet, TextInput, TouchableWithoutFeedback, Text} from 'react-native'
import { Link } from 'expo-router'
import React, { useState } from 'react'

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedButton } from '../../components/ThemedButton';
import Spacer from '@/components/Spacer';
import ThemedTextInput from '@/components/ThemedTextInput';
import { useUser } from '@/hooks/useUser';
import { Colors } from 'react-native/Libraries/NewAppScreen';


const Register = () => {        
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    
    const { register } = useUser()

    const handleSubmit = async () => {
        setError(null)

        try {
            await register(username, email, password)
            // Optionally navigate to home/profile
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message)
            } else {
                setError('An unknown error has occured')
            }
        }
    }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView style={styles.container}>

            <ThemedText type="subtitle"> Register For An Account </ThemedText>
            <Spacer/>
            <ThemedTextInput
                style={{ width: '80%', marginBottom: 20 }}
                placeholder = "Username" 
                onChangeText={setUsername}
                value={username}
                autoCapitalize='none'
            />

            <ThemedTextInput
                style={{ width: '80%', marginBottom: 20 }}
                placeholder = "Email" 
                keyboardType="email-address"
                onChangeText={setEmail}
                value={email}
            /> 

            <ThemedTextInput
                style={{ width: '80%', marginBottom: 20 }}
                placeholder = "Password" 
                onChangeText={setPassword}
                value={password}
                secureTextEntry
            /> 

            <Spacer />
            <ThemedButton onPress={handleSubmit}>
                        <ThemedText style={styles.register}> Register </ThemedText>
            </ThemedButton>

            <Spacer />
            {error && <Text style={styles.error}>{error}</Text>}

            <Spacer height={100} />

            <ThemedText type='defaultSemiBold'>
                        Already have an account?
            </ThemedText>
                <Link href='/login'>
                    <ThemedText type='linkBold'>
                        Login here
                    </ThemedText>
                </Link>
        </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default Register

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems:'center',
        justifyContent:'center',
    },
    register: {
        textAlign:'center',
        color: "#f2f2f2",
    },
    error: {
        color: Colors.warning,
        padding: 10,
        backgroundColor: '#f5c1c8',
        borderColor: Colors.warning,
        borderWidth: 1,
        borderRadius: 6,
        marginHorizontal: 10,
    },
})