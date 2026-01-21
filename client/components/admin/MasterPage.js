import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#0099FF',
    secondary: '#00D4FF',
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    textLight: '#64748B',
    border: '#E2E8F0',
};

function MasterMenuItem({ icon, label, description, onPress }) {
    return (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={28} color={COLORS.primary} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
    );
}

export default function AdminMasterPage() {
    const navigation = useNavigation();

    const MASTER_ITEMS = [
        {
            id: 'staffs',
            label: 'Staffs',
            description: 'Manage users and employees',
            icon: 'people',
            route: 'AdminEmployees'
        },
        {
            id: 'projects',
            label: 'Projects',
            description: 'Manage projects and assignments',
            icon: 'briefcase',
            route: 'AdminProjects'
        },
        {
            id: 'shift',
            label: 'Shift',
            description: 'Configure daily work shifts',
            icon: 'time',
            route: 'AdminShift'
        },
        {
            id: 'holidays',
            label: 'Holidays',
            description: 'Manage holiday calendar',
            icon: 'calendar',
            route: 'AdminHolidays'
        },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#00D4FF', '#0099FF', '#667EEA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Master Management</Text>
                <Text style={styles.headerSubtitle}>Configure core settings</Text>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.grid}>
                    {MASTER_ITEMS.map((item) => (
                        <MasterMenuItem
                            key={item.id}
                            icon={item.icon}
                            label={item.label}
                            description={item.description}
                            onPress={() => navigation.navigate(item.route)}
                        />
                    ))}
                </View>

                <View style={{ height: 120 }} />
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
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    grid: {
        gap: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: `${COLORS.primary}15`, // 15 = low opacity hex
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: COLORS.textLight,
    },
});
