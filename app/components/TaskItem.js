import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../../services/ApiService';
import moment from 'moment';

// Design System Colors
const COLORS = {
  // Primary Palette
  primary: '#3B82F6',
  primaryDark: '#1E40AF',
  primaryLight: '#DBEAFE',
  primaryVeryLight: '#F0F9FF',

  // Secondary/Accent
  secondary: '#06B6D4',
  accent: '#10B981',
  accentLight: '#ECFDF5',

  // Status Colors
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#0284C7',

  // Neutral Palette
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  surfaceTertiary: '#E2E8F0',

  // Text Colors
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.5)',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

const TYPOGRAPHY = {
  xs: { fontSize: 11, lineHeight: 16 },
  sm: { fontSize: 12, lineHeight: 18 },
  base: { fontSize: 14, lineHeight: 20 },
  lg: { fontSize: 16, lineHeight: 24 },
  xl: { fontSize: 18, lineHeight: 28 },
  '2xl': { fontSize: 20, lineHeight: 28 },
};

const TaskItem = React.memo(({ task, onStart, onPause, onStop, onStatusChange }) => {
  const [elapsed, setElapsed] = useState(task.elapsed_seconds || 0);
  const [timings, setTimings] = useState([]);
  const [loadingTimings, setLoadingTimings] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  const intervalRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { width, height } = useWindowDimensions();

  // Responsive Layout
  const isSmallPhone = width < 375;
  const isMediumPhone = width >= 375 && width < 428;
  const isLargePhone = width >= 428 && width < 768;
  const isTablet = width >= 768;

  const isPortrait = height > width;

  const containerPadding = useMemo(() => {
    if (isSmallPhone) return SPACING.md;
    if (isMediumPhone) return SPACING.lg;
    return isTablet ? SPACING.xl : SPACING.lg;
  }, [isSmallPhone, isMediumPhone, isTablet]);

  const fetchTimings = async () => {
    if (!task?.id) return;
    try {
      setLoadingTimings(true);
      const res = await ApiService.getTaskTimeUpdates(task.id);
      if (res.data) {
        setTimings(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error(`Failed to fetch timings for task ${task.id}`, err);
    } finally {
      setLoadingTimings(false);
    }
  };

  useEffect(() => {
    fetchTimings();
  }, [task.id, task.status]);

  const isRunning = task.task_start && task.timer_start;

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning) {
      const base = task.elapsed_seconds || 0;
      const start = new Date(task.timer_start);

      const update = () => {
        const now = new Date();
        const session = Math.floor((now - start) / 1000);
        setElapsed(base + session);
      };

      update();
      intervalRef.current = setInterval(update, 1000);
    } else {
      setElapsed(task.elapsed_seconds || 0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, task.timer_start, task.elapsed_seconds, task.id]);

  // Animation trigger
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.02,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [task.status]);

  const formatTime = (totalSeconds) => {
    if (isNaN(totalSeconds)) return '00:00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return (
      String(hours).padStart(2, '0') +
      ':' +
      String(minutes).padStart(2, '0') +
      ':' +
      String(seconds).padStart(2, '0')
    );
  };

  const getPriorityConfig = (priority) => {
    switch (String(priority)) {
      case '1':
        return { color: COLORS.danger, label: 'High', icon: 'alert-circle' };
      case '2':
        return { color: COLORS.warning, label: 'Medium', icon: 'alert' };
      case '3':
        return { color: COLORS.success, label: 'Low', icon: 'check-circle' };
      default:
        return { color: COLORS.info, label: 'Normal', icon: 'information' };
    }
  };

  const getStatusConfig = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed')
      return { color: COLORS.success, label: 'completed', icon: 'check-all' };
    if (s === 'in progress')
      return { color: COLORS.primary, label: 'In Progress', icon: 'play-circle' };
    if (s === 'pending')
      return { color: COLORS.warning, label: 'pending', icon: 'clock' };
    if (s === 'incomplete')
      return { color: COLORS.danger, label: 'Incomplete', icon: 'close-circle' };
    if (s === 'Paused')
      return { color: COLORS.textTertiary, label: 'Paused', icon: 'pause-circle' };
    return { color: COLORS.textTertiary, label: 'Unknown', icon: 'help-circle' };
  };

  const formatPlannedDate = (d) => {
    const m = moment(d);
    return m.isValid()
      ? m.format(isSmallPhone ? 'MMM DD' : 'MMM DD, hh:mm A')
      : 'Invalid Date';
  };

  const formatTimingTime = (d) => {
    const m = moment(d);
    return m.isValid()
      ? { date: m.format('MMM DD'), time: m.format('hh:mm A') }
      : { date: 'Invalid', time: 'Date' };
  };

  const priorityConfig = getPriorityConfig(task.priority);
  const statusConfig = getStatusConfig(task.status);

  const renderTimingItem = (timing) => {
    const isStart = timing.type === 1;
    const { date, time } = formatTimingTime(timing.time);

    return (
      <View key={timing.id || Math.random().toString()} style={styles.timingItem}>
        <View
          style={[
            styles.timingIconContainer,
            { backgroundColor: isStart ? COLORS.accentLight : COLORS.primaryLight },
          ]}
        >
          <MaterialCommunityIcons
            name={isStart ? 'play' : 'stop'}
            size={14}
            color={isStart ? COLORS.success : COLORS.danger}
          />
        </View>

        <View style={styles.timingContent}>
          <Text style={styles.timingType}>{isStart ? 'Started' : 'Stopped'}</Text>
          <Text style={styles.timingDate}>{date}</Text>
        </View>

        <Text style={styles.timingTime}>{time}</Text>
      </View>
    );
  };

  const hasReasons =
    (task.start_early_reason || task.start_late_reason) && task.status !== 'completed';

  return (
    <Animated.View
      style={[
        styles.taskCard,
        {
          transform: [{ scale: scaleAnim }],
          marginHorizontal: isTablet ? SPACING.xl : SPACING.sm,
          marginVertical: SPACING.md,
        },
      ]}
    >
      {/* Header Section */}
      <View style={[styles.header, { paddingTop: containerPadding }]}>
        <View style={styles.titleSection}>
          <Text
            style={[
              styles.taskTitle,
              {
                fontSize: isTablet ? 18 : 16,
                maxWidth: width - (isTablet ? 160 : 140),
              },
            ]}
            numberOfLines={2}
          >
            {task.title || task.project_title}
          </Text>

          {task.project_title && task.project_title !== task.title && (
            <Text style={styles.projectSubtitle} numberOfLines={1}>
              {task.project_title}
            </Text>
          )}
        </View>

        <View style={styles.badgesContainer}>
          {/* Priority Badge */}
          <View
            style={[
              styles.badge,
              { backgroundColor: priorityConfig.color + '12' },
            ]}
          >
            <MaterialCommunityIcons
              name={priorityConfig.icon}
              size={12}
              color={priorityConfig.color}
            />
            <Text
              style={[styles.badgeText, { color: priorityConfig.color, marginLeft: 3 }]}
            >
              {priorityConfig.label}
            </Text>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: statusConfig.color + '12',
                borderWidth: 1,
                borderColor: statusConfig.color + '30',
              },
            ]}
          >
            <MaterialCommunityIcons
              name={statusConfig.icon}
              size={12}
              color={statusConfig.color}
            />
            <Text
              style={[styles.badgeText, { color: statusConfig.color, marginLeft: 3 }]}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      {task.description && (
        <Text
          style={[
            styles.description,
            { marginHorizontal: containerPadding, marginTop: SPACING.md },
          ]}
          numberOfLines={3}
        >
          {task.description}
        </Text>
      )}

      {/* Divider */}
      <View
        style={[
          styles.divider,
          { marginVertical: containerPadding, marginHorizontal: containerPadding },
        ]}
      />

      {/* Schedule Section */}
      <View style={[styles.section, { paddingHorizontal: containerPadding }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="calendar-range"
            size={16}
            color={COLORS.primary}
          />
          <Text style={styles.sectionTitle}>Planned Schedule</Text>
        </View>

        <View style={styles.dateRangeContainer}>
          <View style={styles.dateChip}>
            <MaterialCommunityIcons
              name="clock-start"
              size={12}
              color={COLORS.primary}
            />
            <Text style={styles.dateText}>{formatPlannedDate(task.start)}</Text>
          </View>

          <View style={styles.dateArrow}>
            <MaterialCommunityIcons
              name="arrow-right-thin"
              size={16}
              color={COLORS.textTertiary}
            />
          </View>

          <View style={styles.dateChip}>
            <MaterialCommunityIcons
              name="clock-end"
              size={12}
              color={COLORS.secondary}
            />
            <Text style={styles.dateText}>{formatPlannedDate(task.end_time)}</Text>
          </View>
        </View>
      </View>

      {/* Activity Log Section */}
      <View style={[styles.section, { paddingHorizontal: containerPadding, marginTop: SPACING.lg }]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() =>
            setExpandedSection(expandedSection === 'activity' ? null : 'activity')
          }
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons
            name="history"
            size={16}
            color={COLORS.secondary}
          />
          <Text style={styles.sectionTitle}>Activity Log</Text>
          <View style={{ flex: 1 }} />
          <MaterialCommunityIcons
            name={expandedSection === 'activity' ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={COLORS.textTertiary}
          />
        </TouchableOpacity>

        {expandedSection === 'activity' && (
          <View style={[styles.activityContent, { marginTop: SPACING.md }]}>
            {loadingTimings ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={{ marginVertical: SPACING.lg }}
              />
            ) : timings.length > 0 ? (
              <View style={styles.timingsList}>
                {timings
                  .slice(-5)
                  .reverse()
                  .map((timing, idx) => (
                    <View key={timing.id || idx}>
                      {renderTimingItem(timing)}
                      {idx < timings.slice(-5).length - 1 && (
                        <View style={styles.timingDivider} />
                      )}
                    </View>
                  ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="clock-off"
                  size={24}
                  color={COLORS.textTertiary}
                />
                <Text style={styles.emptyStateText}>
                  No activity recorded yet
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Reasons Section */}
      {hasReasons && (
        <View
          style={[
            styles.reasonsSection,
            { marginHorizontal: containerPadding, marginTop: SPACING.lg },
          ]}
        >
          {task.start_early_reason && (
            <View style={styles.reasonItem}>
              <View style={styles.reasonIcon}>
                <MaterialCommunityIcons
                  name="fast-forward"
                  size={14}
                  color={COLORS.info}
                />
              </View>
              <View style={styles.reasonContent}>
                <Text style={styles.reasonLabel}>Early Start</Text>
                <Text style={styles.reasonText}>{task.start_early_reason}</Text>
              </View>
            </View>
          )}

          {task.start_late_reason && (
            <View style={styles.reasonItem}>
              <View style={styles.reasonIcon}>
                <MaterialCommunityIcons
                  name="rewind"
                  size={14}
                  color={COLORS.warning}
                />
              </View>
              <View style={styles.reasonContent}>
                <Text style={styles.reasonLabel}>Late Start</Text>
                <Text style={styles.reasonText}>{task.start_late_reason}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Divider */}
      <View
        style={[
          styles.divider,
          {
            marginVertical: containerPadding,
            marginHorizontal: containerPadding,
          },
        ]}
      />

      {/* Footer - Timer & Controls */}
      <View style={[styles.footer, { paddingHorizontal: containerPadding }]}>
        {/* Timer Display */}
        <View style={[styles.timerSection, { marginBottom: isTablet || !isPortrait ? 0 : SPACING.lg }]}>
          <Text style={styles.timerLabel}>Time Elapsed</Text>
          <View style={styles.timerDisplay}>
            <View style={styles.timerIcon}>
              <MaterialCommunityIcons
                name="timer"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <Text
              style={[
                styles.timerValue,
                { fontSize: isTablet ? 32 : 28 },
              ]}
            >
              {formatTime(elapsed)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View
          style={[
            styles.controlsSection,
            { flex: isTablet || !isPortrait ? 1 : 0 },
          ]}
        >
          {/* Status Picker */}
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={task.status}
              onValueChange={(val) => onStatusChange(task, val)}
              style={styles.picker}
              mode="dropdown"
            >
              <Picker.Item label="pending" value="pending" />
              <Picker.Item label="in progress" value="in progress" />
              <Picker.Item label="completed" value="completed" />
              <Picker.Item label="incomplete" value="incomplete" />
              <Picker.Item label="paused" value="paused" />
            </Picker>
            <MaterialCommunityIcons
              name="chevron-down"
              size={18}
              color={COLORS.textTertiary}
              style={styles.pickerIcon}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!isRunning ? (
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }]}
                onPress={() => onStart(task)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={elapsed > 0 ? 'play-pause' : 'play'}
                  size={16}
                  color={COLORS.textInverse}
                />
                <Text style={styles.primaryBtnText}>
                  {elapsed > 0 ? 'Resume' : 'Start'}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.secondaryBtn, styles.pauseBtn]}
                  onPress={() => onPause(task)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="pause"
                    size={16}
                    color={COLORS.textInverse}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryBtn, styles.stopBtn]}
                  onPress={() => onStop(task)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="stop"
                    size={16}
                    color={COLORS.textInverse}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Bottom Padding */}
      <View style={{ height: containerPadding }} />
    </Animated.View>
  );
});

TaskItem.displayName = 'TaskItem';

export default TaskItem;

// ============================================================================
// STYLES - Professional Design System
// ============================================================================

const styles = StyleSheet.create({
  // ─── Card Container ───
  taskCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },

  // ─── Header Section ───
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },

  titleSection: {
    flex: 1,
  },

  taskTitle: {
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },

  projectSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondary,
    marginTop: SPACING.xs,
  },

  badgesContainer: {
    gap: SPACING.sm,
    alignItems: 'flex-end',
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ─── Description ───
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // ─── Divider ───
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // ─── Sections ───
  section: {
    paddingVertical: SPACING.md,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ─── Schedule Section ───
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },

  dateChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceTertiary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    gap: SPACING.xs,
  },

  dateArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },

  // ─── Activity Log ───
  activityContent: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    padding: SPACING.md,
  },

  timingsList: {
    gap: SPACING.md,
  },

  timingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },

  timingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  timingContent: {
    flex: 1,
  },

  timingType: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },

  timingDate: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },

  timingTime: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.primary,
  },

  timingDivider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },

  emptyStateText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },

  // ─── Reasons Section ───
  reasonsSection: {
    backgroundColor: COLORS.primaryVeryLight,
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },

  reasonItem: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  reasonIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.textInverse,
    justifyContent: 'center',
    alignItems: 'center',
  },

  reasonContent: {
    flex: 1,
  },

  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },

  reasonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },

  // ─── Footer ───
  footer: {
    paddingVertical: SPACING.lg,
  },

  timerSection: {
    marginBottom: SPACING.md,
  },

  timerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },

  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.primaryVeryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },

  timerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.textInverse,
    justifyContent: 'center',
    alignItems: 'center',
  },

  timerValue: {
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  // ─── Controls Section ───
  controlsSection: {
    gap: SPACING.md,
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    overflow: 'hidden',
  },

  picker: {
    width: '100%',
    height: '100%',
  },

  pickerIcon: {
    position: 'absolute',
    right: SPACING.md,
    pointerEvents: 'none',
  },

  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    gap: SPACING.sm,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  primaryBtnText: {
    color: COLORS.textInverse,
    fontWeight: '600',
    fontSize: 14,
  },

  secondaryBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pauseBtn: {
    backgroundColor: COLORS.warning,
  },

  stopBtn: {
    backgroundColor: COLORS.danger,
  },
});
