import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const StyledConfirmAlert = ({
    visible,
    onConfirm,
    onCancel,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger" // "danger", "warning", "info"
}) => {
    const getColors = () => {
        switch (type) {
            case 'logout': return ['#EF4444', '#B91C1C'];
            case 'delete': return ['#EF4444', '#cc4141e1'];
            case 'danger': return ['#EF4444', '#B91C1C'];
            case 'warning': return ['#F59E0B', '#D97706'];
            case 'info': return ['#3B82F6', '#2563EB'];
            default: return ['#6366F1', '#4F46E5'];
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'logout': return 'log-out-outline';
            case 'delete': return 'trash-outline';
            case 'danger': return 'trash-outline';
            case 'warning': return 'alert-circle-outline';
            case 'info': return 'information-circle-outline';
            default: return 'help-circle-outline';
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.alertOverlay}>
                <View style={styles.alertContainer}>
                    <LinearGradient
                        colors={getColors()}
                        style={styles.alertHeader}
                    >
                        <Ionicons name={getIcon()} size={40} color="#fff" />
                    </LinearGradient>
                    <View style={styles.alertBody}>
                        <Text style={styles.alertTitle}>{title}</Text>
                        <Text style={styles.alertMessage}>{message}</Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onCancel}
                            >
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.confirmButton]}
                                onPress={onConfirm}
                            >
                                <LinearGradient
                                    colors={getColors()}
                                    style={styles.confirmButtonGradient}
                                >
                                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
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
        marginBottom: 8,
    },
    alertMessage: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    button: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    cancelButton: {
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
    },
    cancelButtonText: {
        color: '#4B5563',
        fontSize: 15,
        fontWeight: '600',
    },
    confirmButton: {
        // Gradient handled by child
    },
    confirmButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default StyledConfirmAlert;
