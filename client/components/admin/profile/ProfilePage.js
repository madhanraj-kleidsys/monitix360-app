import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert, Image, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// import ApiService from '../../services/ApiService';
import api from '../../../api/client';
import companyServices from '../services/CompanyService';
import StyledConfirmAlert from '../../common/StyledConfirmAlert';
import EmailSettings from './EmailSettings';
import ChangePasswordModal from '../../common/ChangePasswordModal';
import { useWebSocket } from '../hooks/useWebSocket';
const { width } = Dimensions.get('window');
import { useNavigation } from '@react-navigation/native';
import { Switch } from 'react-native';
import { useTheme } from '../../../utils/ThemeContext';

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
function ProfileStat({ label, value, onPress }) {
  return (
    <TouchableOpacity style={styles.statItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.statValue,
        value === '—' && styles.statValueLoading
      ]}>
        {value}
      </Text>
      {/* <Text style={styles.statValue}>{value}</Text> */}
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ========== MAIN ADMIN PROFILE PAGE ==========
export default function AdminProfilePage({ onLogout, user, refreshUserCompany }) {
  const [projectsCount, setProjectsCount] = useState(0);
  const [employeesCount, setEmployeesCount] = useState(0);
  const [shiftsCount, setShiftsCount] = useState(0);
  const [holidaysCount, setHolidaysCount] = useState(0);
  const [companyData, setCompanyData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [emailSettingsVisible, setEmailSettingsVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);
  const { on, off, isConnected } = useWebSocket();

  const navigation = useNavigation();

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setLoadingStats(true);

        // Fetch projects
        const projectsRes = await api.get('/projects');
        setProjectsCount(projectsRes.data.length);

        // Fetch employees
        const employeesRes = await api.get('/users');
        setEmployeesCount(employeesRes.data.length);

        // Fetch shifts
        const shiftsRes = await api.get('/shifts');
        setShiftsCount(shiftsRes.data.length);

        // Fetch holidays
        const holidaysRes = await api.get('/declare-holiday');
        setHolidaysCount(holidaysRes.data.length);

      } catch (err) {
        console.log('Stats fetch error:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchAllStats();
  }, []);

  // Real-time stats updates
  useEffect(() => {
    if (!isConnected) return;

    const handleUpdate = () => {
      console.log('🔄 Profile stats update received');
      // Re-fetch all stats
      const fetchAllStats = async () => {
        try {
          const [p, u, s, h] = await Promise.all([
            api.get('/projects'),
            api.get('/users'),
            api.get('/shifts'),
            api.get('/declare-holiday')
          ]);
          setProjectsCount(p.data.length);
          setEmployeesCount(u.data.length);
          setShiftsCount(s.data.length);
          setHolidaysCount(h.data.length);
        } catch (err) {
          console.error('Real-time stats fetch error:', err);
        }
      };
      fetchAllStats();
    };

    on('project:created', handleUpdate);
    on('project:deleted', handleUpdate);
    on('user:created', handleUpdate);
    on('user:deleted', handleUpdate);
    on('shift:created', handleUpdate);
    on('shift:deleted', handleUpdate);
    on('holiday:created', handleUpdate);
    on('holiday:deleted', handleUpdate);

    return () => {
      off('project:created', handleUpdate);
      off('project:deleted', handleUpdate);
      off('user:created', handleUpdate);
      off('user:deleted', handleUpdate);
      off('shift:created', handleUpdate);
      off('shift:deleted', handleUpdate);
      off('holiday:created', handleUpdate);
      off('holiday:deleted', handleUpdate);
    };
  }, [isConnected, on, off]);

  // ✅ Fetch company using companyServices
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        if (user?.company_id) {
          const company = await companyServices.getCompanyById(user.company_id);
          // console.log('Company fetched:', company);
          setCompanyData({
            name: company?.company_name || 'N/A',
            code: company?.company_code || '—',
          });
        }
      } catch (err) {
        console.log('Company fetch error:', err);
      }
    };

    fetchCompany();
  }, [user?.company_id]);

  const adminData = {
    id: user?.id || 'N/A',
    name: user?.username || 'Unknown',
    email: user?.email || 'N/A',
    role: user?.role || 'User',
    profileInitial: user?.username?.charAt(0)?.toUpperCase() || 'Um',
    status: 'Active',
    CompanyName: companyData?.name || 'Loading...',
    CompanyCode: companyData?.code || '_',
  }

  const stats = useMemo(() => ({
    employees: loadingStats ? '—' : employeesCount,
    projects: loadingStats ? '—' : projectsCount,
    shifts: loadingStats ? '—' : shiftsCount,
    holidays: loadingStats ? '—' : holidaysCount,
  }), [loadingStats, projectsCount, employeesCount, shiftsCount, holidaysCount]);

  const ADMIN_INFO = [
    { id: '1', label: 'Admin ID', value: adminData.id, icon: 'id-card' },
    { id: '2', label: 'Company Code', value: adminData.CompanyCode, icon: 'card' },
    { id: '3', label: 'Company Name', value: adminData.CompanyName, icon: 'business' },
    { id: '4', label: 'Email Id', value: adminData.email, icon: 'mail' },
  ];

  // console.log('Stats object:', stats);
  // console.log('Company data:', companyData);

  const handleEmailSettings = () => {
    setEmailSettingsVisible(true);
  };
  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Coming in next update !');
  };
  const handleChangePass = () => {
    setChangePasswordVisible(true);
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'No new notifications');
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Version 1.0.0');
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'Contact: support@kleidsys.com\nPhone: +91-9876543210'
    );
  };

  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    setLogoutAlertVisible(true);
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
                {/* <Text style={styles.avatarText}>{adminData.profileInitial}</Text> */}
                <Image
                  source={require('../../../assets/admin.png')}
                  resizeMode="cover"
                  style={styles.priorityCircle}
                />
              </View>
            </View>

            {/* Profile Info */}
            <Text style={styles.profileName}>{adminData.name}</Text>
            {/* <Text style={styles.profileRole}>{adminData.CompanyName}</Text> */}

            {/* Status Badge */}
            {/* <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{adminData.status}</Text>
            </View> */}
          </View>

          {/* Profile Stats */}
          <View style={styles.statsContainer}>
            <ProfileStat label={stats.employees > 1 ? "Staffs" : "Staff"} value={stats.employees}
              onPress={() => navigation.navigate('AdminEmployees')} />
            <View style={styles.dividing} />

            <ProfileStat label={stats.projects > 1 ? "Projects" : "Project"} value={stats.projects}
              onPress={() => navigation.navigate('AdminProjects')} />
            <View style={styles.dividing} />

            <ProfileStat label={stats.shifts > 1 ? "Shifts" : "Shift"} value={stats.shifts}
              onPress={() => navigation.navigate('AdminShift')} />
            <View style={styles.dividing} />

            <ProfileStat label={stats.holidays > 1 ? "Holidays" : "Holiday"} value={stats.holidays}
              onPress={() => navigation.navigate('AdminHolidays')} />
          </View>
        </LinearGradient>

        {/* Admin Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Admin Info Card</Text>

          {ADMIN_INFO.map((item, index) => (
            <React.Fragment key={item.id}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name={item.icon} size={16} color={COLORS.primary} />
                  <Text style={styles.infoLabelText}>{item.label}</Text>
                </View>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>

              {/* Hide divider if it's the last item */}
              {index < ADMIN_INFO.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <ProfileMenuItem
            icon="mail"
            label="Email Settings"
            onPress={handleEmailSettings}
            isDanger={false}
          />

          <ProfileMenuItem
            icon="lock-closed"
            label="Change Password"
            onPress={handleChangePass}
          />

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

          {/* Dark Mode Toggle */}
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: isDarkMode ? '#334155' : '#E0F2FE' }]}>
                <Ionicons name="moon" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.menuItemLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: COLORS.primary }}
              thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
            />
          </View>

          <ProfileMenuItem
            icon="log-out"
            label="Logout"
            onPress={handleLogout}
            isDanger={true}
          />

          <StyledConfirmAlert
            visible={logoutAlertVisible}
            title="Logout"
            message="Are you sure !! you want to logout from your account ?"
            confirmText="Logout"
            cancelText="Cancel"
            type="logout"
            onConfirm={() => {
              setLogoutAlertVisible(false);
              if (onLogout) onLogout();
            }}
            onCancel={() => setLogoutAlertVisible(false)}
          />

        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionSubtext}>© {new Date().getFullYear()} Kleidsys Technologies</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ChangePasswordModal
        visible={changePasswordVisible}
        onClose={() => setChangePasswordVisible(false)}
      />

      {/* ✅ Email Settings Modal - Built-in Modal */}
      <Modal
        animationType="slide"
        visible={emailSettingsVisible}
        transparent={true}
        onRequestClose={() => setEmailSettingsVisible(false)}
        style={styles.emailModal}
      >
        <View style={styles.modalOverlay}>

          <View style={styles.emailModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Email Settings</Text>
              <TouchableOpacity
                onPress={() => setEmailSettingsVisible(false)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <EmailSettings
              companyId={user?.company_id}
              onClose={() => setEmailSettingsVisible(false)}
              onUpdate={refreshUserCompany}
            />
          </View>

        </View>
      </Modal>

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
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 10,
    elevation: 10,
  },
  profileHeader: {
    alignItems: 'center',
    width: '100%',
  },

  // AVATAR
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 3,
    borderColor: '#ffffffff',
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
  priorityCircle: {
    width: 110,
    height: 100,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
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
    // marginBottom: 12,
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
    marginTop: 10,
    // marginBottom: 24,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dividing: {
    width: 1,
    backgroundColor: COLORS.border,
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
  statValueLoading: {
    opacity: 0.6,
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

  emailModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  emailModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emailModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    // maxHeight: '85%',
    paddingTop: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

});