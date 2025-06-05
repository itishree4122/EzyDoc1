// NotificationScreen.jsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useNotification } from '../util/NotificationContext';

const NotificationScreen = () => {
  const { notifications } = useNotification();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.notificationCard}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>{item.body}</Text>
            <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  notificationCard: { padding: 10, backgroundColor: '#f0f0f0', marginBottom: 10, borderRadius: 8 },
  title: { fontWeight: 'bold' },
  timestamp: { fontSize: 12, color: '#888', marginTop: 4 },
});
