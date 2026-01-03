import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Alert, ActivityIndicator, Text, Platform, AppState } from 'react-native';
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

    // AppState listener for sticky notifications
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'background') {
        // App went to background: Schedule sticky notification if task is running
        const runningTask = tasksRef.current.find(t => t.task_start && t.timer_start);
        if (runningTask) {
          await scheduleActiveTaskReminder(user, runningTask.id, runningTask.project_title || runningTask.title);
        }
      } else if (nextAppState === 'active') {
        // App came to foreground: Cancel all sticky notifications
        // We iterate potentially or just cancel all known active ones. 
        // For now, cancel all for the running task if we know it, or just generic cancel.
        const runningTask = tasksRef.current.find(t => t.task_start && t.timer_start);
        if (runningTask) {
          await cancelAllTaskNotifications(runningTask.id);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadShiftBreaks]);

  useEffect(() => {
    if (!breakWindows.length) return;

    const checkBreaks = async () => {
      if (!breakWindows.length) return;
      const now = new Date();
      const current = now.toTimeString().substring(0, 8); // "HH:MM:SS"

      // Find active break
      const activeBreak = breakWindows.find(b => {
        // Normalize locally just in case
        const bStart = b.start.length === 5 ? `${b.start}:00` : b.start;
        const bEnd = b.end.length === 5 ? `${b.end}:00` : b.end;
        return bStart <= current && bEnd >= current;
      });

      if (activeBreak) {
        // console.log(`☕ Active Break Found: ${activeBreak.type} (${activeBreak.start}-${activeBreak.end}) vs ${current}`);
      } else {
        // console.log(`▶️ No Active Break. Current: ${current}`);
      }

      const currentTasks = tasksRef.current;
      let updatedPausedByBreak = { ...pausedByBreakTasks };
      let tasksChanged = false;

      for (const task of currentTasks) {
        // ... (rest of logic)
        const isRunning = task.task_start && task.timer_start;
        const wasPausedByBreak = pausedByBreakTasks[task.id];
        const isAllowedDuringBreak = allowRunDuringBreakRef.current[task.id];

        // 1. Auto-Pause if break started
        if (activeBreak && isRunning && !isAllowedDuringBreak) {
          console.log(`⏸️ Client Auto-Pausing Task ${task.id}`);
          // ...
          await executePause(task); // Calls API
          updatedPausedByBreak[task.id] = true;
          tasksChanged = true;
        }

        // 2. Auto-Resume if break ended
        if (!activeBreak && wasPausedByBreak) {
          console.log(`▶️ Client Auto-Resuming Task ${task.id}`);
          await executeStart(task); // Calls API
          delete updatedPausedByBreak[task.id];
          allowRunDuringBreakRef.current[task.id] = false;
          tasksChanged = true;
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
            `Hello ${user.username || 'there'} 👋🏻 New Task Assigned to uuh !! ✨`,
            `Project: ${task.project_title || task.Project_Title}\nTask: ${task.title || task.name}\n${task.description || ''}`,
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
        console.log(`🏠 [TaskPage] Task Updated: ${task.id} Status: ${task.status} Started: ${task.task_start} Timer: ${task.timer_start}`);
        // console.log('Full Task Payload:', JSON.stringify(task)); 
        if (String(task.assigned_to) !== String(user.id)) return;

        // Merge updates carefully
        setTasks(prev => prev.map(t => {
          if (String(t.id) === String(task.id)) {
            // If status changed to Paused from server (Auto-Pause), reflect it
            // Logic for stopping timer is derived from task status in TaskItem
            return { ...t, ...task };
          }
          return t;
        }));

        // If status changed to Paused, cancel active notifications
        if ((task.status || '').toLowerCase() === 'paused') {
          await cancelAllTaskNotifications(task.id);
        }
      };

      const onTaskDeleted = (taskId) => {
        // ... 
        setTasks(prev => prev.filter(t => t.id !== taskId));
        cancelAllTaskNotifications(taskId).catch(console.error);
      };

      const onBreakStarted = (data) => {
        console.log('🔄 Break started received:', data);
        if (data.taskId) {
          setTasks(prev => prev.map(t => {
            if (String(t.id) === String(data.taskId)) {
              return { ...t, status: 'Paused', task_start: false, timer_start: null };
            }
            return t;
          }));
        }
        if (data.breaks || data.shift_breaks) loadShiftBreaks();
      };

      socket.on("task:created", onTaskAssigned);
      socket.on("task:updated", onTaskUpdated);
      socket.on("task:deleted", onTaskDeleted);
      socket.on("break:started", onBreakStarted); // Add this
      socket.on("shift:updated", onBreakStarted); // Re-use for shift updates that contain breaks

      // Listen for shift updates to refresh break windows
      socket.on("shift:created", loadShiftBreaks);
      // socket.on("shift:updated", loadShiftBreaks); // covered above
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
      // User request: Show ReasonModal instead of Conflict Alert
      setConflictTask(running);
      setPendingTask(task);
      setModalType('conflictPause');
      setModalVisible(true);
      return;
    }
    // Allow manual run even during breaks
    allowRunDuringBreakRef.current[task.id] = true;
    await executeStart(task);
  }, [executeStart]);

  const executeStart = useCallback(async (task) => {
    try {
      const now = new Date().toISOString();

      // Record time log
      await ApiService.recordStartTask({ task_id: task.id, type: 1, time_logged: now });

      // CRITICAL: Update task_start and timer_start in the database
      // This is required for the server auto-pause cron to detect active tasks
      await ApiService.updateTaskTimer(task.id, {
        task_start: true,
        timer_start: now,
        status: 'In Progress'
      });

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'In Progress', task_start: true, timer_start: now } : t));

      // Cancel any pending start reminders before scheduling the active one
      await cancelAllTaskNotifications(task.id);

      console.log(`✅ Task ${task.id} started and saved to DB with task_start: true, timer_start: ${now}`);
    } catch (err) { console.error('executeStart error:', err); }
  }, [user]);

  const executePause = useCallback(async (task) => {
    if (!task.timer_start) return;
    const now = new Date();
    const start = new Date(task.timer_start);
    const sessionElapsed = Math.floor((now - start) / 1000);
    const totalElapsed = (task.elapsed_seconds || 0) + sessionElapsed;

    try {
      await ApiService.updateTaskTimer(task.id, { task_start: false, timer_start: null, elapsed_seconds: totalElapsed, status: 'Paused' });
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