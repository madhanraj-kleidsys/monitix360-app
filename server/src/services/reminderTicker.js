const cron = require('node-cron');
const { getIO } = require('../socket/socket');
const { Task, User, Shift, ShiftBreak, TaskReason } = require('../config/db');
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

    // Get friendly message based on break type and time
    const getBreakMessage = (breakType, isResume, userName, taskName) => {
        const bt = (breakType || '').toLowerCase();
        const isMorning = bt.includes('mrg') || bt.includes('morning') || bt.includes('tea');
        const isLunch = bt.includes('lunch') || bt.includes('noon') || bt.includes('afternoon');
        const isEvening = bt.includes('evening') || bt.includes('Break');

        if (!isResume) {
            // Pause messages
            if (isMorning) {
                return {
                    title: `☕ Tea Break Time, ${userName}!`,
                    body: `Your task "${taskName}" has been auto-paused. Enjoy your tea! ☕ You can resume manually if needed.`
                };
            } else if (isLunch) {
                return {
                    title: `🍽️ Lunch Time, ${userName}!`,
                    body: `Your task "${taskName}" is paused for lunch. Enjoy your meal! 🍴 Timer will resume after break.`
                };
            } else {
                return {
                    title: `⏸️ Break Time, ${userName}!`,
                    body: `Your task "${taskName}" has been auto-paused. Take a breather! 😊 You can resume manually anytime.`
                };
            }
        } else {
            // Resume messages
            if (isMorning) {
                return {
                    title: `🌅 Tea Break Over, ${userName}!`,
                    body: `Hope you enjoyed your tea! ☕ Your task "${taskName}" is now resumed. Let's get back to work! 💪`
                };
            } else if (isLunch) {
                return {
                    title: `🍽️ Lunch Break Ended, ${userName}!`,
                    body: `Had a good lunch? 😋 Your task "${taskName}" timer is running again. Ready to crush it! 🚀`
                };
            } else {
                return {
                    title: `▶️ Break Over, ${userName}!`,
                    body: `Your task "${taskName}" has been auto-resumed. Welcome back! Let's continue where you left off. 💼`
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

                    // Build break map
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
                                companyBreakMap[shift.company_id] = b;
                                break;
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
                            const msg = getBreakMessage(activeBreak.break_type, false, task.AssignedTo.username || 'there', task.title || task.project_title);
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

            if (pausedTasks.length > 0) {
                const companyIds = [...new Set(pausedTasks.map(t => t.company_id).filter(id => !!id))];
                if (companyIds.length > 0) {
                    const shifts = await Shift.findAll({
                        where: { company_id: { [Op.in]: companyIds } },
                        include: [{ model: ShiftBreak }]
                    });

                    // Check each paused task for auto-resume
                    for (const task of pausedTasks) {
                        if (processedResumeTasks.has(task.id)) continue;

                        // Find if this task was auto-paused (check last TaskReason)
                        const lastReason = await TaskReason.findOne({
                            where: { task_id: task.id, reason_type: 3 },
                            order: [['createdAt', 'DESC']]
                        });

                        if (!lastReason) continue; // Manual pause, don't auto-resume

                        // Check if any break is currently active for this company
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
                                const breakType = lastReason.reason || 'Break';
                                const msg = getBreakMessage(breakType, true, task.AssignedTo.username || 'there', task.title || task.project_title);
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

            for (const task of pendingTasks) {
                // Only send reminder if task start date/time has passed
                if (task.start) {
                    const taskStartDate = new Date(task.start);
                    if (taskStartDate > now) {
                        // Task start time is in the future, skip
                        continue;
                    }
                }

                // Check notification cooldown
                const lastSent = lastNotificationSent.get(`pending_${task.id}`);
                if (lastSent && (now - lastSent) < NOTIFICATION_COOLDOWN_MS) {
                    continue; // Skip, recently notified
                }

                if (task.AssignedTo && task.AssignedTo.expo_push_token) {
                    await sendPushNotification(
                        task.AssignedTo.expo_push_token,
                        'Task Reminder 🤨',
                        `Hey ${task.AssignedTo.username || 'there'}, task "${task.title || task.project_title || task.Project_Title}" is still Pending. When will you start?`,
                        { taskId: task.id, type: 'reminder' }
                    );
                    lastNotificationSent.set(`pending_${task.id}`, now);
                }
            }
        } catch (err) {
            console.error('Reminder Cron Error (Pending):', err);
        }
    });

    // 2. Every 15 minutes (at second 30): Check for ACTIVE tasks (Still Working?)
    cron.schedule('30 */15 * * * *', async () => {
        try {
            const now = new Date();
            const activeTasks = await Task.findAll({
                where: {
                    task_start: { [Op.or]: [true, 1, '1'] },
                    status: { [Op.or]: ['In Progress', 'in progress'] }
                },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            for (const task of activeTasks) {
                // Check notification cooldown
                const lastSent = lastNotificationSent.get(`active_${task.id}`);
                if (lastSent && (now - lastSent) < NOTIFICATION_COOLDOWN_MS) {
                    continue;
                }

                if (task.AssignedTo && task.AssignedTo.expo_push_token) {
                    await sendPushNotification(
                        task.AssignedTo.expo_push_token,
                        'Still Working ? 🚀',
                        `You are currently working on "${task.title || task.project_title || task.Project_Title}". Keep it up!`,
                        { taskId: task.id, type: 'active_reminder' }
                    );
                    lastNotificationSent.set(`active_${task.id}`, now);
                }
            }
        } catch (err) {
            console.error('Reminder Cron Error (Active):', err);
        }
    });

    // 3. Every 10 minutes (at second 45): Check for PAUSED tasks (When will you resume?)
    // Skip auto-paused tasks (they'll resume automatically)
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

            for (const task of pausedTasks) {
                // Check if this was auto-paused (has reason_type 3) - skip those as they'll auto-resume
                const lastAutoReason = await TaskReason.findOne({
                    where: { task_id: task.id, reason_type: 3 },
                    order: [['createdAt', 'DESC']]
                });
                if (lastAutoReason) {
                    // Check if the auto-pause was recent (within 30 mins) - skip
                    const reasonAge = now - new Date(lastAutoReason.createdAt);
                    if (reasonAge < 30 * 60 * 1000) continue;
                }

                // Check notification cooldown
                const lastSent = lastNotificationSent.get(`paused_${task.id}`);
                if (lastSent && (now - lastSent) < NOTIFICATION_COOLDOWN_MS) {
                    continue;
                }

                if (task.AssignedTo && task.AssignedTo.expo_push_token) {
                    const updatedAt = new Date(task.updatedAt);
                    const diffMins = Math.floor((Date.now() - updatedAt) / 60000);

                    await sendPushNotification(
                        task.AssignedTo.expo_push_token,
                        'Task still Paused? ⏸️',
                        `Hey ${task.AssignedTo.username || 'there'}, when will you start? You paused the task "${task.title || task.project_title || task.Project_Title}" about ${diffMins} minutes ago.`,
                        { taskId: task.id, type: 'paused_reminder' }
                    );
                    lastNotificationSent.set(`paused_${task.id}`, now);
                }
            }
        } catch (err) {
            console.error('Reminder Cron Error (Paused):', err);
        }
    });
}

module.exports = { startReminderTicker };
