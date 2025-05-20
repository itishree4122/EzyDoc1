// tokenHelper.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      console.log('Access token retrieved:', token); // debug log
      return token;
    } else {
      console.log('No access token found');
      return null;
    }
  } catch (error) {
    console.error('Failed to retrieve access token:', error);
    return null;
  }
};
