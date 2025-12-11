import api from '../../../api/client';

const TaskService = {
  // ===== PLANNED TASKS =====
  // in TaskService
  getAllUsers: async () => {
    const response = await api.get('/users');
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  },

  getMyTasks: async () => {
    const response = await api.get('/tasks/my');
    return response.data;
  },

  getAllTasks: async () => {
    try {
      const response = await api.get('/tasks/all');
      // RETURN response.data (which is the array), NOT response object
      return response.data;
    } catch (err) {
      console.error('❌ TaskService.getAllTasks error:', err);
      throw err;
    }
  },

  getBasicUserTasks: async (userId) => {
    const response = await api.get(`/tasks/user/${userId}/basic`);
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await api.post('/tasks/', taskData);
    return response.data;
  },

  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  updateTaskStatus: async (taskId, status) => {
    const response = await api.patch(`/tasks/${taskId}/status`, { status });
    return response.data;
  },

  updateOwnTask: async (taskId, taskData) => {
    const response = await api.patch(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  assignTask: async (taskId, userId) => {
    const response = await api.patch(`/tasks/${taskId}/assign`, { assigned_to: userId });
    return response.data;
  },

  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // ===== UNPLANNED TASKS =====

  getUnplannedTasks: async () => {
    const response = await api.get('/tasks/unplanned');
    return response.data;
  },

  createUnplannedTask: async (taskData) => {
    const response = await api.post('/tasks/unplanned', taskData);
    return response.data;
  },

  updateUnplannedTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/unplanned/${taskId}`, taskData);
    return response.data;
  },

  deleteUnplannedTask: async (taskId) => {
    const response = await api.delete(`/tasks/unplanned/${taskId}`);
    return response.data;
  },

  // ===== TIMER ENDPOINTS =====

  getTimer: async (taskId) => {
    const response = await api.get(`/tasks/timer/${taskId}`);
    return response.data;
  },

  patchTimer: async (taskId, timerData) => {
    const response = await api.patch(`/tasks/${taskId}/timer`, timerData);
    return response.data;
  },

  putTimer: async (taskId, timerData) => {
    const response = await api.put(`/tasks/timer/${taskId}`, timerData);
    return response.data;
  },

  // ===== REASON ENDPOINTS =====

  startEarlyReason: async (taskId, reasonData) => {
    const response = await api.post(`/tasks/timer/${taskId}/start_early_reason`, reasonData);
    return response.data;
  },

  startLateReason: async (taskId, reasonData) => {
    const response = await api.post(`/tasks/timer/${taskId}/start_late_reason`, reasonData);
    return response.data;
  },

  pauseReason: async (taskId, reasonData) => {
    const response = await api.post(`/tasks/timer/${taskId}/pause_reason`, reasonData);
    return response.data;
  },

  stopReason: async (taskId, reasonData) => {
    const response = await api.post(`/tasks/timer/${taskId}/stop_reason`, reasonData);
    return response.data;
  },
};

export default TaskService;