import { View, StyleSheet } from 'react-native';
import React from 'react';

type Dimension = number | `${number}%`;

type SpacerProps = {
  width?: Dimension;
  height?: Dimension;
};

const Spacer = ({ width = '100%', height = 40 }: SpacerProps) => {
  return <View style={{ width, height }} />;
};

export default Spacer;


const styles = StyleSheet.create({})