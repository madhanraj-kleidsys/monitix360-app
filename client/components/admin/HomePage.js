import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';
import * as MediaLibrary from 'expo-media-library';
import XLSX from 'xlsx';

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

const employeesData = [
  {
    id: 1,
    name: "Rajesh Kumar",
    tasks: [
      {
        id: 101,
        name: "Complete UI Design for Dashboard",
        status: "In Progress",
        project: "Admin Portal",
        description: "Design the admin dashboard UI with glassomorphic style components",
        startDate: "2025-11-25T09:00:00",
        endDate: "2025-11-29T17:00:00"
      },
      {
        id: 102,
        name: "API Integration Testing",
        status: "Completed",
        project: "Mobile App Backend",
        description: "Test all API endpoints with Postman",
        startDate: "2025-11-24T10:00:00",
        endDate: "2025-11-28T16:00:00"
      },
      {
        id: 103,
        name: "Database Optimization",
        status: "Pending",
        project: "Performance Enhancement",
        description: "Optimize database queries for faster response times",
        startDate: "2025-11-30T09:00:00",
        endDate: "2025-12-02T17:00:00"
      }
    ]
  },
  {
    id: 2,
    name: "Priya Sharma",
    tasks: [
      {
        id: 201,
        name: "Frontend Components Development",
        status: "In Progress",
        project: "Admin Portal",
        description: "Develop reusable React components for dashboard",
        startDate: "2025-11-26T08:30:00",
        endDate: "2025-11-29T18:00:00"
      },
      {
        id: 202,
        name: "Bug Fixes - Mobile App",
        status: "Incomplete",
        project: "Mobile App",
        description: "Fix reported bugs in iOS and Android versions",
        startDate: "2025-11-28T09:00:00",
        endDate: "2025-12-01T17:00:00"
      }
    ]
  },
  {
    id: 3,
    name: "Amit Patel",
    tasks: [
      {
        id: 301,
        name: "Server Setup and Configuration",
        status: "Completed",
        project: "Infrastructure",
        description: "Setup production servers on AWS",
        startDate: "2025-11-20T10:00:00",
        endDate: "2025-11-27T16:00:00"
      },
      {
        id: 302,
        name: "Security Audit Report",
        status: "Paused",
        project: "Security",
        description: "Conduct comprehensive security audit of the system",
        startDate: "2025-11-25T09:00:00",
        endDate: "2025-12-05T17:00:00"
      },
      {
        id: 303,
        name: "Documentation Update",
        status: "Pending",
        project: "Documentation",
        description: "Update API documentation with new endpoints",
        startDate: "2025-11-29T10:00:00",
        endDate: "2025-12-03T17:00:00"
      }
    ]
  },
  {
    id: 4,
    name: "Neha Singh",
    tasks: [
      {
        id: 401,
        name: "User Experience Testing and Feedback Collection",
        status: "In Progress",
        project: "Admin Portal",
        description: "Test user experience and collect feedback from stakeholders",
        startDate: "2025-11-27T09:00:00",
        endDate: "2025-11-29T17:00:00"
      },
      {
        id: 402,
        name: "Mobile App Testing",
        status: "Completed",
        project: "Mobile App",
        description: "Perform QA testing on both iOS and Android",
        startDate: "2025-11-23T08:00:00",
        endDate: "2025-11-28T18:00:00"
      }
    ]
  }
];

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
      alert('❌ No tasks to export for the selected date range');
      return;
    }

    const fileName = `Employee_Tasks_${formatDateRange(dateRange)}.xlsx`;

    // Show loading notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Exporting Tasks',
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
          title: '❌ Permission Denied',
          body: 'Storage permission is required to export files',
          sound: 'default',
        },
        trigger: null,
      });
      alert('❌ Storage permission denied. Cannot save file.');
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
        title: '✅ Export Successful',
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
        title: '❌ Export Failed',
        body: error.message || 'Something went wrong',
        sound: 'default',
      },
      trigger: null,
    });

    alert('❌ Export Failed:\n' + error.message);
  }
};

// ========== HEADER COMPONENT ==========
function Header() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! 👋';
    if (hour < 18) return 'Good Afternoon! 👋';
    return 'Good Evening! 👋';
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
function TaskCard({ task, onPress }) {
  const statusColor = STATUS_COLORS[task.status] || COLORS.textLight;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        <View style={styles.employeeSection}>
          <Text style={styles.employeeName}>{task.employeeName}</Text>
        </View>

        <View style={styles.taskSection}>
          <Text style={styles.taskName}>{truncateText(task.name, 25)}</Text>
        </View>

        <View style={styles.statusSection}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{task.status}</Text>
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

// ========== MAIN HOME SCREEN ==========
export default function HomePage() {
  const insets = useSafeAreaInsets();
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  // ===== RESPONSIVE CALCULATIONS =====
  const bottomPadding = useMemo(() => {
    // Dock height is approximately 80-100px
    // Add extra buffer based on device type
    if (isTablet) {
      return insets.bottom + 150;
    }
    return insets.bottom + 100;
  }, [insets.bottom]);

  const getModalHeight = useMemo(() => {
    const reservedSpace = insets.top + insets.bottom + 60;
    return height - reservedSpace;
  }, [insets.top, insets.bottom]);

  const filteredTasks = useMemo(() => {
    const allTasks = [];
    
    employeesData.forEach(employee => {
      employee.tasks.forEach(task => {
        const taskDate = new Date(task.startDate);
        const startDate = new Date(selectedDateRange.start);
        const endDate = new Date(selectedDateRange.end);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        if (taskDate >= startDate && taskDate <= endDate) {
          allTasks.push({
            ...task,
            employeeName: employee.name,
            employeeId: employee.id,
          });
        }
      });
    });
    
    return allTasks;
  }, [selectedDateRange]);

  const handleTaskPress = (task) => {
    setSelectedTask(task);
    setModalVisible(true);
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
            <Text style={styles.sectionTitle}>Employee Tasks</Text>
            
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => (
                <TaskCard
                  key={`${task.employeeId}-${task.id}`}
                  task={task}
                  onPress={() => handleTaskPress(task)}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="mail-open-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No tasks found for selected date range</Text>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    gap: 6,
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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