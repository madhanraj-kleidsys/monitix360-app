import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import StyledConfirmAlert from '../common/StyledConfirmAlert';

const COLORS = {
  primary: '#1E5A8E',
  secondary: '#0099FF',
  background: '#f8fafc',
  // cardBg: '#a00404ff',
  cardBg: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
  border: '#E2E8F0',
  danger: '#EF4444',
};

export default function ProfilePage({ onLogout, user, userCompany }) {
  const [logoutAlertVisible, setLogoutAlertVisible] = React.useState(false);

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', color: COLORS.primary, action: () => { } },
    // { icon: 'notifications-outline', label: 'Notifications', color: COLORS.primary, action: () => { } },
    { icon: 'settings-outline', label: 'Settings', color: COLORS.primary, action: () => { } },
    { icon: 'help-circle-outline', label: 'Help & Support', color: COLORS.primary, action: () => { } },
    {
      icon: 'log-out-outline',
      label: 'Logout',
      color: COLORS.danger,
      action: () => {
        setLogoutAlertVisible(true);
      },
    },
  ];

  const employeeData = {
    id: user?.user_code || 'N/A',
    name: `${user?.username || 'Unknown'} ${user?.last_name || ''}`.trim(),
    email: user?.email || 'N/A',
    role: user?.role || 'User',
    profileInitial: user?.username?.charAt(0)?.toUpperCase() || 'U',
    department: user?.department || 'General',
    contact_number: user?.contact_no || 'N/A',
    status: 'Active',
    CompanyName: userCompany?.company_name || 'N/dA',
    CompanyCode: userCompany?.company_code || 'N/dA',
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing !');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'No new notifications');
  }

  return (
    <View style={styles.container}>
{/*   <LinearGradient
        // colors={['#00D4FF', '#0099FF', '#4facfe']}
        colors={['#00D4FF', '#0099FF', '#667EEA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{employeeData.profileInitial}</Text>
            <Image
              source={require('../../assets/usericon.png')}
              resizeMode="cover"
              style={styles.priorityCircle}
            />
          </View>
          <Text style={styles.profileName}>{employeeData.name}</Text>
          <Text style={styles.profileRole}>{employeeData.CompanyName}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>10</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.dividing} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.dividing} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>156h</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
          </View>
        </View>
      </LinearGradient> */}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Your Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="id-card" size={16} color={COLORS.secondary} />
              <Text style={styles.infoLabelText}>Staff ID</Text>
            </View>
            <Text style={styles.infoValue}>{employeeData.id}</Text>
          </View>
          <View style={styles.divider} />

          {/* <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="card" size={16} color={COLORS.secondary} />
              <Text style={styles.infoLabelText}>Company Code</Text>
            </View>
            <Text style={styles.infoValue}>{employeeData.CompanyCode}</Text>
          </View>
          <View style={styles.divider} /> */}

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="business-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.infoLabelText}>Company Name</Text>
            </View>
            <Text style={styles.infoValue}>{employeeData.CompanyName}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="mail" size={16} color={COLORS.secondary} />
              <Text style={styles.infoLabelText}>Email Id</Text>
            </View>
            <Text style={styles.infoValue}>{employeeData.email}</Text>
          </View>

          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons name="briefcase" size={16} color={COLORS.secondary} />
              <Text style={styles.infoLabelText}>Department</Text>
            </View>
            <Text style={styles.infoValue}>{employeeData.department}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <FontAwesome name="phone" size={18} color={COLORS.secondary} />
              {/* <Ionicons name="phone-portrait-outline" size={16} color={COLORS.secondary} /> */}
              <Text style={styles.infoLabelText}>Contact Number</Text>
            </View>
            <Text style={styles.infoValue}>{employeeData.contact_number}</Text>
          </View>

          <View style={styles.divider} />
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

      <StyledConfirmAlert
        visible={logoutAlertVisible}
        title="Logout"
        message="Are you sure !! you want to logout from your account?"
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
        onConfirm={() => {
          setLogoutAlertVisible(false);
          if (onLogout) onLogout();
        }}
        onCancel={() => setLogoutAlertVisible(false)}
      />
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
    width: 90,
    height: 90,
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
  priorityCircle: {
    width: 120,
    height: 130,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    fontSize: 15,
    // color: COLORS.primary,
    color: '#fff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    marginTop: 20,
  },

  // INFO CARD
  infoCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
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
    alignItems: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
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

  // STATS ROW
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginTop: 20,
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
  dividing: {
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