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
        lightColor: '#ff0400ff',
    });
}

export const registerForPushNotifications = async () => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Permission not granted for push notifications');
            return null;
        }

        const token = (await Notifications.getExpoPushTokenAsync({
            projectId: '0b1cf24e-c39f-4284-a820-84322836ddcf'
        })).data;
        console.log('🚀 Expo Push Token:', token);
        return token;
    } catch (err) {
        console.error('❌ Failed to get push token:', err);
        return null;
    }
};

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

export const scheduleTaskReminder = async (user, taskId, taskName, delaySeconds = 180) => {
    try {
        console.log(`📅 Scheduling reminder for task ${taskId} in ${delaySeconds}s`);
        console.log(user.username);

        return await Notifications.scheduleNotificationAsync({
            content: {
                title: "⚠️Task Reminder 🤨",
                body: `Hey ${user.username}, task "${taskName}" is still Pending. When will you start?`,
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

export const scheduleActiveTaskReminder = async (user, taskId, taskName) => {
    try {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title: `Hey ${user.username} are you Working ? 🤔`,
                body: `You are currently working on "${taskName}" right ?. Keep it up!`,
                data: { taskId, type: 'active_reminder' },
                sound: true,
                priority: Notifications.AndroidImportance.HIGH,
                android: { channelId: 'default', sticky: true },
            },
            trigger: {
                type: 'timeInterval',
                seconds: 3600,
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
