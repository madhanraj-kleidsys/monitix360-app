import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../../services/ApiService';
import moment from 'moment';


const COLORS = {
    primary: '#2563EB',
    primarySoft: '#EFF6FF',
    secondary: '#0EA5E9',
    accent: '#22C55E',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',
    background: '#F1F5F9',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    textLight: '#64748B',
    border: '#E2E8F0',
    chipBg: '#F9FAFB',
};

const TaskItem = React.memo(({ task, onStart, onPause, onStop, onStatusChange }) => {
    const [elapsed, setElapsed] = useState(task.elapsed_seconds || 0);
    const [timings, setTimings] = useState([]);
    const [loadingTimings, setLoadingTimings] = useState(false);
    const intervalRef = useRef(null);
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;


    const fetchTimings = async () => {
        if (!task?.id) return;
        try {
            setLoadingTimings(true);
            const res = await ApiService.getTaskTimeUpdates(task.id);
            if (res.data) {
                setTimings(res.data);
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

    // Moving socket listeners to parent (TaskPage) for better performance
    // and to avoid 100s of listeners when list is long.

    const isRunning = task.task_start && task.timer_start;

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (isRunning) {
            console.log(`⏱️ Starting timer for Task ${task.id}`);
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
            console.log(`⏹️ Timer idle for Task ${task.id}`);
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
        return (
            String(hours).padStart(2, '0') +
            ':' +
            String(minutes).padStart(2, '0') +
            ':' +
            String(seconds).padStart(2, '0')
        );
    };

    const getPriorityColor = (priority) => {
        switch (String(priority)) {
            case '1': return COLORS.danger;
            case '2': return COLORS.warning;
            case '3': return COLORS.success;
            default: return COLORS.textLight;
        }
    };

    const getPriorityLabel = (priority) => {
        switch (String(priority)) {
            case '1': return 'High';
            case '2': return 'Medium';
            case '3': return 'Low';
            default: return 'Normal';
        }
    };

    const getStatusColor = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'completed') return COLORS.success;
        if (s === 'in progress') return COLORS.primary;
        if (s === 'pending') return COLORS.warning;
        if (s === 'incomplete') return COLORS.danger;
        if (s === 'paused') return COLORS.textLight;
        return COLORS.textLight;
    };



    const renderTimingItem = (timing) => {
        const isStart = timing.type === 1;
        // Use moment for robust parsing and formatting
        const m = moment(timing.time);
        const isValid = m.isValid();
        const timeDisplay = isValid ? m.format('hh:mm:ss A') : 'Invalid Time';
        const dateDisplay = isValid ? m.format('MMM DD') : 'Invalid Date';

        return (
            <View key={timing.id || Math.random().toString()} style={styles.timingItem}>
                <View style={[styles.timingIcon, { backgroundColor: isStart ? COLORS.success + '15' : COLORS.danger + '15' }]}>
                    <Ionicons name={isStart ? "play" : "stop"} size={12} color={isStart ? COLORS.success : COLORS.danger} />
                </View>
                <View style={styles.timingInfo}>
                    <Text style={styles.timingTypeText}>{isStart ? 'Started' : 'Stopped'}</Text>
                    <Text style={styles.timingTimeText}>{dateDisplay}, {timeDisplay}</Text>
                </View>
            </View>
        );
    };

    const formatPlannedDate = (d) => {
        const m = moment(d);
        return m.isValid() ? m.format('MMM DD, hh:mm A') : 'Invalid Date';
    };

    return (
        <View style={[styles.taskCard, { padding: isTablet ? 24 : 16, borderRadius: isTablet ? 20 : 16 }]}>
            {/* Header */}
            <View style={styles.taskHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.projectName, { fontSize: isTablet ? 20 : 18 }]} numberOfLines={1}>
                        {task.title || task.project_title}
                    </Text>
                    <Text style={styles.projectTitle} numberOfLines={1}>
                        {task.project_title}
                    </Text>
                </View>

                <View style={styles.headerRight}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '15' }]}>
                        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                        <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                            {getPriorityLabel(task.priority)}
                        </Text>
                    </View>

                    <View style={[styles.statusPill, { backgroundColor: getStatusColor(task.status) + '15' }]}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(task.status) }]} />
                        <Text style={[styles.statusText, { color: getStatusColor(task.status) }]} numberOfLines={1}>
                            {task.status || 'Pending'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Description */}
            {task.description ? (
                <Text style={[styles.description, { fontSize: isTablet ? 14 : 13 }]} numberOfLines={3}>
                    {task.description}
                </Text>
            ) : null}

            {/* Planned Time Section */}
            <View style={styles.sectionDivider} />
            <View style={styles.timeRow}>
                <View style={styles.labelContainer}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.textLight} />
                    <Text style={styles.sectionLabel}>Planned Schedule</Text>
                </View>
                <View style={styles.timeChipsRow}>
                    <View style={styles.timeChip}>
                        <Text style={styles.timeText}>{formatPlannedDate(task.start)}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.textLight} style={{ marginHorizontal: 4 }} />
                    <View style={styles.timeChip}>
                        <Text style={styles.timeText}>{formatPlannedDate(task.end_time)}</Text>
                    </View>
                </View>
            </View>

            {/* Actual Timings Section (New) */}
            <View style={styles.timingSection}>
                <View style={styles.labelContainer}>
                    <Ionicons name="stats-chart-outline" size={14} color={COLORS.textLight} />
                    <Text style={styles.sectionLabel}>Activity Log</Text>
                </View>
                {loadingTimings ? (
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
                ) : (
                    <View style={styles.timingsList}>
                        {timings.length > 0 ? (
                            timings.slice(-3).reverse().map(renderTimingItem)
                        ) : (
                            <Text style={styles.emptyTimingsText}>No activity recorded yet</Text>
                        )}
                    </View>
                )}
            </View>

            {/* Reasons */}
            {(task.start_early_reason || task.start_late_reason) && (
                <View style={styles.reasonsContainer}>
                    {task.start_early_reason && (
                        <View style={styles.reasonRow}>
                            <Text style={styles.reasonLabel}>Early start:</Text>
                            <Text style={styles.reasonText}>{task.start_early_reason}</Text>
                        </View>
                    )}
                    {task.start_late_reason && (
                        <View style={styles.reasonRow}>
                            <Text style={styles.reasonLabel}>Late start:</Text>
                            <Text style={styles.reasonText}>{task.start_late_reason}</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Timer & Controls */}
            <View style={styles.footer}>
                <View style={styles.timerColumn}>
                    <Text style={styles.timerLabel}>Total Time Elapsed</Text>
                    <View style={styles.timerChip}>
                        <Ionicons name="timer-outline" size={18} color={COLORS.primary} />
                        <Text style={[styles.timerText, { fontSize: isTablet ? 26 : 22 }]}>
                            {formatTime(elapsed)}
                        </Text>
                    </View>
                </View>

                <View style={[styles.controlsColumn, { width: isTablet ? '45%' : '100%' }]}>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={task.status}
                            onValueChange={(val) => onStatusChange(task, val)}
                            style={styles.picker}
                            mode="dropdown"
                        >
                            <Picker.Item label="Pending" value="pending" />
                            <Picker.Item label="In Progress" value="In Progress" />
                            <Picker.Item label="Completed" value="completed" />
                            <Picker.Item label="Incomplete" value="Incomplete" />
                            <Picker.Item label="Paused" value="Paused" />
                        </Picker>
                    </View>

                    <View style={styles.actionButtons}>
                        {!isRunning ? (
                            <TouchableOpacity style={[styles.btn, styles.btnStart]} onPress={() => onStart(task)}>
                                <Ionicons name="play" size={18} color="#fff" />
                                <Text style={styles.btnText}>{elapsed > 0 ? 'Resume' : 'Start'}</Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity style={[styles.iconBtn, styles.btnPause]} onPress={() => onPause(task)}>
                                    <Ionicons name="pause" size={18} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.iconBtn, styles.btnStop]} onPress={() => onStop(task)}>
                                    <Ionicons name="stop" size={18} color="#fff" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
});

export default TaskItem;

const styles = StyleSheet.create({
    taskCard: {
        backgroundColor: COLORS.cardBg,
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 0.5,
        borderColor: 'rgba(148, 163, 184, 0.25)',
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerRight: {
        marginLeft: 12,
        alignItems: 'flex-end',
        gap: 6,
    },
    projectName: {
        fontWeight: '800',
        color: COLORS.text,
    },
    projectTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.secondary,
        marginTop: 2,
    },
    description: {
        color: COLORS.textLight,
        marginBottom: 16,
        lineHeight: 20,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 12,
        opacity: 0.5,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: 6,
    },
    timeRow: {
        marginBottom: 12,
    },
    timeChipsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    timeChip: {
        backgroundColor: COLORS.chipBg,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    timeText: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: '500',
    },
    timingSection: {
        marginBottom: 16,
    },
    timingsList: {
        gap: 8,
    },
    timingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 8,
        borderRadius: 10,
    },
    timingIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    timingInfo: {
        flex: 1,
    },
    timingTypeText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.text,
    },
    timingTimeText: {
        fontSize: 11,
        color: COLORS.textLight,
    },
    emptyTimingsText: {
        fontSize: 12,
        color: COLORS.textLight,
        fontStyle: 'italic',
        marginLeft: 4,
        marginTop: 4,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priorityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '700',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    reasonsContainer: {
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    reasonRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    reasonLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#92400E',
        width: 80,
    },
    reasonText: {
        fontSize: 12,
        color: '#B45309',
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: 16,
    },
    timerColumn: {
        flex: 1,
        minWidth: 150,
    },
    timerLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textLight,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    timerChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    timerText: {
        fontWeight: '800',
        color: COLORS.primary,
        marginLeft: 8,
    },
    controlsColumn: {
        gap: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        height: 48,
        justifyContent: 'center',
        backgroundColor: COLORS.chipBg,
    },
    picker: {
        height: 48,
        width: '100%',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    btn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: COLORS.accent,
    },
    iconBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnStart: {
        backgroundColor: COLORS.accent,
    },
    btnPause: {
        backgroundColor: COLORS.warning,
    },
    btnStop: {
        backgroundColor: COLORS.danger,
    },
    btnText: {
        color: '#fff',
        fontWeight: '800',
        marginLeft: 8,
        fontSize: 14,
    },
});
