import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ThemedText } from '@/components/ThemedText';
import { Link } from 'expo-router';

const About = () => {
  return (
    <View style = {[styles.titleContainer, { marginTop : 200}]} >
      <ThemedText> About fly high </ThemedText>
    

    <Link href = "/"> Back to home </Link>
    </View>
  )
}

export default About

const styles = StyleSheet.create({
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    stepContainer: {
      gap: 8,
      marginBottom: 8,
    },
    reactLogo: {
      height: 178,
      width: 290,
      bottom: 0,
      left: 0,
      position: 'absolute',
    },
    link: {
      marginVertical:10,
      borderBottomWidth: 1,
    },
    
  });