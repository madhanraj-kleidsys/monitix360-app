import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import RNPickerSelect from 'react-native-picker-select';
import { Picker } from '@react-native-picker/picker';

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

export default function TaskPage() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      projectName: 'ERP Module Development',
      description: 'Implement user authentication and role management',
      priority: 'High',
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      status: 'In Progress',
      timerStatus: 'stopped', // stopped, running, paused
    },
    {
      id: 2,
      projectName: 'Mobile App UI Design',
      description: 'Create wireframes for dashboard screens',
      priority: 'Medium',
      startTime: '10:00 AM',
      endTime: '02:00 PM',
      status: 'Pending',
      timerStatus: 'stopped',
    },
  ]);

  const handleTimerAction = (taskId, action) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, timerStatus: action } : task
    ));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return COLORS.danger;
      case 'Medium': return COLORS.warning;
      case 'Low': return COLORS.success;
      default: return COLORS.textLight;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return COLORS.success;
      case 'In Progress': return COLORS.primary;
      case 'Pending': return COLORS.warning;
      case 'Incomplete': return COLORS.danger;
      default: return COLORS.textLight;
    }
  };

  const renderTimerButton = (task) => {
    if (task.timerStatus === 'stopped') {
      return (
        <TouchableOpacity
          style={[styles.timerBtn, { backgroundColor: COLORS.success }]}
          onPress={() => handleTimerAction(task.id, 'running')}
        >
          <Ionicons name="play" size={16} color="#fff" />
          <Text style={styles.timerBtnText}>Start</Text>
        </TouchableOpacity>
      );
    }

    if (task.timerStatus === 'running') {
      return (
        <View style={styles.timerActions}>
          <TouchableOpacity
            style={[styles.timerBtn, styles.smallBtn, { backgroundColor: COLORS.warning }]}
            onPress={() => handleTimerAction(task.id, 'paused')}
          >
            <Ionicons name="pause" size={14} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timerBtn, styles.smallBtn, { backgroundColor: COLORS.danger }]}
            onPress={() => handleTimerAction(task.id, 'stopped')}
          >
            <Ionicons name="stop" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }

    if (task.timerStatus === 'paused') {
      return (
        <View style={styles.timerActions}>
          <TouchableOpacity
            style={[styles.timerBtn, styles.smallBtn, { backgroundColor: COLORS.success }]}
            onPress={() => handleTimerAction(task.id, 'running')}
          >
            <Ionicons name="play" size={14} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timerBtn, styles.smallBtn, { backgroundColor: COLORS.danger }]}
            onPress={() => handleTimerAction(task.id, 'stopped')}
          >
            <Ionicons name="stop" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>K</Text>
        </View>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {tasks.map(task => (
          <View key={task.id} style={styles.taskCard}>
            {/* Project Name & Priority */}
            <View style={styles.taskHeader}>
              <Text style={styles.projectName}>{task.projectName}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                  {task.priority}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.description}>{task.description}</Text>

            {/* Time */}
            <View style={styles.timeRow}>
              <View style={styles.timeItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.textLight} />
                <Text style={styles.timeText}>{task.startTime}</Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color={COLORS.textLight} />
              <View style={styles.timeItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.textLight} />
                <Text style={styles.timeText}>{task.endTime}</Text>
              </View>
            </View>

            {/* Status Dropdown */}
            <View style={styles.statusRow}>
              <Text style={styles.label}>Status:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={task.status}
                  onValueChange={(value) => {
                    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: value } : t));
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="⏳ Pending" value="Pending" />
                  <Picker.Item label="⚙️ In Progress" value="In Progress" />
                  <Picker.Item label="✅ Completed" value="Completed" />
                  <Picker.Item label="❌ Incomplete" value="Incomplete" />
                </Picker>
              </View>

            </View>

            {/* Timer Controls */}
            <View style={styles.timerRow}>
              {renderTimerButton(task)}
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(task.status) + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                  {task.status}
                </Text>
              </View>
            </View>
          </View>
        ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginLeft: 16,
  },
  notificationBtn: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  taskCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  timeText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 8,
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow:'hidden',
  },
  picker: {
    height: 52,
    color: COLORS.text,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  timerBtnText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  timerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

// const pickerSelectStyles = StyleSheet.create({
//   inputIOS: {
//     fontSize: 14,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     color: COLORS.text,
//   },
//   inputAndroid: {
//     fontSize: 14,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     color: COLORS.text,
//   },
// }); 