import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { getToken } from '../auth/tokenHelper'; // adjust path as needed

const useFCMSetup = () => {
  useEffect(() => {
    let unsubscribeTokenRefresh = null;
    let unsubscribeForeground = null;

    const setupFCM = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const fcmToken = await messaging().getToken();
          console.log('FCM Token:', fcmToken);
          await sendTokenToBackend(fcmToken);

          // Token refresh
          unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
            await sendTokenToBackend(newToken);
          });

          // Foreground message
          unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
            console.log('Foreground FCM message:', remoteMessage);

            const channelId = await notifee.createChannel({
              id: 'default',
              name: 'Default Channel',
              importance: AndroidImportance.HIGH,
            });

            await notifee.displayNotification({
              title: remoteMessage.notification?.title || 'New Notification',
              body: remoteMessage.notification?.body || 'You have a new message',
              android: {
                channelId,
                smallIcon: 'ic_notification',
                pressAction: { id: 'default' },
              },
            });
          });

          // Notifee permissions
          await notifee.requestPermission();
        }
      } catch (error) {
        console.error('FCM setup failed:', error);
      }
    };

    setupFCM();

    return () => {
      if (unsubscribeTokenRefresh) unsubscribeTokenRefresh();
      if (unsubscribeForeground) unsubscribeForeground();
    };
  }, []);
};

const sendTokenToBackend = async (fcmToken) => {
  try {
    const token = await getToken();
    if (!token) {
      console.warn('Access token is missing, cannot send FCM token.');
      return;
    }

    const response = await fetch('https://ezydoc.pythonanywhere.com/users/firebase-token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        firebase_registration_token: fcmToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to send FCM token to backend:', data);
    } else {
      console.log('FCM token sent successfully:', data.message);
    }
  } catch (error) {
    console.error('Error sending FCM token:', error);
  }
};

export default useFCMSetup;
