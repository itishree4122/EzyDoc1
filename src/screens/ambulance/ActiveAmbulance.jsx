import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  Switch,
  TouchableOpacity
} from 'react-native';

import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';

const ActiveAmbulance = ({ route }) => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const fetchAmbulances = async () => {
    const token = await getToken();
    if (!token) {
      console.error('Token not available');
      Alert.alert('Error', 'Access token not found');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/ambulance/status/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching ambulances:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to fetch ambulance list');
        return;
      }

      const data = await response.json();
      const allAmbulances = data.ambulances || [];

      const { ambulanceId } = route.params || {};
      if (ambulanceId) {
        const filtered = allAmbulances.filter(
          (item) => item.user?.toString() === ambulanceId.toString()
        );
        setAmbulances(filtered);
      } else {
        setAmbulances(allAmbulances);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Something went wrong while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAmbulanceStatus = async (ambulanceId, vehicleNumber, currentStatus) => {
  const token = await getToken();
  if (!token) return;

  try {
    const response = await fetch(
      `${BASE_URL}/ambulance/toggle/${ambulanceId}/${vehicleNumber}/`,
      {
        method: 'PUT', // now using PUT
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error updating status:', errorData);
      Alert.alert('Error', errorData.message || 'Failed to update status');
      return;
    }

    const result = await response.json();
    console.log('Status updated:', result.message);

    // Update the local ambulance list with new status
    setAmbulances((prev) =>
      prev.map((amb) =>
        amb.user === ambulanceId && amb.vehicle_number === vehicleNumber
          ? { ...amb, active: !currentStatus }
          : amb
      )
    );
  } catch (error) {
    console.error('Toggle error:', error);
    Alert.alert('Error', 'Failed to update ambulance status');
  }
};


  const renderAmbulanceCard = ({ item }) => (
  <View style={styles.card}>
    <View style={styles.cardContent}>
      <Text style={styles.name}>Service: {item.service_name}</Text>
      <Text>User ID: {item.user}</Text>
      <Text>Vehicle No: {item.vehicle_number}</Text>
      <Text>Phone: {item.phone_number}</Text>
      <Text>WhatsApp: {item.whatsapp_number}</Text>
      <Text>Service Area: {item.service_area}</Text>
      <Text>Status: {item.active ? 'Active' : 'Inactive'}</Text>
    </View>
    <Switch
  value={item.active}
  onValueChange={() => toggleAmbulanceStatus(item.user, item.vehicle_number, item.active)}
/>

  </View>
);


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ambulances}
        keyExtractor={(item) => `${item.user}_${item.vehicle_number}`}
        renderItem={renderAmbulanceCard}
        ListEmptyComponent={<Text style={styles.emptyText}>No ambulances found</Text>}
      />
    </View>
  );
};

export default ActiveAmbulance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'center',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#ccc',
  },
  selectedTab: {
    backgroundColor: '#007bff',
  },
  tabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f4f4f4',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
});
