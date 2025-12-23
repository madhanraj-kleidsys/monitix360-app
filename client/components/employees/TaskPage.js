import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Alert, ActivityIndicator, Text } from 'react-native';
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
      if (data && data[0] && data[0].breaks) {
        const windows = data[0].breaks.map(b => ({
          start: normalizeTime(b.break_start),
          end: normalizeTime(b.break_end),
          type: b.break_type
        }));
        setBreakWindows(windows);
      }
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
      const filtered = res.data.filter(task => {
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
    console.log('📋 TaskPage Socket Effect:', { socket: !!socket, isConnected, userId: user?.id });
    if (socket && isConnected && user?.id) {
      console.log(`📋 Joining room: user_${user.id}`);
      socket.emit("joinRoom", `user_${user.id}`);

      const onTaskAssigned = async (task) => {
        console.log('📋 Task Assigned Event Received:', task.id);

        // Filter by user ID as events are currently broadcast (unless we fix server too)
        if (String(task.assigned_to) !== String(user.id)) return;

        setTasks(prev => {
          if (prev.find(t => t.id === task.id)) return prev;
          return [task, ...prev];
        });

        // Schedule immediate notification (5 seconds delay for visibility)
        try {
          await scheduleLocalNotification(
            `Hey ${user.username || 'there'} 👋🏻, New Task! 🚀`,
            `Task assigned: ${task.project_title || task.title}\n${task.description || ''}`,
            { taskId: task.id, type: 'assignment' },
            5 // 5 seconds delay
          );
          console.log('✅ Task notification scheduled');
        } catch (notifErr) {
          console.error('❌ Failed to schedule notification:', notifErr);
        }

        // Schedule reminder for 3 minutes later
        try {
          const reminderId = await scheduleTaskReminder(
            task.id,
            task.project_title || task.title,
            180 // 3 minutes
          );
          remindersRef.current[task.id] = reminderId;
          console.log('✅ Reminder scheduled:', reminderId);
        } catch (err) {
          console.error('❌ Failed to schedule reminder:', err);
        }
      };

      const onTaskUpdated = async (task) => {
        console.log('📋 Task Updated Event Received:', task.id);
        if (String(task.assigned_to) !== String(user.id)) return;
        setTasks(prev => prev.map(t => (t.id === task.id ? task : t)));
      };

      const onTaskDeleted = (taskId) => {
        console.log('📋 Task Deleted Event Received:', taskId);
        setTasks(prev => prev.filter(t => t.id !== taskId));
        cancelAllTaskNotifications(taskId).catch(console.error);
      };

      socket.on("task:created", onTaskAssigned);
      socket.on("task:updated", onTaskUpdated);
      socket.on("task:deleted", onTaskDeleted);

      return () => {
        console.log('📋 Cleaning up TaskPage listeners');
        socket.off("task:created", onTaskAssigned);
        socket.off("task:updated", onTaskUpdated);
        socket.off("task:deleted", onTaskDeleted);
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
          { text: "Run Both", onPress: () => handleConflictAction(task, running, 'run') },
          { text: "Cancel", style: 'cancel' }
        ]
      );
      return;
    }

    try {
      const res = await ApiService.getTaskReasonsByTaskId(task.id);
      const reasons = res.data || {};
      const elapsed = task.elapsed_seconds || 0;
      const start = new Date(task.start);
      const end = new Date(task.end_time);
      const now = new Date();

      if (elapsed === 0) {
        if (now < start && !reasons.start_early_reason) {
          setPendingTask(task);
          setModalType('early');
          setModalVisible(true);
          return;
        } else if (now > end && !reasons.start_late_reason) {
          setPendingTask(task);
          setModalType('late');
          setModalVisible(true);
          return;
        }
      }

      await executeStart(task);
    } catch (err) { console.error(err); }
  }, [handleConflictAction, executeStart]);

  const executeStart = useCallback(async (task) => {
    try {
      const now = new Date().toISOString();
      await ApiService.recordStartTask({
        task_id: task.id,
        type: 1,
        time: now,
      });

      if (task.status === "pending" || task.status === "Paused") {
        await ApiService.updateTaskStatus(task.id, { status: "In Progress" });
      }

      setTasks(prev => prev.map(t => t.id === task.id ? {
        ...t,
        status: 'In Progress',
        task_start: true,
        timer_start: now
      } : t));

      await cancelAllTaskNotifications(task.id);
      await scheduleActiveTaskReminder(task.id, task.project_title || task.title);

      if (remindersRef.current[task.id]) {
        delete remindersRef.current[task.id];
      }
    } catch (err) {
      console.error("Execute Start Error:", err);
      Alert.alert("Error", "Failed to start task in database.");
    }
  }, []);

  const handleConflictAction = useCallback(async (newTask, runningTask, action) => {
    setPendingTask(newTask);
    setConflictTask(runningTask);

    if (action === 'pause') {
      setModalType('conflictPause');
      setModalVisible(true);
    } else if (action === 'stop') {
      setModalType('conflictStop');
      setModalVisible(true);
    } else if (action === 'run') {
      const now = new Date();
      if (now < new Date(newTask.start)) setModalType('early');
      else if (now > new Date(newTask.end_time)) setModalType('late');
      else setModalType('conflictRunBoth');
      setModalVisible(true);
    }
  }, []);

  const handlePauseRequest = useCallback((task) => {
    setPendingTask(task);
    setModalType('pause');
    setModalVisible(true);
  }, []);

  const handleStopRequest = useCallback((task) => {
    const now = new Date();
    setPendingTask(task);
    if (now > new Date(task.end_time)) setModalType('stopLate');
    else setModalType('stop');
    setModalVisible(true);
  }, []);

  const onSaveReason = async (reason) => {
    setModalVisible(false);
    if (!pendingTask) return;

    const task = pendingTask;
    const type = modalType;
    const reasonKeyMap = {
      early: "start_early_reason",
      late: "start_late_reason",
      pause: "pause_reason",
      stop: "stop_reason",
      stopLate: "stop_reason",
      conflictPause: "conflict_pause_reason",
      conflictStop: "conflict_stop_reason",
      conflictRunBoth: "conflict_runboth_reason",
    };

    const reasonKey = reasonKeyMap[type];

    try {
      if (reasonKey) {
        await ApiService.submitReason(task.id, reasonKey, { reason });
        if (type === 'conflictPause' && conflictTask) {
          await executePause(conflictTask);
          await executeStart(task);
        } else if (type === 'conflictStop' && conflictTask) {
          await executeStop(conflictTask);
          await executeStart(task);
        } else if (type === 'conflictRunBoth') {
          await executeStart(task);
        }
      }

      if (type === 'early' || type === 'late') {
        await executeStart(task);
      } else if (type === 'pause') {
        await executePause(task);
      } else if (type === 'stop' || type === 'stopLate') {
        await executeStop(task);
        if (reason.toLowerCase().includes('task completed') || type === 'stopLate') {
          await ApiService.markTaskCompleted(task.id);
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
        }
      }
    } catch (err) {
      console.error("Action Save Error:", err);
      Alert.alert("Error", "Action failed in database.");
    } finally {
      setPendingTask(null);
      setConflictTask(null);
    }
  };

  const executePause = useCallback(async (task) => {
    if (!task.timer_start) return;
    const now = new Date();
    const start = new Date(task.timer_start);
    const sessionElapsed = Math.floor((now - start) / 1000);
    const totalElapsed = (task.elapsed_seconds || 0) + sessionElapsed;

    try {
      await ApiService.updateTaskTimer(task.id, {
        task_start: false,
        timer_start: null,
        elapsed_seconds: totalElapsed
      });
      setTasks(prev => prev.map(t => t.id === task.id ? {
        ...t,
        task_start: false,
        timer_start: null,
        elapsed_seconds: totalElapsed,
        status: 'Paused'
      } : t));
      await cancelAllTaskNotifications(task.id);
    } catch (err) { console.error("Pause failed", err); }
  }, []);

  const executeStop = useCallback(async (task) => {
    await executePause(task);
    try {
      await ApiService.recordStopTask({
        task_id: task.id,
        type: 2,
        time_logged: new Date().toISOString()
      });
    } catch (err) { console.error("Stop record failed", err); }
  }, [executePause]);

  const handleStatusChange = useCallback(async (task, newStatus) => {
    try {
      if (newStatus === 'In Progress') await handleStartRequest(task);
      else if (newStatus === 'completed') await handleStopRequest(task);
      else {
        await ApiService.partialUpdateTask(task.id, { status: newStatus });
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      }
    } catch (err) { Alert.alert("Error", "Failed to update status"); }
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
          contentContainerStyle={{ paddingBottom: 20 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />
      )}
      <ReasonModal
        visible={modalVisible}
        type={modalType}
        onClose={() => { setModalVisible(false); setPendingTask(null); }}
        onSave={onSaveReason}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
