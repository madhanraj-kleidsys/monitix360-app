const cron = require('node-cron');
const { getIO } = require('../socket/socket');
const { Task, User, Shift, ShiftBreak, TaskReason, TimeUpdate, DeclaredHoliday } = require('../config/db');
const { sendPushNotification } = require('./notificationService');
const { Op } = require('sequelize');

let isCronRunning = false;

/**
 * Starts the reminder ticker to send push notifications and handle auto-pause/resume.
 */
function startReminderTicker() {
    console.log('🔔 Reminder Ticker Started (Remote Push Mode)');

    const lastNotificationSent = new Map();
    const NOTIFICATION_COOLDOWN_MS = 25 * 60 * 1000; // 25 mins cooldown

    // Helper: Normalize time strings to HH:MM
    const norm = (t) => {
        if (!t) return "";
        const parts = t.split(':');
        if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
        return t;
    };

    // Helper: Break Messages based on time of day
    const getBreakMessage = (isResume, userName, taskName) => {
        const hour = new Date().getHours();
        if (!isResume) {
            if (hour < 12) return { title: `☕ Tea Break, ${userName}!`, body: `"${taskName}" auto-paused. Enjoy your tea!` };
            if (hour < 15) return { title: `🍽️ Lunch Time, ${userName}!`, body: `"${taskName}" paused for lunch.` };
            return { title: `🍪 Snack Break, ${userName}!`, body: `"${taskName}" paused. Take a breather!` };
        } else {
            if (hour < 12) return { title: `🌅 Break Over, ${userName}!`, body: `Task "${taskName}" resumed.` };
            if (hour < 15) return { title: `🍽️ Welcome Back, ${userName}!`, body: `Task "${taskName}" is running again.` };
            return { title: `▶️ Let's Finish Strong!`, body: `Task "${taskName}" auto-resumed.` };
        }
    };

    // ==========================================
    // 1. MAIN MINUTE CRON (AUTO-PAUSE & RESUME)
    // ==========================================
    cron.schedule('5 * * * * *', async () => {
        if (isCronRunning) return; 
        isCronRunning = true;

        try {
            const now = new Date();
            const currentHM = norm(now.toTimeString().split(' ')[0]);
            console.log(`🕐 Running Pause/Resume Logic. Time: ${currentHM}`);

            // A. FETCH ACTIVE AND PAUSED TASKS
            const activeTasks = await Task.findAll({
                where: { status: { [Op.substring]: 'progress' }, task_start: true },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            const pausedTasks = await Task.findAll({
                where: { status: { [Op.substring]: 'paused' } },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            if (activeTasks.length === 0 && pausedTasks.length === 0) {
                isCronRunning = false;
                return;
            }

            const companyIds = [...new Set([...activeTasks, ...pausedTasks].map(t => t.company_id))];
            const shifts = await Shift.findAll({
                where: { company_id: { [Op.in]: companyIds } },
                include: [{ model: ShiftBreak }]
            });

            // B. AUTO-PAUSE LOGIC
            for (const task of activeTasks) {
                const shift = shifts.find(s => s.company_id === task.company_id);
                if (!shift) continue;

                const activeBreak = (shift.shift_breaks || []).find(b => {
                    const start = norm(b.break_start);
                    const end = norm(b.break_end);
                    return start <= end ? (currentHM >= start && currentHM <= end) : (currentHM >= start || currentHM <= end);
                });

                const shiftEnded = shift.shift_end && currentHM >= norm(shift.shift_end);

                if (activeBreak || shiftEnded) {
                    const reason = shiftEnded ? "Shift Ended" : (activeBreak.break_type || "Break");
                    const start = new Date(task.timer_start);
                    const totalElapsed = (task.elapsed_seconds || 0) + Math.floor((now - start) / 1000);

                    await TaskReason.create({ task_id: task.id, reason_type: 3, reason, company_id: task.company_id, user_id: task.assigned_to });
                    await Task.update({ status: 'Paused', task_start: false, timer_start: null, elapsed_seconds: totalElapsed }, { where: { id: task.id }, hooks: false });

                    const io = getIO();
                    if (io) io.to(`user_${task.assigned_to}`).emit('task:updated', { id: task.id, status: 'Paused' });

                    if (task.AssignedTo?.expo_push_token) {
                        const msg = getBreakMessage(false, task.AssignedTo.username, task.title || "Task");
                        await sendPushNotification(task.AssignedTo.expo_push_token, msg.title, msg.body, { taskId: task.id });
                    }
                    console.log(`⏸️ Auto-paused task ${task.id} for ${reason}`);
                }
            }

            // C. AUTO-RESUME LOGIC
            for (const task of pausedTasks) {
                const lastReason = await TaskReason.findOne({ where: { task_id: task.id, reason_type: 3 }, order: [['createdAt', 'DESC']] });
                if (!lastReason) continue;

                const manualPauseReasons = ['Call', 'Technical issue', 'Meeting', 'Other', 'Personal Break'];
                if (manualPauseReasons.includes(lastReason.reason)) continue;

                const shift = shifts.find(s => s.company_id === task.company_id);
                const isStillInBreak = (shift?.shift_breaks || []).some(b => {
                    const start = norm(b.break_start);
                    const end = norm(b.break_end);
                    return start <= end ? (currentHM >= start && currentHM <= end) : (currentHM >= start || currentHM <= end);
                });

                if (!isStillInBreak && lastReason.reason !== "Shift Ended") {
                    await Task.update({ status: 'In Progress', task_start: true, timer_start: now.toISOString() }, { where: { id: task.id }, hooks: false });
                    await TimeUpdate.create({ task_id: task.id, user_id: task.assigned_to, type: 1, time_logged: now });

                    const io = getIO();
                    if (io) io.to(`user_${task.assigned_to}`).emit('task:updated', { id: task.id, status: 'In Progress' });

                    if (task.AssignedTo?.expo_push_token) {
                        const msg = getBreakMessage(true, task.AssignedTo.username, task.title || "Task");
                        await sendPushNotification(task.AssignedTo.expo_push_token, msg.title, msg.body, { taskId: task.id });
                    }
                    console.log(`▶️ Auto-resumed task ${task.id}`);
                }
            }
        } catch (err) {
            console.error('❌ Cron Error:', err);
        } finally {
            isCronRunning = false;
        }
    });

    // ==========================================
    // 2. PENDING TASK REMINDERS (EVERY 10 MINS)
    // ==========================================
    cron.schedule('15 */10 * * * *', async () => {
        try {
            const now = new Date();
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

            const pendingTasks = await Task.findAll({
                where: { status: { [Op.or]: ['Pending', 'pending'] }, task_start: false, createdAt: { [Op.lt]: fiveMinsAgo } },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            const userTasksMap = new Map();
            for (const task of pendingTasks) {
                if (!task.AssignedTo?.expo_push_token) continue;
                if (!userTasksMap.has(task.assigned_to)) userTasksMap.set(task.assigned_to, { user: task.AssignedTo, tasks: [] });
                userTasksMap.get(task.assigned_to).tasks.push(task);
            }

            for (const [userId, data] of userTasksMap) {
                const { user, tasks } = data;
                const lastSent = lastNotificationSent.get(`pending_user_${userId}`);
                if (lastSent && (now - lastSent) < NOTIFICATION_COOLDOWN_MS) continue;

                const displayTitle = tasks.map(t => t.description || t.title).slice(0, 3).join(', ') + (tasks.length > 3 ? ` +${tasks.length - 3} more` : '');

                await sendPushNotification(user.expo_push_token, '⚠️ Pending Task Reminder 🚨', 
                    `Hey ${user.username || 'there'}, you have ${tasks.length === 1 ? 'a pending task' : 'pending tasks'} (${displayTitle}). When will you start?`,
                    { type: 'reminder', count: tasks.length });
                lastNotificationSent.set(`pending_user_${userId}`, now);
            }
        } catch (err) { console.error('Reminder Cron Error (Pending):', err); }
    });

    // ==========================================
    // 3. ACTIVE TASK REMINDERS (EVERY 2 MINS)
    // ==========================================
    cron.schedule('30 */2 * * * *', async () => {
        try {
            const now = new Date();
            const activeTasks = await Task.findAll({
                where: { task_start: true, status: { [Op.substring]: 'progress' } },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            const userTasksMap = new Map();
            for (const task of activeTasks) {
                if (!task.AssignedTo?.expo_push_token) continue;
                if (!userTasksMap.has(task.assigned_to)) userTasksMap.set(task.assigned_to, { user: task.AssignedTo, tasks: [] });
                userTasksMap.get(task.assigned_to).tasks.push(task);
            }

            for (const [userId, data] of userTasksMap) {
                const { user, tasks } = data;
                const lastSent = lastNotificationSent.get(`active_user_${userId}`);
                if (lastSent && (now - lastSent) < 50 * 60 * 1000) continue; // 50 min cooldown for active

                const displayTitle = tasks.map(t => t.description || t.title).slice(0, 3).join(', ') + (tasks.length > 3 ? ` +${tasks.length - 3} more` : '');

                await sendPushNotification(user.expo_push_token, 'Still Working ? 🚀', 
                    `You are working on: "${displayTitle}". Keep it up!`,
                    { type: 'active_reminder', count: tasks.length });
                lastNotificationSent.set(`active_user_${userId}`, now);
            }
        } catch (err) { console.error('Reminder Cron Error (Active):', err); }
    });

    // ==========================================
    // 4. PAUSED TASK REMINDERS (EVERY 15 MINS)
    // ==========================================
    cron.schedule('45 */15 * * * *', async () => {
        try {
            const now = new Date();
            const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);

            const pausedTasks = await Task.findAll({
                where: { status: { [Op.substring]: 'paused' }, updatedAt: { [Op.lt]: tenMinsAgo } },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            const userTasksMap = new Map();
            for (const task of pausedTasks) {
                if (!task.AssignedTo?.expo_push_token) continue;
                if (!userTasksMap.has(task.assigned_to)) userTasksMap.set(task.assigned_to, { user: task.AssignedTo, tasks: [] });
                userTasksMap.get(task.assigned_to).tasks.push(task);
            }

            for (const [userId, data] of userTasksMap) {
                const { user, tasks } = data;
                const lastSent = lastNotificationSent.get(`paused_user_${userId}`);
                if (lastSent && (now - lastSent) < NOTIFICATION_COOLDOWN_MS) continue;

                const displayTitle = tasks.map(t => t.description || t.title).slice(0, 3).join(', ') + (tasks.length > 3 ? ` +${tasks.length - 3} more` : '');

                await sendPushNotification(user.expo_push_token, 'Task still Paused ? ⏸️', 
                    `Hey ${user.username || 'there'}, your task(s) (${displayTitle}) are still paused. When will you resume?`,
                    { type: 'paused_reminder', count: tasks.length });
                lastNotificationSent.set(`paused_user_${userId}`, now);
            }
        } catch (err) { console.error('Reminder Cron Error (Paused):', err); }
    });

    // ==========================================
    // 5. NO TASK NOTIFICATION (EVERY 5 MINS)
    // ==========================================
    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
            const currentMins = toMins(now.toTimeString().split(' ')[0].substring(0, 5));

            const shifts = await Shift.findAll();
            for (const shift of shifts) {
                if (!shift.shift_start) continue;
                const diff = currentMins - toMins(shift.shift_start.substring(0, 5));

                if (diff >= 15 && diff <= 25) {
                    const day = now.getDay();
                    const date = now.getDate();
                    const week = Math.ceil(date / 7);

                    if (day === 0 || (day === 6 && (week === 2 || week === 4))) continue;

                    const holiday = await DeclaredHoliday.findOne({ where: { company_id: shift.company_id, holiday_date: todayStr } });
                    if (holiday) continue;

                    const users = await User.findAll({ where: { company_id: shift.company_id } });
                    for (const user of users) {
                        const notifKey = `no_task_${todayStr}_${user.id}`;
                        if (lastNotificationSent.has(notifKey)) continue;

                        const taskCount = await Task.count({ where: { assigned_to: user.id, status: { [Op.not]: 'Completed' } } });
                        if (taskCount === 0 && user.expo_push_token) {
                            await sendPushNotification(user.expo_push_token, 'No Tasks Assigned? 🧐', 
                                `Hey ${user.username}, no tasks assigned for today? Contact your admin!`, { type: 'no_task_reminder' });
                            lastNotificationSent.set(notifKey, now);
                        }
                    }
                }
            }
        } catch (err) { console.error('Reminder Cron Error (No Task):', err); }
    });
}

module.exports = { startReminderTicker };