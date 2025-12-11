import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Octicons from '@expo/vector-icons/Octicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';
import * as MediaLibrary from 'expo-media-library';
import XLSX from 'xlsx';
import useTaskManagement from './hooks/useTaskManagement';
import AsyncStorage from '@react-native-async-storage/async-storage';
const { width, height } = Dimensions.get('window');
const isTablet = width > 600;

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

const STATUS_COLORS = {
  Incomplete: '#95A5A6',
  pending: '#F39C12',
  'in progress': '#3498DB',
  completed: '#27AE60',
  Paused: '#E74C3C',
};


const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${days} days, ${hours} hours ${minutes} min`;
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateRange = (dateRange) => {
  const startDate = new Date(dateRange.start).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const endDate = new Date(dateRange.end).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  return `${startDate}_${endDate}`;
};

// ====== excel export function ======
const exportTasksToExcel = async (tasks, dateRange) => {
  try {
    // Check if there are tasks
    if (!tasks || tasks.length === 0) {
      alert('No tasks to export for the selected date range');
      return;
    }

    const fileName = `Employee_Tasks_${formatDateRange(dateRange)}.xlsx`;

    // Show loading notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Exporting Tasks',
        body: `Preparing ${fileName}...`,
        sound: 'default',
      },
      trigger: null,
    });

    // Request storage permission
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Permission Denied',
          body: 'Storage permission is required to export files',
          sound: 'default',
        },
        trigger: null,
      });
      alert('Storage permission denied. Cannot save file.');
      return;
    }

    // Create data array
    const data = tasks.map(task => ({
      'Employee Name': task.employeeName,
      'Task Name': task.name,
      'Status': task.status,
      'Project': task.project,
      'Description': task.description,
      'Start Date/Time': formatDateTime(task.startDate),
      'End Date/Time': formatDateTime(task.endDate),
      'Total Duration': calculateDuration(task.startDate, task.endDate),
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Tasks');

    // Set column widths
    const colWidths = [20, 30, 15, 20, 30, 18, 18, 20];
    ws['!cols'] = colWidths.map(width => ({ wch: width }));

    // Generate Excel file
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    // Convert to base64
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    // Save to device
    await FileSystem.writeAsStringAsync(filePath, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Save to media library (accessible from phone's file manager)
    try {
      await MediaLibrary.saveToLibraryAsync(filePath);
    } catch (mediaError) {
      console.warn('Could not save to media library:', mediaError);
      // Continue - file is still saved locally
    }

    // Show success notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Export Successful',
        body: `${fileName}\nTotal Tasks: ${tasks.length}`,
        sound: 'default',
      },
      trigger: null,
    });

    // Share the file
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export Employee Tasks',
    });

  } catch (error) {
    console.error('Error exporting tasks:', error);

    // Show error notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'ðŸ”´ Export Failed',
        body: error.message || 'Something went wrong',
        sound: 'default',
      },
      trigger: null,
    });

    alert('ðŸ”´ Export Failed:\n' + error.message);
  }
};

// ========== HEADER COMPONENT ==========
function Header() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! 👋🏻';
    if (hour < 18) return 'Good Afternoon! 👋🏻';
    return 'Good Evening! 👋🏻';
  };

  return (
    <LinearGradient
      colors={['#00D4FF', '#0099FF', '#667EEA']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>Admin Dashboard</Text>
            <View style={styles.statusBadgenf}>
              <View style={styles.statusDotnf} />
              <Text style={styles.statusTextnf}>Online</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <LinearGradient
              colors={['#FFFFFF', '#F0F9FF']}
              style={styles.avatar}
            >
              <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
            </LinearGradient>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* <View style={styles.statsOverviewCard}>
          <Text style={styles.statsTitle}>Today Stats</Text>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>75%</Text>
              <Text style={styles.overviewLabel}>Completion</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>1hrs</Text>
              <Text style={styles.overviewLabel}>Time Saved</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>98%</Text>
              <Text style={styles.overviewLabel}>Efficiency</Text>
            </View>
          </View>
        </View> */}
      </View>
    </LinearGradient>
  );
}

// ========== FILTER BAR COMPONENT ==========
function FilterBar({ selectedDate, setSelectedDate, filteredTasks }) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleTodayPress = () => {
    const today = new Date();
    setSelectedDate(today);
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const dateText = formatDate(selectedDate);

  return (
    <>
      <View style={styles.filterBarContainer}>
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton} onPress={handleTodayPress}>
            <Ionicons name="calendar" size={16} color={COLORS.primary} />
            <Text style={styles.filterButtonText}>Today</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateRangeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={16} color={COLORS.secondary} />
            <Text style={styles.dateRangeText}>{dateText}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => exportTasksToExcel(filteredTasks, selectedDate)}
          >
            <Ionicons name="download" size={16} color="#fff" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </>
  );
}

// ========== TASK CARD COMPONENT ==========
function TaskCard({ task, onPress }) {
  const statusColor = STATUS_COLORS[task.status] || COLORS.textLight;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        <View style={styles.employeeSection}>
          <Text style={styles.employeeName}>
            {task.employeeName || 'Unassigned'}
          </Text>
        </View>

        <View style={styles.taskSection}>
          <Text style={styles.taskName}>
            {task.name ? (task.name.length > 30 ? task.name.substring(0, 30) + '...' : task.name) : 'No Title'}
          </Text>
          <Text style={styles.projectText}>{task.Project_Title}</Text>
        </View>

        <View style={styles.statusSection}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {task.status || 'pending'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  );
}

// ========== TASK MODAL COMPONENT ==========
function TaskModal({ visible, task, onClose, modalHeight, onEditPress, onDeletePress }) {
  if (!task) return null;

  const statusColor = STATUS_COLORS[task.status] || COLORS.textLight;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.modalContent, { height: modalHeight }]}>
          <LinearGradient
            colors={['#00D4FF', '#0099FF', '#667EEA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.employeeNameCenter}>{task.employeeName}</Text>
            <View style={{ width: 44 }} />
          </LinearGradient>

          <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Task Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Task No:</Text>
                <Text style={styles.value}>{task.id}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                    {task.status}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Project:</Text>
                <Text style={styles.value}>{task.Project_Title}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Description:</Text>
              </View>
              <Text style={styles.descriptionText}>{task.description}</Text>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Timeline</Text>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Start Date & Time:</Text>
              </View>
              <Text style={styles.dateTimeText}>
                {formatDateTime(task.startDate)}
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.label}>End Date & Time:</Text>
              </View>
              <Text style={styles.dateTimeText}>
                {formatDateTime(task.endDate)}
              </Text>

              <View style={[styles.detailRow, { marginTop: 16 }]}>
                <Text style={styles.label}>Total Duration :</Text>
                <Text style={[styles.value, { color: COLORS.primary, fontWeight: '700' }]}>
                  {calculateDuration(task.startDate, task.endDate)}
                </Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.editBtn]}
              onPress={() => {
                onEditPress?.();  // Trigger edit
              }}
            >
              <Ionicons name="pencil" size={18} color="#fff" />
              <Text style={styles.modalButtonText}>Update Task</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.deleteBtn]}
              onPress={() => {
                onDeletePress?.();  // Trigger delete
              }}
            >
              <Ionicons name="trash" size={18} color="#fff" />
              <Text style={styles.modalButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>

        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ========== ASSIGN TASK MODAL ==========
function AssignTaskModal({ visible, onClose, onSave, allUsers }) {
  // Helper to convert priority label to number
  const getPriorityNumber = (label) => {
    if (label === 'Critical') return 1;
    if (label === 'High') return 1;
    if (label === 'Medium') return 2;
    if (label === 'Low') return 3;
    return 2;
  };

  const [formData, setFormData] = useState({
    department: '',
    title: '',
    Project_Title: '',
    taskDescription: '',
    priority: '',
    assignUserId: '',
    assignUser: '',
    duration: '',
    durationHours: '',
    durationMinutes: '',
    startTime: '',
    endTime: '',
    durationInputMode: 'auto',
  });
  const [loading, setLoading] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [projectTitleOpen, setProjectTitleOpen] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [dateTimePickerMode, setDateTimePickerMode] = useState('date');
  const [currentPicker, setCurrentPicker] = useState(null); // 'startTime' or 'endTime'
  const scrollViewRef = useRef(null);

  // Dummy data for dropdowns
  const departments = ['Development', 'UI/UX', 'Infrastructure', 'QA Testing', 'Documentation'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  // const users = ['Madhaneeh J', 'Arun', 'Patel'];
  // const {allUsers} = useTaskManagement;

  useEffect(() => {
    if (!visible) {
      setFormData({
        department: '',
        title: '',
        Project_Title: '',
        taskDescription: '',
        priority: '',
        assignUserId: '',
        assignUser: '',
        duration: '',
        durationHours: '',
        durationMinutes: '',
        startTime: '',
        endTime: '',
        durationInputMode: 'auto',
      });
      setDepartmentOpen(false);
      setPriorityOpen(false);
      setUserOpen(false);
      setProjectTitleOpen(false);
      setShowDateTimePicker(false);
      setCurrentPicker(null);

    }
  }, [visible]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);

      if (end > start) {
        const diffMs = end - start;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const formattedDuration = `${diffHours}.${String(diffMinutes).padStart(2, '0')}`;
        handleInputChange('duration', formattedDuration);

        // Only update if user manually changed times (not from manual duration)
        if (formData.durationInputMode !== 'manual') {
          handleInputChange('durationHours', String(diffHours));
          handleInputChange('durationMinutes', String(diffMinutes));
        }
      } else {
        handleInputChange('duration', '0.00');
      }
      // reset modes
      handleInputChange('durationInputMode', 'auto');
    }
  }, [formData.startTime, formData.endTime]);

  // ========== MANUAL DURATION INPUT EFFECT ==========
  useEffect(() => {
    if (formData.durationHours || formData.durationMinutes) {
      const hours = parseInt(formData.durationHours) || 0;
      const minutes = parseInt(formData.durationMinutes) || 0;

      // Format for display (e.g., "5.30" for 5 hours 30 minutes)
      const formattedDuration = `${hours}.${String(minutes).padStart(2, '0')}`;
      handleInputChange('duration', formattedDuration);

      // Auto-set start and end times based on manual duration
      if (hours > 0 || minutes > 0) {
        const now = new Date();
        const endTime = new Date(now.getTime() + (hours * 60 + minutes) * 60 * 1000);

        handleInputChange('startTime', now.toISOString());
        handleInputChange('endTime', endTime.toISOString());
        handleInputChange('durationInputMode', 'manual');
      }
    }
  }, [formData.durationHours, formData.durationMinutes]);
 
 const handleSave = async () => {
  const finalTitle = formData.title?.trim() || formData.Project_Title?.trim();

  if (!finalTitle) {
    Alert.alert('Error', 'Project title is required');
    return;
  }
  if (!formData.assignUserId && formData.assignUserId !== 0) {
    Alert.alert('Error', 'User must be assigned');
    return;
  }
  if (!formData.startTime) {
    Alert.alert('Error', 'Start time is required');
    return;
  }
  if (!formData.endTime) {
    Alert.alert('Error', 'End time is required');
    return;
  }

  setLoading(true);
  try {
    // ✅ EXACT MATCH for createTask expectations:
    const taskPayload = {
      department: formData.department || '',           // ← Used for title
      projectTitle: formData.Project_Title || '',      // ← createTask expects camelCase!
      taskDescription: formData.taskDescription || '',
      priority: formData.priority,                     // ← String 'High', 'Medium', etc.
      assignUserId: parseInt(formData.assignUserId),   // ← Integer
      startTime: formData.startTime,
      endTime: formData.endTime,
      duration: formData.duration || '0.00'            // ← HH.MM format
    };

    console.log('✅ MATCHED createTask format:', JSON.stringify(taskPayload, null, 2));
    await onSave(taskPayload);
  } catch (error) {
    console.error('❌ Save error:', error);
    Alert.alert('Error', 'Failed to create task');
  } finally {
    setLoading(false);
  }
};

  const handleClose = () => {
    setDepartmentOpen(false);
    setPriorityOpen(false);
    setUserOpen(false);
    setProjectTitleOpen(false);
    onClose();
  };

  const openDateTimePicker = (pickerType, mode) => {
    setCurrentPicker(pickerType);
    setDateTimePickerMode(mode);
    setShowDateTimePicker(true);
  };

  const onDateTimeChange = (event, selectedDate) => {
    setShowDateTimePicker(false);
    if (selectedDate) {
      const currentVal = formData[currentPicker] ? new Date(formData[currentPicker]) : new Date();

      if (dateTimePickerMode === 'date') {
        currentVal.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        handleInputChange(currentPicker, currentVal.toISOString());
        // Automatically open time picker next
        setTimeout(() => openDateTimePicker(currentPicker, 'time'), 200);
      } else { // time
        currentVal.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        handleInputChange(currentPicker, currentVal.toISOString());
      }
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={[styles.sheetWrapper, { maxHeight: height * 0.95 }]}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <LinearGradient
                colors={['#00D4FF', '#0099FF', '#667EEA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalHeader}
              >
                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Assign a Task</Text>
                <View style={{ width: 44 }} />
              </LinearGradient>

              {/* Body */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.modalBody}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
              >
                <View style={styles.section}>

                  {/* Assign User Dropdown (required) */}
                  <Text style={styles.fieldLabel}>Assign User <Text style={{ color: COLORS.danger }}>*</Text></Text>
                  <View>
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => {
                        setUserOpen(prev => !prev);
                        setDepartmentOpen(false);
                        setPriorityOpen(false);
                        setProjectTitleOpen(false);
                      }}
                      disabled={loading}
                    >
                      <Text style={[
                        styles.dropdownText,
                        !formData.assignUser && { color: COLORS.textLight },
                      ]}>
                        {formData.assignUser || 'Select user'}
                      </Text>
                      <Ionicons
                        name={userOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>

                    {userOpen && (
                      <View style={[styles.dropdownMenu, { zIndex: 1000 }]}>
                        {allUsers && allUsers.length > 0 ? (
                          // FILTER: Show only users with role === 'user'
                          allUsers
                            .filter(user => user.role === 'user')  // ONLY 'user' role
                            .map((user) => (
                              <TouchableOpacity
                                key={user.id}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  handleInputChange('assignUserId', user.id);
                                  handleInputChange('assignUser', user.username);
                                  setUserOpen(false);
                                }}
                              >
                                <Text style={styles.dropdownItemText}>
                                  {user.first_name} {user.last_name} ({user.username})
                                </Text>
                                <Text style={{ fontSize: 10, color: COLORS.textLight }}>
                                  {user.department}
                                </Text>
                              </TouchableOpacity>
                            ))
                        ) : (
                          <Text style={styles.dropdownItemText}>Loading users...</Text>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Department Dropdown */}
                  <Text style={styles.fieldLabel}>Department</Text>
                  <View>
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => {
                        setDepartmentOpen(prev => !prev);
                        setPriorityOpen(false);
                        setUserOpen(false);
                        setProjectTitleOpen(false);
                      }}
                      disabled={loading}
                    >
                      <Text style={[
                        styles.dropdownText,
                        !formData.department && { color: COLORS.textLight },
                      ]}>
                        {formData.department || 'Select department'}
                      </Text>
                      <Ionicons
                        name={departmentOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>

                    {departmentOpen && (
                      <View style={styles.customInputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Type custom department"
                          placeholderTextColor={COLORS.textLight}
                          value={formData.department}
                          onChangeText={(value) => handleInputChange('department', value)}
                          editable={!loading}
                        />
                      </View>
                    )}

                    {departmentOpen && (
                      <View style={[styles.dropdownMenu, { zIndex: 1000 }]}>
                        {departments.map((dept, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.dropdownItem}
                            onPress={() => {
                              handleInputChange('department', dept);
                              setDepartmentOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{dept}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                  </View>

                  {/* Project Title */}
                  <Text style={styles.fieldLabel}>Project Title</Text>
                  <View>
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => {
                        setProjectTitleOpen(prev => !prev);
                        setPriorityOpen(false);
                        setDepartmentOpen(false);
                        setUserOpen(false);
                      }}
                      disabled={loading}
                    >
                      <Text style={[
                        styles.dropdownText,
                        !formData.Project_Title && { color: COLORS.textLight },
                      ]}>
                        {formData.Project_Title || 'Select project'}
                      </Text>
                      <Ionicons
                        name={projectTitleOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>

                    {projectTitleOpen && (
                      <View style={styles.customInputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Type custom project name"
                          placeholderTextColor={COLORS.textLight}
                          value={formData.Project_Title}
                          onChangeText={(value) => handleInputChange('Project_Title', value)}
                          editable={!loading}
                        />
                      </View>
                    )}

                    {projectTitleOpen && (
                      <View style={[styles.dropdownMenu, { zIndex: 900 }]}>
                        {['Admin Portal', 'Mobile App', 'Infrastructure', 'Performance Enhancement'].map((proj, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.dropdownItem}
                            onPress={() => {
                              handleInputChange('Project_Title', proj);
                              setProjectTitleOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{proj}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                  </View>

                  {/* Task Description */}
                  <Text style={styles.fieldLabel}>Task Description</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                    placeholder="Enter task description"
                    placeholderTextColor={COLORS.textLight}
                    value={formData.taskDescription}
                    onChangeText={value => handleInputChange('taskDescription', value)}
                    editable={!loading}
                    multiline
                  />

                  {/* Priority Dropdown (required) */}
                  <Text style={styles.fieldLabel}>Priority <Text style={{ color: COLORS.danger }}>*</Text></Text>
                  <View>
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => {
                        setPriorityOpen(prev => !prev);
                        setDepartmentOpen(false);
                        setUserOpen(false);
                        setProjectTitleOpen(false);
                      }}
                      disabled={loading}
                    >
                      <Text style={[
                        styles.dropdownText,
                        !formData.priority && { color: COLORS.textLight },
                      ]}>
                        {formData.priority || 'Select priority'}
                      </Text>
                      <Ionicons
                        name={priorityOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>
                    {priorityOpen && (
                      <View style={[styles.dropdownMenu, { zIndex: 1000 }]}>
                        {priorities.map((prior, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.dropdownItem}
                            onPress={() => {
                              handleInputChange('priority', prior);
                              setPriorityOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{prior}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Duration */}
                  <View style={styles.durationSection}>
                    <Text style={styles.fieldLabel}>Duration <Text style={{ color: COLORS.danger }}>*</Text></Text>

                    {/* Duration Display */}
                    <View style={styles.durationDisplay}>
                      <Text style={styles.durationDisplayText}>
                        {formData.duration || '0.00'} hours
                      </Text>
                    </View>

                    {/* Hours & Minutes Inputs */}
                    <View style={styles.durationInputRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subLabel}>Hours</Text>
                        <TextInput
                          style={styles.durationInput}
                          placeholder="0"
                          placeholderTextColor={COLORS.textLight}
                          keyboardType="number-pad"
                          value={formData.durationHours}
                          onChangeText={(value) => {
                            handleInputChange('durationHours', value);
                            handleInputChange('durationInputMode', 'manual');
                          }}
                          editable={!loading}
                          maxLength={2}
                        />
                      </View>

                      <Text style={styles.durationSeparator}>:</Text>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.subLabel}>Minutes</Text>
                        <TextInput
                          style={styles.durationInput}
                          placeholder="00"
                          placeholderTextColor={COLORS.textLight}
                          keyboardType="number-pad"
                          value={formData.durationMinutes}
                          onChangeText={(value) => {
                            // Limit to 59 minutes
                            const limited = value.length > 2 ? value.slice(0, 2) : value;
                            handleInputChange('durationMinutes', limited);
                            handleInputChange('durationInputMode', 'manual');
                          }}
                          editable={!loading}
                          maxLength={2}
                        />
                      </View>
                    </View>

                    <Text style={styles.durationHint}>
                      💡 Enter duration or select start/end times 🕔
                    </Text>
                  </View>


                  {/* Start Time */}
                  <Text style={styles.fieldLabel}>Start Time</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => openDateTimePicker('startTime', 'date')}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.dropdownText,
                      !formData.startTime && { color: COLORS.textLight },
                    ]}>
                      {formatDisplayDate(formData.startTime) || 'Select start date & time'}
                    </Text>
                    <Ionicons name="calendar" size={18} color={COLORS.primary} />
                  </TouchableOpacity>

                  {/* End Time */}
                  <Text style={styles.fieldLabel}>End Time</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => openDateTimePicker('endTime', 'date')}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.dropdownText,
                      !formData.endTime && { color: COLORS.textLight },
                    ]}>
                      {formatDisplayDate(formData.endTime) || 'Select end date & time'}
                    </Text>
                    <Ionicons name="calendar" size={18} color={COLORS.primary} />
                  </TouchableOpacity>

                  {/* DateTimePicker Modal */}
                  {showDateTimePicker && (
                    <DateTimePicker
                      value={formData[currentPicker] ? new Date(formData[currentPicker]) : new Date()}
                      mode={dateTimePickerMode}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onDateTimeChange}
                      minimumDate={currentPicker === 'endTime' && formData.startTime ? new Date(formData.startTime) : undefined}
                    />
                  )}

                  {/* Buttons */}
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={[styles.saveButton, loading && { opacity: 0.6 }]}
                      onPress={handleSave}
                      disabled={loading}
                    >
                      <Text style={styles.saveButtonText}>
                        {loading ? 'Saving...' : 'Assign Task'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleClose}
                      disabled={loading}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}


// ========== COMPLETE EDIT TASK MODAL WITH ALL FEATURES ==========
function EditTaskModal({ visible, task, onClose, onSave, loading, allUsers }) {
  const [editedTask, setEditedTask] = useState({
    title: '',
    description: '',
    department: '',
    Project_Title: '',
    status: 'Pending',
    priority: 'Medium',
    durationHours: '',
    durationMinutes: '',
    duration: '',
    startTime: '',
    endTime: '',
    durationInputMode: 'auto',
  });

  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [projectTitleOpen, setProjectTitleOpen] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [dateTimePickerMode, setDateTimePickerMode] = useState('date');
  const [currentPicker, setCurrentPicker] = useState(null);

  const departments = ['Development', 'UI/UX', 'Infrastructure', 'QA Testing', 'Documentation'];
  const projectOptions = ['Admin Portal', 'Mobile App', 'Infrastructure', 'Performance Enhancement'];

  // ========== INITIALIZE FORM WITH ACTUAL VALUES ==========
  useEffect(() => {
    if (task && visible) {
      console.log('📋 Task data:', {
        id: task.id,
        name: task.name,
        startDate: task.startDate,
        endDate: task.endDate,
        duration_minutes: task.duration_minutes,
      });

      // Parse duration from minutes correctly
      const totalMinutes = parseInt(task.duration_minutes) || 0;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      setEditedTask({
        title: task.name || '',
        description: task.description || '',
        department: task.department || '',
        Project_Title: task.Project_Title || '',
        status: task.status === 'pending' ? 'Pending' : (task.status || 'Pending'),
        priority: getPriorityLabel(task.priority),
        durationHours: String(hours),
        durationMinutes: String(minutes),
        duration: `${hours}.${String(minutes).padStart(2, '0')}`,
        startTime: task.startDate || '',
        endTime: task.endDate || '',
        durationInputMode: 'auto',
      });

      console.log('✅ Parsed duration:', { hours, minutes, totalMinutes });
    }
  }, [task, visible]);

  // Helper to convert priority number to label
  const getPriorityLabel = (priorityNum) => {
    if (priorityNum === 1) return 'High';
    if (priorityNum === 2) return 'Medium';
    if (priorityNum === 3) return 'Low';
    return 'Medium';
  };

  // Helper to convert priority label to number
  const getPriorityNumber = (label) => {
    if (label === 'High') return 1;
    if (label === 'Medium') return 2;
    if (label === 'Low') return 3;
    return 2;
  };

  const handleInputChange = (field, value) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
  };

  // ========== AUTO-CALCULATE DURATION FROM START/END TIME ==========
  useEffect(() => {
    if (editedTask.startTime && editedTask.endTime && editedTask.durationInputMode === 'auto') {
      const start = new Date(editedTask.startTime);
      const end = new Date(editedTask.endTime);

      if (end > start) {
        const diffMs = end - start;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        handleInputChange('durationHours', String(diffHours));
        handleInputChange('durationMinutes', String(diffMinutes));
        handleInputChange('duration', `${diffHours}.${String(diffMinutes).padStart(2, '0')}`);
      }
    }
  }, [editedTask.startTime, editedTask.endTime, editedTask.durationInputMode]);

  // ========== MANUAL DURATION INPUT ==========
  useEffect(() => {
    if ((editedTask.durationHours || editedTask.durationMinutes) && editedTask.durationInputMode === 'manual') {
      const hours = parseInt(editedTask.durationHours) || 0;
      const minutes = parseInt(editedTask.durationMinutes) || 0;

      const formattedDuration = `${hours}.${String(minutes).padStart(2, '0')}`;
      handleInputChange('duration', formattedDuration);

      // Auto-set end time based on start time + duration
      if (editedTask.startTime && (hours > 0 || minutes > 0)) {
        const start = new Date(editedTask.startTime);
        const end = new Date(start.getTime() + (hours * 60 + minutes) * 60 * 1000);
        handleInputChange('endTime', end.toISOString());
      }
    }
  }, [editedTask.durationHours, editedTask.durationMinutes, editedTask.durationInputMode]);

  const handleSave = async () => {
    if (!editedTask.title.trim()) {
      Alert.alert('Error', 'Task title cannot be empty');
      return;
    }

    if (!editedTask.startTime) {
      Alert.alert('Error', 'Start time is required');
      return;
    }

    if (!editedTask.endTime) {
      Alert.alert('Error', 'End time is required');
      return;
    }

    // Calculate total minutes correctly
    const durationParts = (editedTask.duration || '0.00').split('.');
    const hours = parseInt(durationParts[0]) || 0;
    const minutes = parseInt(durationParts[1]) || 0;
    const totalDurationMinutes = (hours * 60) + minutes;

    const updateData = {
      title: editedTask.title,
      description: editedTask.description,
      department: editedTask.department,
      Project_Title: editedTask.Project_Title,
      status: editedTask.status.toLowerCase(),
      priority: getPriorityNumber(editedTask.priority),
      duration_minutes: totalDurationMinutes,
      start: editedTask.startTime,
      end_time: editedTask.endTime,
    };

    console.log('💾 Saving update:', updateData);
    await onSave(task.id, updateData);
  };

  const openDateTimePicker = (pickerType, mode) => {
    setCurrentPicker(pickerType);
    setDateTimePickerMode(mode);
    setShowDateTimePicker(true);
  };

  const onDateTimeChange = (event, selectedDate) => {
    setShowDateTimePicker(false);
    if (selectedDate) {
      const currentVal = editedTask[currentPicker]
        ? new Date(editedTask[currentPicker])
        : new Date();

      if (dateTimePickerMode === 'date') {
        currentVal.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        handleInputChange(currentPicker, currentVal.toISOString());
        setTimeout(() => openDateTimePicker(currentPicker, 'time'), 200);
      } else {
        currentVal.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        handleInputChange(currentPicker, currentVal.toISOString());
        handleInputChange('durationInputMode', 'auto');
      }
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!task) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={[styles.sheetWrapper, { maxHeight: height * 0.95 }]}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <LinearGradient
                colors={['#00D4FF', '#0099FF', '#667EEA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalHeader}
              >
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Update Task</Text>
                <View style={{ width: 44 }} />
              </LinearGradient>

              {/* Body */}
              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.section}>

                  {/* Task Title */}
                  <Text style={styles.fieldLabel}>Task Title *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter task title"
                    placeholderTextColor={COLORS.textLight}
                    value={editedTask.title}
                    onChangeText={(value) => handleInputChange('title', value)}
                    editable={!loading}
                  />

                  {/* Description */}
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                    placeholder="Enter task description"
                    placeholderTextColor={COLORS.textLight}
                    value={editedTask.description}
                    onChangeText={(value) => handleInputChange('description', value)}
                    editable={!loading}
                    multiline
                  />

                  {/* Department Dropdown
                  <Text style={styles.fieldLabel}>Department</Text>
                  <View>
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => setDepartmentOpen(prev => !prev)}
                      disabled={loading}
                    >
                      <Text style={[
                        styles.dropdownText,
                        !editedTask.department && { color: COLORS.textLight },
                      ]}>
                        {editedTask.department || 'Select department'}
                      </Text>
                      <Ionicons
                        name={departmentOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>

                    {departmentOpen && (
                      <View style={styles.customInputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Type custom department"
                          placeholderTextColor={COLORS.textLight}
                          value={editedTask.department}
                          onChangeText={(value) => handleInputChange('department', value)}
                          editable={!loading}
                        />
                      </View>
                    )}

                    {departmentOpen && (
                      <View style={[styles.dropdownMenu, { zIndex: 1000 }]}>
                        {departments.map((dept, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.dropdownItem}
                            onPress={() => {
                              handleInputChange('department', dept);
                              setDepartmentOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{dept}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View> */}

                  {/* Project Title */}

                  <Text style={styles.fieldLabel}>Project Title</Text>
                  <View>
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => setProjectTitleOpen(prev => !prev)}
                      disabled={loading}
                    >
                      <Text style={[
                        styles.dropdownText,
                        !editedTask.Project_Title && { color: COLORS.textLight },
                      ]}>
                        {editedTask.Project_Title || 'Select project'}
                      </Text>
                      <Ionicons
                        name={projectTitleOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>

                    {projectTitleOpen && (
                      <View style={styles.customInputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Type custom project name"
                          placeholderTextColor={COLORS.textLight}
                          value={editedTask.Project_Title}
                          onChangeText={(value) => handleInputChange('Project_Title', value)}
                          editable={!loading}
                        />
                      </View>
                    )}

                    {projectTitleOpen && (
                      <View style={[styles.dropdownMenu, { zIndex: 900 }]}>
                        {projectOptions.map((proj, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.dropdownItem}
                            onPress={() => {
                              handleInputChange('Project_Title', proj);
                              setProjectTitleOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{proj}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>


                  {/* Status */}
                  <Text style={styles.fieldLabel}>Status</Text>
                  <View style={styles.statusPicker}>
                    {['pending', 'in progress', 'completed'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusOption,
                          editedTask.status === status && styles.statusOptionActive
                        ]}
                        onPress={() => handleInputChange('status', status)}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            editedTask.status === status && styles.statusOptionTextActive
                          ]}
                        >
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Priority */}
                  <Text style={styles.fieldLabel}>Priority</Text>
                  <View style={styles.priorityPicker}>
                    {['High', 'Medium', 'Low'].map((pri) => (
                      <TouchableOpacity
                        key={pri}
                        style={[
                          styles.priorityOption,
                          editedTask.priority === pri && styles.priorityOptionActive
                        ]}
                        onPress={() => handleInputChange('priority', pri)}
                      >
                        <Text
                          style={[
                            styles.priorityOptionText,
                            editedTask.priority === pri && styles.priorityOptionTextActive
                          ]}
                        >
                          {pri}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Duration Display */}
                  <View style={styles.durationSection}>
                    <Text style={styles.fieldLabel}>Duration</Text>
                    <View style={styles.durationDisplay}>
                      <Text style={styles.durationDisplayText}>
                        {editedTask.duration || '0.00'} hours
                      </Text>
                    </View>

                    {/* Hours & Minutes */}
                    <View style={styles.durationInputRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subLabel}>Hours</Text>
                        <TextInput
                          style={styles.durationInput}
                          placeholder="0"
                          placeholderTextColor={COLORS.textLight}
                          keyboardType="number-pad"
                          value={editedTask.durationHours}
                          onChangeText={(value) => {
                            handleInputChange('durationHours', value);
                            handleInputChange('durationInputMode', 'manual');
                          }}
                          editable={!loading}
                          maxLength={2}
                        />
                      </View>

                      <Text style={styles.durationSeparator}>:</Text>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.subLabel}>Minutes</Text>
                        <TextInput
                          style={styles.durationInput}
                          placeholder="00"
                          placeholderTextColor={COLORS.textLight}
                          keyboardType="number-pad"
                          value={editedTask.durationMinutes}
                          onChangeText={(value) => {
                            const limited = value.length > 2 ? value.slice(0, 2) : value;
                            handleInputChange('durationMinutes', limited);
                            handleInputChange('durationInputMode', 'manual');
                          }}
                          editable={!loading}
                          maxLength={2}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Start Time */}
                  <Text style={styles.fieldLabel}>Start Time *</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => openDateTimePicker('startTime', 'date')}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.dropdownText,
                      !editedTask.startTime && { color: COLORS.textLight },
                    ]}>
                      {formatDisplayDate(editedTask.startTime) || 'Select start date & time'}
                    </Text>
                    <Ionicons name="calendar" size={18} color={COLORS.primary} />
                  </TouchableOpacity>

                  {/* End Time */}
                  <Text style={styles.fieldLabel}>End Time *</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => openDateTimePicker('endTime', 'date')}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.dropdownText,
                      !editedTask.endTime && { color: COLORS.textLight },
                    ]}>
                      {formatDisplayDate(editedTask.endTime) || 'Select end date & time'}
                    </Text>
                    <Ionicons name="calendar" size={18} color={COLORS.primary} />
                  </TouchableOpacity>

                  {/* DateTimePicker */}
                  {showDateTimePicker && (
                    <DateTimePicker
                      value={editedTask[currentPicker] ? new Date(editedTask[currentPicker]) : new Date()}
                      mode={dateTimePickerMode}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onDateTimeChange}
                    />
                  )}

                  {/* Action Buttons */}
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={onClose}
                      disabled={loading}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.saveButton, loading && { opacity: 0.6 }]}
                      onPress={handleSave}
                      disabled={loading}
                    >
                      <Text style={styles.saveButtonText}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ========== MAIN HOME SCREEN ==========

export default function HomePage() {
  const {
    allUsers = [],
    allTasks = [],
    myTasks = [],
    loading,
    fetchMyTasks,
    createTask,
    fetchAllTasks,
    fetchAllUsers,
    updateTask,
    deleteTask
  } = useTaskManagement();

  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [assignTaskModalVisible, setAssignTaskModalVisible] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = decoded.exp - now;
          console.log(`â° Token expires in: ${Math.floor(timeLeft / 60)} minutes`);
          if (timeLeft < 0) {
            console.log('âŒ Token EXPIRED - need to log in again');
            await AsyncStorage.removeItem('authToken');
          }
        } catch (err) {
          console.error('Error decoding token:', err);
        }
      }
    };
    checkToken();
  }, []);

  // ===== RESPONSIVE CALCULATIONS =====
  const bottomPadding = useMemo(() => {
    // Dock height is approximately 80-100px
    if (isTablet) {
      return insets.bottom + 150;
    }
    return insets.bottom + 100;
  }, [insets.bottom]);

  const getModalHeight = useMemo(() => {
    const reservedSpace = insets.top + insets.bottom + 60;
    return height - reservedSpace;
  }, [insets.top, insets.bottom]);

  const handleSaveTask = async (taskData) => {
    console.log('[HomePage] handleSaveTask called');
    console.log('Task Data received:', taskData);

    try {
      console.log(' Calling createTask...');
      const response = await createTask(taskData);
      console.log(' Task created:', response);

      Alert.alert('Success', 'Task assigned successfully!');
      setAssignTaskModalVisible(false);
    } catch (error) {
      console.error(' createTask error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create task';
      Alert.alert('Error', errorMessage);
    }
  };

  // convert backend tasks UI tasks for TaskCard
  const uiTasks = useMemo(() => {
    if (!Array.isArray(allTasks)) return [];

    return allTasks.map(t => ({
      id: t.id,
      employeeName: t.assigned_to_name || `User #${t.assigned_to}`,
      name: t.title,
      status: t.status === 'pending' ? 'pending' : t.status,
      // Handle backend (project_title) vs frontend (Project_Title) mismatch
      Project_Title: t.project_title || t.Project_Title,
      description: t.description,
      startDate: t.start,
      endDate: t.end_time,
    }));
  }, [allTasks]);

  //  Filter tasks by date
  const filteredTasks = useMemo(() => {
    const targetDateStart = new Date(selectedDate);
    const targetDateEnd = new Date(selectedDate);
    // Set the time boundaries for the entire day (from 00:00:00 to 23:59:59)
    targetDateStart.setHours(0, 0, 0, 0);
    targetDateEnd.setHours(23, 59, 59, 999);

    const filtered = uiTasks.filter(task => {
      if (!task.startDate) return false;
      const taskDate = new Date(task.startDate);

      // Check if the task's date is >= start of the day AND <= end of the day
      return taskDate >= targetDateStart && taskDate <= targetDateEnd;
    });
    return filtered;
  }, [uiTasks, selectedDate]);

  //  In useEffect
  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  const handleTaskPress = (task) => {
    setSelectedTask(task);
    setIsDetailVisible(true);
  };

  const handleAddTask = () => {
    setAssignTaskModalVisible(true);
  };

  const handleOpenEditModal = (taskId) => {
    setIsEditModalVisible(true);
  };

  const handleUpdateTask = async (id, data) => {
    try {
      await updateTask(id, data);
      // Close edit modal after save
      setIsEditModalVisible(false);
      // Keep detail sheet open to show updated data
      await fetchAllTasks();
      setSelectedTask(null); // Close detail sheet too
      setIsDetailVisible(false);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id);
      setIsDetailVisible(false);
      await fetchAllTasks();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.headerSpacer} />
      <FilterBar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        filteredTasks={filteredTasks}
      />

      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <ScrollView
          style={styles.content}
          scrollEnabled={!isDetailVisible}
          pointerEvents={isDetailVisible ? 'none' : 'auto'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomPadding }
          ]}
        >
          <View style={styles.tasksSection}>
            <View style={styles.filterContainer}>
              <Text style={styles.sectionTitle}>Employee Tasks ({filteredTasks.length})</Text>
              <TouchableOpacity
                style={styles.assignButton}
                onPress={handleAddTask}
              >
                <Octicons name="tasklist" size={16} color="#fff" />
                <Text style={styles.assignButtonText}>Assign a Task</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : Array.isArray(filteredTasks) && filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onPress={() => handleTaskPress(task)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="mail-open-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyText}>
                  {loading ? 'Loading tasks...' : 'No tasks for today'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* ONLY THESE THREE MODALS */}
      <AssignTaskModal
        visible={assignTaskModalVisible}
        onClose={() => setAssignTaskModalVisible(false)}
        onSave={handleSaveTask}
        allUsers={allUsers}
      />

      <TaskModal
        visible={isDetailVisible}
        task={selectedTask}
        onClose={() => setIsDetailVisible(false)}
        modalHeight={getModalHeight}
        onEditPress={() => {
          setIsDetailVisible(false); // Close preview modal
          setIsEditModalVisible(true); // Open edit modal
        }}
        onDeletePress={() => {
          setIsDetailVisible(false); // Close preview modal
          handleDeleteTask(selectedTask.id); // Delete
        }}
      />

      <EditTaskModal
        visible={isEditModalVisible}
        task={selectedTask}
        onClose={() => setIsEditModalVisible(false)}
        onSave={handleUpdateTask}
        loading={loading}
        allUsers={allUsers}
      />
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  // ========== CONTAINER ==========
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ========== HEADER STYLES ==========
  headerGradient: {
    paddingTop: isTablet ? 60 : 50,
    paddingBottom: isTablet ? 50 : 40,
    paddingHorizontal: isTablet ? 25 : 15,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 10,
    elevation: 10,
  },
  header: {
    paddingHorizontal: isTablet ? 30 : 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: isTablet ? 18 : 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: isTablet ? 36 : 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  employeeNameCenter: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },

  // ========== STATUS STYLES ==========
  statusBadgenf: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
  },
  statusDotnf: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  statusTextnf: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },



  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // ========== AVATAR & NOTIFICATION ==========
  avatar: {
    width: isTablet ? 64 : 56,
    height: isTablet ? 64 : 56,
    borderRadius: isTablet ? 32 : 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  notificationBtn: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // ========== STATS OVERVIEW ==========
  statsOverviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: isTablet ? 24 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  statsTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: isTablet ? 13 : 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },

  // ========== FILTER BAR ==========
  filterBarContainer: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}15`,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dateRangeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: `${COLORS.secondary}15`,
    gap: 6,
  },
  dateRangeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginLeft: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    gap: 6,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // ========== CONTENT ==========
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isTablet ? 24 : 16,
  },
  tasksSection: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: isTablet ? 24 : 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    // marginTop: 2,
  },
  roleIndicator: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // ========== EMPTY STATE ==========
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 12,
    fontWeight: '500',
  },

  // ========== CARD STYLES ==========
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: 14,
    gap: 12,
  },
  employeeSection: {
    width: isTablet ? 120 : 80,
  },
  employeeName: {
    fontSize: isTablet ? 14 : 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  taskSection: {
    flex: 1,
  },
  taskName: {
    fontSize: isTablet ? 14 : 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 90,
  },

  // ========== MODAL STYLES ==========
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '95%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: COLORS.background,
  },
  scrollViewContent: {
    paddingBottom: 60,
    flexGrow: 1,
  },
  modalScrollContent: {
    flex: 1,
    paddingHorizontal: isTablet ? 24 : 20,
    paddingTop: 20,
  },

  // ========== FORM STYLES ==========
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: isTablet ? 20 : 16,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 14,
  },

  priorityPicker: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  priorityOptionTextActive: {
    color: '#fff',
    fontWeight: '700',
  },


  //=======
  durationSection: {
    marginVertical: 12,
  },
  durationDisplay: {
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  durationDisplayText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  durationInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  durationInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  durationSeparator: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textLight,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 4,
  },
  durationHint: {
    fontSize: 12,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: 8,
  },

  //=======

  label: {
    fontSize: isTablet ? 15 : 14,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 8,
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
    marginBottom: 4,
  },
  editInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },

  // ========== DROPDOWN STYLES ==========
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 6,
    marginBottom: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  dropdownMenu: {
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  customInputWrapper: {
    marginBottom: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    gap: 6,
  },
  customInputLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '500',
    paddingHorizontal: 4,
  },

  // ========== BUTTON STYLES ==========
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // ========== STATUS PICKER ==========
  statusPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusOptionTextActive: {
    color: '#fff',
  },

  // ========== DETAIL STYLES ==========
  detailRow: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: isTablet ? 15 : 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  descriptionText: {
    fontSize: isTablet ? 15 : 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  dateTimeText: {
    fontSize: isTablet ? 15 : 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 12,
  },

  // ========== DIVIDER & SEPARATOR ==========
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },

  // ========== BOTTOM SHEET STYLES ==========
  overlayTouch: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.65,
    paddingHorizontal: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  sheetBody: {
    flex: 1,
    paddingBottom: 20,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },

  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  editBtn: {
    backgroundColor: COLORS.primary,
  },
  deleteBtn: {
    backgroundColor: COLORS.danger,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

});