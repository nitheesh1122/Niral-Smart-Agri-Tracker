/**
 * Notification utility service for backend
 * Send push notifications via Expo Push API
 */
const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send push notification to a single user
 * @param {string} expoPushToken - User's Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {object} data - Additional data payload
 * @param {string} channelId - Android notification channel
 */
async function sendPushNotification(expoPushToken, title, body, data = {}, channelId = 'default') {
    if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
        console.log('Invalid push token:', expoPushToken);
        return null;
    }

    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
        channelId,
        priority: 'high',
    };

    try {
        const response = await axios.post(EXPO_PUSH_URL, message, {
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
        });
        console.log('📤 Push notification sent:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending push notification:', error.message);
        return null;
    }
}

/**
 * Send push notification to multiple users
 * @param {Array} tokens - Array of Expo push tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {object} data - Additional data payload
 */
async function sendBulkPushNotifications(tokens, title, body, data = {}) {
    const validTokens = tokens.filter(t => t && t.startsWith('ExponentPushToken'));

    if (validTokens.length === 0) {
        console.log('No valid push tokens found');
        return [];
    }

    const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high',
    }));

    try {
        const response = await axios.post(EXPO_PUSH_URL, messages, {
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
        });
        console.log('📤 Bulk push notifications sent:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending bulk push notifications:', error.message);
        return [];
    }
}

/**
 * Send order status update notification
 */
async function sendOrderUpdateNotification(userToken, orderDetails) {
    const { itemName, status, exportId } = orderDetails;

    const statusMessages = {
        'Pending': `Your order for ${itemName} is pending confirmation`,
        'Started': `🚚 Your ${itemName} delivery has started!`,
        'Completed': `✅ Your ${itemName} has been delivered!`,
    };

    const body = statusMessages[status] || `Order status updated to ${status}`;

    return sendPushNotification(
        userToken,
        'Order Update',
        body,
        { type: 'order_update', exportId, status },
        'orders'
    );
}

/**
 * Send chat message notification
 */
async function sendChatNotification(userToken, senderName, message, chatData) {
    return sendPushNotification(
        userToken,
        `New message from ${senderName}`,
        message.length > 50 ? message.substring(0, 47) + '...' : message,
        { type: 'chat_message', ...chatData },
        'chat'
    );
}

module.exports = {
    sendPushNotification,
    sendBulkPushNotifications,
    sendOrderUpdateNotification,
    sendChatNotification,
};
