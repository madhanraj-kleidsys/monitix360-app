import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#0099FF',
  secondary: '#00D4FF',
  accent: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  text: '#0F172A',
  textLight: '#64748B',
  border: '#E2E8F0',
};

const DOCK_ITEMS = [
  { id: 'AdminHome', label: 'Home', icon: 'home' },
  { id: 'AdminProjects', label: 'Projects', icon: 'briefcase' },
  { id: 'AdminEmployees', label: 'Employees', icon: 'people' },
  { id: 'AdminHolidays', label: 'Holidays', icon: 'calendar' },
  { id: 'AdminShift', label: 'Shift', icon: 'time' },
  { id: 'AdminProfile', label: 'Profile', icon: 'person-circle' },
];

export default function DockNavigation({ state,navigation,activeScreen, onTabPress,onLogout }) {
  return (
    <View style={styles.dockContainer}>
      <View style={styles.dock}>
        {DOCK_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.dockItem,
              activeScreen === item.id && styles.activeDockItem,
            ]}
            onPress={() => {
              onTabPress(item.id)
              navigation.navigate(item.id)
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                activeScreen === item.id && styles.activeIconContainer,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={activeScreen === item.id ? '#fff' : COLORS.primary}
              />
            </View>
            <Text
              style={[
                styles.dockLabel,
                activeScreen === item.id && styles.activeDockLabel,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'transparent',
  },
  dock: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 12,
    marginBottom: 20,
    borderRadius: 24,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dockItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeDockItem: {
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: COLORS.primary,
  },
  dockLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  activeDockLabel: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});