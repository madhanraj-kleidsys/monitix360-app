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

import { useWebSocket } from './hooks/useWebSocket';
import api from '../../api/client';

const DOCK_ITEMS = [
  { id: 'AdminHome', label: 'Home', icon: 'home' },
  { id: 'AdminMaster', label: 'Master', icon: 'grid' },
  { id: 'AdminGraph', label: 'Graph', icon: 'stats-chart' },
  { id: 'AdminApprovals', label: 'Approvals', icon: 'checkmark-done-circle', hasBadge: true },
  { id: 'AdminProfile', label: 'Profile', icon: 'person-circle' },
];

export default function DockNavigation({ state, navigation, activeScreen, onTabPress, onLogout }) {
  const activeRouteName = state.routes[state.index].name;
  const { socket } = useWebSocket();
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    // Initial fetch
    api.get('/tasks/admin/getPendingUserTaskRequests')
      .then(res => setPendingCount(res.data?.length || 0))
      .catch(err => console.log('Dock Badge Error', err));

    if (socket) {
      const handleNewReq = () => {
        setPendingCount(prev => prev + 1);
      };
      socket.on('newUserTaskRequest', handleNewReq);
      return () => socket.off('newUserTaskRequest', handleNewReq);
    }
  }, [socket]);

  return (
    <View style={styles.dockContainer}>
      <View style={styles.dock}>
        {DOCK_ITEMS.map((item) => {
          // Check if this specific item is the active one
          const isFocused = activeRouteName === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.dockItem,
                isFocused && styles.activeDockItem,
              ]}
              onPress={() => {
                // standard navigation call
                navigation.navigate(item.id);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  isFocused && styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={isFocused ? '#fff' : COLORS.primary}
                />
                {item.hasBadge && pendingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.dockLabel,
                  isFocused && styles.activeDockLabel,
                ]}
              >
                {item.label}
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
    paddingVertical: 2,
    marginHorizontal: 6
  },
  activeDockItem: {
    backgroundColor: `${COLORS.secondary}15`,
    borderRadius: 10,
    borderWidth: 0.9,
    borderColor: COLORS.primary,
    marginHorizontal: 6
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
    backgroundColor: `${COLORS.primary}`,
    width: 44,
    height: 44,
    borderRadius: 30,
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
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff'
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold'
  }
});