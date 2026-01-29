import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
    ActivityIndicator,
    Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../api/client';
import PremiumAlert from '../../components/common/PremiumAlert';

const COLORS = {
    primary: '#1E5A8E',
    secondary: '#3E9AD8',
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    text: '#1E293B',
    textLight: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
    error: '#EF4444',
};

export default function ActionPage({ user }) {
    const [mode, setMode] = useState('addTask'); // 'addTask' or 'notifications'

    // Add Task State
    const [projects, setProjects] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [showPicker, setShowPicker] = useState({ visible: false, mode: 'date', field: 'start' });
    const [submitting, setSubmitting] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [loadingNotes, setLoadingNotes] = useState(false);

    useEffect(() => {
        fetchProjects();
        fetchNotifications();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data || []);
        } catch (err) {
            console.log('Fetch projects error:', err);
        }
    };

    const fetchNotifications = async () => {
        setLoadingNotes(true);
        try {
            const res = await api.get('/tasks/user/userTaskUpdates');
            setNotifications(res.data || []);
        } catch (err) {
            console.log('Fetch notifications error:', err);
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleAddTask = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        if (endTime <= startTime) {
            Alert.alert('Error', 'End time must be after start time');
            return;
        }

        setSubmitting(true);
        try {
            const durationMinutes = (endTime - startTime) / 60000;
            const payload = {
                title: user?.department || 'General', // title is department, Project_Title is project name || orrr || dept is department , title is  Project name
                description: description,
                Project_Title: title,
                start: startTime.toISOString(),
                end_time: endTime.toISOString(),
                priority: 1,
                assigned_to: user?.id,
                status: 'pending',
                duration_minutes: durationMinutes
            };

            await api.post('/tasks/user/add-task-by-user', payload);
            Alert.alert('Success', 'Task sent for approval!');
            setTitle('');
            setDescription('');
            setStartTime(new Date());
            setEndTime(new Date());
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to send task');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteNotification = async (id) => {
        try {
            await api.delete(`/tasks/user/${id}/deleteUserTaskUpdates`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            Alert.alert('Error', 'Failed to delete notification');
        }
    };

    // Date Picker Handlers
    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || (showPicker.field === 'start' ? startTime : endTime);
        const field = showPicker.field;

        setShowPicker(prev => ({ ...prev, visible: Platform.OS === 'ios' }));

        if (field === 'start') setStartTime(currentDate);
        else setEndTime(currentDate);

        if (Platform.OS !== 'ios') {
            setShowPicker({ visible: false, mode: 'date', field: '' });
        }
    };

    const showDatepicker = (field, mode = 'date') => {
        setShowPicker({ visible: true, mode, field });
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1E5A8E', '#3E9AD8']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Actions Center</Text>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, mode === 'addTask' && styles.activeTab]}
                        onPress={() => setMode('addTask')}
                    >
                        <Text style={[styles.tabText, mode === 'addTask' && styles.activeTabText]}>New Task</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, mode === 'notifications' && styles.activeTab]}
                        onPress={() => { setMode('notifications'); fetchNotifications(); }}
                    >
                        <Text style={[styles.tabText, mode === 'notifications' && styles.activeTabText]}>Notifications</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                {mode === 'addTask' ? (
                    <View style={styles.form}>
                        <Text style={styles.label}>Project Title</Text>
                        <View style={styles.inputWrapper}>
                            {/* Simplified Project Selection - In real app, consider a Picker/Dropdown */}
                            <TextInput
                                style={styles.input}
                                placeholder="Enter project name..."
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>
                        {projects.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                {projects.map(p => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={styles.chip}
                                        onPress={() => setTitle(p.project_name)}
                                    >
                                        <Text style={styles.chipText}>{p.project_name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <Text style={styles.label}>Description</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                                placeholder="Describe your task..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.label}>Start Time</Text>
                                <TouchableOpacity
                                    style={styles.dateBtn}
                                    onPress={() => showDatepicker('start', 'date')}
                                >
                                    <Text>{startTime.toLocaleString()}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={styles.label}>End Time</Text>
                                <TouchableOpacity
                                    style={styles.dateBtn}
                                    onPress={() => showDatepicker('end', 'date')}
                                >
                                    <Text>{endTime.toLocaleString()}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {/* Time pickers logic is simplified, usually two steps (Date -> Time) are better */}
                        <View style={styles.row}>
                            <TouchableOpacity onPress={() => showDatepicker('start', 'time')} style={styles.timeLink}>
                                <Text style={styles.linkText}>Edit Start Time</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => showDatepicker('end', 'time')} style={styles.timeLink}>
                                <Text style={styles.linkText}>Edit End Time</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={handleAddTask}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>Request Approval</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {loadingNotes ? (
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        ) : notifications.length === 0 ? (
                            <Text style={styles.emptyText}>No notifications yet.</Text>
                        ) : (
                            notifications.map(note => (
                                <View key={note.id} style={styles.noteCard}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.noteTitle}>{note.project_title}</Text>
                                        <Text style={styles.noteDesc}>{note.description}</Text>
                                        <View style={styles.noteFooter}>
                                            <Text style={[
                                                styles.status,
                                                { color: note.approval_status === 'approved' ? COLORS.success : COLORS.error }
                                            ]}>
                                                {note.approval_status.toUpperCase()}
                                            </Text>
                                            <Text style={styles.date}>
                                                {new Date(note.createdAt).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                    {note.approval_status !== 'approved' && (
                                        <TouchableOpacity onPress={() => handleDeleteNotification(note.id)}>
                                            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))
                        )}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {showPicker.visible && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={showPicker.field === 'start' ? startTime : endTime}
                    mode={showPicker.mode}
                    is24Hour={true}
                    display="default"
                    onChange={onDateChange}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        marginBottom: 20
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12, padding: 4
    },
    tab: {
        flex: 1, paddingVertical: 8,
        alignItems: 'center', borderRadius: 8
    },
    activeTab: { backgroundColor: '#fff' },
    tabText: {
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600'
    },
    activeTabText: { color: COLORS.primary },
    content: { padding: 20 },
    form: { gap: 16 },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 6
    },
    inputWrapper: {
        backgroundColor: '#fff',
        borderRadius: 12, padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    input: { fontSize: 16, color: COLORS.text },
    chipScroll: {
        flexDirection: 'row',
        marginBottom: 12
    },
    chip: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8
    },
    chipText: {
        color: COLORS.primary,
        fontSize: 12, fontWeight: '600'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    dateBtn: {
        backgroundColor: '#fff',
        padding: 12, borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    timeLink: { marginTop: 8 },
    linkText: {
        color: COLORS.primary,
        fontWeight: '600'
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        padding: 16, borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8, elevation: 4
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },

    // Notifications
    list: { gap: 12 },
    noteCard: {
        backgroundColor: '#fff',
        padding: 16, borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center'
    },
    noteTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text
    },
    noteDesc: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 4
    },
    noteFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingRight: 10
    },
    status: {
        fontSize: 12,
        fontWeight: '700'
    },
    date: {
        fontSize: 12,
        color: COLORS.textLight
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textLight,
        marginTop: 40
    },
});
