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
  Platform, ActivityIndicator,
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
import TaskService from './services/TaskService';
import useTaskManagement from './hooks/useTaskManagement';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

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
  Pending: '#F39C12',
  'In Progress': '#3498DB',
  Completed: '#27AE60',
  Paused: '#E74C3C',
};

// const employeesData = [
//   {
//     id: 1,
//     name: "Rajesh Kumar",
//     tasks: [
//       {
//         id: 101,
//         name: "Complete UI Design for Dashboard",
//         status: "In Progress",
//         project: "Admin Portal",
//         description: "Design the admin dashboard UI with glassomorphic style components",
//         startDate: "2025-11-25T09:00:00",
//         endDate: "2025-11-29T17:00:00"
//       },
//       {
//         id: 102,
//         name: "API Integration Testing",
//         status: "Completed",
//         project: "Mobile App Backend",
//         description: "Test all API endpoints with Postman",
//         startDate: "2025-11-24T10:00:00",
//         endDate: "2025-11-28T16:00:00"
//       },
//       {
//         id: 103,
//         name: "Database Optimization",
//         status: "Pending",
//         project: "Performance Enhancement",
//         description: "Optimize database queries for faster response times",
//         startDate: "2025-11-30T09:00:00",
//         endDate: "2025-12-02T17:00:00"
//       }
//     ]
//   },
//   {
//     id: 2,
//     name: "Priya Sharma",
//     tasks: [
//       {
//         id: 201,
//         name: "Frontend Components Development",
//         status: "In Progress",
//         project: "Admin Portal",
//         description: "Develop reusable React components for dashboard",
//         startDate: "2025-11-26T08:30:00",
//         endDate: "2025-11-29T18:00:00"
//       },
//       {
//         id: 202,
//         name: "Bug Fixes - Mobile App",
//         status: "Incomplete",
//         project: "Mobile App",
//         description: "Fix reported bugs in iOS and Android versions",
//         startDate: "2025-11-28T09:00:00",
//         endDate: "2025-12-01T17:00:00"
//       }
//     ]
//   },
//   {
//     id: 3,
//     name: "Amit Patel",
//     tasks: [
//       {
//         id: 301,
//         name: "Server Setup and Configuration",
//         status: "Completed",
//         project: "Infrastructure",
//         description: "Setup production servers on AWS",
//         startDate: "2025-11-20T10:00:00",
//         endDate: "2025-11-27T16:00:00"
//       },
//       {
//         id: 302,
//         name: "Security Audit Report",
//         status: "Paused",
//         project: "Security",
//         description: "Conduct comprehensive security audit of the system",
//         startDate: "2025-11-25T09:00:00",
//         endDate: "2025-12-05T17:00:00"
//       },
//       {
//         id: 303,
//         name: "Documentation Update",
//         status: "Pending",
//         project: "Documentation",
//         description: "Update API documentation with new endpoints",
//         startDate: "2025-11-29T10:00:00",
//         endDate: "2025-12-03T17:00:00"
//       }
//     ]
//   },
//   {
//     id: 4,
//     name: "Neha Singh",
//     tasks: [
//       {
//         id: 401,
//         name: "User Experience Testing and Feedback Collection",
//         status: "In Progress",
//         project: "Admin Portal",
//         description: "Test user experience and collect feedback from stakeholders",
//         startDate: "2025-11-27T09:00:00",
//         endDate: "2025-11-29T17:00:00"
//       },
//       {
//         id: 402,
//         name: "Mobile App Testing",
//         status: "Completed",
//         project: "Mobile App",
//         description: "Perform QA testing on both iOS and Android",
//         startDate: "2025-11-23T08:00:00",
//         endDate: "2025-11-28T18:00:00"
//       }
//     ]
//   }
// ];

