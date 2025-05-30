import { Image } from 'expo-image';
import { Link } from 'expo-router'
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Spacer from '@/components/Spacer';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function HomeScreen() {
  return (
  
    <ThemedView style={styles.container}>
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
            <Link href='/profile'>
              <ThemedText type="link">Profile</ThemedText>
            </Link>
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