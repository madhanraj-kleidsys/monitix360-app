// components/SplashScreen.js
import React from 'react';
import { View, Text } from 'react-native';
import AnimatedLogoLoader from './AnimatedLogoLoader';

export default function SplashScreen() {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
    }}>
      <AnimatedLogoLoader />
      <Text style={{ marginTop: 20, color: '#666', fontSize: 14 }}>
        Loading...
      </Text>
    </View>
  );
}
