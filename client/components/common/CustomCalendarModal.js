import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
    primary: '#0099FF',
    text: '#0F172A',
    textLight: '#64748B',
    border: '#E2E8F0',
    cardBg: '#FFFFFF',
    danger: '#EF4444',
    darkRed: '#7f1d1d',
    weekend: '#ef4444',
    today: '#0099FF',
};

const CustomCalendarModal = ({
    visible,
    onClose,
    selectedDate,
    onDateSelect,
    holidays = [],
    onHolidayPress
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear();
    };

    const isSelected = (day) => {
        const s = new Date(selectedDate);
        return day === s.getDate() &&
            currentMonth.getMonth() === s.getMonth() &&
            currentMonth.getFullYear() === s.getFullYear();
    };

    // Check for holidays and weekends (2nd/4th Sat, Sun)
    const getDateStatus = (day) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Fix: Use local date components instead of toISOString() to avoid timezone shifts
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayOfMonth}`;
        const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat

        // Holiday Check
        const holiday = holidays.find(h => h.holiday_date === dateStr);
        if (holiday) return { type: 'holiday', info: holiday };

        // Sunday Check
        if (dayOfWeek === 0) return { type: 'weekend', reason: 'Sunday' };

        // Saturday Check (2nd & 4th)
        if (dayOfWeek === 6) {
            const weekNum = Math.ceil(day / 7);
            if (weekNum === 2 || weekNum === 4) return { type: 'weekend', reason: 'Non-working Saturday' };
        }

        return null;
    };

    const renderDays = () => {
        const totalDays = daysInMonth(currentMonth);
        const firstDay = firstDayOfMonth(currentMonth);
        const days = [];

        // Empty slots for days before start of month
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        for (let i = 1; i <= totalDays; i++) {
            const status = getDateStatus(i);
            const isDayToday = isToday(i);
            const isDaySelected = isSelected(i);

            let bgColor = 'transparent';
            let textColor = COLORS.text;
            let fontWeight = '400';

            if (isDaySelected) {
                bgColor = COLORS.primary;
                textColor = '#fff';
                fontWeight = '700';
            } else if (isDayToday) {
                textColor = COLORS.primary;
                fontWeight = '700';
            }

            // Holiday/Weekend styling
            if (status) {
                if (status.type === 'holiday') {
                    bgColor = isDaySelected ? COLORS.primary : '#FEE2E2'; // Light Red
                    textColor = isDaySelected ? '#fff' : COLORS.danger;
                } else if (status.type === 'weekend') {
                    bgColor = isDaySelected ? COLORS.primary : '#FEE2E2';
                    textColor = isDaySelected ? '#fff' : COLORS.darkRed;
                }
            }

            days.push(
                <TouchableOpacity
                    key={i}
                    style={[styles.dayCell, { backgroundColor: bgColor }]}
                    onPress={() => {
                        if (status && status.type === 'holiday') {
                            onHolidayPress && onHolidayPress(status.info);
                            // We typically allow selecting holidays too if needed, but the requirement implies handling the click as Alert.
                            // If specific requirement says "Integrate click events... to display holiday descriptions", maybe prevent selection?
                            // The current HomePage allows selecting holidays but warns user.
                            // I'll call onDateSelect as well, so the main page logic (which alerts) triggers? 
                            // OR trigger alert directly here? The prompt says "display holiday descriptions using HolidayAlert".
                            // I'll assume only Alert for holiday click, OR selection + alert.
                            // I'll do BOTH: Alert via callback, but also select? 
                            // Actually, passing data to parent is safer.
                        } else if (status && status.type === 'weekend') {
                            // Similar handling
                            onDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
                        } else {
                            onDateSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
                        }
                    }}
                >
                    <Text style={{ color: textColor, fontWeight, fontSize: 13 }}>{i}</Text>
                    {status && <View style={[styles.dot, { backgroundColor: textColor }]} />}
                </TouchableOpacity>
            );
        }

        return days;
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <LinearGradient
                        colors={['#00D4FF', '#0099FF']}
                        style={styles.header}
                    >
                        <TouchableOpacity onPress={handlePrevMonth}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.monthTitle}>
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </Text>
                        <TouchableOpacity onPress={handleNextMonth}>
                            <Ionicons name="chevron-forward" size={24} color="#fff" />
                        </TouchableOpacity>
                    </LinearGradient>

                    <View style={styles.weekDays}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <Text key={i} style={[styles.weekDayText, i === 0 || i === 6 ? { color: COLORS.danger } : {}]}>{d}</Text>
                        ))}
                    </View>

                    <View style={styles.grid}>
                        {renderDays()}
                    </View>

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: 320,
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
    },
    header: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    monthTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    weekDays: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textLight,
        width: 30,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
    },
    dayCell: {
        width: '14.28%', // 100% / 7
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginBottom: 4,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 2,
    },
    closeBtn: {
        padding: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: '#eee',
    },
    closeText: {
        color: COLORS.textLight,
        fontWeight: '600',
    }

});

export default CustomCalendarModal;
