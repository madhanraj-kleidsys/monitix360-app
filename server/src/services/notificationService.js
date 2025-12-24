const axios = require('axios');

/**
 * Sends a push notification via Expo's Push API
 * @param {string} pushToken - The recipient's Expo Push Token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
async function sendPushNotification(pushToken, title, body, data = {}) {
    if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
        console.log('Skipping push: Invalid or missing token');
        return;
    }

    const message = {
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        priority: 'high',
        channelId: 'default',
    };

    try {
        const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
        });
        console.log('Push Notification Sent:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending push notification:', error.response ? error.response.data : error.message);
    }
}

module.exports = { sendPushNotification };
