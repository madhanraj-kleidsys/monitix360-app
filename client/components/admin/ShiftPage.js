import React, { useState,useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TouchableWithoutFeedback } from 'react-native';

const { height } = Dimensions.get('window');

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

// ========== SHIFT CARD COMPONENT ==========
function ShiftCard({ shift, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.shiftIconContainer}>
          <Ionicons name="time" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.shiftInfo}>
          <Text style={styles.shiftName}>{shift.name}</Text>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>
              <Ionicons name="play" size={12} color={COLORS.success} /> {shift.startTime}
            </Text>
            <Text style={styles.timeText}>
              <Ionicons name="stop" size={12} color={COLORS.danger} /> {shift.endTime}
            </Text>
          </View>
        </View>
      </View>

      {shift.breaks && shift.breaks.length > 0 && (
        <View style={styles.breaksContainer}>
          <Text style={styles.breaksLabel}>
            <Ionicons name="pause" size={12} color={COLORS.warning} /> Breaks: {shift.breaks.length}
          </Text>
          {shift.breaks.map((breakItem, idx) => (
            <Text key={idx} style={styles.breakDetail}>
              {breakItem.name}: {breakItem.startTime} - {breakItem.endTime}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(shift)}
        >
          <Ionicons name="pencil" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(shift.id)}
        >
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ========== TIME PICKER COMPONENT ==========
function TimePickerField({ label, value, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const handleTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      const hours = String(selectedDate.getHours()).padStart(2, '0');
      const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
  };

  return (
    <View style={styles.timePickerField}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.timeInput}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons name="time" size={18} color={COLORS.primary} />
        <Text style={styles.timeInputText}>{value || 'Select time'}</Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

// ========== ADD/EDIT SHIFT MODAL ==========
function ShiftModal({ visible, shift, onClose, onSave }) {
  const [formData, setFormData] = useState(
    shift || {
      name: '',
      startTime: '',
      endTime: '',
      breaks: [],
    }
  );
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
  if (visible) {
      if (shift) {
        // Edit existing shift
        setFormData({
          name: shift.name || '',
          startTime: shift.startTime || '',
          endTime: shift.endTime || '',
          // Make sure each break has a stable id
          breaks: (shift.breaks || []).map(b => ({
            id: b.id ?? Date.now() + Math.random(),
            name: b.name || '',
            startTime: b.startTime || '',
            endTime: b.endTime || '',
          })),
        });
      } else {
        // Add new shift
        setFormData({
          name: '',
          startTime: '',
          endTime: '',
          breaks: [],
        });
      }
    }
  }, [visible, shift]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddBreak = () => {
    setFormData(prev => ({
      ...prev,
      breaks: [
        ...prev.breaks,
        { id: Date.now(), name: '', startTime: '', endTime: '' },
      ],
    }));
  };

  const handleRemoveBreak = (breakId) => {
    setFormData(prev => ({
      ...prev,
      breaks: prev.breaks.filter(b => b.id !== breakId),
    }));
  };

  const handleBreakChange = (breakId, field, value) => {
    setFormData(prev => ({
      ...prev,
      breaks: prev.breaks.map(b =>
        b.id === breakId ? { ...b, [field]: value } : b
      ),
    }));
  };

  const handleSave = async () => {
    if (
      !formData.name.trim() ||
      !formData.startTime ||
      !formData.endTime
    ) {
      Alert.alert('Error', 'Please fill shift name, start time, and end time');
      return;
    }

    if (formData.breaks.length > 0) {
      const invalidBreak = formData.breaks.find(
        b => !b.name.trim() || !b.startTime || !b.endTime
      );
      if (invalidBreak) {
        Alert.alert('Error', 'Please fill all break details');
        return;
      }
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      onSave({
        id: shift?.id || Date.now(),
        ...formData,
      });

      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save shift');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // setFormData(
    //   shift || {
    //     name: '',
    //     startTime: '',
    //     endTime: '',
    //     breaks: [],
    //   }
    // );
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
       <TouchableWithoutFeedback onPress={handleClose}>
      <View style={styles.overlay}>
         <TouchableWithoutFeedback onPress={() => {}}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <LinearGradient
            colors={['#00D4FF', '#0099FF', '#667EEA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {shift ? 'Edit Shift' : 'Add Shift'}
            </Text>
            <View style={{ width: 44 }} />
          </LinearGradient>

          {/* Modal Body */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              {/* Shift Name */}
              <Text style={styles.label}>
                <Ionicons name="briefcase" size={14} color={COLORS.primary} /> Shift Name
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Morning Shift"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                editable={!loading}
              />

              {/* Start Time */}
              <TimePickerField
                label={<><Ionicons name="play-circle" size={14} color={COLORS.success} /> Start Time</>}
                value={formData.startTime}
                onChange={(value) => handleInputChange('startTime', value)}
              />

              {/* End Time */}
              <TimePickerField
                label={<><Ionicons name="stop-circle" size={14} color={COLORS.danger} /> End Time</>}
                value={formData.endTime}
                onChange={(value) => handleInputChange('endTime', value)}
              />

              {/* Breaks Section */}
              <View style={styles.breaksSection}>
                <View style={styles.breaksSectionHeader}>
                  <Text style={styles.breaksSectionTitle}>
                    <Ionicons name="pause-circle" size={16} color={COLORS.warning} /> Breaks
                  </Text>
                  <Text style={styles.breaksCount}>
                    ({formData.breaks.length})
                  </Text>
                </View>

                {formData.breaks.map((breakItem, index) => (
                  <View key={breakItem.id} style={styles.breakCard}>
                    <View style={styles.breakHeader}>
                      <Text style={styles.breakIndex}>Break {index + 1}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveBreak(breakItem.id)}
                      >
                        <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>

                    {/* Break Name */}
                    <Text style={styles.label}>Break Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Lunch"
                      value={breakItem.name}
                      onChangeText={(value) =>
                        handleBreakChange(breakItem.id, 'name', value)
                      }
                      editable={!loading}
                    />

                    {/* Break Start Time */}
                    <TimePickerField
                      label="Break Start Time"
                      value={breakItem.startTime}
                      onChange={(value) =>
                        handleBreakChange(breakItem.id, 'startTime', value)
                      }
                    />

                    {/* Break End Time */}
                    <TimePickerField
                      label="Break End Time"
                      value={breakItem.endTime}
                      onChange={(value) =>
                        handleBreakChange(breakItem.id, 'endTime', value)
                      }
                    />
                  </View>
                ))}

                {/* Add More Breaks Button */}
                <TouchableOpacity
                  style={styles.addBreakButton}
                  onPress={handleAddBreak}
                >
                  <Ionicons name="add-circle" size={18} color="#fff" />
                  <Text style={styles.addBreakButtonText}>Add Break</Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.saveButton, loading && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  <Ionicons name="checkmark-done" size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  disabled={loading}
                >
                  <Ionicons name="close" size={18} color={COLORS.text} />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
         </TouchableWithoutFeedback>
      </View>
       </TouchableWithoutFeedback>
    </Modal>
  );
}

// ========== MAIN SHIFT PAGE ==========
export default function AdminShiftPage() {
  const [shifts, setShifts] = useState([
    {
      id: 1,
      name: 'Morning Shift',
      startTime: '08:00',
      endTime: '16:00',
      breaks: [
        { id: 101, name: 'Breakfast', startTime: '10:00', endTime: '10:30' },
        { id: 102, name: 'Lunch', startTime: '12:30', endTime: '13:30' },
      ],
    },
    {
      id: 2,
      name: 'Afternoon Shift',
      startTime: '16:00',
      endTime: '00:00',
      breaks: [
        { id: 201, name: 'Dinner', startTime: '19:00', endTime: '20:00' },
      ],
    },
    {
      id: 3,
      name: 'Night Shift',
      startTime: '22:00',
      endTime: '06:00',
      breaks: [
        { id: 301, name: 'Midnight Snack', startTime: '02:00', endTime: '02:30' },
      ],
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  const handleAddShift = () => {
    setSelectedShift(null);
    setModalVisible(true);
  };

  const handleEditShift = (shift) => {
    setSelectedShift(shift);
    setModalVisible(true);
  };

  const handleDeleteShift = (shiftId) => {
    Alert.alert(
      'Delete Shift',
      'Are you sure you want to delete this shift?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: () => {
            setShifts(shifts.filter(s => s.id !== shiftId));
            Alert.alert('Success', 'Shift deleted successfully');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSaveShift = (shiftData) => {
    if (selectedShift) {
      setShifts(
        shifts.map(s =>
          s.id === selectedShift.id ? { ...shiftData, id: s.id } : s
        )
      );
      Alert.alert('Success', 'Shift updated successfully');
    } else {
      setShifts([...shifts, shiftData]);
      Alert.alert('Success', 'Shift added successfully');
    }
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
          <Text style={styles.headerTitle}>
            <Ionicons name="time" size={32} color="#fff" /> Shifts
          </Text>
          <Text style={styles.headerSubtitle}>Manage work shifts</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add Shift Button */}
        <View style={styles.topSection}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddShift}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add New Shift</Text>
          </TouchableOpacity>
        </View>

        {/* Shifts List */}
        <View style={styles.shiftsSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="layers" size={20} color={COLORS.primary} /> All Shifts ({shifts.length})
          </Text>

          {shifts.length > 0 ? (
            shifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                onEdit={handleEditShift}
                onDelete={handleDeleteShift}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No shifts yet</Text>
              <Text style={styles.emptySubtext}>Click "Add New Shift" to create one</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add/Edit Shift Modal */}
      <ShiftModal
        visible={modalVisible}
        shift={selectedShift}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveShift}
      />
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

  // TOP SECTION
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // SHIFTS SECTION
  shiftsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },

  // SHIFT CARD
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  shiftIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftInfo: {
    flex: 1,
  },
  shiftName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },

  // BREAKS CONTAINER
  breaksContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: `${COLORS.warning}08`,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  breaksLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
    marginBottom: 8,
  },
  breakDetail: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },

  // CARD ACTIONS
  cardActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // EMPTY STATE
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },

  // MODAL STYLES
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: height * 0.9,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },

  // MODAL BODY
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },

  // TIME PICKER FIELD
  timePickerField: {
    marginTop: 12,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  timeInputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // BREAKS SECTION
  breaksSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  breaksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breaksSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  breaksCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.warning,
    marginLeft: 6,
  },

  // BREAK CARD
  breakCard: {
    backgroundColor: `${COLORS.warning}08`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${COLORS.warning}30`,
  },
  breakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakIndex: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
  },

  // ADD BREAK BUTTON
  addBreakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  addBreakButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // BUTTON GROUP
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
});