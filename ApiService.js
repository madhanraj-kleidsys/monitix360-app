import API from "./axios";

class ApiService {

    getAllUsers() {
        return API.get("/users", {
            headers: {
                applicationCode: "USERS",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    createUser(values) {
        return API.post("/users", values);
    }

    updateUser(id, updatedFields) {
        return API.patch(`/users/${id}`, updatedFields);
    }

    deleteUser(userId) {
        return API.delete(`/users/${userId}`);
    }

    createTask(data) {
        return API.post("/tasks", data, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    getMyTasks() {
        return API.get("/tasks/my", {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    getAllTasks() {
        return API.get("/tasks/all", {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    updateTask(id, data) {
        return API.put(`/tasks/${id}`, data, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    deleteTask(id) {
        return API.delete(`/tasks/${id}`, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    updateTaskTimer(id, data) {
        return API.patch(`/tasks/${id}/timer`, data, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    updateTaskStatus(id, data) {
        return API.patch(`/tasks/${id}/status`, data, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    updateAssignedUser(id, data) {
        return API.patch(`/tasks/${id}/assign`, data, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    partialUpdateTask(id, data) {
        return API.patch(`/tasks/${id}`, data, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    getTaskTimer(id) {
        return API.get(`/tasks/${id}/timer`, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    saveTaskTimer(id, data) {
        return API.put(`/tasks/${id}/timer`, data, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    getUserBasicTimes(userId) {
        return API.get(`/tasks/user/${userId}/basic`);
    }

    getShiftBreaks() {
        return API.get("/shift-breaks");
    }

    startEarlyReason(id, data) {
        return API.post(`/tasks/${id}/start_early_reason`, data, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    startLateReason(id, data) {
        return API.post(`/tasks/${id}/start_late_reason`, data, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    pauseReason(id, data) {
        // console.log("push task")
        return API.post(`/tasks/${id}/pause_reason`, data, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    stopReason(id, data) {
        return API.post(`/tasks/${id}/stop_reason`, data, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    getUnplannedTasks() {
        return API.get("/tasks/unplanned", {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    createUnplannedTask(data) {
        return API.post("/tasks/unplanned", data, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    updateUnplannedTask(id, data) {
        return API.put(`/tasks/unplanned/${id}`, data, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    deleteUnplannedTask(id) {
        return API.delete(`/tasks/unplanned/${id}`, {
            headers: {
                applicationCode: "TASK",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    getLastEndTime(userId) {
        return API.get(`/tasks/last-end-time/${userId}`, {
            headers: {
                applicationCode: "TASKS",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    getShifts() {
        return API.get("/shifts", {
            headers: {
                applicationCode: "SHIFT",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    createShift(data) {
        // console.log("added")
        return API.post("/shifts", data, {
            headers: {
                applicationCode: "SHIFT",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    updateShift(id, data) {
        // console.log("updated")
        return API.put(`/shifts/${id}`, data, {
            headers: {
                applicationCode: "SHIFT",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    deleteShift(id) {
        return API.delete(`/shifts/${id}`, {
            headers: {
                applicationCode: "SHIFT",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    getHolidays() {
        return API.get("/declare-holiday", {
            headers: {
                applicationCode: "HOLIDAY",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    getHolidayById(id) {
        return API.get(`/declare-holiday/${id}`, {
            headers: {
                applicationCode: "HOLIDAY",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    createHoliday(data) {
        return API.post("/declare-holiday", data, {
            headers: {
                applicationCode: "HOLIDAY",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    updateHoliday(id, data) {
        return API.put(`/declare-holiday/${id}`, data, {
            headers: {
                applicationCode: "HOLIDAY",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    deleteHoliday(id) {
        return API.delete(`/declare-holiday/${id}`, {
            headers: {
                applicationCode: "HOLIDAY",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    getProjects() {
        return API.get("/projects", {
            headers: {
                applicationCode: "PROJECT",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    createProject(data) {
        return API.post("/projects", data, {
            headers: {
                applicationCode: "PROJECT",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    updateProject(id, data) {
        return API.put(`/projects/${id}`, data, {
            headers: {
                applicationCode: "PROJECT",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    deleteProject(id) {
        return API.delete(`/projects/${id}`, {
            headers: {
                applicationCode: "PROJECT",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    getAllTaskReasons() {
        return API.get("/taskReasons", {
            headers: {
                applicationCode: "TASK_REASON",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    createTaskReason(data) {
        return API.post("/taskReasons", data, {
            headers: {
                applicationCode: "TASK_REASON",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    getTaskReasonsByTaskId(taskId) {
        return API.get(`/taskReasons/${taskId}`, {
            headers: {
                applicationCode: "TASK_REASON",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    addReasonToTask(taskId, reasonKey, payload) {
        return API.post(`/taskReasons/${taskId}/${reasonKey}`, payload, {
            headers: {
                applicationCode: "TASK_REASON",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    recordStartTask(payload) {
        return API.post("/time_update/start-task", payload);
    }

    recordStopTask(payload) {
        return API.post("/time_update/stop-task", payload);
    }

    getTaskTimeUpdates(taskId) {
        return API.get(`/time_update/time_get/${taskId}`);
    }

    submitReason(taskId, reasonType, payload) {
        // console.log("puase task")
        return API.post(`/taskReasons/${taskId}/${reasonType}`, payload, {
            headers: {
                applicationCode: "TASK_REASON",
                lastUpdatedMachine: "LOCAL",
            },
        });
    }

    // recordStartTime(payload) {
    //     return API.post("/time_update/start-task", payload);
    // }

    recordStopTime(payload) {
        return API.post("/time_update/stop-task", payload);
    }

    markTaskCompleted(id) {
        return API.patch(`/tasks/${id}/status`, { status: "completed" });
    }

    markTaskInProgress(id) {
        return API.patch(`/tasks/${id}/status`, { status: "In Progress" });
    }

    savePauseReason(taskId) {
        return API.post(`/taskReasons/${taskId}/pause_reason`, {
            reason: "Browser closed or page refreshed",
        });
    }

    pauseTimerOnBrowserClose(taskId, finalElapsed) {
        return API.patch(`/tasks/${taskId}/timer`, {
            task_start: false,
            timer_start: null,
            elapsed_seconds: finalElapsed,
        });
    }

    // 21-11-2025 - Changes by Priyanka
    // Added saveSelectedUsers function for select employe by admin
    saveSelectedUsers(selectedUserIds) {
        return API.post("/users/select", { selectedUserIds });
    }

    // 21-11-2025 - Changes by Priyanka
    // Added getSelectedUsers function to get only selected employee in the admin dash boar
    getSelectedUsers() {
        return API.get("/users/selected");
    }

    // Company Details APIs
    getCompanyDetails() {
        return API.get("/companyDetails");
    }

    addCompanyDetails(data) {
        return API.post("/companyDetails", data);
    }

userAddTask(data) {
  return API.post(`/tasks/user/add-task`, data);
}

// Fetch tasks approved by admin
getUserApprovedTasks(userId) {
  return API.get(`/tasks/user/approved/${userId}`);
}

// Admin: Get pending user tasks
getPendingUserRequests() {
  return API.get(`/tasks/admin/pending/task-requests`);
}

// Admin: Approve or Reject
updateAdminApproval(taskId, status) {
  return API.patch(`/tasks/admin/task-request/${taskId}`, {
    approval_status: status,
  });
}

getUserNotifications() {
  return API.get("/tasks/user/notifications");
}
deleteUserNotification(taskId) {
  return API.delete(`/tasks/user/notification/${taskId}`);
}
getCompanyEmailSettings(companyId) {
        return API.get(`/companyDetails/${companyId}/email-settings`);
    }

    // Save / update email settings
    updateCompanyEmailSettings(data) {
        return API.post("/companyDetails/email-settings", data);
    }
}

export default new ApiService();
