import { useState, useCallback, useEffect } from 'react';
import TaskService from '../services/TaskService';
import { Alert } from 'react-native';

export const useTaskManagement = () => {
  const [myTasks, setMyTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [unplannedTasks, setUnplannedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all users for assign dropdown
  const fetchAllUsers = useCallback(async () => {
    try {
      // console.log('fatchgggg users.......!!!!');

      const response = await TaskService.getAllUsers();
      // console.log('fetched uersds:::::',response);

      setAllUsers(Array.isArray(response) ? response : response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err.response || err.message);
      setAllUsers([]);
    }
  }, []);

  // Fetch current user's tasks
  const fetchMyTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TaskService.getMyTasks();
      setMyTasks(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch tasks';
      setError(errorMsg);
      console.error('Error fetching my tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all tasks (admin)
  const fetchAllTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // console.log('🔵 [FETCH ALL TASKS] Starting...');
      const response = await TaskService.getAllTasks();
      // Handle different response formats
      let tasksData = [];
      if (Array.isArray(response)) {
        tasksData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        tasksData = response.data;
      } else if (response && typeof response === 'object') {
        console.warn('⚠️ Response is object, not array:', response);
        tasksData = [];
      }

      setAllTasks(Array.isArray(tasksData) ? tasksData : []);
      return tasksData;
    } catch (err) {
      console.error('❌ Error fetching all tasks:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch all tasks';
      setError(errorMsg);
      setAllTasks([]);  //  Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unplanned tasks
  const fetchUnplannedTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TaskService.getUnplannedTasks();
      setUnplannedTasks(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch unplanned tasks';
      setError(errorMsg);
      console.error('Error fetching unplanned tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new task
  const createTask = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const durationParts = (formData.duration || '0.00').split('.');
      const hours = parseInt(durationParts[0]) || 0;
      const minutes = parseInt(durationParts[1]) || 0;
      const totalDurationMinutes = (hours * 60) + minutes;

      const taskData = {
        title: formData.department || formData.projectTitle,
        description: formData.taskDescription || 'No description',
        priority: formData.priority === 'High' ? 1 :
          (formData.priority === 'Medium' ? 2 : 3),
        assigned_to: formData.assignUserId,
        status: 'pending',
        duration_minutes:totalDurationMinutes,
        start: formData.startTime,
        end_time: formData.endTime,
        Project_Title: formData.projectTitle,
      };

      const newTask = await TaskService.createTask(taskData);
      await fetchAllTasks();

      Alert.alert('Success', 'Task created successfully!');
      return newTask;
    } catch (err) {
      console.error('❌ [ERROR]', err);
      console.error('Response:', err.response?.data);
      console.error('Message:', err.message);

      const errorMsg = err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to create task';

      Alert.alert('Error', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAllTasks]);


  // Update task status
  const updateStatus = useCallback(async (taskId, status) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await TaskService.updateTaskStatus(taskId, status);
      setMyTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      return updated;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update status';
      setError(errorMsg);
      console.error('Error updating status:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update own task
  const updateOwnTask = useCallback(async (taskId, taskData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await TaskService.updateOwnTask(taskId, taskData);
      setMyTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      return updated;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update task';
      setError(errorMsg);
      console.error('Error updating task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  const updateTask = useCallback(async (taskId, taskData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('📝 Updating task:', taskId, taskData);
      const updated = await TaskService.updateTask(taskId, taskData);

      // Update local state immediately
      setAllTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      setMyTasks(prev => prev.map(t => t.id === taskId ? updated : t));

      Alert.alert('Success', 'Task updated successfully');
      return updated;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update task';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete task
  const deleteTask = useCallback(async (taskId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🗑️ Deleting task:', taskId);
      await TaskService.deleteTask(taskId);

      // Remove from both states
      setAllTasks(prev => prev.filter(t => t.id !== taskId));
      setMyTasks(prev => prev.filter(t => t.id !== taskId));

      console.log('✅ Task deleted successfully');
      Alert.alert('Success', 'Task deleted successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete task';
      setError(errorMsg);
      console.error('❌ Error deleting task:', err);
      Alert.alert('Error', errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create unplanned task
  const createUnplannedTask = useCallback(async (taskData) => {
    setLoading(true);
    setError(null);
    try {
      const newTask = await TaskService.createUnplannedTask(taskData);
      setUnplannedTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create unplanned task';
      setError(errorMsg);
      console.error('Error creating unplanned task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete unplanned task
  const deleteUnplannedTask = useCallback(async (taskId) => {
    setLoading(true);
    setError(null);
    try {
      await TaskService.deleteUnplannedTask(taskId);
      setUnplannedTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete unplanned task';
      setError(errorMsg);
      console.error('Error deleting unplanned task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);



  // Add to hook:
  const startTimer = useCallback(async (taskId) => {
    try {
      const response = await TaskService.patchTimer(taskId, {
        timer_start: new Date().toISOString(),
      });
      setMyTasks(prev => prev.map(t => t.id === taskId ? response : t));
    } catch (err) {
      Alert.alert('Error', 'Failed to start timer');
    }
  }, []);

  const pauseTimer = useCallback(async (taskId, elapsedSeconds) => {
    try {
      const response = await TaskService.patchTimer(taskId, {
        elapsed_seconds: elapsedSeconds,
      });
      setMyTasks(prev => prev.map(t => t.id === taskId ? response : t));
    } catch (err) {
      Alert.alert('Error', 'Failed to pause timer');
    }
  }, []);


  const addStartLateReason = useCallback(async (taskId, reason) => {
    try {
      const response = await TaskService.startLateReason(taskId, {
        reason: reason,
        reason_date: new Date().toISOString(),
      });
      return response;
    } catch (err) {
      Alert.alert('Error', 'Failed to add reason');
    }
  }, []);

  const addStopReason = useCallback(async (taskId, reason) => {
    try {
      const response = await TaskService.stopReason(taskId, {
        reason: reason,
        reason_date: new Date().toISOString(),
      });
      return response;
    } catch (err) {
      Alert.alert('Error', 'Failed to add reason');
    }
  }, []);

  const approveTask = useCallback(async (taskId) => {
    try {
      const response = await TaskService.updateTask(taskId, {
        approval_status: 'approved',
      });
      setMyTasks(prev => prev.map(t => t.id === taskId ? response : t));
      Alert.alert('Success', 'Task approved!');
    } catch (err) {
      Alert.alert('Error', 'Failed to approve task');
    }
  }, []);

  const rejectTask = useCallback(async (taskId, reason) => {
    try {
      const response = await TaskService.updateTask(taskId, {
        approval_status: 'rejected',
        reason: reason,
      });
      setMyTasks(prev => prev.map(t => t.id === taskId ? response : t));
      Alert.alert('Success', 'Task rejected!');
    } catch (err) {
      Alert.alert('Error', 'Failed to reject task');
    }
  }, []);



  // Load initial data
  useEffect(() => {
    fetchAllTasks();
    fetchAllUsers();
  }, [fetchAllTasks, fetchAllUsers]);

  return {
    // State
    myTasks,
    allUsers,
    allTasks,
    unplannedTasks,
    loading,
    error,
    // Methods
    fetchMyTasks,
    fetchAllTasks,
    fetchAllUsers,
    fetchUnplannedTasks,
    createTask,
    updateStatus,
    updateOwnTask,

    updateTask,
    deleteTask,
    createUnplannedTask,
    deleteUnplannedTask,
    startTimer,
    pauseTimer,
    addStartLateReason,
    addStopReason,
    approveTask,
    rejectTask,
  };
};

export default useTaskManagement;