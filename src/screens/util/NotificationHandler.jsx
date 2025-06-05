import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';

const NotificationHandler = () => {
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      if (remoteMessage?.notification) {
        const { title, body } = remoteMessage.notification;
        Alert.alert(title ?? 'Notification', body ?? 'You received a new message');
      }
    });

    return unsubscribe;
  }, []);

  return null; // This is just a handler component; no UI
};

export default NotificationHandler;
