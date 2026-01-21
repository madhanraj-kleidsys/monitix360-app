import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/client'; // Adjust path if needed

const COLORS = {
    primary: '#0099FF',
    secondary: '#00D4FF',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    textLight: '#64748B',
    border: '#E2E8F0',
};

const AdminApprovalsPage = () => {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchApprovals = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tasks/admin/getPendingUserTaskRequests');
            setApprovals(res.data || []);
        } catch (err) {
            console.log('Fetch approvals error:', err);
            // Alert.alert('Error', 'Failed to fetch approvals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    const handleAction = async (id, status) => {
        setActionLoading(id);
        try {
            const endpoint = status === 'approved'
                ? `/tasks/admin/${id}/task-approved`
                : `/tasks/admin/${id}/task-rejected`;

            await api.patch(endpoint);

            // Remove from list locally
            setApprovals(prev => prev.filter(item => item.id !== id));
            Alert.alert('Success', `Task ${status} successfully`);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', `Failed to ${status} task`);
        } finally {
            setActionLoading(null);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.itemProject}>{item.project_title}</Text>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                    <Text style={styles.priorityText}>{getPriorityLabel(item.priority)}</Text>
                </View>
            </View>

            <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>

            <View style={styles.metaRow}>
                <View style={styles.userRow}>
                    <Ionicons name="person-circle-outline" size={16} color={COLORS.textLight} />
                    <Text style={styles.metaText}>{item.AssignedTo?.username || 'User'}</Text>
                </View>
                <Text style={styles.metaText}>
                    {new Date(item.start).toLocaleDateString()} - {new Date(item.end_time).toLocaleDateString()}
                </Text>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleAction(item.id, 'rejected')}
                    disabled={actionLoading === item.id}
                >
                    <Ionicons name="close-circle" size={18} color="#fff" />
                    <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleAction(item.id, 'approved')}
                    disabled={actionLoading === item.id}
                >
                    {actionLoading === item.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                            <Text style={styles.btnText}>Approve</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const getPriorityColor = (p) => {
        if (p == 1) return COLORS.danger;
        if (p == 2) return COLORS.warning;
        return COLORS.success;
    };

    const getPriorityLabel = (p) => {
        if (p == 1) return 'High';
        if (p == 2) return 'Medium';
        return 'Low';
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#00D4FF', '#0099FF', '#667EEA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Approvals</Text>
                <Text style={styles.headerSubtitle}>Manage pending requests</Text>
            </LinearGradient>

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : approvals.length > 0 ? (
                    <FlatList
                        data={approvals}
                        renderItem={renderItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.list}
                        refreshControl={
                            <RefreshControl refreshing={loading} onRefresh={fetchApprovals} />
                        }
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkmark-done-circle-outline" size={64} color={COLORS.textLight} />
                        <Text style={styles.emptyText}>No pending approvals</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export default AdminApprovalsPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500'
    },
    content: { flex: 1 },
    list: { padding: 20 },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.textLight,
        fontWeight: '500'
    },
    card: {
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8
    },
    itemProject: {
        fontSize: 12,
        color: COLORS.textLight,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 2
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    priorityText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    itemDesc: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 12,
        lineHeight: 20
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        alignItems: 'center'
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    metaText: {
        fontSize: 12,
        color: COLORS.textLight,
        fontWeight: '500'
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6
    },
    approveBtn: {
        backgroundColor: COLORS.success
    },
    rejectBtn: {
        backgroundColor: COLORS.danger
    },
    btnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14
    }
});
