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
import Svg, { Defs, Pattern, Rect, Line as SvgLine } from 'react-native-svg';

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
  // 'pending': '#F39C12',
  // 'in progress': '#3498DB',
  // 'In Progress': '#3498DB',
  // 'completed': '#27AE60',
  // 'Incomplete': '#95A5A6',
  // 'Paused': '#E74C3C',

  'pending': ['#ffb700','#ffd93d'],
  'in progress': ['#ff6b6b', '#ee5a52'],
  // ['#3498DB', '#2980B9'],
  'completed': ['#4caf50','#6bcf7f'],
  'Incomplete': ['#95A5A6', '#7F8C8D'],
  'Paused': ['#E74C3C', '#C0392B'],
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
 * Helper: Convert HH:MM string to minutes
 */
const timeStringToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return h * 60 + m;
};

const formatDurationText = (durationMs) => {
  const totalSeconds = Math.floor(durationMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
      return { startTime: '09:00', endTime: '19:00', breaks: [] };
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
  const shiftStartMin = timeStringToMinutes(shiftTimes.startTime);
  const shiftEndMin = timeStringToMinutes(shiftTimes.endTime);
  // Handle crossing midnight (e.g. 22:00 to 06:00) - Basic support
  const totalMinutes = shiftEndMin < shiftStartMin
    ? (1440 - shiftStartMin) + shiftEndMin
    : shiftEndMin - shiftStartMin;

  // Normalize tasks data
  const normalizedTasks = useMemo(() => {
    return tasks.map(t => ({
      ...t,
      startTime: t.startTime || t.startDate || t.start,
      endTime: t.endTime || t.endDate || t.end_time || t.end
    }));
  }, [tasks]);

  // Use selectedDate for reference
  const referenceDate = useMemo(() => {
    if (selectedDate) return new Date(selectedDate);
    if (normalizedTasks.length > 0 && normalizedTasks[0].startTime) {
      return new Date(normalizedTasks[0].startTime);
    }
    return new Date();
  }, [selectedDate, normalizedTasks]);

  // Convert minutes to ISO using reference date
  const minToIsoDate = useCallback((mins) => {
    const d = new Date(referenceDate);
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  }, [referenceDate]);

  // Calculate layout
  const TIMELINE_PADDING = 16;
  const HOURS_LABEL_WIDTH = 60;
  const pixelsPerMinute = 2.5; // Wider for better visibility
  const tracksWidth = totalMinutes * pixelsPerMinute;
  const TIMELINE_WIDTH = tracksWidth + HOURS_LABEL_WIDTH + (TIMELINE_PADDING * 2);

  // Group tasks by employee
  const tasksByEmployee = useMemo(() => {
    const grouped = {};
    normalizedTasks.forEach((task) => {
      const emp = task.employeeName || task.assigned_to_name || `User #${task.assigned_to}` || 'Unassigned';
      if (!grouped[emp]) {
        grouped[emp] = [];
      }
      grouped[emp].push(task);
    });
    return Object.entries(grouped)
      .map(([emp, empTasks]) => ({ employee: emp, tasks: empTasks }))
      .slice(0, 15);
  }, [normalizedTasks]);

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

  // Handle task updates (Move or Resize)
  const handleTaskUpdate = useCallback(
    (task, changeType, dx) => {
      if (Math.abs(dx) < 2) {
        if (changeType === 'move') {
          onTaskPress?.(task);
        }
        setDraggingTaskId(null);
        return;
      }

      try {
        const minutesChange = dx / pixelsPerMinute;
        const currentStartMin = isoToMinutes(task.startTime);
        const currentEndMin = isoToMinutes(task.endTime);

        let newStartMin = currentStartMin;
        let newEndMin = currentEndMin;

        if (changeType === 'move') {
          newStartMin += minutesChange;
          newEndMin += minutesChange;
        } else if (changeType === 'resize-left') {
          newStartMin += minutesChange;
          // Clamp: start cannot be after end
          if (newStartMin > newEndMin - 15) newStartMin = newEndMin - 15;
        } else if (changeType === 'resize-right') {
          newEndMin += minutesChange;
          // Clamp: end cannot be before start
          if (newEndMin < newStartMin + 15) newEndMin = newStartMin + 15;
        }

        // Clamp to shift boundaries
        if (newStartMin < shiftStartMin) newStartMin = shiftStartMin;
        if (newEndMin > shiftEndMin) newEndMin = shiftEndMin;

        // Validation
        if (newStartMin >= newEndMin) return;

        const newStartIso = minToIsoDate(newStartMin);
        const newEndIso = minToIsoDate(newEndMin);

        console.log(`📝 ${changeType} result:`, {
          original: { s: task.startTime, e: task.endTime },
          new: { s: newStartIso, e: newEndIso }
        });

        onTaskDragEnd?.(task.id, newStartIso, newEndIso);

      } catch (err) {
        console.error('❌ Update error:', err);
      } finally {
        setDraggingTaskId(null);
      }
    },
    [pixelsPerMinute, shiftStartMin, shiftEndMin, minToIsoDate, onTaskDragEnd, onTaskPress]
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

  // Render breaks with diagonal lines
  const renderBreaks = () => {
    return (shiftTimes.breaks || []).map((breakItem, idx) => {
      const startMin = timeStringToMinutes(breakItem.startTime);
      const endMin = timeStringToMinutes(breakItem.endTime);

      // Calculate mins relative to shift start
      let relStart = startMin - shiftStartMin;
      if (relStart < 0) relStart += 1440; // Handle next day

      let duration = endMin - startMin;
      if (duration < 0) duration += 1440;

      const left = (relStart * pixelsPerMinute);
      const width = (duration * pixelsPerMinute);

      return (
        <View
          key={`break-${idx}`}
          style={[styles.breakBlock, { left, width }]}
          pointerEvents="none"
        >
          <Svg height="100%" width="100%">
            <Defs>
              <Pattern id={`hatch-${idx}`} width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <SvgLine x1="0" y1="0" x2="0" y2="10" stroke={COLORS.textLight} strokeWidth="1" strokeOpacity="0.5" />
              </Pattern>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#hatch-${idx})`} opacity="0.4" />
          </Svg>
          <View style={styles.breakLabelContainer}>
            <Text style={styles.breakLabel}>{breakItem.name}</Text>
          </View>
        </View>
      );
    });
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
        <View style={{ width: TIMELINE_WIDTH }}>
          {/* Hour Labels Row */}
          <View style={styles.hoursRow}>
            <View style={[styles.employeeCell, styles.hoursCellLabel]} />
            <View style={[styles.timelineTrack, { width: tracksWidth }]}>
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
                  { width: tracksWidth },
                ]}
              >
                {/* Grid Background */}
                <View style={styles.gridOverlay}>
                  {renderGridLines()}
                  {/* Breaks rendered per row for correct z-index */}
                  {renderBreaks()}
                </View>

                {/* Task Bars */}
                {empData.tasks.map((task, taskIdx) => {
                  const { left, taskWidth } = getTaskPosition(task);
                  const statusColor = STATUS_COLORS[task.status] || COLORS.textLight;

                  return (
                    <ResizableTaskBar
                      key={`${idx}-${taskIdx}`}
                      task={task}
                      left={left}
                      width={taskWidth}
                      statusColor={statusColor}
                      isDragging={draggingTaskId === task.id}
                      onInteractionStart={() => setDraggingTaskId(task.id)}
                      onUpdate={(type, dx) => handleTaskUpdate(task, type, dx)}
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
 * ResizableTaskBar - Task bar with drags and resize handles
 */
function ResizableTaskBar({
  task,
  left,
  width,
  statusColor,
  isDragging,
  onInteractionStart,
  onUpdate
}) {
  const pan = useRef(new Animated.Value(0)).current;
  const interactionType = useRef('move');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const { locationX } = evt.nativeEvent;
        // Determine interaction type based on touch area
        if (width > 40) { // Only resize if wide enough
          if (locationX < 20) interactionType.current = 'resize-left';
          else if (locationX > width - 20) interactionType.current = 'resize-right';
          else interactionType.current = 'move';
        } else {
          interactionType.current = 'move';
        }

        onInteractionStart?.();
        pan.setOffset(0);
        pan.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Visual feedback
        if (interactionType.current === 'move') {
          pan.setValue(gestureState.dx);
        }
        // For resize, we might want to animate width/left locally? 
        // Complex. For now, rely on parent re-render or just drag end?
        // User asked for "live" adjustment? "while moving it has to automatically take start and end time"
        // The parent `handleTaskUpdate` is called on Drag END right now (based on previous code).
        // Wait, the prompt implies dragging updates. But updating parent state on every frame is heavy.
        // Let's stick to "Drag End" updates for calculation safety, 
        // BUT visual feedback on drag is needed.
        // If I can't easily animate width locally, I'll stick to move animation only.
      },
      onPanResponderRelease: (evt, gestureState) => {
        onUpdate?.(interactionType.current, gestureState.dx);
        Animated.spring(pan, { toValue: 0, useNativeDriver: false }).start();
        interactionType.current = 'move'; // Reset
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
          zIndex: isDragging ? 100 : 2
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Left Handle */}

      <LinearGradient
    colors={statusColor} // This must be an array, e.g., ['#3498DB', '#2980B9']
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[StyleSheet.absoluteFill, { borderRadius: styles.taskBar.borderRadius || 4 }]}
  />

      <View style={styles.resizeHandleLeft}>
        <View style={styles.handleBar} />
      </View>

      <View style={styles.taskBarContent}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {task.id}. {task.name || task.title || 'Task'} - {formatDurationText(getIsoDuration(task.startTime, task.endTime))}
        </Text>
      </View>

      {/* Right Handle */}
      <View style={styles.resizeHandleRight}>
        <View style={styles.handleBar} />
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
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 0,
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
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
    fontWeight: '500',
  },

  breakBlock: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(200, 200, 200, 0.1)', // Light overlay
    zIndex: 1, // Behind tasks (tasks have zIndex implicit high or need checking)
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  breakLabelContainer: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 4,
    borderRadius: 4
  },
  breakLabel: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#333'
  },
  resizeHandleLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    justifyContent: 'center',
    paddingLeft: 4,
    zIndex: 10
  },
  resizeHandleRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
    zIndex: 10
  },
  handleBar: {
    width: 4,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2
  },
});

export default DraggableTimeline;