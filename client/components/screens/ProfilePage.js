import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#1E5A8E',
  background: '#f8fafc',
  // cardBg: '#a00404ff',
  cardBg: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
  border: '#E2E8F0',
  danger: '#EF4444',
};

export default function ProfilePage({ onLogout }) {
  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', color: COLORS.primary, action: () => { } },
    { icon: 'notifications-outline', label: 'Notifications', color: COLORS.primary, action: () => { } },
    { icon: 'settings-outline', label: 'Settings', color: COLORS.primary, action: () => { } },
    { icon: 'help-circle-outline', label: 'Help & Support', color: COLORS.primary, action: () => { } },
    {
      icon: 'log-out-outline',
      label: 'Logout',
      color: COLORS.danger,
      action: () => {
        if (onLogout) {
          onLogout();   // This will set isLoggedIn(false) in App.js and show Login ----------/\-------
        }
      },
    },
  ];


  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#00D4FF', '#0099FF','#4facfe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>M</Text>
          </View>
          <Text style={styles.profileName}>Madhan</Text>
          <Text style={styles.profileEmail}>madhan@kleidsyscom</Text>
          <Text style={styles.profileRole}>Software Developer</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>10</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>156h</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.action}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, item.color === COLORS.danger && { color: COLORS.danger }]}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </View>


        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    // paddingTop: 50,
    paddingBottom: 2,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 10,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    // backgroundColor: COLORS.cardBg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    // backgroundColor: COLORS.primary,
    backgroundColor: '#00d5ffe1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: COLORS.border,
  },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    // color: COLORS.text,
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 15,
    fontWeight: '500',
    // color: COLORS.textLight,
    color: '#fff',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 22,
    // color: COLORS.primary,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  menuSection: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
});