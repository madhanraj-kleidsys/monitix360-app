import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Setup Android notification channel (required for heads-up notifications)
if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
    });
}

export const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    return finalStatus === 'granted';
};

export const scheduleLocalNotification = async (title, body, data = {}, seconds = 1) => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
                priority: Notifications.AndroidImportance.HIGH,
                android: { channelId: 'default' },
            },
            trigger: seconds > 0 ? {
                type: 'timeInterval',
                seconds: seconds,
                repeats: false,
            } : null,
        });
        console.log(`✅ Notification scheduled: ${title}`);
    } catch (err) {
        console.error('❌ scheduleLocalNotification Error:', err);
    }
};

export const scheduleTaskReminder = async (taskId, taskName, delaySeconds = 180) => {
    try {
        console.log(`📅 Scheduling reminder for task ${taskId} in ${delaySeconds}s`);
        return await Notifications.scheduleNotificationAsync({
            content: {
                title: "Task Reminder 🤨",
                body: `Hey, task "${taskName}" was assigned. When will you start?`,
                data: { taskId, type: 'reminder' },
                sound: true,
                priority: Notifications.AndroidImportance.HIGH,
                android: { channelId: 'default' },
            },
            trigger: {
                type: 'timeInterval',
                seconds: delaySeconds,
                repeats: false,
            },
        });
    } catch (err) {
        console.error('❌ scheduleTaskReminder Error:', err);
    }
};

export const scheduleActiveTaskReminder = async (taskId, taskName) => {
    try {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title: "Still Working? 🚀",
                body: `You are currently working on "${taskName}". Keep it up!`,
                data: { taskId, type: 'active_reminder' },
                sound: true,
                priority: Notifications.AndroidImportance.HIGH,
                android: { channelId: 'default' },
            },
            trigger: {
                type: 'timeInterval',
                seconds: 60, // Every 1 minute for "active" tasks
                repeats: true,
            },
        });
    } catch (err) {
        console.error('❌ scheduleActiveTaskReminder Error:', err);
    }
};

export const cancelNotification = async (id) => {
    if (!id) return;
    try {
        await Notifications.cancelScheduledNotificationAsync(id);
    } catch (err) {
        console.error('❌ cancelNotification Error:', err);
    }
};

export const cancelAllTaskNotifications = async (taskId) => {
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content.data?.taskId === taskId) {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
        }
    } catch (err) {
        console.error('❌ cancelAllTaskNotifications Error:', err);
    }
};
