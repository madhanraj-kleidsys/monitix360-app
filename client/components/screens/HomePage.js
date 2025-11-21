import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#1E5A8E',
  secondary: '#2E7AB8',
  accent: '#3E9AD8',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
  border: '#E2E8F0',
};

export default function HomePage() {
  const stats = [
    { label: 'Total Tasks', value: '24', icon: 'list', color: COLORS.primary, bgColor: '#1E5A8E20' },
    { label: 'In Progress', value: '8', icon: 'time', color: COLORS.warning, bgColor: '#F59E0B20' },
    { label: 'Completed', value: '12', icon: 'checkmark-circle', color: COLORS.success, bgColor: '#10B98120' },
    { label: 'Pending', value: '4', icon: 'alert-circle', color: COLORS.danger, bgColor: '#EF444420' },
  ];

  const recentActivity = [
    { task: 'ERP Module Development', time: '2 hours ago', type: 'completed' },
    { task: 'Mobile App UI Design', time: '5 hours ago', type: 'started' },
    { task: 'Database Optimization', time: 'Yesterday', type: 'paused' },
  ];

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good Morning! 👋</Text>
            <Text style={styles.userName}>Madhan Raj</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>M</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: stat.bgColor }]}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon} size={24} color="#fff" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="add-circle" size={28} color={COLORS.success} />
              </View>
              <Text style={styles.actionText}>New Task</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="calendar" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="document-text" size={28} color={COLORS.warning} />
              </View>
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityCard}>
              <View style={[styles.activityDot, { 
                backgroundColor: activity.type === 'completed' ? COLORS.success : 
                                activity.type === 'started' ? COLORS.primary : COLORS.warning 
              }]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTask}>{activity.task}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
              <Ionicons 
                name={activity.type === 'completed' ? 'checkmark-circle' : 
                      activity.type === 'started' ? 'play-circle' : 'pause-circle'}
                size={24}
                color={activity.type === 'completed' ? COLORS.success : 
                       activity.type === 'started' ? COLORS.primary : COLORS.warning}
              />
            </View>
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
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTask: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textLight,
  },
});
