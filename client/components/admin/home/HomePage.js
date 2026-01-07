import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator, Image, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Octicons from '@expo/vector-icons/Octicons';
import * as FileSystem from 'expo-file-system/legacy'; // Fix for deprecated writeAsStringAsync warning/error
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';
import * as XLSX from 'xlsx';
import DateTimePicker from '@react-native-community/datetimepicker';

import useTaskManagement from '../hooks/useTaskManagement';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWebSocket } from '../hooks/useWebSocket';
import useProjects from '../hooks/useProjects';
import HomeTimeline from './HomeTimeline';
import api from '../../../api/client';
import { CompactToggle } from './CompactToggle';
import { isHolidayOrWeekend } from '../../../utils/holidayUtils';
import HolidayAlert from '../../common/HolidayAlert';
import StyledConfirmAlert from '../../common/StyledConfirmAlert';

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
  'In complete': '#95A5A6',
  'Pending': '#3498DB',
  'pending': '#3498DB',
  'In Progress': '#F39C12',
  'completed': '#27AE60',
  'Paused': '#E74C3C',
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
  if (dateRange instanceof Date || typeof dateRange === 'string' || typeof dateRange === 'number') {
    const d = new Date(dateRange);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).replace(/, /g, '_').replace(/ /g, '_');
  }
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
    // MediaLibrary permission removed - using Sharing instead

    // Create data array
    const data = tasks.map(task => ({
      'Employee Name': task.employeeName,
      'Project / Task Name': task.name,
      'Status': task.status,
      // 'Project': task.project,
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
      encoding: 'base64',
    });

    // Show success notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Export Successful ✅',
        body: `${fileName}\nTotal Tasks: ${tasks.length}`,
        sound: 'default',
      },
      trigger: null,
    });

    // Share the file
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export Staff Tasks',
    });

  } catch (error) {
    console.error('Error exporting tasks:', error);

    // Show error notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Export Failed ❌',
        body: error.message || 'Something went wrong',
        sound: 'default',
      },
      trigger: null,
    });
    Alert.alert('Export Error', error.message);
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
            {/* <View style={styles.statusBadgenf}>
              <View style={styles.statusDotnf} />
              <Text style={styles.statusTextnf}>Online</Text>
            </View> */}
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
function FilterBar({ selectedDate, setSelectedDate, filteredTasks, showTimeline, setShowTimeline, isSmall }) {
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

          {/* <TouchableOpacity
            style={styles.dateRangeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={16} color={COLORS.secondary} />
            <Text style={styles.dateRangeText}>{dateText}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textLight} />
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[
              styles.dateRangeButton,
              isSmall && styles.dateRangeButtonSmall,
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={16} color={COLORS.secondary} />
            <Text
              style={[
                styles.dateRangeText,
                isSmall && styles.dateRangeTextSmall,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {dateText}
            </Text>
            {!isSmall && (
              <Ionicons
                name="chevron-down"
                size={16}
                color={COLORS.textLight}
              />
            )}
          </TouchableOpacity>

          <CompactToggle isActive={showTimeline} onToggle={(val) => setShowTimeline(val)} />

          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => exportTasksToExcel(filteredTasks, selectedDate)}
          >
            <Ionicons name="download" size={16} color="#fff" />
            <Text style={styles.exportButtonText}>Export Data</Text>
          </TouchableOpacity>
        </View>
      </View >

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )
      }
    </>
  );
}

const TaskCard = React.memo(({ task, onPress }) => {
  const statusColor = STATUS_COLORS[task.status] || COLORS.textLight;

  const PRIORITY_COLORS = {
    1: ['#fd0022ff', '#fd0022ff'],
    2: ['#FFC46B', '#FFD93D'],
    3: ['#08a745ff', '#08a745ff'],
    'High': ['#fd0022ff', '#fd0022ff'],
    'Medium': ['#FFC46B', '#FFD93D'],
    'Low': ['#00ff33ff', '#08a745ff'],
    'high': ['#fd0022ff', '#fd0022ff'],
    'medium': ['#FFC46B', '#FFD93D'],
    'low': ['#00ff33ff', '#08a745ff'],
  };

  const getPriorityLabel = (priorityNum) => {
    if (priorityNum === null || priorityNum === undefined) return 'Low';
    if (typeof priorityNum === 'number') {
      if (priorityNum === 1) return 'High';
      if (priorityNum === 2) return 'Medium';
      if (priorityNum === 3) return 'Low';
    }
    if (typeof priorityNum === 'string') {
      const num = parseInt(priorityNum);
      if (!isNaN(num)) {
        if (num === 1) return 'High';
        if (num === 2) return 'Medium';
        if (num === 3) return 'Low';
      }
      const lower = priorityNum.trim().toLowerCase();
      if (lower === 'high') return 'High';
      if (lower === 'medium') return 'Medium';
      if (lower === 'low') return 'Low';
    }
    return 'Low';
  };

  const getPriorityColor = (priority) => {
    const priorityLabel = getPriorityLabel(priority);
    return PRIORITY_COLORS[priorityLabel] || ['#A8E6CF', '#88D8C0'];
  };

  const getCuteIcon = (priority) => {
    const labels = { 'High': 'High', 'Medium': 'Mid', 'Low': 'Low' };
    return labels[getPriorityLabel(priority)] || 'Low';
  };

  const getStatusEmoji = (status) => {
    const s = (status || '').toLowerCase();
    const emojis = {
      'Pending': '⏳',
      'pending': '⏳',
      'In Progress': '🚀',
      'completed': '✅',
      'Paused': '⏸️',
      'paused': '⏸️',
      'incomplete': '❌',
      'in complete': '❌',
    };
    return emojis[s] || '📋';
  };

  if (!task) return null;

  const priorityColors = getPriorityColor(task.priority);
  const statusEmoji = getStatusEmoji(task.status);

  return (
    <TouchableOpacity
      style={[styles.card, styles.cuteCard]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(248,250,252,0.7)']}
        style={styles.cardGradient}
      />

      <View style={styles.cardContent}>
        <View style={styles.leftSection}>
          <Image
            source={require('../../../assets/men1.jpg')}
            resizeMode="cover"
            style={styles.priorityCircle}
          />
        </View>

        <View style={styles.middleSection}>
          <View style={styles.taskHeader}>
            <View style={styles.employeeRow}>
              <Text style={styles.employeeEmoji}>👤</Text>
              <Text style={styles.employeeNameText}>
                {task.employeeName || 'Unassigned'}
              </Text>
            </View>

            <LinearGradient
              colors={priorityColors}
              style={styles.miniPriorityBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.miniPriorityText}>
                {getCuteIcon(task.priority)}
              </Text>
            </LinearGradient>
          </View>

          <Text style={styles.projectText}>🎯 {task.Project_Title}</Text>
          <Text style={styles.taskTitleText} numberOfLines={2}>
            {task.name || 'No Title'}
          </Text>
        </View>

        <View style={styles.rightSection}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={styles.statusEmoji}>{statusEmoji}</Text>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {task.status || 'Pending'}
            </Text>
          </View>

          <View style={styles.forwardArrow}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          </View>
        </View>
      </View>

      <View style={styles.decorativeDots}>
        <View style={[styles.dot, { backgroundColor: priorityColors[0] }]} />
        <View style={[styles.dot, { backgroundColor: priorityColors[1] }]} />
        <View style={[styles.dot, { backgroundColor: priorityColors[0] }]} />
      </View>
    </TouchableOpacity>
  );
});

// ========== TASK MODAL COMPONENT ==========

function TaskModal({ visible, task, onClose, modalHeight, onEditPress, onDeletePress }) {

  // Add this with your other constants at the top
  // Replace your PRIORITY_COLORS and getPriorityColor function with:
  const PRIORITY_COLORS = {
    1: '#FF6B6B', // High - Red
    2: '#FFA726', // Medium - Orange  
    3: '#4CAF50', // Low - Green
    'High': '#FF6B6B',
    'Medium': '#FFA726',
    'Low': '#4CAF50',
    'high': '#FF6B6B',
    'medium': '#FFA726',
    'low': '#4CAF50',
  };

  const getPriorityColor = (priority) => {
    const priorityLabel = getPriorityLabel(priority);
    return PRIORITY_COLORS[priorityLabel] || '#FFA726'; // Default to Medium orange
  };
  if (!task) return null;

  const statusColor = STATUS_COLORS[task.status] || COLORS.textLight;
  const getPriorityLabel = (priorityNum) => {
    if (priorityNum === null || priorityNum === undefined) return 'Medium';

    // Handle numeric values (1, 2, 3)
    if (typeof priorityNum === 'number') {
      if (priorityNum === 1) return 'High';
      if (priorityNum === 2) return 'Medium';
      if (priorityNum === 3) return 'Low';
    }

    // Handle string numbers ("1", "2", "3")
    if (typeof priorityNum === 'string') {
      const num = parseInt(priorityNum);
      if (!isNaN(num)) {
        if (num === 1) return 'High';
        if (num === 2) return 'Medium';
        if (num === 3) return 'Low';
      }

      // Handle string labels directly
      const lower = priorityNum.trim().toLowerCase();
      if (lower === 'high') return 'High';
      if (lower === 'medium') return 'Medium';
      if (lower === 'low') return 'Low';
    }

    console.warn('Unknown priority value:', priorityNum);
    return 'Medium'; // Default fallback
  };

  const priorityDisplay = getPriorityLabel(task.priority);
  const priorityColor = getPriorityColor(task.priority);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'transparent' }]}>
        {/* Backdrop Layer - Sibling to content */}
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Content - Sibling, touches won't bubble to backdrop */}
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

          <View style={{ flex: 1 }}>
            <ScrollView
              style={styles.modalScrollContent}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
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

                {/* <View style={styles.detailRow}>
                <Text style={styles.label}>Priority:</Text>
                <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
                  <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                  <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>
                    {priorityDisplay}
                  </Text>
                </View>
              </View> */}

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Priority:</Text>
                  <View style={[
                    styles.priorityBadge,
                    {
                      backgroundColor: `${priorityColor}15`,
                      borderWidth: 1,
                      borderColor: `${priorityColor}30`,
                    }
                  ]}>
                    <Ionicons
                      name={priorityDisplay === 'High' ? 'alert-circle' :
                        priorityDisplay === 'Medium' ? 'time' : 'checkmark-circle'}
                      size={14}
                      color={priorityColor}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[
                      styles.priorityBadgeText,
                      {
                        color: priorityColor,
                        fontWeight: '800',
                      }
                    ]}>
                      {priorityDisplay}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Department:</Text>
                  <Text style={styles.value}>{task.name}</Text>
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
          </View>

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
      </View>
    </Modal>
  );
}

