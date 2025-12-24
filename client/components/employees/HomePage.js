import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TaskPage from './TaskPage';
import ApiService from '../../services/ApiService';
import NotificationModal from './NotificationModal';
import { useWebSocket } from '../admin/hooks/useWebSocket';
import moment from 'moment';
import * as NotificationServices from '../../services/NotificationService';

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

export default function HomePage({ user }) {

  const [taskStats, setTaskStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    pending: 0,
  });

  const [notifications, setNotifications] = useState([]);
  const [notifVisible, setNotifVisible] = useState(false);
  const { socket, isConnected } = useWebSocket();

  const fetchStats = useCallback(async () => {
    try {
      const res = await ApiService.getMyTasks();
      const tasks = res.data.filter(task => {
        if (task.added_by_user === false) return true;
        return task.approval_status === "approved";
      });

      setTaskStats({
        total: tasks.length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'pending').length,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  useEffect(() => {
    const setupNotifications = async () => {
      const { registerForPushNotifications } = require('../../services/NotificationService');
      const token = await registerForPushNotifications();
      if (token) {
        try {
          await ApiService.updatePushToken(token);
          console.log('✅ Push Token registered with server');
        } catch (err) {
          console.error('❌ Server push token update failed:', err);
        }
      }
    };

    fetchStats();
    setupNotifications();
  }, [fetchStats]);

  // WebSocket for live notifications list
  useEffect(() => {
    console.log('🏠 HomePage Socket Effect:', { socket: !!socket, isConnected, userId: user?.id });
    if (socket && isConnected && user?.id) {
      console.log(`🏠 Joining room: user_${user.id}`);
      socket.emit("joinRoom", `user_${user.id}`);

      const onTaskAssigned = (task) => {
        console.log('🏠 Task Assigned Event Received:', task.id);
        if (String(task.assigned_to) !== String(user.id)) return;

        const newNotif = {
          id: Date.now().toString(),
          title: "New Task Assigned! 🚀",
          body: task.description || "You have a new task to work on.",
          project: task.project_title || "General",
          time: moment().format('hh:mm A'),
          icon: "rocket",
          color: COLORS.primary,
        };
        setNotifications(prev => [newNotif, ...prev]);
        fetchStats();
      };

      const onTaskUpdated = (task) => {
        console.log('🏠 Task Updated Event Received:', task.id);
        if (String(task.assigned_to) !== String(user.id)) return;

        const newNotif = {
          id: Date.now().toString(),
          title: "Task Updated 🔄",
          body: `Status: ${task.status}`,
          project: task.project_title,
          time: moment().format('hh:mm A'),
          icon: "refresh",
          color: COLORS.warning,
        };
        setNotifications(prev => [newNotif, ...prev]);
        fetchStats();
      };

      socket.on("task:created", onTaskAssigned);
      socket.on("task:updated", onTaskUpdated);

      return () => {
        console.log('🏠 Cleaning up HomePage listeners');
        socket.off("task:created", onTaskAssigned);
        socket.off("task:updated", onTaskUpdated);
      };
    }
  }, [socket, isConnected, user?.id]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! 👋🏻';
    if (hour < 18) return 'Good Afternoon! 👋🏻';
    return 'Good Evening! 👋🏻';
  };

  const statsDisplay = [
    { label: 'Total Tasks', value: taskStats.total, icon: 'list', color: COLORS.primary, bgColor: '#1E5A8E15' },
    { label: 'In Progress', value: taskStats.inProgress, icon: 'time', color: COLORS.warning, bgColor: '#F59E0B15' },
    { label: 'Completed', value: taskStats.completed, icon: 'checkmark-circle', color: COLORS.success, bgColor: '#10B98115' },
    { label: 'Pending', value: taskStats.pending, icon: 'alert-circle', color: COLORS.danger, bgColor: '#EF444415' },
  ];

  const headerComponent = useMemo(() => (
    <View>
      <LinearGradient
        colors={['#00D4FF', '#0099FF', '#667EEA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.username || 'Unknown'}</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.profileContainer} onPress={() => setNotifVisible(true)}>
              <LinearGradient colors={['#FFFFFF', '#F0F9FF']} style={styles.avatar}>
                <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
              </LinearGradient>
              {notifications.length > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationText}>{notifications.length}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>

          {/* <View style={styles.statsOverviewCard}>
            <Text style={styles.statsTitle}> Today Stats</Text>
            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>75%</Text>
                <Text style={styles.overviewLabel}>Completion</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>1hrs</Text>
                <Text style={styles.overviewLabel}>Time Saved</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>98%</Text>
                <Text style={styles.overviewLabel}>Efficiency</Text>
              </View>
            </View>
          </View> */}

          <View style={styles.statsOverviewCard}>
            <Text style={styles.statsTitle}>Today Stats</Text>
            <View style={styles.overviewRow}>
              {statsDisplay.map((stat, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <View style={styles.overviewDivider} />}
                  <View style={styles.overviewItem}>
                    {/* <Ionicons name={stat.icon} size={20} color={stat.color} style={{ marginBottom: 6 }} /> */}
                    <Text style={[styles.overviewValue, { color: stat.color }]}>
                      {stat.value}
                    </Text>
                    <Text style={styles.overviewLabel}>{stat.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.contentPadding}>
        {/* <View style={styles.statsGrid}>
          {statsDisplay.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: stat.bgColor }]}>
              <Ionicons name={stat.icon} size={24} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View> */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Tasks</Text>
          <TouchableOpacity onPress={fetchStats}>
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [taskStats, notifications.length, user, fetchStats]);

  return (
    <View style={styles.container}>
      <TaskPage
        user={user}
        ListHeaderComponent={headerComponent}
      />

      <NotificationModal
        visible={notifVisible}
        notifications={notifications}
        onClose={() => setNotifVisible(false)}
        onNotificationPress={(item) => {
          setNotifVisible(false);
          // logic to scroll to task if taskId exists
        }}
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
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileContainer: {
    position: 'relative',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsOverviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 5,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  contentPadding: {
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
});