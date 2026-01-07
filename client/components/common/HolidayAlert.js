import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const HolidayAlert = ({ visible, onConfirm, message }) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.alertOverlay}>
                <View style={styles.alertContainer}>
                    <LinearGradient
                        colors={['#6366F1', '#4F46E5']}
                        style={styles.alertHeader}
                    >
                        <Ionicons name="calendar" size={40} color="#fff" />
                    </LinearGradient>
                    <View style={styles.alertBody}>
                        <Text style={styles.alertTitle}>Non-Working Day</Text>
                        <Text style={styles.alertMessage}>{message}</Text>
                        <TouchableOpacity
                            style={styles.alertButton}
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#4F46E5']}
                                style={styles.alertButtonGradient}
                            >
                                <Text style={styles.alertButtonText}>Understood</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertContainer: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    alertHeader: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertBody: {
        padding: 24,
        alignItems: 'center',
    },
    alertTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 12,
    },
    alertMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    alertButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    alertButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    alertButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default HolidayAlert;