// ========== UTILITY FUNCTIONS ==========
const truncateText = (text, maxLength = 20) => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${diffDays} days, ${diffHours} hours`;
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
      alert('âŒ No tasks to export for the selected date range');
      return;
    }

    const fileName = `Employee_Tasks_${formatDateRange(dateRange)}.xlsx`;

    // Show loading notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'ðŸ“Š Exporting Tasks',
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
          title: 'âŒ Permission Denied',
          body: 'Storage permission is required to export files',
          sound: 'default',
        },
        trigger: null,
      });
      alert('âŒ Storage permission denied. Cannot save file.');
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
        title: 'âœ… Export Successful',
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
        title: 'âŒ Export Failed',
        body: error.message || 'Something went wrong',
        sound: 'default',
      },
      trigger: null,
    });

    alert('âŒ Export Failed:\n' + error.message);
  }
};

// ========== HEADER COMPONENT ==========
function Header() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! ðŸ‘‹';
    if (hour < 18) return 'Good Afternoon! ðŸ‘‹';
    return 'Good Evening! ðŸ‘‹';
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

        <View style={styles.statsOverviewCard}>
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
        </View>
      </View>
    </LinearGradient>
  );
}

// ========== FILTER BAR COMPONENT ==========
function FilterBar({ selectedDateRange, setSelectedDateRange, filteredTasks }) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleTodayPress = () => {
    const today = new Date();
    setSelectedDateRange({
      start: today,
      end: today,
    });
  };

  const handleStartDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (date) {
      setSelectedDateRange(prev => ({
        ...prev,
        start: date,
      }));
    }
  };

  const handleEndDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (date) {
      setSelectedDateRange(prev => ({
        ...prev,
        end: date,
      }));
    }
  };

  const dateRangeText = selectedDateRange.start.toDateString() === selectedDateRange.end.toDateString()
    ? formatDate(selectedDateRange.start)
    : `${formatDate(selectedDateRange.start)} - ${formatDate(selectedDateRange.end)}`;

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
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar" size={16} color={COLORS.secondary} />
            <Text style={styles.dateRangeText}>{dateRangeText}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => exportTasksToExcel(filteredTasks, selectedDateRange)}
          >
            <Ionicons name="download" size={16} color="#fff" />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={selectedDateRange.start}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={selectedDateRange.end}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
        />
      )}
    </>
  );
}

// ========== TASK CARD COMPONENT ==========
// In TaskCard component
function TaskCard({ task, onPress, showAssignedTo }) {
  const statusColor = STATUS_COLORS[task.status] || COLORS.textLight;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        <View style={styles.employeeSection}>
          <Text style={styles.employeeName}>
            {task.assigned_to_name || 'Unassigned'}
          </Text>
        </View>

        <View style={styles.taskSection}>
          <Text style={styles.taskName}>{truncateText(task.title, 25)}</Text>
        </View>

        <View style={styles.statusSection}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {task.status}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  );
}

// ========== TASK MODAL COMPONENT ==========
function TaskModal({ visible, task, onClose, modalHeight }) {
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
                <Text style={styles.value}>{task.project}</Text>
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
                <Text style={styles.label}>Total Duration:</Text>
                <Text style={[styles.value, { color: COLORS.primary, fontWeight: '700' }]}>
                  {calculateDuration(task.startDate, task.endDate)}
                </Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ========== ASSIGN TASK MODAL ==========
function AssignTaskModal({ visible, onClose, onSave, allUsers }) {
  const [formData, setFormData] = useState({
    department: '',
    title: '',
    projectTitle: '',
    taskDescription: '',
    priority: '',
    assgnUserId: '',
    assignUser: '',
    duration: '',
    startTime: '',
    endTime: ''
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
        projectTitle: '',
        taskDescription: '',
        priority: '',
        assignUserId: '',
        assignUser: '',
        duration: '',
        startTime: '',
        endTime: '',
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
      } else {
        handleInputChange('duration', '0.00');
      }
    }
  }, [formData.startTime, formData.endTime]);

  const handleSave = async () => {
    console.log('ðŸ”µ [MODAL] handleSave called');
    console.log('Form Data:', formData);

    // âœ… Use projectTitle as title if title is empty
    const finalTitle = formData.title?.trim() || formData.projectTitle?.trim();

    if (!finalTitle) {
      Alert.alert('Error', 'Project title is required');
      console.log('âŒ Title/Project missing');
      return;
    }
    if (!formData.assignUserId) {
      Alert.alert('Error', 'User must be assigned');
      console.log('âŒ User not assigned');
      return;
    }
    if (!formData.startTime) {
      Alert.alert('Error', 'Start time is required');
      console.log('âŒ Start time missing');
      return;
    }
    if (!formData.endTime) {
      Alert.alert('Error', 'End time is required');
      console.log('âŒ End time missing');
      return;
    }

    console.log('âœ… All validations passed');
    setLoading(true);
    try {
      // âœ… Pass corrected formData with title set
      const correctedData = {
        ...formData,
        title: finalTitle, // âœ… Use projectTitle as fallback
      };
      console.log('ðŸ“¤ Calling onSave with:', correctedData);
      await onSave(correctedData);
    } catch (error) {
      console.error('âŒ onSave error:', error);
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
                          // âœ… FILTER: Show only users with role === 'user'
                          allUsers
                            .filter(user => user.role === 'user')  // âœ… ONLY 'user' role
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
                        !formData.projectTitle && { color: COLORS.textLight },
                      ]}>
                        {formData.projectTitle || 'Select project'}
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
                          value={formData.projectTitle}
                          onChangeText={(value) => handleInputChange('projectTitle', value)}
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
                              handleInputChange('projectTitle', proj);
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
                  <Text style={styles.fieldLabel}>Calculated Duration (HH.mm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textLight}
                    value={formData.duration}
                    editable={false} // Duration is now calculated
                  />

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


// ========== MAIN HOME SCREEN ==========
export default function HomePage() {
  const [userRole, setUserRole] = useState('user');
  const [currentUserId, setCurrentUserId] = useState(null);

  const insets = useSafeAreaInsets();
  const { allUsers = [], myTasks = [], loading, fetchMyTasks, createTask, fetchAllTasks, allTasks = [] } = useTaskManagement();

  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [assignTaskModalVisible, setAssignTaskModalVisible] = useState(false);

  // const [todaysTasks, setTodaysTasks] = useState([]);
  // const [filteredTasks, setFilteredTasks] = useState([]);

  const tasksToDisplay = userRole === 'admin' ? allTasks : myTasks;

  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  const filteredTasks = useMemo(() => {
    if (!Array.isArray(myTasks)) return [];

    return myTasks.map(task => ({
      ...task,
      assigned_to_name: task.assigned_by_name || task.username || 'Unknown',
    })).filter(task => {
      const taskDate = new Date(task.start || task.startDate);
      const startDate = new Date(selectedDateRange.start);
      const endDate = new Date(selectedDateRange.end);

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      return taskDate >= startDate && taskDate <= endDate;
    });
  }, [myTasks, selectedDateRange.start, selectedDateRange.end]);


  // âœ… FIXED: Fetch ONCE on mount only
  useEffect(() => {
    fetchMyTasks();
  }, []); // âœ… Empty array = run once only not in Loooooooooooooooop âŒ

  useEffect(() => {
    const getUserFromToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const decoded = jwtDecode(token);  // âœ… Using correct import
          setCurrentUserId(decoded.id);
          setUserRole(decoded.role || 'user');  // âœ… Default to 'user'
          console.log('ðŸ‘¤ Current User:', decoded.id);
          console.log('ðŸ” Role:', decoded.role);
        }
      } catch (err) {
        console.error('Error decoding token:', err);
        setUserRole('user');  // âœ… Fallback
      }
    };
    getUserFromToken();
  }, []);

  // âœ… Update useEffect to call correct function based on role:
  useEffect(() => {
    if (userRole === 'admin') {
      console.log('ðŸ“Š Loading ALL tasks (Admin)');
      fetchAllTasks();  // âœ… Load all tasks for admin
    } else {
      console.log('ðŸ“‹ Loading MY tasks (User)');
      fetchMyTasks();   // âœ… Load only assigned tasks for user
    }
  }, [userRole, fetchAllTasks, fetchMyTasks]);


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


  const handleTaskPress = (task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const handleAddTask = () => {
    setAssignTaskModalVisible(true);
  };

  // Add task to today's list
  // const handleSaveTask = (taskData) => {
  //   setTodaysTasks([...todaysTasks, {
  //     ...taskData,
  //     employeeName: taskData.assignee,
  //     employeeId: Date.now(),
  //   }]);

  //   Alert.alert('Success', 'Task assigned successfully!');
  //   setAssignTaskModalVisible(false);
  // };

  const handleSaveTask = async (taskData) => {
    console.log('ðŸ”µ [HomePage] handleSaveTask called');
    console.log('Task Data received:', taskData);

    try {
      console.log('ðŸ“¤ Calling createTask...');
      const response = await createTask(taskData);
      console.log('âœ… Task created:', response);

      Alert.alert('Success', 'Task assigned successfully!');
      setAssignTaskModalVisible(false);
    } catch (error) {
      console.error('âŒ createTask error:', error);
      Alert.alert('Error', error.message || 'Failed to create task');
    }
  };




  return (
    <View style={styles.container}>
      <Header />
      <FilterBar
        selectedDateRange={selectedDateRange}
        setSelectedDateRange={setSelectedDateRange}
        filteredTasks={filteredTasks}
      />

      {/* Background with opacity when modal is open */}
      <View style={{
        flex: 1,
        opacity: modalVisible ? 0.4 : 1,
        backgroundColor: COLORS.background
      }}>
        <ScrollView
          style={styles.content}
          scrollEnabled={!modalVisible}
          pointerEvents={modalVisible ? 'none' : 'auto'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomPadding }
          ]}
        >
          <View style={styles.tasksSection}>
            <View style={styles.filterContainer}>

              <Text style={styles.sectionTitle}>Employee Tasks</Text>
              <TouchableOpacity
                style={styles.assignButton}
                onPress={handleAddTask}
              //  style={styles.addButton} onPress={handleAddTask} 
              >
                <Octicons name="tasklist" size={16} color="#fff" />
                <Text style={styles.assignButtonText}>Assign a Task</Text>
              </TouchableOpacity>
            </View>

            {/* Show filtered tasks + today's new tasks */}
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TaskCard
                  // key={`${task.employeeId}-${task.id}`}
                  key={task.id}
                  task={task}
                  onPress={() => handleTaskPress(task)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="mail-open-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No tasks for today</Text>
              </View>
            )}

          </View>
        </ScrollView>
      </View>
      <TaskModal
        visible={modalVisible}
        task={selectedTask}
        onClose={() => setModalVisible(false)}
        modalHeight={getModalHeight}
      />

      <AssignTaskModal
        visible={assignTaskModalVisible}
        onClose={() => setAssignTaskModalVisible(false)}
        onSave={handleSaveTask}
        allUsers={allUsers}
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

  // HEADER STYLES
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

  statusBadgenf: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusDotnf: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusTextnf: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
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
  notificationBtn: {
    position: 'relative',
  },
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

  // FILTER BAR STYLES
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

  // CONTENT STYLES
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
    marginBottom: 16,
  },
  roleIndicator: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },

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

  // TASK CARD STYLES
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // MODAL STYLES
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

  // Form Styles
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 14,
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

  // Dropdown Styles
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

  // Button Styles
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },

  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
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
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  //======================
  employeeNameCenter: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  modalScrollContent: {
    flex: 1,
    paddingHorizontal: isTablet ? 24 : 20,
    paddingTop: 20,
  },
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: isTablet ? 20 : 16,
  },
  detailRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: isTablet ? 15 : 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  value: {
    fontSize: isTablet ? 15 : 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // ========== ASSIGN TASK MODAL ==========
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

  // ========== MODAL CONTENT STYLES ==========
  // UPDATE IF EXISTING, ADD IF NOT
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '95%',
    flex: 1,
    // REMOVE: height: modalHeight (this was causing issues)
    // REMOVE: width: '100%' (not needed with flex layout)
  },

  // ========== MODAL HEADER STYLES ==========
  // UPDATE IF EXISTING
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    // REMOVE: elevation or extra shadows
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

  // ========== MODAL BODY STYLES ==========
  // ADD THESE IF NOT PRESENT
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

  // ========== FORM SECTION STYLES ==========
  // ADD THESE IF NOT PRESENT
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 14,
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

  // ========== DROPDOWN STYLES ==========
  // ADD THESE IF NOT PRESENT
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
    // NEW: Added proper shadow properties for Android
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

  // ========== BUTTON STYLES ==========
  // ADD THESE IF NOT PRESENT
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },

  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
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
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // SECTION STYLE
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 16,
  },

  //=============================================

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
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
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // SECTION STYLE
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 16,
  },

  //=============================================

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
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
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // SECTION STYLE
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 16,
  },

  //=============================================

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
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
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // SECTION STYLE
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 16,
  },

  //=============================================

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
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
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // SECTION STYLE
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 16,
  },

  //=============================================

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
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
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // SECTION STYLE
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 16,
  },

  //=============================================

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
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
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // SECTION STYLE
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 16,
  },

  //=============================================

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
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
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // SECTION STYLE
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 16,
  },

  //=============================================

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
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
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // SECTION STYLE
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 16,
  },

  //=============================================

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
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

  // ========== BUTTON STYLES ==========
  // ADD THESE IF NOT PRESENT
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },

  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
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
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // SECTION STYLE
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    marginTop: 16,
  },

  //=============================================

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
});