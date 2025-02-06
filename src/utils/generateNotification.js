const generateNotification = (type, message) => {
    const notificationTypes = ['success', 'error', 'info', 'warning'];
  
    if (!notificationTypes.includes(type)) {
      console.error(`Invalid notification type: ${type}`);
      return null;
    }
  
    return {
      type,
      message,
      timestamp: new Date().toISOString(),
    };
  };
  
  export default generateNotification;
  