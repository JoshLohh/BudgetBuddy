import { Link, router } from 'expo-router'
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Spacer from '@/components/Spacer';
import { Image } from 'expo-image';
import { useNavigationState } from '@react-navigation/native';
import { useEffect } from 'react';


export default function HomeScreen() {
  
  return (
  
    <ThemedView style={styles.container}>
          <Image
          source={require('@/assets/images/logo.png')}
          style={{ width: 200, height: 200, resizeMode: 'contain' }}
          />
          <Spacer />
          <ThemedView style={styles.titleContainer}>
            <ThemedText style={styles.title} type="title">Welcome to BudgetBuddy</ThemedText>
          </ThemedView>
          <Spacer/>
              <HelloWave />
          <Spacer/>
          <ThemedView style={styles.stepContainer}>
            <Link href='/login'>
              <ThemedText type="link">Login</ThemedText>
            </Link>
          </ThemedView>
          
          <ThemedView style={styles.stepContainer}>
            <Link href='/register'>
              <ThemedText type="link">Register</ThemedText>
            </Link>
          </ThemedView>

          <ThemedView style={styles.stepContainer}>
            <Link href={'/profile/profile' as any}>
              <ThemedText type="link">Profile</ThemedText>
            </Link>
            {/* <TouchableOpacity onPress={() => router.push(`/profile/profile`)}>
                <ThemedText type="link">Profile</ThemedText>
          </TouchableOpacity> */}
          </ThemedView>
        </ ThemedView>
    
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    alignItems:'center',
  },
  container: {
    flex: 1,
    alignItems:'center',
    justifyContent:'center',
  },
  title: {
    textAlign:'center',
  }
});