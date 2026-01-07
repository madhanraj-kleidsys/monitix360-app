import client from '../api/client';

class ApiService {
    getMyTasks() {
        return client.get('/tasks/my');
    }

    getTaskReasonsByTaskId(taskId) {
        return client.get(`/taskReasons/${taskId}`);
    }

    updateTaskStatus(id, data) {
        return client.patch(`/tasks/${id}/status`, data);
    }

    partialUpdateTask(id, data) {
        return client.patch(`/tasks/${id}`, data);
    }

    recordStopTask(payload) {
        return client.post('/time_update/stop-task', payload);
    }

    recordStartTask(payload) {
        return client.post('/time_update/start-task', payload);
    }

    updateTaskTimer(id, data) {
        return client.patch(`/tasks/${id}/timer`, data);
    }

    getTaskTimeUpdates(taskId) {
        return client.get(`/time_update/time_get/${taskId}`);
    }

    getTaskReasons(taskId) {
        return client.get(`/taskReasons/${taskId}`);
    }

    submitReason(taskId, reasonType, payload) {
        return client.post(`/taskReasons/${taskId}/${reasonType}`, payload);
    }

    markTaskCompleted(id) {
        return client.patch(`/tasks/${id}/status`, { status: 'Completed' });
    }

    markTaskInProgress(id) {
        return client.patch(`/tasks/${id}/status`, { status: 'In Progress' });
    }

    startEarlyReason(id, data) {
        return client.post(`/tasks/${id}/start_early_reason`, data);
    }

    startLateReason(id, data) {
        return client.post(`/tasks/${id}/start_late_reason`, data);
    }

    pauseReason(id, data) {
        return client.post(`/tasks/${id}/pause_reason`, data);
    }

    stopReason(id, data) {
        return client.post(`/tasks/${id}/stop_reason`, data);
    }

    recordStartTime(payload) {
        return client.post("/time_update/start-task", payload);
    }

    recordStopTime(payload) {
        return client.post("/time_update/stop-task", payload);
    }

    getShiftBreaks() {
        return client.get("/shift-breaks");
    }

    updatePushToken(token) {
        return client.post('/users/push-token', { token });
    }

    getCompanyEmailSettings(companyId) {
        return client.get(`/companyDetails/${companyId}/email-settings`);
    }

    updateCompanyEmailSettings(data) {
        return client.post("/companyDetails/email-settings", data);
    }
}

export default new ApiService();
