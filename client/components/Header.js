import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Header() {
  return (
    <View style={styles.headerContainer}>
      {/* Logo */}
      <Image
        source={require('../assets/kleidsys.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title with Gradient */}
      <LinearGradient
        colors={['#1E5A8E', '#2E7AB8', '#3E9AD8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientTitle}
      >
        <Text style={styles.title}>Kleidsys</Text>
        <Text style={styles.subtitle}>Planning Tool</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  gradientTitle: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#D4E7F5',
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
