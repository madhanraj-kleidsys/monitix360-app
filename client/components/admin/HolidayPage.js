
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ========== GET DAYS IN MONTH ==========
const getDaysInMonth = (month, year) => {
  return new Date(year, month + 1, 0).getDate();
};

// ========== GET FIRST DAY OF MONTH ==========
const getFirstDayOfMonth = (month, year) => {
  return new Date(year, month, 1).getDay();
};

// ========== CALENDAR GRID COMPONENT ==========
function CalendarGrid({ month, year, selectedDates, onDateSelect }) {
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isDateSelected = (day) => {
    if (!day) return false;
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedDates.includes(dateString);
  };

  const handleDayPress = (day) => {
    if (!day) return;
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (selectedDates.includes(dateString)) {
      onDateSelect(selectedDates.filter(d => d !== dateString));
    } else {
      onDateSelect([...selectedDates, dateString]);
    }
  };

  return (
    <View style={styles.calendarGrid}>
      {/* Days of week header */}
      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((day) => (
          <Text key={day} style={styles.dayOfWeekText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar days */}
      <View style={styles.daysContainer}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              day === null && styles.emptyCell,
              day && isDateSelected(day) && styles.selectedDay,
            ]}
            onPress={() => handleDayPress(day)}
            disabled={day === null}
            activeOpacity={0.7}
          >
            {day && (
              <View
                style={[
                  styles.dayContent,
                  isDateSelected(day) && styles.selectedDayContent,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isDateSelected(day) && styles.selectedDayText,
                  ]}
                >
                  {day}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ========== MAIN HOLIDAYS PAGE ==========
export default function AdminHolidayPage() {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDates, setSelectedDates] = useState([]);

  const handlePrevMonth = () => {
    setSelectedMonth(prev => (prev === 0 ? 11 : prev - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => (prev === 11 ? 0 : prev + 1));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#00D4FF', '#0099FF', '#667EEA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Holidays</Text>
          <Text style={styles.headerSubtitle}>Select leave days</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Calendar Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBadge}>
            <Ionicons name="calendar" size={16} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Selected Days: <Text style={styles.infoBold}>{selectedDates.length}</Text>
            </Text>
          </View>
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevMonth}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.monthDisplay}>
            <Text style={styles.monthText}>{MONTHS[selectedMonth]}</Text>
            <Text style={styles.yearText}>{currentYear}</Text>
          </View>

          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextMonth}
          >
            <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarSection}>
          <CalendarGrid
            month={selectedMonth}
            year={currentYear}
            selectedDates={selectedDates}
            onDateSelect={setSelectedDates}
          />
        </View>

        {/* Selected Dates List */}
        {selectedDates.length > 0 && (
          <View style={styles.selectedDatesSection}>
            <Text style={styles.selectedDatesTitle}>Selected Holiday Dates</Text>
            <View style={styles.datesList}>
              {selectedDates.sort().map((date, index) => (
                <View key={index} style={styles.dateTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#fff" />
                  <Text style={styles.dateTagText}>{date}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedDates(selectedDates.filter(d => d !== date))
                    }
                  >
                    <Ionicons name="close-circle" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Legend */}
        <View style={styles.legendSection}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: COLORS.cardBg, borderColor: COLORS.border }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 100,
  },

  // HEADER STYLES
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 10,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },

  // CONTENT STYLES
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // INFO SECTION
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    marginBottom: 16,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  infoBold: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // MONTH SELECTOR
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  yearText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 2,
  },

  // CALENDAR SECTION
  calendarSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  calendarGrid: {
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
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayOfWeekText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
    width: '14.28%',
    textAlign: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyCell: {
    opacity: 0,
  },
  dayContent: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  selectedDayContent: {
    backgroundColor: COLORS.danger,
    borderRadius: 18,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700',
  },
  selectedDay: {
    backgroundColor: 'transparent',
  },

  // SELECTED DATES SECTION
  selectedDatesSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  selectedDatesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  datesList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  dateTagText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  // LEGEND SECTION
  legendSection: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
});