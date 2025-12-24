import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
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

const STATUS_COLORS = {
  'Pending': '#F39C12',
  'In Progress': '#3498DB',
  'Completed': '#27AE60',
  'Incomplete': '#95A5A6',
  'Paused': '#E74C3C',
};

export const HomeBarChart = ({ tasks, selectedDate, onTaskPress }) => {
  if (!Array.isArray(tasks)) {
    tasks = [];
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => {
      const s = (t.status || '').toLowerCase();
      return s === 'completed';
    }).length;
    const inProgress = tasks.filter(t => {
      const s = (t.status || '').toLowerCase();
      return s === 'in progress';
    }).length;
    const pending = tasks.filter(t => {
      const s = (t.status || '').toLowerCase();
      return s === 'pending';
    }).length;
    const paused = tasks.filter(t => {
      const s = (t.status || '').toLowerCase();
      return s === 'paused';
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const efficiency = Math.min(100, completionRate + (inProgress * 10));

    const totalHours = tasks.reduce((sum, task) => {
      const duration = (task.durationminutes || 0) / 60;
      return sum + duration;
    }, 0);

    return {
      total,
      completed,
      inProgress,
      pending,
      completionRate,
      efficiency,
      totalHours: totalHours.toFixed(1),
    };
  }, [tasks]);

  // Group tasks by employee
  const tasksByEmployee = useMemo(() => {
    const grouped = {};
    tasks.forEach(task => {
      const emp = task.employeeName || task.assignedto || 'Unassigned';
      if (!grouped[emp]) {
        grouped[emp] = [];
      }
      grouped[emp].push(task);
    });
    return Object.entries(grouped).map(([emp, empTasks]) => ({
      employee: emp,
      tasks: empTasks,
      totalHours: empTasks.reduce((sum, t) => sum + ((t.durationminutes || 0) / 60), 0),
    }));
  }, [tasks]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Main Stats Cards */}
      <View style={styles.statsGrid}>
        {/* Total Tasks */}
        <LinearGradient
          colors={['#00D4FF', '#0099FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCard}
        >
          <View style={styles.statCardContent}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
            <Ionicons name="list-sharp" size={24} color="#fff" style={styles.statIcon} />
          </View>
        </LinearGradient>

        {/* Completed */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCard}
        >
          <View style={styles.statCardContent}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
            <Ionicons name="checkmark-circle" size={24} color="#fff" style={styles.statIcon} />
          </View>
        </LinearGradient>
      </View>

      {/* Second Row Stats */}
      <View style={styles.statsGrid}>
        {/* In Progress */}
        <LinearGradient
          colors={['#3498DB', '#2980B9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCard}
        >
          <View style={styles.statCardContent}>
            <Text style={styles.statValue}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
            <Ionicons name="hourglass" size={24} color="#fff" style={styles.statIcon} />
          </View>
        </LinearGradient>

        {/* Pending */}
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCard}
        >
          <View style={styles.statCardContent}>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
            <Ionicons name="time" size={24} color="#fff" style={styles.statIcon} />
          </View>
        </LinearGradient>
      </View>

      {/* Metrics */}
      <View style={styles.metricsSection}>
        {/* Completion Rate */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Completion Rate</Text>
            <Text style={styles.metricValue}>{stats.completionRate}%</Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${stats.completionRate}%` }]}
            />
          </View>
        </View>

        {/* Efficiency Score */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Efficiency Score</Text>
            <Text style={styles.metricValue}>{stats.efficiency}%</Text>
          </View>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.min(100, stats.efficiency)}%` }]}
            />
          </View>
        </View>

        {/* Total Hours */}
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Total Hours</Text>
            <Text style={styles.metricValue}>{stats.totalHours}h</Text>
          </View>
          <Text style={styles.metricDescription}>
            Time allocated today
          </Text>
        </View>
      </View>

      {/* Employee Workload */}
      {tasksByEmployee.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Employee Workload</Text>
          {tasksByEmployee.map((emp, idx) => (
            <View key={idx} style={styles.employeeRow}>
              <Text style={styles.employeeName}>{emp.employee}</Text>
              <View style={styles.workloadContainer}>
                <LinearGradient
                  colors={['#00D4FF', '#0099FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.workloadBar,
                    { width: `${Math.min(100, (emp.totalHours / 10) * 100)}%` }
                  ]}
                />
              </View>
              <Text style={styles.hoursText}>
                {emp.totalHours.toFixed(1)}h
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Today's Tasks */}
      {tasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Today's Tasks</Text>
          {tasks.slice(0, 5).map((task, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.taskItem}
              onPress={() => onTaskPress?.(task)}
            >
              <View
                style={[
                  styles.taskDot,
                  { backgroundColor: STATUS_COLORS[task.status] || STATUS_COLORS['Pending'] || '#ccc' }
                ]}
              />
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>
                  {task.name || task.title}
                </Text>
                <Text style={styles.taskMeta}>
                  {task.employeeName} • {((task.durationminutes || 0) / 60).toFixed(1)}h
                </Text>
              </View>
              <Text
                style={[
                  styles.taskStatus,
                  { color: STATUS_COLORS[task.status] || STATUS_COLORS['Pending'] || '#ccc' }
                ]}
              >
                {task.status || 'Pending'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statCardContent: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  statIcon: {
    marginTop: 4,
  },
  metricsSection: {
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  employeeRow: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  employeeName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  workloadContainer: {
    height: 20,
    backgroundColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 6,
  },
  workloadBar: {
    height: '100%',
    borderRadius: 10,
  },
  hoursText: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  taskMeta: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  taskStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default HomeBarChart;