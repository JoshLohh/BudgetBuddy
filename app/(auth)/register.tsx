import { StyleSheet, TextInput } from 'react-native'
import { Link } from 'expo-router'
import React, { useState } from 'react'

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedButton } from '../../components/ThemedButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Spacer from '@/components/Spacer';
import ThemedTextInput from '@/components/ThemedTextInput';

const Register = () => {        
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = () => {
        console.log('register form submitted')
    }
  return (
    <ThemedView style={styles.container}>
            <ThemedText type="subtitle"> Register For An Account </ThemedText>
        <Spacer/>

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
    }
})