import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import api from '../../api/client';
import TaskService from './services/TaskService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { allocateWorkingHours } from '../../utils/Scheduling';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#0099FF',
  secondary: '#00D4FF',
  text: '#0F172A',
  textLight: '#64748B',
  border: '#E2E8F0',
  cardBg: '#FFFFFF',
  background: '#F8FAFC',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B'
};

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 153, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // black labels
  style: {
    borderRadius: 16
  },
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#0099FF"
  }
};

export default function GraphPage({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0=Planned, 1=Unplanned
  const [projects, setProjects] = useState([]);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [unplannedTasks, setUnplannedTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [holidays, setHolidays] = useState([]);

  // Assign Modal State
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedUnplannedTask, setSelectedUnplannedTask] = useState(null);
  const [assignFormData, setAssignFormData] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState('start'); // 'start' or 'end'

  // Fetch Data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [allTasksRes, unplannedRes, userRes, projRes, shiftRes, holidayRes] = await Promise.all([
        TaskService.getAllTasks(),
        TaskService.getUnplannedTasks().catch(() => []), // Fail safe
        api.get('/users'),
        api.get('/projects'),
        api.get('/shifts'),
        api.get('/declare-holiday')
      ]);

      const tasksData = Array.isArray(allTasksRes) ? allTasksRes : (allTasksRes.data || []);
      const unplannedData = Array.isArray(unplannedRes) ? unplannedRes : (unplannedRes.data || []);
      const usersData = userRes.data || [];
      const projectsData = projRes.data || [];
      const shiftsData = shiftRes.data || [];
      const holidaysData = holidayRes.data || [];

      setTasks(tasksData);
      setUnplannedTasks(unplannedData);
      setUsers(usersData);
      setShifts(shiftsData);
      setHolidays(holidaysData);

      // Extract Project Names unique
      const projNames = projectsData.map(p => p.name || p.project_name);
      // Also check tasks for project titles not in list
      const taskProjects = [...tasksData, ...unplannedData].map(t => t.project_title || t.Project_Title).filter(Boolean);
      const allProj = [...new Set([...projNames, ...taskProjects])];
      if (!allProj.includes('Other')) allProj.push('Other');

      setProjects(allProj.sort());

    } catch (error) {
      console.error("Fetch Data Error:", error);
      Alert.alert('Error', 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Tasks for Graph & List (Planned)
  const filteredTasks = useMemo(() => {
    if (projects.length === 0) return [];
    const currentProject = projects[selectedProjectIndex];
    return tasks.filter(t => {
      const pTitle = t.project_title || t.Project_Title || (t.project ? t.project.name : 'Other');
      return pTitle === currentProject;
    });
  }, [tasks, projects, selectedProjectIndex]);

  // Graph Data Processing
  const graphData = useMemo(() => {
    if (filteredTasks.length === 0) return null;

    // Group by Date for simplicity (Last 7 days logic)
    // Map: 'Mon', 'Tue' etc or Date string
    const grouped = {};
    const today = new Date();

    // Initialize last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      last7Days.push(label);
      grouped[label] = { assigned: 0, actual: 0 };
    }

    filteredTasks.forEach(t => {
      // Find which date bucket this task falls into. 
      // Using end_time or createdAt
      const dateObj = new Date(t.end_time || t.start || t.createdAt);
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (grouped[label]) {
        // Assigned: duration_minutes / 60
        grouped[label].assigned += (t.duration_minutes || 0) / 60;
        // Actual: elapsed_seconds / 3600
        grouped[label].actual += (t.elapsed_seconds || 0) / 3600;
      }
    });

    const assignedData = last7Days.map(l => grouped[l].assigned);
    const actualData = last7Days.map(l => grouped[l].actual);

    // Formula: (Assigned / Actual) * 100.
    const efficiencyData = last7Days.map(l => {
      const d = grouped[l];
      if (d.actual === 0) return d.assigned > 0 ? 100 : 0; // If no actual time logged but assigned exists, assume 100% or 0%? is 0 😅
      // Cap at 100 or allowed? so allow > 100
      return (d.assigned / d.actual) * 100;
    });

    return {
      labels: last7Days,
      datasets: [
        { data: assignedData }, // Assigned (Primary colourr)
        { data: actualData }    // Actual (Red/Danger)
      ],
      efficiency: {
        labels: last7Days,
        datasets: [{ data: efficiencyData }]
      }
    };

  }, [filteredTasks]);

  // --- Actions ---

  const handleAssignUnplanned = (task) => {
    setSelectedUnplannedTask(task);
    setAssignFormData({
      title: task.description ? task.description.substring(0, 30) : 'New Task',
      description: task.description,
      project_title: task.project_title,
      priority: 'Medium',
      assigned_to: '',
      duration: task.duration_minutes ? (task.duration_minutes / 60).toFixed(2) : '1.00',
      start: new Date(),
      end: new Date(new Date().getTime() + 60 * 60 * 1000)
    });
    setAssignModalVisible(true);
  };

  const calculateAutoSchedule = (userId) => {
    // Logic from TaskDetails.js: allocateWorkingHours
    // 1. Find User's Shift
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const shift = shifts[0]; // Simplification
    if (!shift) {
      Alert.alert('Warning', 'No shift configuration found for calculation.');
      return;
    }
    const now = new Date();
    // Round to next 15
    const remainder = 15 - (now.getMinutes() % 15);
    now.setMinutes(now.getMinutes() + remainder);
    now.setSeconds(0);

    const durationMins = parseFloat(assignFormData.duration || 60) * 60;
    // Pre-fill Start = Now, End = Now + Duration
    const end = new Date(now.getTime() + durationMins * 60000);
    setAssignFormData(prev => ({ ...prev, start: now, end: end, assigned_to: userId }));
  };

  const submitAssignment = async () => {
    if (!assignFormData.assigned_to) {
      Alert.alert("Error", "Please select a user");
      return;
    }

    try {
      setLoading(true);
      // Create Task (Planned)
      const payload = {
        title: assignFormData.title,
        taskDescription: assignFormData.description,
        projectTitle: assignFormData.project_title,
        priority: assignFormData.priority,
        assignUserId: assignFormData.assigned_to,
        startTime: assignFormData.start.toISOString(),
        endTime: assignFormData.end.toISOString(),
        duration: assignFormData.duration
      };

      await TaskService.createTask(payload);

      // Delete Unplanned Task
      if (selectedUnplannedTask && selectedUnplannedTask.id) {
        await TaskService.deleteUnplannedTask(selectedUnplannedTask.id);
      }

      Alert.alert("Success", "Task assigned successfully!");
      setAssignModalVisible(false);
      fetchInitialData(); // Refresh

    } catch (error) {
      Alert.alert("Error", "Failed to assign task");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  const renderFilteredItem = ({ item }) => (
    <TouchableOpacity style={styles.taskRow} activeOpacity={0.8}>
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle} numberOfLines={1}>{item.title || item.description}</Text>
        <Text style={styles.taskDesc} >{item.description ||  'no description'}</Text>
        <Text style={styles.taskSub}>
          {(item.AssignedTo && (item.AssignedTo.username || item.AssignedTo.first_name)) || 'Unassigned'} • {new Date(item.start || item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.taskMeta}>
        <View style={[styles.badge, styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
        <Text style={styles.taskMetrics}>
          Assigned: {(item.duration_minutes / 60).toFixed(1)}h | Actual: {((item.elapsed_seconds || 0) / 3600).toFixed(1)}h
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderUnplannedItem = ({ item }) => (
    <View style={styles.taskRow}>
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.taskSub}>{item.project_title} • Priority: {item.priority}</Text>
      </View>
      <TouchableOpacity
        style={styles.assignBtn}
        onPress={() => handleAssignUnplanned(item)}
      >
        <LinearGradient
          colors={['#0099FF', '#00D4FF']}
          style={{ borderRadius: 8, padding: 8 }}
        >
          <Text style={styles.assignBtnText}>Assign</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed': return COLORS.success;
      case 'in progress': return COLORS.warning;
      case 'pending': return COLORS.primary;
      default: return COLORS.textLight;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#00D4FF', '#0099FF', '#667EEA']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Analysis & Planner</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {/* Main Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 0 && styles.activeTab]} onPress={() => setActiveTab(0)}>
          <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>Planned Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 1 && styles.activeTab]} onPress={() => setActiveTab(1)}>
          <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>Unplanned Tasks</Text>
        </TouchableOpacity>
      </View>

      {/* Project Filter */}
      <View style={styles.projectTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {projects.map((proj, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.projectTab, selectedProjectIndex === idx && styles.activeProjectTab]}
              onPress={() => setSelectedProjectIndex(idx)}
            >
              <Text style={[styles.projectTabText, selectedProjectIndex === idx && styles.activeProjectTabText]}>{proj}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />}

        {!loading && activeTab === 0 && (
          <>
            {/* Charts Section */}
            {graphData ? (
              <View style={styles.graphContainer}>
                <Text style={styles.sectionTitle}>Performance Overview</Text>

                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Assigned (Blue) vs Actual (Red)</Text>
                  <LineChart
                    data={{
                      labels: graphData.labels,
                      datasets: [
                        { data: graphData.datasets[0].data, color: (opacity = 1) => `rgba(0, 153, 255, ${opacity})` },
                        { data: graphData.datasets[1].data, color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})` }
                      ]
                    }}
                    width={width - 40}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chartStyle}
                  />
                </View>

                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Efficiency %</Text>
                  <BarChart
                    data={graphData.efficiency}
                    width={width - 40}
                    height={220}
                    chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})` }}
                    style={styles.chartStyle}
                    showValuesOnTopOfBars
                  />
                </View>
              </View>
            ) : (
              <Text style={styles.emptyText}>No data available for this project.</Text>
            )}

            <Text style={styles.sectionTitle}>Task List</Text>
            {filteredTasks.map((t, i) => (
              <View key={i}>{renderFilteredItem({ item: t })}</View>
            ))}
            {filteredTasks.length === 0 && <Text style={styles.emptyText}>No tasks found.</Text>}
          </>
        )}

        {!loading && activeTab === 1 && (
          <>
            <Text style={styles.sectionTitle}>Unplanned Items</Text>
            {unplannedTasks
              .filter(t => t.project_title === projects[selectedProjectIndex])
              .map((t, i) => <View key={i}>{renderUnplannedItem({ item: t })}</View>)
            }
            {unplannedTasks.length === 0 && <Text style={styles.emptyText}>No unplanned items to assign.</Text>}
          </>
        )}
      </ScrollView>

      {/* Assign Modal */}
      <Modal visible={assignModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Task</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Title</Text>
              <TextInput style={styles.input} value={assignFormData.title} onChangeText={t => setAssignFormData({ ...assignFormData, title: t })} />

              <Text style={styles.label}>Assign To (Auto-Schedule)</Text>
              <View style={styles.userList}>
                {users.map(u => (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.userChip, assignFormData.assigned_to === u.id && styles.activeUserChip]}
                    onPress={() => calculateAutoSchedule(u.id)}
                  >
                    <Text style={[styles.userChipText, assignFormData.assigned_to === u.id && styles.activeUserChipText]}>
                      {u.username}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 0.48 }}>
                  <Text style={styles.label}>Start</Text>
                  <TouchableOpacity onPress={() => { setDatePickerField('start'); setShowDatePicker(true) }} style={styles.dateBtn}>
                    <Text>{assignFormData.start ? new Date(assignFormData.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 0.48 }}>
                  <Text style={styles.label}>End</Text>
                  <TouchableOpacity onPress={() => { setDatePickerField('end'); setShowDatePicker(true) }} style={styles.dateBtn}>
                    <Text>{assignFormData.end ? new Date(assignFormData.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)} style={styles.cancelBtn}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={submitAssignment} style={styles.submitBtn}><Text style={styles.submitBtnText}>Confirm Assignment</Text></TouchableOpacity>
            </View>
          </View>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={assignFormData[datePickerField] ? new Date(assignFormData[datePickerField]) : new Date()}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={(e, date) => {
              setShowDatePicker(false);
              if (date) setAssignFormData({ ...assignFormData, [datePickerField]: date });
            }}
          />
        )}
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 45, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  backBtn: { padding: 5 },
  content: { padding: 20, paddingBottom: 100 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { fontWeight: '600', color: COLORS.textLight },
  activeTabText: { color: COLORS.primary, fontWeight: 'bold' },
  projectTabsContainer: { paddingVertical: 12, backgroundColor: '#f1f5f9' },
  projectTab: { paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  activeProjectTab: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  projectTabText: { color: COLORS.textLight, fontSize: 13 },
  activeProjectTabText: { color: '#fff', fontWeight: '600' },
  graphContainer: { marginBottom: 20 },
  chartCard: { backgroundColor: '#fff', borderRadius: 16, padding: 10, marginBottom: 15, elevation: 1 },
  chartTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10, textAlign: 'center', color: COLORS.text },
  chartStyle: { borderRadius: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: COLORS.text },
  taskRow: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  taskInfo: { flex: 1 },
  taskTitle: { fontWeight: '600', color: COLORS.text, fontSize: 15, marginBottom: 4 },
  taskDesc: { fontWeight: '450', color: COLORS.textLight, fontSize: 14, marginBottom: 8, lineHeight: 25 },
  taskSub: { color: COLORS.textLight, fontSize: 12 },
  taskMeta: { alignItems: 'flex-end' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  taskMetrics: { fontSize: 11, color: COLORS.textLight },
  assignBtn: { marginLeft: 10 },
  assignBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 13, color: COLORS.textLight, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14, color: COLORS.text },
  dateBtn: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, alignItems: 'center' },
  userList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, maxHeight: 150 },
  userChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  activeUserChip: { backgroundColor: '#e0f2fe', borderColor: COLORS.primary },
  userChipText: { fontSize: 12, color: COLORS.text },
  activeUserChipText: { color: COLORS.primary, fontWeight: 'bold' },
  modalBtns: { flexDirection: 'row', marginTop: 30, gap: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  cancelBtnText: { color: COLORS.textLight, fontWeight: '600' },
  submitBtnText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: COLORS.textLight, marginTop: 30 }
});
