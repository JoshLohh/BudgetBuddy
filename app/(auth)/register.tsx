import { StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import React from 'react'

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedButton } from '../../components/ThemedButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Spacer from '@/components/Spacer';

const Register = () => {
    const handleSubmit = () => {
        console.log('register form submitted')
    }
  return (
    <ThemedView style={styles.container}>
            <ThemedText type="subtitle"> Register For An Account </ThemedText>
        <Spacer/>
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