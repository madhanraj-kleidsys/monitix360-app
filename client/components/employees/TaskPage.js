import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Alert, ActivityIndicator, Text, Platform } from 'react-native';
import ApiService from '../../services/ApiService';
import { useWebSocket } from '../admin/hooks/useWebSocket';
import TaskItem from './TaskItem';
import ReasonModal from './ReasonModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestNotificationPermissions,
  scheduleLocalNotification,
  scheduleTaskReminder,
  scheduleActiveTaskReminder,
  cancelNotification,
  cancelAllTaskNotifications
} from '../../services/NotificationService';

const COLORS = {
  background: '#F8FAFC',
  primary: '#1E5A8E',
  text: '#1E293B',
};

export default function TaskPage({ user, ListHeaderComponent }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [breakWindows, setBreakWindows] = useState([]);
  const [pausedByBreakTasks, setPausedByBreakTasks] = useState({});
  const allowRunDuringBreakRef = useRef({});
  const tasksRef = useRef([]);
  const remindersRef = useRef({});

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [pendingTask, setPendingTask] = useState(null);
  const [conflictTask, setConflictTask] = useState(null);

  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const loadShiftBreaks = useCallback(async () => {
    try {
      const { data } = await ApiService.getShiftBreaks();
      // Flatten breaks from all shifts
      const allBreaks = [];
      if (Array.isArray(data)) {
        data.forEach(shift => {
          // Use shift_breaks as per Sequelize association
          const bks = shift.shift_breaks || shift.breaks || [];
          if (Array.isArray(bks)) {
            bks.forEach(b => {
              allBreaks.push({
                start: normalizeTime(b.break_start),
                end: normalizeTime(b.break_end),
                type: b.break_type || 'Break'
              });
            });
          }
        });
      }
      setBreakWindows(allBreaks);
    } catch (err) {
      console.error("Failed to load shift breaks:", err);
    }
  }, []);

  const normalizeTime = (t) => {
    if (!t) return t;
    if (t.length === 8) return t;
    if (t.length === 5) return `${t}:00`;
    return t;
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getMyTasks();
      const filtered = (res.data || []).filter(task => {
        if (task.added_by_user === false) return true;
        return task.approval_status === "approved";
      });
      setTasks(filtered);

      const persisted = await AsyncStorage.getItem('pausedByBreakTasks');
      if (persisted) {
        setPausedByBreakTasks(JSON.parse(persisted));
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    loadShiftBreaks();
    requestNotificationPermissions().catch(console.error);
  }, [loadShiftBreaks]);

  useEffect(() => {
    if (!breakWindows.length) return;

    const checkBreaks = async () => {
      const now = new Date();
      const current = now.toTimeString().substring(0, 8);
      const activeBreak = breakWindows.find(b => b.start <= current && b.end >= current);
      const currentTasks = tasksRef.current;

      let updatedPausedByBreak = { ...pausedByBreakTasks };
      let tasksChanged = false;

      for (const task of currentTasks) {
        const isRunning = task.task_start && task.timer_start;
        const wasPausedByBreak = pausedByBreakTasks[task.id];
        const isAllowedDuringBreak = allowRunDuringBreakRef.current[task.id];

        if (activeBreak && isRunning && !isAllowedDuringBreak) {
          try {
            await ApiService.submitReason(task.id, "pause_reason", {
              reason: `${activeBreak.type} - Auto Paused`,
            });
            await executePause(task);
            updatedPausedByBreak[task.id] = true;
            tasksChanged = true;
          } catch (err) { console.error("Auto pause API failed", err); }
        }

        if (!activeBreak && wasPausedByBreak) {
          try {
            await executeStart(task);
            delete updatedPausedByBreak[task.id];
            allowRunDuringBreakRef.current[task.id] = false;
            tasksChanged = true;
          } catch (err) { console.error("Auto resume API failed", err); }
        }
      }

      if (tasksChanged) {
        setPausedByBreakTasks(updatedPausedByBreak);
        AsyncStorage.setItem('pausedByBreakTasks', JSON.stringify(updatedPausedByBreak));
      }
    };

    const interval = setInterval(checkBreaks, 10000);
    return () => clearInterval(interval);
  }, [breakWindows, pausedByBreakTasks]);

  useEffect(() => {
    if (socket && isConnected && user?.id) {
      socket.emit("joinRoom", `user_${user.id}`);

      const onTaskAssigned = async (task) => {
        if (String(task.assigned_to) !== String(user.id)) return;
        setTasks(prev => {
          if (prev.find(t => t.id === task.id)) return prev;
          return [task, ...prev];
        });

        try {
          await scheduleLocalNotification(
            `Hey ${user.username || 'there'} 👋🏻`,
            `New Task Assigned: ${task.project_title || task.title}`,
            { taskId: task.id, type: 'assignment' },
            5
          );
        } catch (notifErr) { console.error(notifErr); }

        try {
          const reminderId = await scheduleTaskReminder(user, task.id, task.project_title || task.title, 180);
          remindersRef.current[task.id] = reminderId;
        } catch (err) { console.error(err); }
      };

      const onTaskUpdated = async (task) => {
        if (String(task.assigned_to) !== String(user.id)) return;
        setTasks(prev => prev.map(t => (t.id === task.id ? task : t)));
      };

      const onTaskDeleted = (taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        cancelAllTaskNotifications(taskId).catch(console.error);
      };

      socket.on("task:created", onTaskAssigned);
      socket.on("task:updated", onTaskUpdated);
      socket.on("task:deleted", onTaskDeleted);

      // Listen for shift updates to refresh break windows
      socket.on("shift:created", loadShiftBreaks);
      socket.on("shift:updated", loadShiftBreaks);
      socket.on("shift:deleted", loadShiftBreaks);

      return () => {
        socket.off("task:created", onTaskAssigned);
        socket.off("task:updated", onTaskUpdated);
        socket.off("task:deleted", onTaskDeleted);
        socket.off("shift:created", loadShiftBreaks);
        socket.off("shift:updated", loadShiftBreaks);
        socket.off("shift:deleted", loadShiftBreaks);
      };
    }
  }, [socket, isConnected, user?.id]);

  const handleStartRequest = useCallback(async (task) => {
    const running = tasksRef.current.find(t => t.task_start && t.id !== task.id);
    if (running) {
      Alert.alert(
        "Conflict",
        `Task "${running.title || running.project_title}" is already running.`,
        [
          { text: "Pause & Start New", onPress: () => handleConflictAction(task, running, 'pause') },
          { text: "Stop & Start New", onPress: () => handleConflictAction(task, running, 'stop') },
          { text: "Cancel", style: 'cancel' }
        ]
      );
      return;
    }
    // Allow manual run even during breaks
    allowRunDuringBreakRef.current[task.id] = true;
    await executeStart(task);
  }, [executeStart, handleConflictAction]);

  const executeStart = useCallback(async (task) => {
    try {
      const now = new Date().toISOString();
      await ApiService.recordStartTask({ task_id: task.id, type: 1, time_logged: now });
      // update status in db
      await ApiService.markTaskInProgress(task.id);

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'In Progress', task_start: true, timer_start: now } : t));
      await scheduleActiveTaskReminder(user, task.id, task.project_title || task.title);
    } catch (err) { console.error(err); }
  }, [user]);

  const executePause = useCallback(async (task) => {
    if (!task.timer_start) return;
    const now = new Date();
    const start = new Date(task.timer_start);
    const sessionElapsed = Math.floor((now - start) / 1000);
    const totalElapsed = (task.elapsed_seconds || 0) + sessionElapsed;

    try {
      await ApiService.updateTaskTimer(task.id, { task_start: false, timer_start: null, elapsed_seconds: totalElapsed });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Paused', task_start: false, timer_start: null, elapsed_seconds: totalElapsed } : t));
      await cancelAllTaskNotifications(task.id);

      // Reset break override flag
      if (allowRunDuringBreakRef.current[task.id]) {
        allowRunDuringBreakRef.current[task.id] = false;
      }
    } catch (err) { console.error("Pause failed", err); }
  }, []);

  const executeStop = useCallback(async (task) => {
    await executePause(task);
    try {
      await ApiService.recordStopTask({ task_id: task.id, type: 2, time_logged: new Date().toISOString() });
    } catch (err) { console.error("Stop record failed", err); }
  }, [executePause]);

  const handlePauseRequest = useCallback((task) => {
    setPendingTask(task);
    setModalType('pause');
    setModalVisible(true);
  }, []);

  const handleStopRequest = useCallback((task) => {
    setPendingTask(task);
    setModalType('stop');
    setModalVisible(true);
  }, []);

  const handleConflictAction = useCallback(async (newTask, runningTask, action) => {
    if (action === 'pause') { setPendingTask(newTask); setConflictTask(runningTask); setModalType('conflictPause'); setModalVisible(true); }
    else if (action === 'stop') { setPendingTask(newTask); setConflictTask(runningTask); setModalType('conflictStop'); setModalVisible(true); }
  }, []);

  const onSaveReason = async (reason, status) => {
    setModalVisible(false);
    if (!pendingTask) return;
    const task = pendingTask;
    try {
      await ApiService.submitReason(task.id, modalType + "_reason", { reason });
      if (modalType === 'conflictPause' && conflictTask) {
        await executePause(conflictTask);
        await executeStart(task);
      }
      else if (modalType === 'conflictStop' && conflictTask) {
        await executeStop(conflictTask);
        await executeStart(task);
      }
      else if (modalType === 'pause') {
        await executePause(task);
      }
      else if (modalType === 'stop') {
        await executeStop(task);
        // Use the status passed from modal (Completed/Incomplete)
        const finalStatus = status || 'Completed';
        await ApiService.partialUpdateTask(task.id, { status: finalStatus });
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: finalStatus } : t));
      }
    } catch (err) { console.error(err); }
    finally { setPendingTask(null); setConflictTask(null); }
  };

  const handleStatusChange = useCallback(async (task, newStatus) => {
    try {
      if (newStatus === 'In Progress') await handleStartRequest(task);
      else if (newStatus === 'Completed' || newStatus === 'Incomplete') await handleStopRequest(task);
      else {
        await ApiService.partialUpdateTask(task.id, { status: newStatus });
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      }
    } catch (err) { console.error(err); }
  }, [handleStartRequest, handleStopRequest]);

  const renderItem = useCallback(({ item }) => (
    <TaskItem
      task={item}
      onStart={handleStartRequest}
      onPause={handlePauseRequest}
      onStop={handleStopRequest}
      onStatusChange={handleStatusChange}
    />
  ), [handleStartRequest, handlePauseRequest, handleStopRequest, handleStatusChange]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={ListHeaderComponent}
          renderItem={renderItem}
          removeClippedSubviews={Platform.OS === 'android'}
          maxToRenderPerBatch={5}
          windowSize={3}
          initialNumToRender={5}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
      <ReasonModal visible={modalVisible} type={modalType} onClose={() => setModalVisible(false)} onSave={onSaveReason} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});