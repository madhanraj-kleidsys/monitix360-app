import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#0099FF',
  background: '#F1F5F9', // Slate-100
  slider: '#FFFFFF',
  textInactive: '#94A3B8', // Slate-400
  textActive: '#0099FF',
};

const TOGGLE_WIDTH = 80;
const TOGGLE_HEIGHT = 36;
const PADDING = 2;
const BUTTON_WIDTH = (TOGGLE_WIDTH - (PADDING * 2)) / 2;

export const CompactToggle = ({ isActive, onToggle }) => {
  // isActive = true -> Timeline (Right side? Or Left? Let's say Left = Timeline, Right = List)
  // Let's stick to: True = Timeline (Bar Chart), False = List (Cards)
  // Or User said "show bar chart which is 1st by default".
  // So Left = Timeline, Right = List.

  const slideAnim = useRef(new Animated.Value(isActive ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isActive ? 0 : 1, // 0 = Left (Timeline), 1 = Right (List)
      useNativeDriver: true,
      damping: 15,
      stiffness: 120,
    }).start();
  }, [isActive]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BUTTON_WIDTH],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.slider,
          {
            transform: [{ translateX }],
          },
        ]}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => onToggle(true)} // Timeline
        activeOpacity={0.7}
      >
        <Ionicons
          name="stats-chart"
          size={18}
          color={isActive ? COLORS.textActive : COLORS.textInactive}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => onToggle(false)} // List
        activeOpacity={0.7}
      >
        <Ionicons
          name="list"
          size={20}
          color={!isActive ? COLORS.textActive : COLORS.textInactive}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: PADDING,
    // borderwidth: 1,
    // borderColor: '#E2E8F0',
  },
  slider: {
    position: 'absolute',
    width: BUTTON_WIDTH,
    height: TOGGLE_HEIGHT - (PADDING * 2),
    top: PADDING,
    left: PADDING,
    backgroundColor: COLORS.slider,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
  },
  button: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});

export default CompactToggle;