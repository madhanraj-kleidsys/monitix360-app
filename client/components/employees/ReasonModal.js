import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
// You can remove Picker import since we are using a custom dropdown UI now
// import { Picker } from '@react-native-picker/picker';

// Modern Color Palette - Professional & Friendly
const COLORS = {
  // Primary & Secondary
  primary: '#3B82F6', // Vibrant Blue
  primaryLight: '#DBEAFE', // Light Blue
  primaryDark: '#1E40AF', // Dark Blue

  // Neutral Colors
  background: '#F8FAFC', // Very Light Blue-Gray
  surface: '#FFFFFF', // Pure White
  text: '#0F172A', // Very Dark Slate
  textSecondary: '#64748B', // Medium Gray
  textTertiary: '#94A3B8', // Light Gray

  // Borders & Dividers
  border: '#E2E8F0', // Light Border
  borderDark: '#CBD5E1', // Medium Border

  // Status Colors
  success: '#10B981', // Emerald
  warning: '#F59E0B', // Amber
  danger: '#EF4444', // Red
  info: '#06B6D4', // Cyan

  // Shadows
  shadow: 'rgba(15, 23, 42, 0.08)',
};

const REASON_OPTIONS = {
  early: ['Previous task completed early', 'As priority of the task', 'Other'],
  late: [
    'Power failure',
    'Meeting extended',
    'System error',
    'Forgot to start',
    "Previous task couldn't complete on time",
    'Other',
  ],
  pause: ['Break', 'Call', 'Technical issue', 'Meeting', 'Shift over', 'Other'],
  stop: [
    'Task completed',
    'Issue occurred',
    'Manager instruction',
    'Shift over',
    "Couldn't complete",
    'Mistaken start',
    'Stopped to prioritize another task',
    'Other',
  ],
  stopLate: [
    'task completed but delay',
    'Delay in task understanding',
    'Unexpected errors',
    'Task took longer than expected',
    'Dependency delay',
    'Client clarification needed',
    'Other',
  ],
  conflictPause: [
    'Another task needed focus',
    'Conflict paused temporarily',
    'Priority shift',
    'Other',
  ],
  conflictStop: ['Mistaken start', 'Stopped to prioritize another task', 'Duplicate task', 'Other'],
  conflictRunBoth: ['Both tasks manageable', 'Time-sensitive tasks', 'Requested by manager', 'Other'],
};

const REASON_LABELS= {
  early: 'Why did you start early?',
  late: 'What caused the late start?',
  pause: 'Why are you pausing?',
  stop: 'Why are you stopping?',
  stopLate: 'What caused the delay?',
  conflictPause: 'Reason for pause?',
  conflictStop: 'Reason for stopping?',
  conflictRunBoth: 'Why continue both?',
};


export default function ReasonModal({ visible, onClose, onSave, type })
 {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSave = () => {
    const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (!finalReason) return;
    onSave(finalReason);
    setSelectedReason('');
    setCustomReason('');
    setPickerOpen(false);
  };

  const options = REASON_OPTIONS[type] || [];
  const label = REASON_LABELS[type] || 'Enter reason';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.backdrop} />

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerIconContainer}>
                <View style={styles.headerIcon} />
              </View>
              <Text style={styles.title}>Tell us more</Text>
              <Text style={styles.subtitle}>{label}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Reason Selector */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Select a reason</Text>

                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setPickerOpen((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      { color: selectedReason ? COLORS.text : COLORS.textTertiary },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedReason || 'Choose from options...'}
                  </Text>
                  <Text style={styles.pickerIcon}>{pickerOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {pickerOpen && (
                  <View style={styles.pickerDropdown}>
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator
                      scrollIndicatorInsets={{ right: 1 }}
                    >
                      <TouchableOpacity
                        style={styles.pickerItem}
                        onPress={() => {
                          setSelectedReason('');
                          setPickerOpen(false);
                        }}
                      >
                        <Text style={styles.pickerItemText}>Select a reason...</Text>
                      </TouchableOpacity>

                      {options.map((opt, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.pickerItem,
                            selectedReason === opt && styles.pickerItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedReason(opt);
                            setPickerOpen(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              selectedReason === opt && styles.pickerItemTextSelected,
                            ]}
                          >
                            {opt}
                          </Text>
                          {selectedReason === opt && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Custom Reason */}
              {selectedReason === 'Other' && (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Add custom reason</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Tell us what happened..."
                    placeholderTextColor={COLORS.textTertiary}
                    value={customReason}
                    onChangeText={setCustomReason}
                    multiline
                    maxLength={200}
                  />
                  <Text style={styles.charCount}>{customReason.length}/200</Text>
                </View>
              )}

              {/* Info */}
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>
                  This helps us understand task patterns and improve scheduling.
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity onPress={onClose} style={styles.buttonCancel} activeOpacity={0.7}>
                <Text style={styles.buttonTextCancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.buttonSave,
                  (!selectedReason || (selectedReason === 'Other' && !customReason.trim())) &&
                    styles.buttonSaveDisabled,
                ]}
                activeOpacity={0.8}
                disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim())}
              >
                <Text style={styles.buttonTextSave}>Save reason</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    maxHeight: '90%',
  },

  // Header
  header: {
    backgroundColor: COLORS.primaryLight,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Content
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
    letterSpacing: -0.3,
  },

  // Picker button
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  pickerButtonText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  pickerIcon: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginLeft: 8,
  },

  // Dropdown
  pickerDropdown: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    maxHeight: 240,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  pickerItemText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  pickerItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Input
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    textAlignVertical: 'top',
    minHeight: 100,
    maxHeight: 140,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 6,
    textAlign: 'right',
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  buttonCancel: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  buttonSave: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonSaveDisabled: {
    backgroundColor: COLORS.textTertiary,
    opacity: 0.6,
  },
  buttonTextCancel: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.3,
  },
  buttonTextSave: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.3,
  },
});
