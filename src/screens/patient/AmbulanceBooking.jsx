import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { getToken } from '../auth/tokenHelper'; // Update with your actual token helper
import { BASE_URL } from '../auth/Api';
import { TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { useLocation } from '../../context/LocationContext';
import { fetchWithAuth } from '../auth/fetchWithAuth'
const AmbulanceBooking = () => {
   const navigation = useNavigation();
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
const { selectedLocation } = useLocation();

  const fetchAmbulances = async () => {
  const token = await getToken();
  if (!token) {
    console.error('Token not available');
    Alert.alert('Error', 'Access token not found');
    return;
  }

  let url = `${BASE_URL}/ambulance/status/`;
  if (
    selectedLocation &&
    selectedLocation !== 'Select Location' &&
    selectedLocation !== 'All'
  ) {
    url += `?location=${encodeURIComponent(selectedLocation)}`;
  }

  console.log('Fetching ambulance from URL:', url);

  try {
    // const response = await fetch(url, {
    const response = await fetchWithAuth(url, {
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

    // ✅ Filter active ambulances
    const activeAmbulances = allAmbulances.filter((amb) => amb.active === true);

    setAmbulances(activeAmbulances);
  } catch (error) {
    console.error('Fetch error:', error);
    Alert.alert('Error', 'Something went wrong while fetching data');
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchAmbulances();
  }, [selectedLocation]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.serviceName}>{item.service_name}</Text>
      <Text style={styles.areas}>{item.service_area}</Text>

      <View style={styles.contactRow}>
       <TouchableOpacity
  style={styles.contactItem}
  onPress={() => {
    if (item.phone_number) {
      Linking.openURL(`tel:${item.phone_number}`);
    }
  }}
>
  <Image source={require('../assets/ambulance/icons8-call-46.png')} style={styles.icon} />
  <Text style={styles.contactText}>{item.phone_number}</Text>
</TouchableOpacity>
        <TouchableOpacity
  style={styles.contactItem}
  onPress={() => {
    if (item.whatsapp_number) {
      const phone = item.whatsapp_number.replace(/[^\d]/g, ''); // Strip non-digits
      const url = `https://wa.me/${phone}`;
      Linking.openURL(url).catch(() => {
        Alert.alert("Error", "WhatsApp is not installed or the number is invalid.");
      });
    }
  }}
>
  <Image source={require('../assets/ambulance/wp.png')} style={styles.icon} />
  <Text style={styles.contactText}>{item.whatsapp_number}</Text>
</TouchableOpacity>

      </View>
    </View>
  );

  const filteredAmbulances = useMemo(() => {
  return ambulances.filter(
    (item) =>
      item.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.service_area?.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [ambulances, searchQuery]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  


  return (

    <>

    <View style={styles.toolbar}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <View style={styles.backIconContainer}>
                    <Image
                      source={require("../assets/UserProfile/back-arrow.png")} // Replace with your back arrow image
                      style={styles.backIcon}
                    />
                  </View>
                </TouchableOpacity>
            
          </View>
           {/* Search Bar */}
                 <View style={styles.searchContainer}>
                  <TextInput
                    placeholder="Search for doctors..."
                    placeholderTextColor="#888"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <Image
                    source={require("../assets/search.png")}
                    style={styles.searchIcon}
                  />
                </View>

                <FlatList
  data={filteredAmbulances}
  keyExtractor={(item, index) => index.toString()}
  renderItem={renderItem}
  contentContainerStyle={styles.list}
/>


    </>
   
  );
};

export default AmbulanceBooking;

const styles = StyleSheet.create({

  toolbar: {
    backgroundColor: "#1c78f2",
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 10, // Adds spacing between icon and title
  },
  backIconContainer: {
    width: 30,
    height: 30,
    backgroundColor: "#7EB8F9", // White background
    borderRadius: 20, // Makes it circular
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
    
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
    
    
  },
  
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 0,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: "#333",
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: "#999",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderColor: '#e6e6e6',
    borderBottomWidth: 4,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderWidth: 1,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0047ab'
  },
  areas: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    marginLeft: 6,
    fontSize: 14,
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#0047ab'
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
