import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    ActivityIndicator,
    Animated,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../../services/ApiService';
import moment from 'moment';

const COLORS = {
    primary: '#3B82F6',
    accent: '#10B981',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    border: '#E2E8F0',
    primaryLight: '#DBEAFE',
    accentLight: '#ECFDF5',
};

const TaskItem = React.memo(({ task, onStart, onPause, onStop, onStatusChange }) => {
    const [elapsed, setElapsed] = useState(task.elapsed_seconds || 0);
    const [timings, setTimings] = useState([]);
    const [loadingTimings, setLoadingTimings] = useState(false);
    const [showActivity, setShowActivity] = useState(false);

    const intervalRef = useRef(null);
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const fetchTimings = useCallback(async () => {
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
    }, [task.id]);

    const toggleActivity = () => {
        if (!showActivity && timings.length === 0) {
            fetchTimings();
        }
        setShowActivity(!showActivity);
    };

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

    const formatTime = (totalSeconds) => {
        if (isNaN(totalSeconds)) return '00:00:00';
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const priorityConfig = useMemo(() => {
        switch (String(task.priority)) {
            case '1': return { color: COLORS.danger, label: 'High', icon: 'alert-circle' };
            case '2': return { color: COLORS.warning, label: 'Medium', icon: 'alert' };
            case '3': return { color: COLORS.success, label: 'Low', icon: 'checkmark-circle' };
            default: return { color: COLORS.textTertiary, label: 'Normal', icon: 'information-circle' };
        }
    }, [task.priority]);

    const statusConfig = useMemo(() => {
        const s = (task.status || '').toLowerCase();
        if (s === 'completed') return { color: COLORS.success, label: 'Completed', icon: 'checkmark-done-circle' };
        if (s === 'in progress') return { color: COLORS.primary, label: 'In Progress', icon: 'play-circle' };
        if (s === 'pending') return { color: COLORS.warning, label: 'Pending', icon: 'time' };
        if (s === 'paused') return { color: COLORS.textTertiary, label: 'Paused', icon: 'pause-circle' };
        if (s === 'incomplete') return { color: COLORS.danger, label: 'Incomplete', icon: 'close-circle' };
        return { color: COLORS.textTertiary, label: task.status, icon: 'help-circle' };
    }, [task.status]);

    const renderTimingItem = (timing) => {
        const isStart = timing.type === 1;
        const m = moment(timing.time_logged || timing.time);
        const date = m.isValid() ? m.format('MMM DD') : 'Invalid';
        const time = m.isValid() ? m.format('hh:mm A') : 'Date';

        return (
            <View key={timing.id || Math.random().toString()} style={styles.timingItem}>
                <View style={[styles.timingIcon, { backgroundColor: isStart ? COLORS.accentLight : COLORS.primaryLight }]}>
                    <Ionicons name={isStart ? "play" : "stop"} size={14} color={isStart ? COLORS.success : COLORS.danger} />
                </View>
                <View style={styles.timingInfo}>
                    <Text style={styles.timingType}>{isStart ? 'Started' : 'Stopped'}</Text>
                    <Text style={styles.timingDate}>{date}</Text>
                </View>
                <Text style={styles.timingTime}>{time}</Text>
            </View>
        );
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.titleArea}>
                    <Text style={styles.projectName} numberOfLines={1}>{task.title || task.project_title}</Text>
                    <Text style={styles.projectSub}>{task.project_title}</Text>
                </View>
                <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: priorityConfig.color + '15' }]}>
                        <Ionicons name={priorityConfig.icon} size={10} color={priorityConfig.color} style={{ marginRight: 2 }} />
                        <Text style={[styles.badgeText, { color: priorityConfig.color }]}>{priorityConfig.label}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusConfig.color + '15' }]}>
                        <Ionicons name={statusConfig.icon} size={10} color={statusConfig.color} style={{ marginRight: 2 }} />
                        <Text style={[styles.badgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                    </View>
                </View>
            </View>

            {task.description ? (
                <Text style={styles.description} numberOfLines={2}>{task.description}</Text>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.timeRow}>
                <View style={styles.timeBlock}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="calendar-outline" size={12} color={COLORS.primary} />
                        <Text style={styles.timeLabel}>Start</Text>
                    </View>
                    <Text style={styles.timeValue}>{moment(task.start).format('MMM DD, LT')}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color={COLORS.textTertiary} />
                <View style={styles.timeBlock}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="time-outline" size={12} color={COLORS.secondary || COLORS.primary} />
                        <Text style={styles.timeLabel}>End</Text>
                    </View>
                    <Text style={styles.timeValue}>{moment(task.end_time).format('MMM DD, LT')}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.activityToggle} onPress={toggleActivity}>
                <Ionicons name="analytics-outline" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.activityToggleText}>
                    {showActivity ? 'Hide Activity Log' : 'Show Activity Log'}
                </Text>
                <Ionicons name={showActivity ? "chevron-up" : "chevron-down"} size={14} color={COLORS.primary} />
            </TouchableOpacity>

            {showActivity && (
                <View style={styles.activityLog}>
                    {loadingTimings ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : timings.length > 0 ? (
                        <View style={{ gap: 10 }}>
                            {timings.slice(-5).reverse().map((timing, idx) => (
                                <View key={timing.id || idx}>
                                    {renderTimingItem(timing)}
                                    {idx < Math.min(timings.length, 5) - 1 && <View style={styles.timingDivider} />}
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="information-circle-outline" size={20} color={COLORS.textTertiary} />
                            <Text style={styles.emptyText}>No activity recorded yet</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.footer}>
                <View style={styles.timerArea}>
                    <Text style={styles.timerSub}>Time Elapsed</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="timer-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.timerMain}>{formatTime(elapsed)}</Text>
                    </View>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.pickerWrapper}
                        onPress={() => {
                            Alert.alert(
                                "Select Status",
                                "Update the current status of this task",
                                [
                                    { text: "Pending", onPress: () => onStatusChange(task, 'Pending') },
                                    { text: "In Progress", onPress: () => onStatusChange(task, 'In Progress') },
                                    { text: "Completed", onPress: () => onStatusChange(task, 'Completed') },
                                    { text: "Incomplete", onPress: () => onStatusChange(task, 'Incomplete') },
                                    { text: "Paused", onPress: () => onStatusChange(task, 'Paused') },
                                    { text: "Cancel", style: "cancel" }
                                ]
                            );
                        }}
                    >
                        <Text style={styles.statusSelectText}>
                            {statusConfig.label}
                        </Text>
                        <Ionicons name="chevron-down" size={12} color={COLORS.textTertiary} />
                    </TouchableOpacity>

                    <View style={styles.buttons}>
                        {!isRunning ? (
                            <TouchableOpacity style={styles.playBtn} onPress={() => onStart(task)}>
                                <Ionicons name={elapsed > 0 ? "play-forward" : "play"} size={22} color="#fff" />
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.pauseBtn} onPress={() => onPause(task)}>
                                    <Ionicons name="pause" size={22} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.stopBtn} onPress={() => onStop(task)}>
                                    <Ionicons name="stop" size={22} color="#fff" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    titleArea: {
        flex: 1,
    },
    projectName: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    projectSub: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
    },
    badges: {
        flexDirection: 'row',
        gap: 6,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    description: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 12,
        lineHeight: 18,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 12,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    timeBlock: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 10,
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
    },
    timeValue: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    activityToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        backgroundColor: COLORS.background,
        borderRadius: 8,
        marginBottom: 12,
    },
    activityToggleText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
        marginRight: 4,
    },
    activityLog: {
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    timingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 2,
    },
    timingIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timingInfo: {
        flex: 1,
    },
    timingType: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.text,
    },
    timingDate: {
        fontSize: 10,
        color: COLORS.textTertiary,
    },
    timingTime: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    timingDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginLeft: 34,
    },
    emptyState: {
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    timeBlock: {
        flex: 1,
    },
    timeLabel: {
        fontSize: 10,
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    timeValue: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    timerArea: {
        flex: 1,
    },
    timerSub: {
        fontSize: 10,
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: 4,
    },
    timerMain: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pickerWrapper: {
        width: 130,
        height: 44,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border,
    },
    statusSelectText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },
    buttons: {
        flexDirection: 'row',
        gap: 8,
    },
    playBtn: {
        backgroundColor: COLORS.accent,
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    pauseBtn: {
        backgroundColor: COLORS.warning,
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: COLORS.warning,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    stopBtn: {
        backgroundColor: COLORS.danger,
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: COLORS.danger,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
});

export default TaskItem;
