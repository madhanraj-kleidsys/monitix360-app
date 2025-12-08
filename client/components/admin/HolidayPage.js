import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import api from '../../api/client';

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

const holidayApi = {
  getHolidays: () => api.get('/declare-holiday'),
  createHoliday: (data) => api.post('/declare-holiday', data),
  updateHoliday: (id, data) => api.put(`/declare-holiday/${id}`, data),
  deleteHoliday: (id) => api.delete(`/declare-holiday/${id}`),
};

// ========== GET DAYS IN MONTH ==========
const getDaysInMonth = (month, year) => {
  return new Date(year, month + 1, 0).getDate();
};

// ========== GET FIRST DAY OF MONTH ==========
const getFirstDayOfMonth = (month, year) => {
  return new Date(year, month, 1).getDay();
};

// ========== CALENDAR GRID COMPONENT ==========
function CalendarGrid({ month, year, holidays, onDateSelect }) {
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isDateMarked = (day) => {
    if (!day) return false;
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.some(h => h.holiday_date === dateString);
  };

  const handleDayPress = (day) => {
    if (!day) return;
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateSelect(dateString);
  };

  return (
    <View style={styles.calendarGrid}>
      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((day) => (
          <Text key={day} style={styles.dayOfWeekText}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.daysContainer}>
        {days.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              day === null && styles.emptyCell,
              day && isDateMarked(day) && styles.markedDay,
            ]}
            onPress={() => handleDayPress(day)}
            disabled={day === null}
            activeOpacity={0.7}
          >
            {day && (
              <View
                style={[
                  styles.dayContent,
                  isDateMarked(day) && styles.markedDayContent,
                ]}
              >
                {isDateMarked(day) && (
                  <View style={styles.markedDot} />
                )}
                <Text
                  style={[
                    styles.dayText,
                    isDateMarked(day) && styles.markedDayText,
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

// ========== HOLIDAY DETAIL MODAL ==========
function HolidayDetailModal({
  visible,
  selectedDate,
  holiday,
  onClose,
  onSave,
  onDelete,
  loading,
}) {
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'create'

  useEffect(() => {
    if (holiday) {
      setDescription(holiday.description || '');
      setMode('view');
    } else {
      setDescription('');
      setMode('create');
    }
  }, [holiday, visible]);

  const handleSave = () => {
    if (!description.trim()) {
      Alert.alert('⚠️ Empty', 'Please enter a description');
      return;
    }

    onSave({
      holiday_date: selectedDate,
      description: description.trim(),
    }, holiday?.id);

    setMode('view');
  };

  const handleDelete = () => {
    Alert.alert(
      '🗑️ Delete Holiday',
      `Delete "${holiday?.description}" on ${selectedDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(holiday?.id);
            setMode('view');
          },
        },
      ]
    );
  };

  const formattedDate = dayjs(selectedDate).format('dddd, MMMM D, YYYY');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <LinearGradient
            colors={['#00D4FF', '#0099FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="chevron-down" size={32} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>
                {holiday ? '✏️ Edit Holiday' : '➕ Add Holiday'}
              </Text>
              <View style={{ width: 32 }} />
            </View>
          </LinearGradient>

          {/* Modal Content */}
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Date Display */}
            <View style={styles.dateDisplayCard}>
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.dateDisplayLabel}>Date</Text>
                <Text style={styles.dateDisplayValue}>{formattedDate}</Text>
              </View>
            </View>

            {/* Holiday Status Info */}
            {holiday && (
              <View style={styles.statusInfoCard}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.success}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.statusLabel}>Holiday Created</Text>
                  <Text style={styles.statusValue}>
                    {dayjs(holiday.createdAt).format('MMM D, YYYY • h:mm A')}
                  </Text>
                </View>
              </View>
            )}

            {/* Description Section */}
            <View style={styles.descriptionSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Description</Text>
                {mode === 'view' && holiday && (
                  <TouchableOpacity
                    onPress={() => setMode('edit')}
                    style={styles.editButton}
                  >
                    <Ionicons name="pencil" size={16} color={COLORS.primary} />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {mode === 'view' ? (
                <View style={styles.descriptionView}>
                  {holiday && holiday.description ? (
                    <Text style={styles.descriptionText}>
                      {holiday.description}
                    </Text>
                  ) : (
                    <Text style={[styles.descriptionText, { color: COLORS.textLight }]}>
                      No description added
                    </Text>
                  )}
                </View>
              ) : (
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Enter holiday description..."
                  placeholderTextColor={COLORS.textLight}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                />
              )}

              {mode !== 'view' && (
                <Text style={styles.charCount}>
                  {description.length}/200
                </Text>
              )}
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.info} />
              <Text style={styles.infoBoxText}>
                Holidays marked here will appear in employee calendars and affect leave calculations.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {mode === 'view' ? (
                <>
                  {holiday && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={handleDelete}
                      disabled={loading}
                    >
                      <Ionicons name="trash" size={18} color={COLORS.danger} />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={onClose}
                  >
                    <Ionicons name="close" size={18} color={COLORS.textLight} />
                    <Text style={styles.actionButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => setMode('view')}
                    disabled={loading}
                  >
                    <Ionicons name="close" size={18} color={COLORS.danger} />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleSave}
                    disabled={loading}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.saveButtonText}>
                      {loading ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ========== YEAR PICKER MODAL ==========
function YearPickerModal({ visible, currentYear, onYearSelect, onClose }) {
  const MIN_YEAR = 2020;
  const MAX_YEAR = 2040;
  const years = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          {/* Header */}
          <LinearGradient
            colors={['#00D4FF', '#0099FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pickerHeader}
          >
            <Text style={styles.pickerTitle}>Select Year</Text>
          </LinearGradient>

          {/* Year Grid */}
          <View style={styles.yearGrid}>
            {years.map(year => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearButton,
                  year === currentYear && styles.yearButtonActive,
                ]}
                onPress={() => {
                  onYearSelect(year);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.yearButtonText,
                    year === currentYear && styles.yearButtonTextActive,
                  ]}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.pickerCloseButton} onPress={onClose}>
            <Text style={styles.pickerCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ========== MAIN HOLIDAYS PAGE ==========
export default function AdminHolidayPage() {
  // const currentYear = new Date().getFullYear();
  // const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const holidayMap = useMemo(() => {
    const map = {};
    holidays.forEach(h => {
      map[h.holiday_date] = h;
    });
    return map;
  }, [holidays]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await holidayApi.getHolidays();
      const data = res.data || [];

      const mapped = data.map(h => ({
        id: h.id,
        holiday_date: dayjs(h.holiday_date).format('YYYY-MM-DD'),
        description: h.description || '',
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
      }));

      const yearFiltered = mapped.filter(h =>
        h.holiday_date.startsWith(String(currentYear))
      );

      setHolidays(yearFiltered);
      // console.log('✅ Holidays loaded:', yearFiltered.length);
    } catch (e) {
      console.log('❌ Error fetching holidays', e);
      Alert.alert('Error', 'Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleYearSelect = (year) => {
    setCurrentYear(year);
  };

  const handleDateSelect = (dateString) => {
    setSelectedDate(dateString);
    setModalVisible(true);
  };

  const handleSaveHoliday = async (data, holidayId) => {
    try {
      setLoading(true);
      // console.log('💾 Saving holiday:', data, 'ID:', holidayId);

      if (holidayId) {
        // UPDATE existing
        await holidayApi.updateHoliday(holidayId, data);
        // console.log('✅ Holiday updated');
      } else {
        // CREATE new
        await holidayApi.createHoliday(data);
        // console.log('✅ Holiday created');
      }

      await fetchHolidays();
      setModalVisible(false);
      Alert.alert('✅ Success', holidayId ? 'Holiday updated' : 'Holiday created');
    } catch (e) {
      console.log('❌ Error saving holiday', e);
      Alert.alert('Error', 'Failed to save holiday');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    try {
      setLoading(true);
      // console.log('🗑️ Deleting holiday:', holidayId);

      await holidayApi.deleteHoliday(holidayId);
      // console.log('✅ Holiday deleted');

      await fetchHolidays();
      setModalVisible(false);
      Alert.alert('✅ Success', 'Holiday deleted');
    } catch (e) {
      console.log('❌ Error deleting holiday', e);
      Alert.alert('Error', 'Failed to delete holiday');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>🗓️ Holidays</Text>
          <Text style={styles.headerSubtitle}>Manage company holidays</Text>
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
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.infoText}>
              Total Holidays: <Text style={styles.infoBold}>{holidays.length}</Text>
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
            <TouchableOpacity onPress={() => setYearPickerVisible(true)}>
              <Text style={[styles.yearText, styles.yearTextClickable]}>
                {currentYear} ▼
              </Text>
            </TouchableOpacity>
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
            holidays={holidays}
            onDateSelect={handleDateSelect}
          />
        </View>

        {/* Month Holidays List */}
        {holidays.length > 0 && (
          <View style={styles.holidaysListSection}>
            <Text style={styles.sectionTitle}>📌 Holidays in {MONTHS[selectedMonth]}</Text>
            <View style={styles.holidaysList}>
              {holidays
                .filter(h => h.holiday_date.startsWith(`${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}`))
                .map((holiday, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.holidayCard}
                    onPress={() => {
                      setSelectedDate(holiday.holiday_date);
                      setModalVisible(true);
                    }}
                  >
                    <View style={styles.holidayCardHeader}>
                      <Text style={styles.holidayDate}>
                        {dayjs(holiday.holiday_date).format('D MMM')}
                      </Text>
                      <Text style={styles.holidayDay}>
                        {dayjs(holiday.holiday_date).format('dddd')}
                      </Text>
                    </View>
                    <Text style={styles.holidayDescription} numberOfLines={2}>
                      {holiday.description || 'No description'}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Holiday Detail Modal */}
      <HolidayDetailModal
        visible={modalVisible}
        selectedDate={selectedDate}
        holiday={selectedDate ? holidayMap[selectedDate] : null}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveHoliday}
        onDelete={handleDeleteHoliday}
        loading={loading}
      />

      {/* Year Picker Modal */}
      <YearPickerModal
        visible={yearPickerVisible}
        currentYear={currentYear}
        onYearSelect={handleYearSelect}
        onClose={() => setYearPickerVisible(false)}
      />

    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // HEADER
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    paddingHorizontal: 20,
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
  },

  // CONTENT
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // INFO SECTION
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
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
    marginBottom: 20,
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
    marginBottom: 20,
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
  },
  markedDayContent: {
    borderWidth: 2,
    borderColor: COLORS.danger,
  },
  markedDay: {},
  markedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
    position: 'absolute',
    top: 4,
    right: 4,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  markedDayText: {
    fontWeight: '700',
    color: COLORS.danger,
  },

  // HOLIDAYS LIST
  holidaysListSection: {
    paddingHorizontal: 16,
    marginBottom: 60,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  holidaysList: {
    gap: 10,
  },
  holidayCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    gap: 12,
  },
  holidayCardHeader: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  holidayDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  holidayDay: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  holidayDescription: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // DATE DISPLAY CARD
  dateDisplayCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateDisplayLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  dateDisplayValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '700',
    marginTop: 4,
  },

  // STATUS INFO CARD
  statusInfoCard: {
    backgroundColor: `${COLORS.success}15`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    marginTop: 2,
  },

  // DESCRIPTION SECTION
  descriptionSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 6,
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  descriptionView: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  descriptionInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 6,
    textAlign: 'right',
  },

  // INFO BOX
  infoBox: {
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 10,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
  },
  info: COLORS.primary,

  // ACTIONS
  actionsContainer: {
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: `${COLORS.danger}15`,
    borderColor: `${COLORS.danger}30`,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.danger,
  },
  cancelButton: {
    backgroundColor: `${COLORS.danger}15`,
    borderColor: `${COLORS.danger}30`,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.danger,
  },

  // YEAR PICKER MODAL STYLES
pickerOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 16,
},
pickerContainer: {
  backgroundColor: COLORS.cardBg,
  borderRadius: 20,
  overflow: 'hidden',
  maxHeight: '80%',
  width: '100%',
  maxWidth: 320,
},
pickerHeader: {
  paddingVertical: 16,
  alignItems: 'center',
},
pickerTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: '#fff',
},
yearGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  padding: 16,
  gap: 10,
  justifyContent: 'center',
},
yearButton: {
  width: '22%',
  aspectRatio: 1,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: COLORS.border,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: COLORS.background,
},
yearButtonActive: {
  backgroundColor: COLORS.primary,
  borderColor: COLORS.primary,
},
yearButtonText: {
  fontSize: 14,
  fontWeight: '700',
  color: COLORS.text,
},
yearButtonTextActive: {
  color: '#fff',
},
pickerCloseButton: {
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderTopWidth: 1,
  borderTopColor: COLORS.border,
  alignItems: 'center',
},
pickerCloseButtonText: {
  fontSize: 14,
  fontWeight: '600',
  color: COLORS.textLight,
},
yearTextClickable: {
  paddingHorizontal: 8,
  paddingVertical: 4,
  backgroundColor: `${COLORS.primary}15`,
  borderRadius: 6,
},

});