const cron = require('node-cron');
const { getIO } = require('../socket/socket');
const { Task, User, Shift, ShiftBreak } = require('../config/db');
const { sendPushNotification } = require('./notificationService');
const { Op } = require('sequelize');

/**
 * Starts the reminder ticker to send push notifications for:
 * 1. Pending tasks (not started yet)
 * 2. Active tasks (still running)
 */
function startReminderTicker() {
    console.log('🔔 Reminder Ticker Started (Remote Push Mode)');

    // 0. Every minute: Run at second 0
    cron.schedule('0 * * * * *', async () => {
        try {
            const now = new Date();
            const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
            // Helper to normalize time "9:00" -> "09:00", "09:00:00" -> "09:00"
            const norm = (t) => {
                if (!t) return "";
                const parts = t.split(':');
                if (parts.length >= 2) {
                    const h = parts[0].padStart(2, '0');
                    const m = parts[1].padStart(2, '0');
                    return `${h}:${m}`; // HH:MM
                }
                return t;
            };
            const currentHM = norm(currentTime);

            // Find all tasks that are In Progress (case insensitive consideration if needed)
            const activeTasks = await Task.findAll({
                where: {
                    status: { [Op.or]: ['In Progress', 'in progress'] },
                    task_start: true
                },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            if (activeTasks.length > 0) {
                // 1. Get unique company IDs
                const companyIds = [...new Set(activeTasks.map(t => t.company_id).filter(id => !!id))];

                if (companyIds.length === 0) return;

                // 2. Fetch shifts for these companies in one query
                const shifts = await Shift.findAll({
                    where: { company_id: { [Op.in]: companyIds } },
                    include: [{ model: ShiftBreak }]
                });

                // 3. Map company -> active break (if any)
                const companyBreakMap = {};

                for (const shift of shifts) {
                    const breaks = shift.shift_breaks || shift.ShiftBreaks || [];
                    const actualBreaks = Array.isArray(breaks) ? breaks : (shift.ShiftBreaks || []);

                    for (const b of actualBreaks) {
                        if (!b.break_start || !b.break_end) continue;

                        const bStart = norm(b.break_start);
                        const bEnd = norm(b.break_end);

                        // Check if current time is within break time (Start <= Current < End)
                        // Use string comparison for HH:MM
                        if (currentHM >= bStart && currentHM <= bEnd) {
                            // Store active break for this company. 
                            // Note: Assuming one active shift per company for simplicity, or we match shift to user later if needed.
                            // ideally we should match user -> shift, but here we likely rely on company-wide shifts or assigned shifts.
                            // For now, mapping by company_id as per original logic.
                            companyBreakMap[shift.company_id] = b;
                            break;
                        }
                    }
                }

                console.log(`⏱️ Auto-Pause Ticker: ${activeTasks.length} active tasks, ${Object.keys(companyBreakMap).length} companies on break.`);

                // 4. Process tasks
                for (const task of activeTasks) {
                    const activeBreak = companyBreakMap[task.company_id];

                    if (activeBreak) {
                        // Double check if already paused
                        if (task.status === 'Paused') continue;

                        // Calculate elapsed
                        const start = new Date(task.timer_start);
                        const sessionElapsed = Math.floor((now - start) / 1000);
                        const totalElapsed = (task.elapsed_seconds || 0) + sessionElapsed;

                        // Update Task
                        await task.update({
                            status: 'Paused',
                            task_start: false,
                            timer_start: null,
                            elapsed_seconds: totalElapsed
                        });

                        console.log(`⏸️ Auto-pausing task ${task.id} (Company ${task.company_id}) due to break: ${activeBreak.break_type}`);

                        // Emit Socket Event
                        try {
                            const io = getIO();
                            if (io) {
                                io.to(`user_${task.assigned_to}`).emit('task:updated', task);
                                io.to(`user_${task.assigned_to}`).emit('break:started', {
                                    break: activeBreak,
                                    taskId: task.id
                                });
                            }
                        } catch (socketErr) {
                            console.error("Socket emit error:", socketErr);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Auto Pause Cron Error:', err);
        }
    });

    // 1. Every 30 minutes (at second 15): Check for PENDING tasks that were assigned but not started
    cron.schedule('15 */30 * * * *', async () => {
        try {
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

            const pendingTasks = await Task.findAll({
                where: {
                    status: 'Pending' || 'pending',
                    task_start: false,
                    createdAt: { [Op.lt]: fiveMinsAgo }
                },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            for (const task of pendingTasks) {
                if (task.AssignedTo && task.AssignedTo.expo_push_token) {
                    await sendPushNotification(
                        task.AssignedTo.expo_push_token,
                        'Task Reminder 🤨',
                        `Hey ${task.AssignedTo.username || 'there'}, task "${task.title || task.project_title || task.Project_Title}" is still Pending. When will you start?`,
                        { taskId: task.id, type: 'reminder' }
                    );
                }
            }
        } catch (err) {
            console.error('Reminder Cron Error (Pending):', err);
        }
    });

    // 2. Every 15 minutes (at second 30): Check for ACTIVE tasks (Still Working?)
    cron.schedule('30 */15 * * * *', async () => {
        try {
            const activeTasks = await Task.findAll({
                where: {
                    task_start: true,
                    status: 'In Progress'
                },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            for (const task of activeTasks) {
                if (task.AssignedTo && task.AssignedTo.expo_push_token) {
                    await sendPushNotification(
                        task.AssignedTo.expo_push_token,
                        'Still Working? 🚀',
                        `You are currently working on "${task.title || task.project_title || task.Project_Title}". Keep it up!`,
                        { taskId: task.id, type: 'active_reminder' }
                    );
                }
            }
        } catch (err) {
            console.error('Reminder Cron Error (Active):', err);
        }
    });

    // 3. Every 10 minutes (at second 45): Check for PAUSED tasks (When will you resume?)
    cron.schedule('45 */10 * * * *', async () => {
        try {
            const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);

            const pausedTasks = await Task.findAll({
                where: {
                    status: 'Paused',
                    updatedAt: { [Op.lt]: tenMinsAgo }
                },
                include: [{ model: User, as: 'AssignedTo' }]
            });

            for (const task of pausedTasks) {
                if (task.AssignedTo && task.AssignedTo.expo_push_token) {
                    const updatedAt = new Date(task.updatedAt);
                    const diffMins = Math.floor((Date.now() - updatedAt) / 60000);

                    await sendPushNotification(
                        task.AssignedTo.expo_push_token,
                        'Task still Paused? ⏸️',
                        `Hey ${task.AssignedTo.username || 'there'}, when will you start? You paused the task "${task.title || task.project_title || task.Project_Title}" about ${diffMins} minutes ago.`,
                        { taskId: task.id, type: 'paused_reminder' }
                    );
                }
            }
        } catch (err) {
            console.error('Reminder Cron Error (Paused):', err);
        }
    });
}

module.exports = { startReminderTicker };
