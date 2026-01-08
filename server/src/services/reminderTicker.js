const cron = require('node-cron');
const { getIO } = require('../socket/socket');
const { Task, User, Shift, ShiftBreak, TaskReason, TimeUpdate, DeclaredHoliday } = require('../config/db');
const { sendPushNotification } = require('./notificationService');
const { Op } = require('sequelize');

/**
 * Starts the reminder ticker to send push notifications for:
 * 1. Pending tasks (not started yet)
 * 2. Active tasks (still running)
 */
function startReminderTicker() {
    console.log('🔔 Reminder Ticker Started (Remote Push Mode)');

    // Track processed tasks to prevent duplicates (per cron cycle)
    const processedPauseTasks = new Set();
    const processedResumeTasks = new Set();

    // Get friendly message based on time of day
    const getBreakMessage = (isResume, userName, taskName) => {
        const now = new Date();
        const hour = now.getHours();
        const mins = now.getMinutes();
        const currentTimeVal = hour + (mins / 60);

        const isMorning = currentTimeVal < 12;
        const isLunch = currentTimeVal >= 12 && currentTimeVal < 15.5; // 3:30 PM
        const isEvening = currentTimeVal >= 15.5;

        if (!isResume) {
            // Pause messages
            if (isMorning) {
                return {
                    title: `☕ Tea Break Time, ${userName}!`,
                    body: `Your task "${taskName}" has been auto-paused. Enjoy your tea! ☕`
                };
            } else if (isLunch) {
                return {
                    title: `🍽️ Lunch Time, ${userName}!`,
                    body: `Your task "${taskName}" is paused for lunch. Enjoy your meal! 🍴`
                };
            } else {
                return {
                    title: `🍪 Snack Break, ${userName}!`,
                    body: `Your task "${taskName}" is paused for a quick snack. Take a breather! 😊`
                };
            }
        } else {
            // Resume messages
            if (isMorning) {
                return {
                    title: `🌅 Break Over, ${userName}!`,
                    body: `Hope you enjoyed your tea! ☕ Your task "${taskName}" is now resumed.`
                };
            } else if (isLunch) {
                return {
                    title: `🍽️ Welcome Back, ${userName}!`,
                    body: `Had a good lunch? 😋 Your task "${taskName}" timer is running again.`
                };
            } else {
                return {
                    title: `▶️ Break's Over, ${userName}!`,
                    body: `Your task "${taskName}" has been auto-resumed. Let's finish strong! 💪`
                };
            }
        }
    };

    // 0. Every minute: Run at second 0 - Auto-Pause AND Auto-Resume
    cron.schedule('0 * * * * *', async () => {
        try {
            const now = new Date();
            const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
            const norm = (t) => {
                if (!t) return "";
                const parts = t.split(':');
                if (parts.length >= 2) {
                    const h = parts[0].padStart(2, '0');
                    const m = parts[1].padStart(2, '0');
                    return `${h}:${m}`;
                }
                return t;
            };
            const currentHM = norm(currentTime);

            console.log(`🕐 Auto-Pause/Resume Cron Running. Server Time: ${currentHM}`);

            // ========== AUTO-PAUSE LOGIC ==========
            const activeTasks = await Task.findAll({
                where: {
                    status: { [Op.or]: ['In Progress', 'in progress', 'IN PROGRESS'] },
                    task_start: { [Op.or]: [true, 1, '1'] }
                },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            console.log(`📋 Active Tasks Found: ${activeTasks.length}`);

            if (activeTasks.length > 0) {
                const companyIds = [...new Set(activeTasks.map(t => t.company_id).filter(id => !!id))];
                if (companyIds.length > 0) {
                    const shifts = await Shift.findAll({
                        where: { company_id: { [Op.in]: companyIds } },
                        include: [{ model: ShiftBreak }]
                    });

                    // Build break map - use BREAK's company_id (if available), otherwise shift's
                    const companyBreakMap = {};
                    for (const shift of shifts) {
                        const breaks = shift.shift_breaks || shift.ShiftBreaks || [];
                        const actualBreaks = Array.isArray(breaks) ? breaks : (shift.ShiftBreaks || []);

                        for (const b of actualBreaks) {
                            if (!b.break_start || !b.break_end) continue;
                            const bStart = norm(b.break_start);
                            const bEnd = norm(b.break_end);

                            let isBreak = false;
                            if (bStart <= bEnd) {
                                isBreak = currentHM >= bStart && currentHM <= bEnd;
                            } else {
                                isBreak = currentHM >= bStart || currentHM <= bEnd;
                            }

                            if (isBreak) {
                                // Use break's own company_id if available, otherwise use shift's
                                const breakCompanyId = b.company_id || shift.company_id;
                                companyBreakMap[breakCompanyId] = b;
                                console.log(`✅ Break active for Company ${breakCompanyId}: ${b.break_type}`);
                            }
                        }
                    }

                    console.log(`⏱️ Companies on break: ${Object.keys(companyBreakMap).length}`);

                    // Process tasks for auto-pause
                    for (const task of activeTasks) {
                        const activeBreak = companyBreakMap[task.company_id];

                        // Skip if already processed or already paused
                        if (processedPauseTasks.has(task.id)) continue;
                        if (task.status === 'Paused') continue;
                        if (!activeBreak) continue;

                        // Mark as processed
                        processedPauseTasks.add(task.id);

                        const start = new Date(task.timer_start);
                        const sessionElapsed = Math.floor((now - start) / 1000);
                        const totalElapsed = (task.elapsed_seconds || 0) + sessionElapsed;

                        // Create TaskReason with proper fields
                        await TaskReason.create({
                            task_id: task.id,
                            reason_type: 3, // 3 = pause_reason
                            reason: activeBreak.break_type || 'Break',
                            company_id: task.company_id,
                            user_id: task.assigned_to
                        });

                        // Update Task
                        await Task.update({
                            status: 'Paused',
                            task_start: false,
                            timer_start: null,
                            elapsed_seconds: totalElapsed
                        }, { where: { id: task.id }, hooks: false });

                        const updatedTask = await Task.findByPk(task.id);
                        console.log(`⏸️ Auto-paused task ${task.id} for ${activeBreak.break_type}`);

                        // Emit socket event
                        try {
                            const io = getIO();
                            if (io) {
                                const taskData = updatedTask.get({ plain: true });
                                io.to(`user_${task.assigned_to}`).emit('task:updated', taskData);
                                io.to(`user_${task.assigned_to}`).emit('break:started', { break: activeBreak, taskId: task.id });
                            }
                        } catch (e) { console.error("Socket error:", e); }

                        // Send friendly push notification
                        if (task.AssignedTo?.expo_push_token) {
                            const msg = getBreakMessage(false, task.AssignedTo.username || 'there', task.title || task.project_title || task.Project_Title);
                            await sendPushNotification(task.AssignedTo.expo_push_token, msg.title, msg.body, { taskId: task.id, type: 'auto_paused' });
                        }
                    }
                }
            }

            // ========== AUTO-RESUME LOGIC ==========
            // Find tasks that were auto-paused and check if break is over
            const pausedTasks = await Task.findAll({
                where: {
                    status: { [Op.or]: ['Paused', 'paused'] }
                },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            // Manual pause reasons that should NOT auto-resume unless it's a designated break
            const manualPauseReasons = ['Call', 'Technical issue', 'Meeting', 'Shift over', 'Other', 'Personal Break'];

            if (pausedTasks.length > 0) {
                const companyIds = [...new Set(pausedTasks.map(t => t.company_id).filter(id => !!id))];
                if (companyIds.length > 0) {
                    const shifts = await Shift.findAll({
                        where: { company_id: { [Op.in]: companyIds } },
                        include: [{ model: ShiftBreak }]
                    });

                    // Build a map of valid break types per company
                    const companyBreakTypes = {};
                    for (const shift of shifts) {
                        const breaks = shift.shift_breaks || shift.ShiftBreaks || [];
                        const actualBreaks = Array.isArray(breaks) ? breaks : (shift.ShiftBreaks || []);
                        companyBreakTypes[shift.company_id] = actualBreaks.map(b => b.break_type).filter(Boolean);
                    }

                    // Check each paused task for auto-resume
                    for (const task of pausedTasks) {
                        if (processedResumeTasks.has(task.id)) continue;

                        // Find the last pause reason
                        const lastReason = await TaskReason.findOne({
                            where: { task_id: task.id, reason_type: 3 },
                            order: [['createdAt', 'DESC']]
                        });

                        if (!lastReason) continue;

                        // Check if the pause reason is a shift break type (and NOT a manual reason)
                        const validBreakTypes = companyBreakTypes[task.company_id] || [];
                        const isSystemAutoPause = validBreakTypes.some(bt =>
                            lastReason.reason && lastReason.reason.toLowerCase().includes(bt.toLowerCase())
                        );

                        // If it's a manual pause reason, don't auto-resume
                        // Crucially, if the user manually paused even with "Break", we might want to let them resume manually
                        // But if it's "Call" or "Meeting", definitely don't auto-resume.
                        if (manualPauseReasons.includes(lastReason.reason)) {
                            // console.log(`⏩ Skipping auto-resume for task ${task.id} (Manual reason: ${lastReason.reason})`);
                            continue;
                        }

                        // If it's not a recognized system break type and not in manual list, but has reason_type: 3
                        // it might be a generic manual "Break". We only auto-resume if it's specifically a system break.
                        if (!isSystemAutoPause && lastReason.reason === 'Break') {
                            // User manually paused for "Break". Let's not auto-resume to avoid forcing them back.
                            continue;
                        }

                        if (!isSystemAutoPause) continue;
                        const shift = shifts.find(s => s.company_id === task.company_id);
                        if (!shift) continue;

                        const breaks = shift.shift_breaks || shift.ShiftBreaks || [];
                        const actualBreaks = Array.isArray(breaks) ? breaks : (shift.ShiftBreaks || []);

                        let isCurrentlyInBreak = false;
                        let recentBreak = null;

                        for (const b of actualBreaks) {
                            if (!b.break_start || !b.break_end) continue;
                            const bStart = norm(b.break_start);
                            const bEnd = norm(b.break_end);

                            if (bStart <= bEnd) {
                                if (currentHM >= bStart && currentHM <= bEnd) {
                                    isCurrentlyInBreak = true;
                                    break;
                                }
                                // Check if break just ended (within last 2 minutes)
                                if (currentHM > bEnd && currentHM <= norm(addMinutes(bEnd, 2))) {
                                    recentBreak = b;
                                }
                            }
                        }

                        // If not in any break, auto-resume
                        if (!isCurrentlyInBreak) {
                            processedResumeTasks.add(task.id);

                            const resumeTime = now.toISOString();
                            await Task.update({
                                status: 'In Progress',
                                task_start: true,
                                timer_start: resumeTime
                            }, { where: { id: task.id }, hooks: false });

                            // Add entry to time_updates table (type 1 = start)
                            await TimeUpdate.create({
                                task_id: task.id,
                                user_id: task.assigned_to,
                                type: 1,
                                time_logged: resumeTime
                            });

                            const updatedTask = await Task.findByPk(task.id);
                            console.log(`▶️ Auto-resumed task ${task.id} after break`);

                            // Emit socket event
                            try {
                                const io = getIO();
                                if (io) {
                                    const taskData = updatedTask.get({ plain: true });
                                    io.to(`user_${task.assigned_to}`).emit('task:updated', taskData);
                                    io.to(`user_${task.assigned_to}`).emit('break:ended', { taskId: task.id });
                                }
                            } catch (e) { console.error("Socket error:", e); }

                            // Send friendly resume notification
                            if (task.AssignedTo?.expo_push_token) {
                                const msg = getBreakMessage(true, task.AssignedTo.username || 'there', task.title || task.project_title || task.Project_Title);
                                await sendPushNotification(task.AssignedTo.expo_push_token, msg.title, msg.body, { taskId: task.id, type: 'auto_resumed' });
                            }
                        }
                    }
                }
            }

            // Clear processed sets after each cycle
            processedPauseTasks.clear();
            processedResumeTasks.clear();

        } catch (err) {
            console.error('Auto Pause/Resume Cron Error:', err);
        }
    });

    // Helper function to add minutes to time string
    function addMinutes(timeStr, mins) {
        const [h, m] = timeStr.split(':').map(Number);
        const total = h * 60 + m + mins;
        const newH = Math.floor(total / 60) % 24;
        const newM = total % 60;
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    }

    // Track last notification sent per task to prevent duplicates
    const lastNotificationSent = new Map();
    const NOTIFICATION_COOLDOWN_MS = 25 * 60 * 1000; // 25 mins between notifications per task

    // 1. Every 30 minutes (at second 15): Check for PENDING tasks that were assigned but not started
    cron.schedule('15 */30 * * * *', async () => {
        try {
            const now = new Date();
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

            const pendingTasks = await Task.findAll({
                where: {
                    status: { [Op.or]: ['Pending', 'pending'] },
                    task_start: false,
                    createdAt: { [Op.lt]: fiveMinsAgo }
                },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            // Group by User to avoid duplicate notifications
            const userTasksMap = new Map();
            for (const task of pendingTasks) {
                if (!task.AssignedTo?.expo_push_token) continue;

                if (task.start) {
                    const taskStartDate = new Date(task.start);
                    if (taskStartDate > now) continue;
                }

                if (!userTasksMap.has(task.assigned_to)) {
                    userTasksMap.set(task.assigned_to, { user: task.AssignedTo, tasks: [] });
                }
                userTasksMap.get(task.assigned_to).tasks.push(task);
            }

            for (const [userId, data] of userTasksMap) {
                const { user, tasks } = data;

                // Check notification cooldown per user for pending reminders
                const lastSent = lastNotificationSent.get(`pending_user_${userId}`);
                if (lastSent && (now - lastSent) < NOTIFICATION_COOLDOWN_MS) continue;

                const taskTitles = tasks.map(t => `"${t.title || t.project_title || t.Project_Title}"`).join(', ');
                const displayTitle = tasks.length > 1 ? `${tasks.length} Pending Tasks` : tasks[0].title || tasks[0].project_title || tasks[0].Project_Title;

                await sendPushNotification(
                    user.expo_push_token,
                    'Task Reminder 🤨',
                    `Hey ${user.username || 'there'}, you have ${tasks.length === 1 ? 'a pending task' : 'pending tasks'}: ${displayTitle}. When will you start?`,
                    { type: 'reminder', count: tasks.length }
                );
                lastNotificationSent.set(`pending_user_${userId}`, now);
            }
        } catch (err) {
            console.error('Reminder Cron Error (Pending):', err);
        }
    });

    // 2. Every 60 minutes (at second 30): Check for ACTIVE tasks (Still Working?)
    cron.schedule('30 0 * * * *', async () => {
        try {
            const now = new Date();
            const activeTasks = await Task.findAll({
                where: {
                    task_start: { [Op.or]: [true, 1, '1'] },
                    status: { [Op.or]: ['In Progress', 'in progress'] }
                },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            // Group by User
            const userTasksMap = new Map();
            for (const task of activeTasks) {
                if (!task.AssignedTo?.expo_push_token) continue;
                if (!userTasksMap.has(task.assigned_to)) {
                    userTasksMap.set(task.assigned_to, { user: task.AssignedTo, tasks: [] });
                }
                userTasksMap.get(task.assigned_to).tasks.push(task);
            }

            for (const [userId, data] of userTasksMap) {
                const { user, tasks } = data;

                // Check notification cooldown per user - Using a more aggressive guard
                const lastSent = lastNotificationSent.get(`active_user_${userId}`);
                // Use 50 minutes as a hard minimum between these reminders
                if (lastSent && (now - lastSent) < 50 * 60 * 1000) continue;

                const displayTitle = tasks.length > 1 ? `${tasks.length} Active Tasks` : tasks[0].title || tasks[0].project_title || tasks[0].Project_Title;

                await sendPushNotification(
                    user.expo_push_token,
                    'Still Working ? 🚀',
                    `You are currently working on ${tasks.length === 1 ? 'this task' : 'these tasks'}: "${displayTitle}". Keep it up!`,
                    { type: 'active_reminder', count: tasks.length }
                );
                lastNotificationSent.set(`active_user_${userId}`, now);
            }
        } catch (err) {
            console.error('Reminder Cron Error (Active):', err);
        }
    });

    // 3. Every 10 minutes (at second 45): Check for PAUSED tasks (When will you resume?)
    cron.schedule('45 */10 * * * *', async () => {
        try {
            const now = new Date();
            const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);

            const pausedTasks = await Task.findAll({
                where: {
                    status: { [Op.or]: ['Paused', 'paused'] },
                    updatedAt: { [Op.lt]: tenMinsAgo }
                },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            // Group by User
            const userTasksMap = new Map();
            for (const task of pausedTasks) {
                if (!task.AssignedTo?.expo_push_token) continue;

                // Skip if auto-paused recently
                const lastAutoReason = await TaskReason.findOne({
                    where: { task_id: task.id, reason_type: 3 },
                    order: [['createdAt', 'DESC']]
                });
                if (lastAutoReason) {
                    const reasonAge = now - new Date(lastAutoReason.createdAt);
                    if (reasonAge < 30 * 60 * 1000) continue;
                }

                if (!userTasksMap.has(task.assigned_to)) {
                    userTasksMap.set(task.assigned_to, { user: task.AssignedTo, tasks: [] });
                }
                userTasksMap.get(task.assigned_to).tasks.push(task);
            }

            for (const [userId, data] of userTasksMap) {
                const { user, tasks } = data;

                // Check notification cooldown per user
                const lastSent = lastNotificationSent.get(`paused_user_${userId}`);
                if (lastSent && (now - lastSent) < NOTIFICATION_COOLDOWN_MS) continue;

                const displayTitle = tasks.length > 1 ? `${tasks.length} Paused Tasks` : tasks[0].title || tasks[0].project_title || tasks[0].Project_Title;

                await sendPushNotification(
                    user.expo_push_token,
                    'Task still Paused? ⏸️',
                    `Hey ${user.username || 'there'}, your ${tasks.length === 1 ? 'task' : 'tasks'} (${displayTitle}) ${tasks.length === 1 ? 'is' : 'are'} still paused. When will you resume?`,
                    { type: 'paused_reminder', count: tasks.length }
                );
                lastNotificationSent.set(`paused_user_${userId}`, now);
            }
        } catch (err) {
            console.error('Reminder Cron Error (Paused):', err);
        }
    });

    // 4. "No Task" Notification (Every 5 mins)
    // Checks 15-25 mins after shift start if user has no tasks
    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

            // Helper to parsing HH:MM to minutes
            const toMins = (t) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };
            const currentMins = toMins(currentTime);

            const shifts = await Shift.findAll();

            for (const shift of shifts) {
                if (!shift.shift_start) continue;

                const shiftStartMins = toMins(shift.shift_start.substring(0, 5));
                const diff = currentMins - shiftStartMins;

                // Check if we are in the 15-25 min window
                if (diff >= 15 && diff <= 25) {

                    // Check holidays
                    const companyId = shift.company_id;

                    // 1. Weekly holidays (Sunday, 2nd/4th Sat)
                    const day = now.getDay();
                    const date = now.getDate();
                    const week = Math.ceil(date / 7);

                    if (day === 0) continue; // Sunday
                    if (day === 6 && (week === 2 || week === 4)) continue; // 2nd/4th Sat

                    // 2. Declared Holidays
                    const holiday = await DeclaredHoliday.findOne({
                        where: {
                            company_id: companyId,
                            holiday_date: todayStr
                        }
                    });
                    if (holiday) continue;

                    // Fetch users for this company
                    const users = await User.findAll({ where: { company_id: companyId } });

                    for (const user of users) {
                        const notifKey = `no_task_${todayStr}_${user.id}`;
                        if (lastNotificationSent.has(notifKey)) continue;

                        // Check for tasks (Active or Pending)
                        const taskCount = await Task.count({
                            where: {
                                assigned_to: user.id,
                                status: { [Op.or]: ['Pending', 'In Progress', 'In complete', 'pending', 'in progress', 'paused', 'Paused'] }
                            }
                        });

                        if (taskCount === 0) {
                            if (user.expo_push_token) {
                                await sendPushNotification(
                                    user.expo_push_token,
                                    'No Tasks Assigned? 🧐',
                                    `Hey ${user.username}, no tasks assigned for today? Contact your admin for tasks!`,
                                    { type: 'no_task_reminder' }
                                );
                                lastNotificationSent.set(notifKey, now);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Reminder Cron Error (No Task):', err);
        }
    });
}

module.exports = { startReminderTicker };