// ========== ASSIGN TASK MODAL ==========
function AssignTaskModal({ visible, onClose, onSave, allUsers, projects, holidays }) {
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
  const [showHolidayAlert, setShowHolidayAlert] = useState(false);
  const [holidayAlertMessage, setHolidayAlertMessage] = useState('');
  const [assignUserSearchQuery, setAssignUserSearchQuery] = useState('');
  const scrollViewRef = useRef(null);

  // Dummy data for dropdowns
  const departments = ['Development', 'UI/UX', 'Infrastructure', 'QA Testing', 'Documentation'];
  const priorities = ['Low', 'Medium', 'High'];
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
        const currentStart = formData.startTime ? new Date(formData.startTime) : new Date();
        const endTime = new Date(currentStart.getTime() + (hours * 60 + minutes) * 60 * 1000);

        // Only update startTime if it wasn't set before
        if (!formData.startTime) {
          handleInputChange('startTime', currentStart.toISOString());
        }
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
      // Helper to convert priority label to number
      const getPriorNumber = (label) => {
        if (label === 'High') return 1;
        if (label === 'Medium') return 2;
        if (label === 'Low') return 3;
        return 2;
      };

      // ✅ EXACT MATCH for createTask expectations:
      const taskPayload = {
        department: formData.department || '',           // ← Used for title
        projectTitle: formData.Project_Title || '',      // ← createTask expects camelCase!
        taskDescription: formData.taskDescription || '',
        // priority: formData.priority,                     // ← String 'High', 'Medium', etc.
        priority: getPriorNumber(formData.priority),     // ← Convert to Integer
        assignUserId: parseInt(formData.assignUserId),   // ← Integer
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: formData.duration || '0.00'            // ← HH.MM format
      };

      // console.log('✅ MATCHED createTask format:', JSON.stringify(taskPayload, null, 2));
      await onSave(taskPayload);
    } catch (error) {
      if (error.message === 'SESSION_EXPIRED') return;
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
      if (dateTimePickerMode === 'date') {
        const holidayCheck = isHolidayOrWeekend(selectedDate, holidays);
        if (holidayCheck.isHoliday) {
          setHolidayAlertMessage(`Oops! You've selected ${holidayCheck.reason || 'a non-working day'}. We don't assign tasks on holidays/weekends. Please pick another date!`);
          setShowHolidayAlert(true);
          return;
        }

        const currentVal = formData[currentPicker] ? new Date(formData[currentPicker]) : new Date();
        currentVal.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        handleInputChange(currentPicker, currentVal.toISOString());
        // Automatically open time picker next
        setTimeout(() => openDateTimePicker(currentPicker, 'time'), 200);
      } else { // time
        const currentVal = formData[currentPicker] ? new Date(formData[currentPicker]) : new Date();
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
        <View style={[styles.overlay, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            activeOpacity={1}
            onPress={onClose}
          />
          <View
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
                <Text style={styles.modalTitle}>Assign a Task ☺️</Text>
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
                        <View style={styles.dropdownSearchContainer}>
                          <Ionicons name="search" size={16} color={COLORS.textLight} />
                          <TextInput
                            style={styles.dropdownSearchInput}
                            placeholder="Search user..."
                            placeholderTextColor={COLORS.textLight}
                            value={assignUserSearchQuery}
                            onChangeText={setAssignUserSearchQuery}
                          />
                        </View>
                        {allUsers && allUsers.length > 0 ? (
                          // FILTER: role === 'user' AND matches search query
                          allUsers
                            .filter(user =>
                              user.role === 'user' &&
                              (
                                (user.first_name || '').toLowerCase().includes(assignUserSearchQuery.toLowerCase()) ||
                                (user.last_name || '').toLowerCase().includes(assignUserSearchQuery.toLowerCase()) ||
                                (user.username || '').toLowerCase().includes(assignUserSearchQuery.toLowerCase())
                              )
                            )
                            .map((user) => (
                              <TouchableOpacity
                                key={user.id}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  handleInputChange('assignUserId', user.id);
                                  handleInputChange('assignUser', user.username);
                                  setUserOpen(false);
                                  setAssignUserSearchQuery('');
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
                        {/* If filter results are empty but users exist */}
                        {allUsers.length > 0 && allUsers.filter(user => user.role === 'user' && ((user.first_name || '').toLowerCase().includes(assignUserSearchQuery.toLowerCase()) || (user.last_name || '').toLowerCase().includes(assignUserSearchQuery.toLowerCase()) || (user.username || '').toLowerCase().includes(assignUserSearchQuery.toLowerCase()))).length === 0 && (
                          <Text style={[styles.dropdownItemText, { textAlign: 'center', padding: 10 }]}>No users found</Text>
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

                    {/* {projectTitleOpen && (
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
                    )} */}

                    {projectTitleOpen && (
                      <View style={[styles.dropdownMenu, { zIndex: 900 }]}>
                        {(projects || []).map((proj) => (
                          <TouchableOpacity
                            key={proj.id}
                            style={styles.dropdownItem}
                            onPress={() => {
                              // only store/display name
                              handleInputChange('Project_Title', proj.name);
                              setProjectTitleOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{proj.name}</Text>
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
          </View>
        </View>
      </KeyboardAvoidingView>

      <HolidayAlert
        visible={showHolidayAlert}
        message={holidayAlertMessage}
        onConfirm={() => setShowHolidayAlert(false)}
      />
    </Modal>
  );
}

// ========== COMPLETE EDIT TASK MODAL WITH ALL FEATURES ==========
function EditTaskModal({ visible, task, onClose, onSave, loading, allUsers, projects, holidays }) {
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
  const [showHolidayAlert, setShowHolidayAlert] = useState(false);
  const [holidayAlertMessage, setHolidayAlertMessage] = useState('');

  const departments = ['Development', 'UI/UX', 'Infrastructure', 'QA Testing', 'Documentation'];
  const projectOptions = ['Admin Portal', 'Mobile App', 'Infrastructure', 'Performance Enhancement'];

  // ========== INITIALIZE FORM WITH ACTUAL VALUES ==========

  // AddED sync state when task prop changes
  useEffect(() => {
    if (task && visible) {
      console.log('Task prop changed in EditTaskModal:', task);

      // Parse priority correctly
      const priorityLabel = getPriorityLabel(task.priority);
      console.log('Parsed priority:', priorityLabel, 'from:', task.priority);

      // Parse duration from minutes
      const totalMinutes = parseInt(task.duration_minutes) || 0;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      setEditedTask({
        title: task.name || task.title || '',
        description: task.description || '',
        department: task.department || '',
        Project_Title: task.project_title || task.Project_Title || '',
        status: task.status === 'Pending' ? 'Pending' : (task.status || 'Pending'),
        priority: priorityLabel,
        durationHours: String(hours),
        durationMinutes: String(minutes),
        duration: `${hours}.${String(minutes).padStart(2, '0')}`,
        startTime: task.startDate || task.start || '',
        endTime: task.endDate || task.end_time || '',
        durationInputMode: 'auto',
      });
    }
  }, [task, visible]); // Re-run when task or visible changes


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
        status: task.status === 'Pending' ? 'Pending' : (task.status || 'Pending'),
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
    if (!priorityNum) return 'Medium';
    if (priorityNum === 1 || priorityNum === '1') return 'High';
    if (priorityNum === 2 || priorityNum === '2') return 'Medium';
    if (priorityNum === 3 || priorityNum === '3') return 'Low';

    // String handling
    if (typeof priorityNum === 'string') {
      const lower = priorityNum.trim().toLowerCase();
      if (lower === 'high') return 'High';
      if (lower === 'medium') return 'Medium';
      if (lower === 'low') return 'Low';
    }

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
      if (dateTimePickerMode === 'date') {
        const holidayCheck = isHolidayOrWeekend(selectedDate, holidays);
        if (holidayCheck.isHoliday) {
          setHolidayAlertMessage(`Oops! You've selected ${holidayCheck.reason}. We don't assign tasks on non-working days. Please pick another date!`);
          setShowHolidayAlert(true);
          return;
        }

        const currentVal = editedTask[currentPicker] ? new Date(editedTask[currentPicker]) : new Date();
        currentVal.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        handleInputChange(currentPicker, currentVal.toISOString());
        setTimeout(() => openDateTimePicker(currentPicker, 'time'), 200);
      } else {
        const currentVal = editedTask[currentPicker] ? new Date(editedTask[currentPicker]) : new Date();
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
        <View style={[styles.overlay, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={[styles.sheetWrapper, { maxHeight: height * 0.95 }]}>
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
              <View style={{ flex: 1 }}>
                <ScrollView
                  style={styles.modalBody}
                  contentContainerStyle={styles.scrollViewContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  <View style={styles.section}>

                    {/* Task Title */}
                    <Text style={styles.fieldLabel}>Task Title *</Text>
                    {/* <TextInput
                    style={styles.input}
                    placeholder="Enter task title"
                    placeholderTextColor={COLORS.textLight}
                    value={editedTask.title}
                    onChangeText={(value) => handleInputChange('title', value)}
                    editable={!loading}
                  /> */}

                    <View>
                      <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => setDepartmentOpen(prev => !prev)}
                        disabled={loading}
                      >
                        <Text style={[
                          styles.dropdownText,
                          !editedTask.title && { color: COLORS.textLight },
                        ]}>
                          {editedTask.title || 'Select Task Title'}
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
                            value={editedTask.title}
                            onChangeText={(value) => handleInputChange('title', value)}
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
                                handleInputChange('title', dept);
                                setDepartmentOpen(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{dept}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>

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

                    {/* Department Dropdown */}
                    {/* <Text style={styles.fieldLabel}>Department</Text>
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

                      {/* {projectTitleOpen && (
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
                    )} */}

                      {projectTitleOpen && (
                        <View style={[styles.dropdownMenu, { zIndex: 900 }]}>
                          {(projects || []).map((proj) => (
                            <TouchableOpacity
                              key={proj.id}
                              style={styles.dropdownItem}
                              onPress={() => {
                                // only store/display name
                                handleInputChange('Project_Title', proj.name);
                                setProjectTitleOpen(false);
                              }}
                            >
                              <Text style={styles.dropdownItemText}>{proj.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                    </View>


                    {/* Status */}
                    <Text style={styles.fieldLabel}>Status</Text>
                    <View style={styles.statusPicker}>
                      {['Pending', 'In Progress', 'completed', 'Paused', 'In complete'].map((status) => (
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
                      {['Low', 'Medium', 'High'].map((pri) => (
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
            </View>
          </View>
        </View>

      </KeyboardAvoidingView>
      <HolidayAlert
        visible={showHolidayAlert}
        message={holidayAlertMessage}
        onConfirm={() => setShowHolidayAlert(false)}
      />
    </Modal >
  );
}

// ========== ADVANCED FILTER BAR ==========
const AdvancedFilterBar = ({ filterUser, setFilterUser, filterDept, setFilterDept,
  filterStatus, setFilterStatus, departments = [] }) => {
  const statuses = ['Pending', 'In Progress', 'Paused', 'Completed', 'In Complete'];

  return (
    <View style={styles.advancedFilterWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.advancedFilterScroll}
      >
        {/* User Search Input */}
        <View style={styles.filterItemSearch}>
          <Ionicons name="search" size={14} color={COLORS.textLight} />
          <TextInput
            style={styles.filterSearchInput}
            placeholder="Staff Name"
            placeholderTextColor={COLORS.textLight}
            value={filterUser}
            onChangeText={setFilterUser}
          />
          {filterUser !== '' && (
            <TouchableOpacity onPress={() => setFilterUser('')}>
              <Ionicons name="close-circle" size={14} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dept & Status Filter Chips */}
        <View style={styles.chipsSection}>
          <TouchableOpacity
            style={[styles.filterChip, filterDept === '' && styles.filterChipActive]}
            onPress={() => setFilterDept('')}
          >
            <Text style={[styles.filterChipText, filterDept === '' && styles.filterChipTextActive]}>All Depts</Text>
          </TouchableOpacity>
          {departments.map((dept, idx) => (
            <TouchableOpacity
              key={`dept-${idx}`}
              style={[styles.filterChip, filterDept === dept && styles.filterChipActive]}
              onPress={() => setFilterDept(dept)}
            >
              <Text style={[styles.filterChipText, filterDept === dept && styles.filterChipTextActive]}>{dept}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.chipDivider} />

          <TouchableOpacity
            style={[styles.filterChip, filterStatus === '' && styles.filterChipActive]}
            onPress={() => setFilterStatus('')}
          >
            <Text style={[styles.filterChipText, filterStatus === '' && styles.filterChipTextActive]}>All Status</Text>
          </TouchableOpacity>
          {statuses.map((status, idx) => (
            <TouchableOpacity
              key={`status-${idx}`}
              style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// ========== MAIN HOME SCREEN ==========

export default function HomePage({ user }) {
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
    deleteTask,

    // emit,
    // on,
    // off,
    // isConnected,
  } = useTaskManagement();
  const { on, off, isConnected } = useWebSocket();
  const tasks = allTasks || [];
  const { projects, projectsLoading } = useProjects();

  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [showChartMode, setShowChartMode] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const [shifts, setShifts] = useState([]);
  const [showTimeline, setShowTimeline] = useState(true);

  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [assignTaskModalVisible, setAssignTaskModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [filterPriority, setFilterPriority] = useState('');
  const [unplannedTasks, setUnplannedTasks] = useState([]);
  const [undoTimeoutId, setUndoTimeoutId] = useState(null);
  const [filterUser, setFilterUser] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [holidays, setHolidays] = useState([]);
  const [showHolidayAlert, setShowHolidayAlert] = useState(false);
  const [holidayAlertMessage, setHolidayAlertMessage] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const fetchHolidays = React.useCallback(async () => {
    try {
      // Backend route is /api/declare-holiday, which automatically filters by company_id in the controller
      const response = await api.get('/declare-holiday');
      if (response.data && Array.isArray(response.data)) {
        const holidayDates = response.data.map(h => {
          const d = new Date(h.holiday_date);
          return d.toISOString().split('T')[0];
        });
        setHolidays(holidayDates);
        console.log('✅ Holidays fetched:', holidayDates.length);
      }
    } catch (error) {
      console.error('Fetch holidays error:', error.message);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);


  const fetchShifts = React.useCallback(async () => {
    try {
      // Adjust API path to match your setup
      const response = await api.get('/shifts');
      const formatted = (response.data || []).map((shift) => ({
        id: shift.id,
        startTime: shift.shift_start,    // e.g., "09:00"
        endTime: shift.shift_end,        // e.g., "17:00"
        breaks: shift.shift_breaks || [],
      }));
      setShifts(formatted);
    } catch (error) {
      console.error('Fetch shifts error:', error);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // Listen for real-time shift updates
  useEffect(() => {
    if (!isConnected) return;

    const handleShiftUpdate = (data) => {
      console.log('🔄 Shift update received:', data);
      fetchShifts();
    };

    on('shift:created', handleShiftUpdate);
    on('shift:updated', handleShiftUpdate);
    on('shift:deleted', handleShiftUpdate);

    return () => {
      off('shift:created', handleShiftUpdate);
      off('shift:updated', handleShiftUpdate);
      off('shift:deleted', handleShiftUpdate);
    };
  }, [isConnected, on, off, fetchShifts]);

  const handleTaskDragEnd = async (taskId, newStartIso, newEndIso) => {
    try {
      // Prepare update payload matching your API
      const updateData = {
        start: newStartIso,
        end_time: newEndIso,
      };

      // Call your existing updateTask function
      await updateTask(taskId, updateData);

      // Update local state
      const updatedTasks = filteredTasks.map((t) =>
        t.id === taskId
          ? { ...t, startTime: newStartIso, endTime: newEndIso }
          : t
      );

      // Update your state (adjust based on your state management)
      // setFilteredTasks(updatedTasks);

      console.log('✅ Task rescheduled:', { taskId, newStartIso, newEndIso });
    } catch (error) {
      console.error('❌ Drag error:', error);
      Alert.alert('Error', 'Failed to reschedule task');
    }
  };


  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = decoded.exp - now;
          console.log(`Token expires in: ${Math.floor(timeLeft / 60)} minutes`);
          if (timeLeft < 0) {
            console.log('Token EXPIRED - need to log in again');
            await AsyncStorage.removeItem('authToken');
          }
        } catch (err) {
          console.error('Error decoding token:', err);
        }
      }
    };
    checkToken();
  }, []);

  // Fetch unplanned tasks
  // useEffect(() => {
  //   const loadUnplannedTasks = async () => {
  //     try {
  //       const data = await TaskService.getUnplannedTasks();
  //       setUnplannedTasks(data);
  //     } catch (error) {
  //       console.error('Error loading unplanned tasks:', error);
  //     }
  //   };

  //   loadUnplannedTasks();
  // }, []);

  // const tasksToDisplay = tabValue === 2 ? unplannedTasks : filteredTasks;

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
    // console.log('[HomePage] handleSaveTask called');
    // console.log('Task Data received:', taskData);

    try {
      // console.log(' Calling createTask...');
      const response = await createTask(taskData);
      // if (isConnected) emit('task:created', response)
      console.log(' Task created:', response);
      Alert.alert('Success', 'Task assigned successfully!');
      setAssignTaskModalVisible(false);
    } catch (error) {
      if (error.message === 'SESSION_EXPIRED') return;
      console.error(' createTask error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create task';
      Alert.alert('Error', errorMessage);
    }
  };

  // convert backend tasks to UI tasks for TaskCard
  const uiTasks = useMemo(() => {
    if (!Array.isArray(allTasks)) return [];

    return allTasks.map(t => {
      // Find full user info for searching
      const assignedUser = allUsers.find(u => u.id === t.assigned_to);

      return {
        id: t.id,
        employeeName: assignedUser ? (assignedUser.username || assignedUser.first_name) : (t.assigned_to_name || 'Unassigned'),
        firstName: assignedUser?.first_name || '',
        lastName: assignedUser?.last_name || '',
        username: assignedUser?.username || '',
        name: t.title,
        status: t.status === 'Pending' ? 'Pending' : t.status,
        Project_Title: t.project_title || t.Project_Title,
        priority: t.priority,
        duration_minutes: t.duration_minutes,
        department: t.department,
        description: t.description,
        startDate: t.start,
        endDate: t.end_time,
      }
    });
  }, [allTasks, allUsers]);

  //  Filter and Sort tasks
  const filteredTasks = useMemo(() => {
    const targetDateStart = new Date(selectedDate);
    const targetDateEnd = new Date(selectedDate);
    targetDateStart.setHours(0, 0, 0, 0);
    targetDateEnd.setHours(23, 59, 59, 999);

    const filtered = uiTasks.filter(task => {
      // Date filter - Logic Change: If task is "In Progress", show it even if it started in past
      const isRunning = (task.status || '').toLowerCase() === 'in progress';

      if (!task.startDate) return false;
      const taskDate = new Date(task.startDate);
      const inDateRange = taskDate >= targetDateStart && taskDate <= targetDateEnd;

      // Rule: Show if it's in the date range OR if it's currently running (so admin can see what's active)
      if (!inDateRange && !isRunning) return false;

      // User filter (search by username, first name, last name, or employee display name)
      if (filterUser) {
        const query = filterUser.toLowerCase();
        const match =
          (task.username || '').toLowerCase().includes(query) ||
          (task.firstName || '').toLowerCase().includes(query) ||
          (task.lastName || '').toLowerCase().includes(query) ||
          (task.employeeName || '').toLowerCase().includes(query);
        if (!match) return false;
      }

      // Department filter
      if (filterDept && task.name !== filterDept) return false;

      // Status filter
      if (filterStatus) {
        const tStatus = (task.status || '').toLowerCase();
        const fStatus = filterStatus.toLowerCase();
        if (tStatus !== fStatus) {
          // Special case for variations of In Progress
          if (fStatus === 'in progress' && tStatus === 'in progress') return true;
          return false;
        }
      }

      return true;
    });

    // Premium Sorting: Running tasks at TOP, then sort by startDate desc
    return [...filtered].sort((a, b) => {
      const aRunning = (a.status || '').toLowerCase() === 'in progress';
      const bRunning = (b.status || '').toLowerCase() === 'in progress';

      if (aRunning && !bRunning) return -1;
      if (!aRunning && bRunning) return 1;

      // Secondary sort: Newest first
      return new Date(b.startDate) - new Date(a.startDate);
    });
  }, [uiTasks, selectedDate, filterUser, filterDept, filterStatus]);

  //  In useEffect
  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  // const handleTaskPress = (task) => {
  //   setSelectedTask(task);
  //   setIsDetailVisible(true);
  // };
  const handleTaskPress = (task) => {
    // console.log('📋 Selected task data:', JSON.stringify(task, null, 2));
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
      // if (isConnected) emit
      console.log('task:updatedrrr', { id, ...data });
      await fetchAllTasks();
      setSelectedTask(null); // Close detail sheet too
      setIsDetailVisible(false);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') return;
      console.error('Update failed:', err);
    }
  };

  // if (isConnected) emit('task:deleted', id);
  const handleDeleteTask = (id) => {
    setTaskToDelete(id);
    setShowDeleteAlert(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete);
      setIsDetailVisible(false);
      await fetchAllTasks();
      setShowDeleteAlert(false);
      setTaskToDelete(null);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') return;
      console.error("Delete failed:", err);
    }
  };
  const { width } = useWindowDimensions();
  const isSmall = width < 360;
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.headerSpacer} />
      <FilterBar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        filteredTasks={filteredTasks}
        showTimeline={showTimeline}
        setShowTimeline={setShowTimeline}
        isSmall={isSmall}
      />

      <AdvancedFilterBar
        filterUser={filterUser} setFilterUser={setFilterUser}
        filterDept={filterDept} setFilterDept={setFilterDept}
        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
        departments={['Development', 'UI/UX', 'Infrastructure', 'QA Testing', 'Documentation']}
      />

      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={[styles.content, { paddingBottom: 0 }]}
          pointerEvents={isDetailVisible ? 'none' : 'auto'}
        >
          <View style={[styles.tasksSection, { flex: 1 }]}>

            <View style={styles.filterContainer}>
              <Text style={styles.sectionTitle}>Total Tasks ({filteredTasks.length})</Text>
              <TouchableOpacity
                style={styles.assignButton}
                onPress={handleAddTask}
              >
                <Octicons name="tasklist" size={16} color="#fff" />
                <Text style={styles.assignButtonText}>Assign a Task</Text>
              </TouchableOpacity>
            </View>

            {!showTimeline && (
              <>
                {loading ? (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                ) : Array.isArray(filteredTasks) && filteredTasks.length > 0 ? (
                  <FlatList
                    data={filteredTasks}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => (
                      <TaskCard
                        task={item}
                        onPress={() => handleTaskPress(item)}
                      />
                    )}
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                      paddingBottom: bottomPadding,
                      paddingHorizontal: 16,
                      paddingTop: 8
                    }}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    initialNumToRender={10}
                    windowSize={5}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="mail-open-outline" size={48} color={COLORS.textLight} />
                    <Text style={styles.emptyText}>No tasks for today</Text>
                  </View>
                )}
              </>
            )}

            {/* Timeline Bar Chart VIEW */}
            {showTimeline && (
              <HomeTimeline
                tasks={filteredTasks}
                shifts={shifts}
                selectedDate={selectedDate}
                onTaskDragEnd={handleTaskDragEnd}
                onTaskPress={(task) => handleTaskPress(task)}
                holidays={holidays}
              />
            )}

          </View>
        </View>
      </View>

      {/* ONLY THESE THREE MODALS */}
      <AssignTaskModal
        visible={assignTaskModalVisible}
        onClose={() => setAssignTaskModalVisible(false)}
        onSave={handleSaveTask}
        allUsers={allUsers}
        projects={projects}
        holidays={holidays}
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
        projects={projects}
        holidays={holidays}
      />

      <HolidayAlert
        visible={showHolidayAlert}
        message={holidayAlertMessage}
        onConfirm={() => setShowHolidayAlert(false)}
      />

      <StyledConfirmAlert
        visible={showDeleteAlert}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDeleteTask}
        onCancel={() => {
          setShowDeleteAlert(false);
          setTaskToDelete(null);
        }}
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
    paddingTop: isTablet ? 40 : 45,
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
    // marginBottom: 20,
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
    // marginBottom: 8,
  },
  employeeNameCenter: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },

  // ========== STATUS STYLES ==========
  // statusBadgenf: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   backgroundColor: 'rgba(255, 255, 255, 0.25)',
  //   paddingHorizontal: 12,
  //   paddingVertical: 6,
  //   borderRadius: 20,
  //   gap: 6,
  //   alignSelf: 'flex-start',
  // },
  // statusDotnf: {
  //   width: 8,
  //   height: 8,
  //   borderRadius: 4,
  //   backgroundColor: COLORS.success,
  //   marginRight: 6,
  // },
  // statusTextnf: {
  //   fontSize: 12,
  //   fontWeight: '600',
  //   color: '#fff',
  // },
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
  // statsOverviewCard: {
  //   backgroundColor: 'rgba(255, 255, 255, 0.95)',
  //   borderRadius: 20,
  //   padding: isTablet ? 24 : 20,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 10 },
  //   shadowOpacity: 0.15,
  //   shadowRadius: 20,
  //   elevation: 10,
  // },
  // statsTitle: {
  //   fontSize: isTablet ? 20 : 18,
  //   fontWeight: '700',
  //   color: COLORS.text,
  //   textAlign: 'center',
  //   marginBottom: 5,
  // },
  // statsContainer: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  // },
  // overviewRow: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  // },
  // overviewItem: {
  //   flex: 1,
  //   alignItems: 'center',
  // },
  // overviewValue: {
  //   fontSize: isTablet ? 28 : 24,
  //   fontWeight: '800',
  //   color: COLORS.text,
  //   marginBottom: 4,
  // },
  // overviewLabel: {
  //   fontSize: isTablet ? 13 : 12,
  //   color: COLORS.textLight,
  //   fontWeight: '500',
  // },
  // overviewDivider: {
  //   width: 1,
  //   height: 40,
  //   backgroundColor: COLORS.border,
  // },

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
    // marginBottom: 16,
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
  dateRangeButtonSmall: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  dateRangeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateRangeTextSmall: {
    fontSize: 10,
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
    paddingTop: 2,
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
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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



  // ========== CUTE CARD STYLES ==========
  cuteCard: {
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 0,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },

  // 🌸 Left section with priority
  leftSection: {
    alignItems: 'center',
    gap: 6,
  },
  priorityCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  priorityEmoji: {
    fontSize: 24,
  },
  priorityLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // 📋 Middle section with task info
  middleSection: {
    flex: 1,
    gap: 6,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cuteImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#14f500ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#18f818ff',
  },
  cuteImageEmoji: {
    fontSize: 16,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  projectText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  employeeEmoji: {
    fontSize: 14,
  },
  employeeName: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '600',
  },

  // ✅ Right section with status
  rightSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusEmoji: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  forwardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // ✨ Decorative elements
  decorativeDots: {
    position: 'absolute',
    bottom: 8,
    right: 16,
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },

  taskImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFB6C1',
  },

  // Mini priority badge - cute & compact
  miniPriorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8, // space after name
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  miniPriorityEmoji: {
    fontSize: 14,
  },
  miniPriorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // VIEW MODE TOGGLES
  viewModeToggle: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    gap: 6,
  },
  viewToggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  viewToggleTextActive: {
    color: '#fff',
  },

  // Advanced Filter Bar Styles
  advancedFilterWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  advancedFilterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
  },
  filterItemSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40,
    minWidth: 160,
    marginRight: 10,
    gap: 8,
  },
  filterSearchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    paddingVertical: 0,
  },
  chipsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  // Dropdown Search
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#F8FAFC',
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    paddingVertical: 4,
  },
});