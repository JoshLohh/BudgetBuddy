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

const Login = () => {
    const handleSubmit = () => {
        console.log('login form submitted')
    }
  return (
    <ThemedView style={styles.container}>
            <ThemedText type="subtitle">Login To Your Account</ThemedText>
            <Spacer/>
        <ThemedButton onPress={handleSubmit}>
            <ThemedText style={styles.login}> Login </ThemedText>
        </ThemedButton>
        <Spacer height={100} />

        <ThemedText type='defaultSemiBold'>
                    Dont have an account?
        </ThemedText>
            <Link href='/register'>
                <ThemedText type='linkBold'>
                     Register here
                </ThemedText>
            </Link>
    </ThemedView>
  )
}

export default Login

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems:'center',
        justifyContent:'center',
    },
    login: {
        textAlign:'center',
        color: "#f2f2f2",
      }
  });