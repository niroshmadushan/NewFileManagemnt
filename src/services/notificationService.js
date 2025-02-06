import generateNotification from '../utils/generateNotification';

let notifications = []; // Local storage for notifications (can be replaced with an API)

// Add a notification
export const addNotification = (type, message) => {
  const notification = generateNotification(type, message);

  if (notification) {
    notifications.push(notification);
    console.log(`Notification added: [${notification.type}] ${notification.message}`);
    return notification;
  }

  console.error('Failed to generate notification.');
  return null;
};

// Get all notifications
export const getNotifications = () => {
  return notifications;
};

// Clear notifications
export const clearNotifications = () => {
  notifications = [];
  console.log('All notifications cleared.');
};

// Example: Display notifications in UI (can be customized for your app)
export const displayNotification = (type, message) => {
  const notification = addNotification(type, message);
  if (notification) {
    alert(`[${notification.type.toUpperCase()}]: ${notification.message}`);
  }
};
