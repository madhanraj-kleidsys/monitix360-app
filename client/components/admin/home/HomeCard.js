import React from 'react';
import {
    View,
    Text,
    StyleSheet,
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
    'pending': '#F39C12',
    'in progress': '#3498DB',
    'In Progress': '#3498DB',
    'completed': '#27AE60',
    'Incomplete': '#95A5A6',
    'Paused': '#E74C3C',
};

const PRIORITY_COLORS = {
    1: '#EF4444',
    2: '#F59E0B',
    3: '#10B981',
    'High': '#EF4444',
    'Medium': '#F59E0B',
    'Low': '#10B981',
};

export const HomeCard = ({ task, onPress }) => {
    if (!task) return null;

    const statusColor = STATUS_COLORS[task.status] || COLORS.textLight;
    const priorityColor = PRIORITY_COLORS[task.priority] || COLORS.textLight;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.cardContent}>
                {/* Employee Section */}
                <View style={styles.employeeSection}>
                    <Text style={styles.employeeName}>
                        {task.employeeName || 'Unassigned'}
                    </Text>
                </View>

                {/* Task Section */}
                <View style={styles.taskSection}>
                    <Text
                        style={styles.taskName}
                        numberOfLines={2}
                    >
                        {task.name || task.title || 'No Title'}
                    </Text>
                    <Text style={styles.projectText}>
                        {task.ProjectTitle || task.projectTitle || 'No Project'}
                    </Text>
                </View>

                {/* Priority Indicator */}
                <View
                    style={[
                        styles.priorityIndicator,
                        { backgroundColor: priorityColor },
                    ]}
                />

                {/* Status Section */}
                <View style={styles.statusSection}>
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: statusColor },
                        ]}
                    />
                    <Text
                        style={[
                            styles.statusText,
                            { color: statusColor },
                        ]}
                    >
                        {task.status || 'pending'}
                    </Text>
                </View>

                {/* Arrow */}
                <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.textLight}
                />
            </View>

            {/* Decorative Dots */}
            <View style={styles.decorativeDots}>
                <View style={[styles.dot, { backgroundColor: priorityColor }]} />
                <View style={[styles.dot, { backgroundColor: statusColor }]} />
                <View style={[styles.dot, { backgroundColor: priorityColor }]} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    employeeSection: {
        width: 80,
    },
    employeeName: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },
    taskSection: {
        flex: 1,
    },
    taskName: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 4,
    },
    projectText: {
        fontSize: 11,
        color: COLORS.textLight,
    },
    priorityIndicator: {
        width: 8,
        height: 24,
        borderRadius: 4,
    },
    statusSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minWidth: 90,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    decorativeDots: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        opacity: 0.4,
    },
});

export default HomeCard;