import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

// ========== PROFILE MENU ITEM COMPONENT ==========
function ProfileMenuItem({ icon, label, onPress, isDanger = false }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View
          style={[
            styles.menuIconContainer,
            isDanger && styles.menuIconContainerDanger,
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={isDanger ? COLORS.danger : COLORS.primary}
          />
        </View>
        <Text style={[styles.menuItemLabel, isDanger && styles.menuItemLabelDanger]}>
          {label}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDanger ? COLORS.danger : COLORS.textLight}
      />
    </TouchableOpacity>
  );
}

// ========== PROFILE STAT COMPONENT ==========
function ProfileStat({ label, value }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ========== MAIN ADMIN PROFILE PAGE ==========
export default function AdminProfilePage({ onLogout, user }) {
  // const [adminData] = useState({
  //   id: 'ADMIN-001',
  //   name: 'madhan',
  //   email: 'madhan@kleidsys.com',
  //   role: 'System Administrator',
  //   department: 'Management',
  //   profileInitial: 'M',
  //   joinDate: 'Jan 2024',
  //   permissions: 'Full Access',
  //   status: 'Active',
  // });

  const adminData = {
    id: user?.id || 'N/A',
    name: user?.username || 'Unknown',
    email: user?.email || 'N/A',
    role: user?.role || 'User',
    profileInitial: user?.username?.charAt(0)?.toUpperCase() || 'U',
    department: 'Management',
    joinDate: 'Jan 2024',
    permissions: 'Full Access',
    status: 'Active',
    Company: user?.company_id || 'N/A',
  }

  const [stats] = useState({
    employees: 15,
    projects: 8,
    shifts: 3,
    holidays: 24,
  });

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing !');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'No new notifications');
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Settings page !');
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'Contact: support@kleidsys.com\nPhone: +91-9876543210'
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Logout',
          onPress: () => {
            onLogout();
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <LinearGradient
          colors={['#00D4FF', '#0099FF', '#667EEA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.profileHeader}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{adminData.profileInitial}</Text>
              </View>
            </View>

            {/* Profile Info */}
            <Text style={styles.profileName}>{adminData.name}</Text>
            <Text style={styles.profileEmail}>EMAIL : {adminData.email}</Text>
            <Text style={styles.profileRole}>{adminData.role}</Text>
            <Text style={styles.profileRole}>{adminData.Company}</Text>

            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{adminData.status}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Profile Stats */}
        <View style={styles.statsContainer}>
          <ProfileStat label="Employees" value={stats.employees} />
          <ProfileStat label="Projects" value={stats.projects} />
          <ProfileStat label="Shifts" value={stats.shifts} />
          <ProfileStat label="Holidays" value={stats.holidays} />
        </View>

        {/* Admin Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Admin Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="id-card" size={16} color={COLORS.primary} />
              <Text style={styles.infoLabelText}>Admin ID</Text>
            </View>
            <Text style={styles.infoValue}>{adminData.id}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="briefcase" size={16} color={COLORS.primary} />
              <Text style={styles.infoLabelText}>Department</Text>
            </View>
            <Text style={styles.infoValue}>{adminData.department}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="calendar" size={16} color={COLORS.primary} />
              <Text style={styles.infoLabelText}>Join Date</Text>
            </View>
            <Text style={styles.infoValue}>{adminData.joinDate}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="lock-closed" size={16} color={COLORS.primary} />
              <Text style={styles.infoLabelText}>Permissions</Text>
            </View>
            <Text style={styles.infoValue}>{adminData.permissions}</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <ProfileMenuItem
            icon="person-circle"
            label="Edit Profile"
            onPress={handleEditProfile}
          />

          <ProfileMenuItem
            icon="notifications"
            label="Notifications"
            onPress={handleNotifications}
          />

          <ProfileMenuItem
            icon="settings"
            label="Settings"
            onPress={handleSettings}
          />

          <ProfileMenuItem
            icon="help-circle"
            label="Help & Support"
            onPress={handleHelpSupport}
          />

          <ProfileMenuItem
            icon="log-out"
            label="Logout"
            onPress={handleLogout}
            isDanger={true}
          />
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          {/* <Text style={styles.versionText}>Admin Dashboard v1.0.0</Text> */}
          <Text style={styles.versionSubtext}>© 2025 Kleidsys Technologies</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // SCROLL CONTENT
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // HEADER GRADIENT
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    width: '100%',
  },

  // AVATAR
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
  },

  // PROFILE INFO
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 8,
  },
  profileRole: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },

  // STATUS BADGE
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  // STATS CONTAINER
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 24,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
    textAlign: 'center',
  },

  // INFO CARD
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // MENU SECTION
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconContainerDanger: {
    backgroundColor: `${COLORS.danger}15`,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuItemLabelDanger: {
    color: COLORS.danger,
  },

  // VERSION INFO
  versionContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  versionSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textLight,
    marginTop: 4,
  },
});