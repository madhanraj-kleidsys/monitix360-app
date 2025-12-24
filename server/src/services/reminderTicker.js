const cron = require('node-cron');
const { Task, User } = require('../config/db');
const { sendPushNotification } = require('./notificationService');
const { Op } = require('sequelize');

/**
 * Starts the reminder ticker to send push notifications for:
 * 1. Pending tasks (not started yet)
 * 2. Active tasks (still running)
 */
function startReminderTicker() {
    console.log('🔔 Reminder Ticker Started (Remote Push Mode)');

    // 1. Every 5 minutes: Check for PENDING tasks that were assigned but not started
    cron.schedule('*/5 * * * *', async () => {
        try {
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

            const pendingTasks = await Task.findAll({
                where: {
                    status: 'Pending',
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

    // 2. Every 15 minutes: Check for ACTIVE tasks (Still Working?)
    cron.schedule('*/15 * * * *', async () => {
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

    // 3. Every 10 minutes: Check for PAUSED tasks (When will you resume?)
    cron.schedule('*/10 * * * *', async () => {
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
