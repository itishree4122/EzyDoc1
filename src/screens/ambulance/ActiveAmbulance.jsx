import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  Switch,
  TextInput,
  Image,
  TouchableOpacity
} from 'react-native';

import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import phoneIcon from '../assets/ambulance/icons8-call-46.png'; 
import wpIcon from '../assets/ambulance/wp.png'; 
import { useNavigation } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth';

const ActiveAmbulance = ({ route }) => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const navigation  = useNavigation();   

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
      // const response = await fetch(`${BASE_URL}/ambulance/status/`, {
      const response = await fetchWithAuth(`${BASE_URL}/ambulance/status/`, {
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
    // const response = await fetch(
    const response = await fetchWithAuth(
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

 const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) setSearchText('');
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    applyFilters(searchText, status);
  };
  
const filteredAmbulances = ambulances.filter(
  (item) =>
    item.service_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.vehicle_number?.toLowerCase().includes(searchText.toLowerCase())
);


const renderAmbulanceCard = ({ item }) => (
  <View style={styles.card}>
    <View style={styles.cardContent}>
      <Text style={styles.name}>
        Service: {item.service_name} (ID: {item.user})
      </Text>
      <Text>Vehicle No: {item.vehicle_number}</Text>
      <Text>Service Area: {item.service_area}</Text>

      {/* Horizontal line */}
      <View style={styles.horizontalLine} />

      {/* Phone & WhatsApp side by side */}
      <View style={styles.contactRow}>
        <View style={styles.contactBox}>
          <Image source={wpIcon} style={styles.icon} />
          <Text>{item.whatsapp_number}</Text>
        </View>

        {/* Vertical divider */}
        <View style={styles.verticalLine} />

        <View style={styles.contactBox}>
          <Image source={phoneIcon} style={styles.icon} />
          <Text>{item.phone_number}</Text>
        </View>
      </View>

      <Text style={[styles.status, { color: item.active ? '#1c78f2' : '#F44336' }]}>
        Status: {item.active ? 'Active' : 'Inactive'}
      </Text>
    </View>

    <Switch
      value={item.active}
      onValueChange={() =>
        toggleAmbulanceStatus(item.user, item.vehicle_number, item.active)
      }
      thumbColor={item.active ? '#1c78f2' : '#ccc'}
      trackColor={{ false: '#ccc', true: '#4D97F5' }}
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

    <View style={styles.toolbar}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image source={require('../assets/left-arrow.png')} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.title}>Ambulance Status</Text>
            <TouchableOpacity onPress={toggleSearch}>
              <Image source={require('../assets/search.png')} style={styles.searchIcon} />
            </TouchableOpacity>
          </View>

          {searchVisible && (
  <View style={styles.searchContainer}>
    <TextInput
      style={styles.searchInput}
      placeholder="Search by service name, vehicle number..."
      value={searchText}
      onChangeText={(text) => setSearchText(text)}
      placeholderTextColor="#999"
    />
  </View>
)}


      <FlatList
        data={filteredAmbulances}
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
    
  },

  // 🔝 Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    zIndex: 10,
    paddingTop: 50  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#000',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchIcon: {
    width: 22,
    height: 22,
    tintColor: '#000',
  },

  // 🔍 Search Bar
  searchInput: {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: '#ccc',
  marginHorizontal: 16,
  marginTop: 8,
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 8,
  fontSize: 16,
  color: '#333',
},

 
 card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  horizontalLine: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactBox: {
    flex: 1,
    alignItems: 'center',
  },
  contactLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  verticalLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#ccc',
    marginHorizontal: 10,
  },
  status: {
    fontWeight: '600',
    marginTop: 6,
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
  icon: {
  width: 20,
  height: 20,
  marginBottom: 4,
  resizeMode: 'contain',
  tintColor: '#1c78f2',
},

// searchInput
searchContainer: {
  backgroundColor: '#f0f0f0',
  paddingHorizontal: 12,
  paddingVertical: 8,
},

searchInput: {
  backgroundColor: '#fff',
  paddingHorizontal: 10,
  paddingVertical: 8,
  borderRadius: 8,
  borderColor: '#ccc',
  borderWidth: 1,
  fontSize: 16,
},


});
