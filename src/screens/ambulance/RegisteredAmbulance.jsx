import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Image } from 'react-native';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';

const COLUMN_WIDTH = 120;

const RegisteredAmbulance = ({route}) => {
    const { ambulanceId } = route.params;
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);



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

    // Get ambulanceId from route.params
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


  useEffect(() => {
    fetchAmbulances();
  }, []);

  const handleDelete = async (ambulanceId, vehicleNumber) => {
  Alert.alert(
    'Confirm Delete',
    'Are you sure you want to delete this ambulance?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getToken();
            if (!token) {
              Alert.alert('Error', 'Access token not available');
              return;
            }

            const response = await fetch(
              `${BASE_URL}/ambulance/delete/${ambulanceId}/${vehicleNumber}/`,
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            const result = await response.json();

            if (response.ok) {
              Alert.alert('Success', result.message || 'Deleted successfully');
              // Remove deleted ambulance from the state
              setAmbulances((prev) =>
                prev.filter(
                  (item) =>
                    item.user !== ambulanceId ||
                    item.vehicle_number !== vehicleNumber
                )
              );
            } else {
              Alert.alert('Error', result.message || 'Delete failed');
            }
          } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Error', 'Something went wrong during deletion');
          }
        },
      },
    ]
  );
};


  const renderItem = ({ item }) => (
  <View style={styles.row}>
    <View style={styles.cellContainer}>
      <Text style={styles.cellText}>{item.service_name}</Text>
    </View>
    <View style={styles.cellContainer}>
      <Text style={styles.cellText}>{item.vehicle_number}</Text>
    </View>
    <View style={styles.cellContainer}>
      <Text style={styles.cellText}>{item.phone_number}</Text>
    </View>
    <View style={styles.cellContainer}>
      <Text style={styles.cellText}>{item.whatsapp_number}</Text>
    </View>
    <View style={styles.cellContainer}>
      {(item.service_area || '')
        .split(',')
        .map((area, idx) => (
          <Text key={idx} style={styles.cellText}>{area.trim()}</Text>
        ))}
    </View>
    <View style={styles.cellContainer}>
      <Text style={[styles.cellText, { color: item.active ? 'green' : 'red' }]}>
        {item.active ? 'Active' : 'Inactive'}
      </Text>
    </View>
    <View style={[styles.cellContainer, styles.actionCell]}>
      <TouchableOpacity onPress={() => handleDelete(item.user, item.vehicle_number)}>
        <Image
          source={require('../assets/doctor/bin.png')}
          style={styles.icon}
        />
      </TouchableOpacity>
    </View>
  </View>
);



  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <ScrollView horizontal>
          <View style={styles.tableWrapper}> {/* 👈 Add wrapper for margin */}
          <View style={[styles.row, styles.headerRow]}>
  <View style={styles.cellContainer}>
    <Text style={[styles.cellText, styles.headerText]}>Service Name</Text>
  </View>
  <View style={styles.cellContainer}>
    <Text style={[styles.cellText, styles.headerText]}>Vehicle No.</Text>
  </View>
  <View style={styles.cellContainer}>
    <Text style={[styles.cellText, styles.headerText]}>Phone No.</Text>
  </View>
  <View style={styles.cellContainer}>
    <Text style={[styles.cellText, styles.headerText]}>WhatsApp</Text>
  </View>
  <View style={styles.cellContainer}>
    <Text style={[styles.cellText, styles.headerText]}>Area(s)</Text>
  </View>
  <View style={styles.cellContainer}>
    <Text style={[styles.cellText, styles.headerText]}>Status</Text>
  </View>
  <View style={[styles.cellContainer, styles.actionCell]}>
    <Text style={[styles.cellText, styles.headerText]}>Action</Text>
  </View>
</View>

          <FlatList
            data={ambulances}
            keyExtractor={(item, index) => `${item.user}-${index}`}
            renderItem={renderItem}
          />
        </View>
        </ScrollView>
      )}
    </View>
  );
};

export default RegisteredAmbulance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  tableWrapper: {
  margin: 20,          // Adds space around the table
  
  paddingBottom: 10,
},

  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  cellContainer: {          // renamed from 'cell'
    width: COLUMN_WIDTH,
    paddingHorizontal: 5,
    justifyContent: 'center',
  },
  cellText: {               // new style for text inside cell
    fontSize: 14,
    lineHeight: 20,
  },
  headerRow: {
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 2,
  },
  headerText: {
    fontWeight: 'bold',
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: 'red',
    // alignSelf: 'center',
  },
  actionCell: {
    justifyContent: 'center',
    // alignItems: 'center',
  },
});
