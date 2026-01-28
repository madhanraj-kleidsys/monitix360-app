import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
    primary: '#0099FF',
    secondary: '#00D4FF',
    text: '#0F172A',
    textLight: '#64748B',
    border: '#E2E8F0',
    cardBg: '#FFFFFF',
};

export default function ExportModal({ visible, onClose, onExport, loading }) {
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState({ visible: false, mode: 'date', field: 'start' });

    const handleExport = () => {
        onExport(startDate, endDate);
    };

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || (showPicker.field === 'start' ? startDate : endDate);
        const field = showPicker.field;

        setShowPicker(prev => ({ ...prev, visible: Platform.OS === 'ios' }));

        if (field === 'start') setStartDate(currentDate);
        else setEndDate(currentDate);

        if (Platform.OS !== 'ios') {
            setShowPicker({ visible: false, mode: 'date', field: '' });
        }
    };

    const showDatepicker = (field) => {
        setShowPicker({ visible: true, mode: 'date', field });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Export Data</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={COLORS.textLight} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.label}>Select Date Range</Text>

                        <View style={styles.dateRow}>
                            <View style={styles.dateField}>
                                <Text style={styles.subLabel}>From</Text>
                                <TouchableOpacity style={styles.dateInput} onPress={() => showDatepicker('start')}>
                                    <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
                                    <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.arrowContainer}>
                                <Ionicons name="arrow-forward" size={16} color={COLORS.textLight} />
                            </View>

                            <View style={styles.dateField}>
                                <Text style={styles.subLabel}>To</Text>
                                <TouchableOpacity style={styles.dateInput} onPress={() => showDatepicker('end')}>
                                    <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
                                    <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.exportBtn}
                            onPress={handleExport}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#00D4FF', '#0099FF']}
                                style={styles.gradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="download" size={18} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.exportBtnText}>Export Excel</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {showPicker.visible && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={showPicker.field === 'start' ? startDate : endDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    content: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 16,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dateField: {
        flex: 1,
    },
    subLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 4,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#F8FAFC',
    },
    dateText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    arrowContainer: {
        paddingHorizontal: 12,
        paddingTop: 16, // align with input
    },
    exportBtn: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    exportBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
