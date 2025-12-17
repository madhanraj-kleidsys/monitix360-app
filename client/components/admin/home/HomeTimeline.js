import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  PanResponder,
  Animated,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

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
  'pending': '#F39C12',
  'in progress': '#3498DB',
  'In Progress': '#3498DB',
  'completed': '#27AE60',
  'Incomplete': '#95A5A6',
  'Paused': '#E74C3C',
};

/**
 * Helper: Convert ISO time string to minutes since midnight
 * "2025-12-17T09:30:00" → 570 minutes
 */
const isoToMinutes = (isoString) => {
  if (!isoString) return 0;
  try {
    const date = new Date(isoString);
    return date.getHours() * 60 + date.getMinutes();
  } catch {
    return 0;
  }
};

/**
 * Helper: Calculate duration between two ISO times
 * Returns milliseconds
 */
const getIsoDuration = (startIso, endIso) => {
  if (!startIso || !endIso) return 0;
  try {
    const start = new Date(startIso);
    const end = new Date(endIso);
    return Math.max(0, end - start);
  } catch {
    return 0;
  }
};

/**
 * Helper: Add duration to ISO time
 * "2025-12-17T09:30:00" + 3600000ms (1 hour) → "2025-12-17T10:30:00"
 */
const addDurationToIso = (isoString, durationMs) => {
  if (!isoString) return new Date().toISOString();
  try {
    const date = new Date(isoString);
    date.setTime(date.getTime() + durationMs);
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

/**
 * Helper: Convert minutes to ISO time string (same date)
 * 570 minutes + "2025-12-17T..." → "2025-12-17T09:30:00Z"
 */
const minutesToIso = (minutes, referenceIsoString) => {
  if (!referenceIsoString) return new Date().toISOString();
  try {
    const refDate = new Date(referenceIsoString);
    const date = new Date(refDate);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    date.setHours(hours, mins, 0, 0);
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

/**
 * DraggableTimeline Component
 *
 * Props:
 * - tasks: Array of task objects with startTime, endTime (ISO strings)
 * - shifts: Array of shift objects with startTime, endTime
 * - selectedDate: Selected date (for reference)
 * - onTaskDragEnd: Callback(taskId, newStartIso, newEndIso)
 * - onTaskPress: Callback(task)
 */
export const DraggableTimeline = ({
  tasks = [],
  shifts = [],
  selectedDate,
  onTaskDragEnd,
  onTaskPress,
}) => {
  const horizontalScrollRef = useRef(null);
  const [draggingTaskId, setDraggingTaskId] = useState(null);

  // Get shift times (default 9-5 if no shifts)
  const shiftTimes = useMemo(() => {
    if (shifts.length === 0) {
      return { startTime: '09:00', endTime: '17:00', breaks: [] };
    }
    // Extract HH:MM from shift_start "09:00", "09:00:00", etc.
    const formatTime = (timeStr) => {
      if (!timeStr) return '09:00';
      return timeStr.split(':').slice(0, 2).join(':');
    };
    return {
      startTime: formatTime(shifts[0].startTime || shifts[0].shift_start),
      endTime: formatTime(shifts[0].endTime || shifts[0].shift_end),
      breaks: shifts[0].breaks || [],
    };
  }, [shifts]);

  // Convert shift times to minutes
  const shiftStartMin = isoToMinutes(`2025-01-01T${shiftTimes.startTime}:00`);
  const shiftEndMin = isoToMinutes(`2025-01-01T${shiftTimes.endTime}:00`);
  const totalMinutes = shiftEndMin - shiftStartMin;

  // Calculate layout
  const TIMELINE_PADDING = 16;
  const HOURS_LABEL_WIDTH = 60;
  const USABLE_WIDTH = width - TIMELINE_PADDING * 2 - HOURS_LABEL_WIDTH;
  const pixelsPerMinute = USABLE_WIDTH / totalMinutes;
  const TIMELINE_HEIGHT = 1200; // Width in horizontal scroll

  // Group tasks by employee
  const tasksByEmployee = useMemo(() => {
    const grouped = {};
    tasks.forEach((task) => {
      const emp = task.employeeName || task.assigned_to || task.assignedto || 'Unassigned';
      if (!grouped[emp]) {
        grouped[emp] = [];
      }
      grouped[emp].push(task);
    });
    return Object.entries(grouped)
      .map(([emp, empTasks]) => ({ employee: emp, tasks: empTasks }))
      .slice(0, 10); // Max 10 employees
  }, [tasks]);

  // Calculate task position
  const getTaskPosition = useCallback(
    (task) => {
      const startMin = isoToMinutes(task.startTime);
      const endMin = isoToMinutes(task.endTime);
      
      const offsetFromShiftStart = Math.max(0, startMin - shiftStartMin);
      const left = HOURS_LABEL_WIDTH + TIMELINE_PADDING + offsetFromShiftStart * pixelsPerMinute;
      
      // Calculate duration properly
      const taskDuration = Math.max(15, endMin - startMin); // Min 15 mins for visibility
      const taskWidth = Math.max(50, taskDuration * pixelsPerMinute);

      return { left, taskWidth, startMin, endMin };
    },
    [shiftStartMin, pixelsPerMinute]
  );

  // Handle drag end - FIXED TO PRESERVE DURATION
  const handleTaskDragEnd = useCallback(
    (task, dx) => {
      if (Math.abs(dx) < 5) {
        // Tap, not drag
        onTaskPress?.(task);
        setDraggingTaskId(null);
        return;
      }

      try {
        // ✅ IMPORTANT: Calculate original duration FIRST
        const originalDuration = getIsoDuration(task.startTime, task.endTime);
        console.log('📊 Original duration (ms):', originalDuration);

        const minutesDragged = dx / pixelsPerMinute;
        const currentStartMin = isoToMinutes(task.startTime);
        const currentEndMin = isoToMinutes(task.endTime);
        const duration = currentEndMin - currentStartMin;

        let newStartMin = currentStartMin + minutesDragged;
        let newEndMin = newStartMin + duration;

        // Clamp to shift hours
        if (newStartMin < shiftStartMin) {
          newStartMin = shiftStartMin;
          newEndMin = newStartMin + duration;
        }
        if (newEndMin > shiftEndMin) {
          newEndMin = shiftEndMin;
          newStartMin = newEndMin - duration;
        }

        // ✅ Convert back to ISO, preserving duration
        const newStartIso = minutesToIso(newStartMin, task.startTime);
        // Add the original duration to new start time
        const newEndIso = addDurationToIso(newStartIso, originalDuration);

        console.log('📝 Drag result:', {
          taskId: task.id,
          originalStart: task.startTime,
          originalEnd: task.endTime,
          originalDurationMs: originalDuration,
          newStart: newStartIso,
          newEnd: newEndIso,
          newDurationMs: getIsoDuration(newStartIso, newEndIso),
        });

        onTaskDragEnd?.(task.id, newStartIso, newEndIso);
      } catch (err) {
        console.error('❌ Drag error:', err);
      } finally {
        setDraggingTaskId(null);
      }
    },
    [pixelsPerMinute, shiftStartMin, shiftEndMin, onTaskDragEnd, onTaskPress]
  );

  // Render hour labels
  const renderHourLabels = () => {
    const labels = [];
    const startHour = Math.floor(shiftStartMin / 60);
    const endHour = Math.ceil(shiftEndMin / 60);

    for (let h = startHour; h <= endHour; h++) {
      const xPos = (h * 60 - shiftStartMin) * pixelsPerMinute;
      labels.push(
        <View key={h} style={[styles.hourLabel, { left: xPos }]}>
          <Text style={styles.hourLabelText}>{String(h).padStart(2, '0')}:00</Text>
        </View>
      );
    }
    return labels;
  };

  // Render grid lines
  const renderGridLines = () => {
    const lines = [];
    const startHour = Math.floor(shiftStartMin / 60);
    const endHour = Math.ceil(shiftEndMin / 60);

    for (let h = startHour; h <= endHour; h++) {
      const xPos = (h * 60 - shiftStartMin) * pixelsPerMinute;
      lines.push(
        <View key={`line-${h}`} style={[styles.gridLine, { left: xPos }]} />
      );
    }
    return lines;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.employeeLabel}>
          <Text style={styles.employeeLabelText}>Employee</Text>
        </View>
        <View style={styles.timelineInfo}>
          <Text style={styles.timelineInfoText}>
            {shiftTimes.startTime} - {shiftTimes.endTime}
          </Text>
        </View>
      </View>

      {/* Horizontal Scroll */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        showsHorizontalScrollIndicator={true}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        <View style={{ width: TIMELINE_HEIGHT }}>
          {/* Hour Labels Row */}
          <View style={styles.hoursRow}>
            <View style={[styles.employeeCell, styles.hoursCellLabel]} />
            <View style={[styles.timelineTrack, { width: TIMELINE_HEIGHT - HOURS_LABEL_WIDTH }]}>
              {renderHourLabels()}
            </View>
          </View>

          {/* Employee Rows */}
          {tasksByEmployee.map((empData, idx) => (
            <View key={idx} style={styles.employeeRow}>
              {/* Employee Name */}
              <View style={[styles.employeeCell, { width: HOURS_LABEL_WIDTH }]}>
                <Text style={styles.employeeNameText} numberOfLines={2}>
                  {empData.employee}
                </Text>
              </View>

              {/* Tasks Track */}
              <View
                style={[
                  styles.tasksTrack,
                  { width: TIMELINE_HEIGHT - HOURS_LABEL_WIDTH },
                ]}
              >
                {/* Grid Background */}
                <View style={styles.gridOverlay}>{renderGridLines()}</View>

                {/* Task Bars */}
                {empData.tasks.map((task, taskIdx) => {
                  const { left, taskWidth } = getTaskPosition(task);
                  const statusColor = STATUS_COLORS[task.status] || COLORS.textLight;

                  return (
                    <DraggableTaskBar
                      key={`${idx}-${taskIdx}`}
                      task={task}
                      left={left}
                      width={taskWidth}
                      statusColor={statusColor}
                      isDragging={draggingTaskId === task.id}
                      onDragStart={() => setDraggingTaskId(task.id)}
                      onDragEnd={(dx) => handleTaskDragEnd(task, dx)}
                      onPress={() => onTaskPress?.(task)}
                    />
                  );
                })}
              </View>
            </View>
          ))}

          {/* Empty State */}
          {tasksByEmployee.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No tasks scheduled</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * DraggableTaskBar - Individual task bar with drag support
 */
function DraggableTaskBar({
  task,
  left,
  width,
  statusColor,
  isDragging,
  onDragStart,
  onDragEnd,
  onPress,
}) {
  const pan = useRef(new Animated.Value(0)).current;
  const lastDx = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onDragStart?.();
        lastDx.current = 0;
      },
      onPanResponderMove: (evt, gestureState) => {
        lastDx.current = gestureState.dx;
        pan.setValue(gestureState.dx);
      },
      onPanResponderRelease: () => {
        onDragEnd?.(lastDx.current);
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.taskBar,
        {
          left,
          width,
          backgroundColor: statusColor,
          opacity: isDragging ? 0.7 : 1,
          transform: [{ translateX: pan }],
        },
      ]}
      {...panResponder.panHandlers}
      onTouchEnd={onPress}
    >
      <View style={styles.taskBarContent}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {task.name || task.title || 'Task'}
        </Text>
        <Text style={styles.taskTime} numberOfLines={1}>
          {new Date(task.startTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          -{' '}
          {new Date(task.endTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    height: 50,
  },

  employeeLabel: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },

  employeeLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
  },

  timelineInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  timelineInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  scrollView: {
    flex: 1,
  },

  hoursRow: {
    flexDirection: 'row',
    height: 45,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },

  hoursCellLabel: {
    backgroundColor: COLORS.background,
  },

  timelineTrack: {
    position: 'relative',
  },

  hourLabel: {
    position: 'absolute',
    width: 50,
    top: 10,
    alignItems: 'center',
  },

  hourLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },

  gridLine: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: COLORS.border,
  },

  employeeRow: {
    flexDirection: 'row',
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },

  employeeCell: {
    width: 60,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },

  employeeNameText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },

  tasksTrack: {
    position: 'relative',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },

  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  taskBar: {
    position: 'absolute',
    top: 6,
    height: 68,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  taskBarContent: {
    justifyContent: 'center',
  },

  taskTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },

  taskTime: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.85)',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
    fontWeight: '500',
  },
});

export default DraggableTimeline;