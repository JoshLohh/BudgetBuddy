import { View, StyleSheet } from 'react-native';
import React from 'react';

type Dimension = number | `${number}%`;

type SpacerProps = {
  width?: Dimension;
  height?: Dimension;
  testID?: 'spacer';
};

const Spacer = ({ width = '100%', height = 40, testID }: SpacerProps) => {
  return <View style={{ width, height }} testID = {testID} />;
};

export default Spacer;


const styles = StyleSheet.create({})