import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#1E5A8E',
  accent: '#3E9AD8',
  cardBg: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
  border: '#E2E8F0',
};

export default function DockNavigation({ state, descriptors, navigation }) {
  const icons = {
    Home: { active: 'home', inactive: 'home-outline' },
    Tasks: { active: 'list', inactive: 'list-outline' },
    Progress: { active: 'stats-chart', inactive: 'stats-chart-outline' },
    Profile: { active: 'person', inactive: 'person-outline' },
  };

  return (
    <View style={styles.dockContainer}>
      <View style={styles.dock}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabButton}
            >
              <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
                <Ionicons
                  name={isFocused ? icons[label].active : icons[label].inactive}
                  size={24}
                  color={isFocused ? COLORS.primary : COLORS.textLight}
                />
                {isFocused && <View style={styles.activeIndicator} />}
              </View>
              <Text style={[styles.label, isFocused && styles.activeLabel]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: 'transparent',
  },
  dock: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  activeIconContainer: {
    transform: [{ scale: 1.1 }],
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textLight,
    marginTop: 2,
  },
  activeLabel: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});