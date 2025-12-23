import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const COLORS = {
    primary: '#0099FF',
    secondary: '#6366F1',
    background: '#F8FAFC',
    text: '#1E293B',
    textLight: '#64748B',
    danger: '#EF4444',
};

export default function NotificationModal({ visible, notifications, onClose, onNotificationPress }) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.dismissArea}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <BlurView
                        intensity={Platform.OS === 'ios' ? 30 : 100}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                </TouchableOpacity>

                <View style={styles.container}>
                    <View style={styles.dragIndicator} />

                    <LinearGradient
                        colors={['#1E293B', '#0F172A']}
                        style={styles.header}
                    >
                        <View style={styles.headerTop}>
                            <View>
                                <Text style={styles.headerTitle}>Notifications</Text>
                                <Text style={styles.headerSubtitle}>
                                    {notifications.length} {notifications.length === 1 ? 'Update' : 'Updates'} for you
                                </Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    <FlatList
                        data={notifications}
                        keyExtractor={(item, index) => item.id || index.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.notifCard}
                                onPress={() => onNotificationPress(item)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: (item.color || COLORS.primary) + '20' }]}>
                                    <Ionicons name={item.icon || 'notifications'} size={24} color={item.color || COLORS.primary} />
                                </View>
                                <View style={styles.notifInfo}>
                                    <View style={styles.notifHeader}>
                                        <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.notifTime}>{item.time}</Text>
                                    </View>
                                    <Text style={styles.notifBody} numberOfLines={2}>
                                        {item.body}
                                    </Text>
                                    {item.project && (
                                        <View style={styles.projectBadge}>
                                            <Ionicons name="folder-outline" size={10} color={COLORS.secondary} style={{ marginRight: 4 }} />
                                            <Text style={styles.projectText}>{item.project}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconCircle}>
                                    <Ionicons name="notifications-off-outline" size={48} color={COLORS.textLight} />
                                </View>
                                <Text style={styles.emptyText}>All caught up!</Text>
                                <Text style={styles.emptySubtext}>You don't have any new notifications at the moment.</Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    dismissArea: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        height: height * 0.8,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
        elevation: 20,
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 10,
        position: 'absolute',
        zIndex: 10,
    },
    header: {
        padding: 24,
        paddingTop: 32,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 60,
    },
    notifCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    notifInfo: {
        flex: 1,
    },
    notifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    notifTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
        flex: 1,
    },
    notifTime: {
        fontSize: 11,
        color: COLORS.textLight,
        marginLeft: 8,
    },
    notifBody: {
        fontSize: 13,
        color: COLORS.textLight,
        lineHeight: 18,
        marginBottom: 10,
    },
    projectBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    projectText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.secondary,
        textTransform: 'uppercase',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: 20,
    },
});
