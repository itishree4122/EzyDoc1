// LabTypesScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';

const LabTestClinics = () => {
  const [labTypes, setLabTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const fetchLabTypes = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token not found');

    const response = await fetch(`${BASE_URL}/labs/lab-types/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Unexpected response format');

    const normalizedData = data.map(item => ({
      ...item,
      lab_profiles: Array.isArray(item.lab_profiles) ? item.lab_profiles : [],
    }));

    setLabTypes(normalizedData);
  } catch (error) {
    console.error('Error fetching lab types:', error.message);
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchLabTypes();
  }, []);

  const renderItem = ({ item }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() =>
      navigation.navigate('BookingLabScreen', {
        labName: item.name,
        services: item.tests,
        labProfile: item.lab_profiles.length > 0 ? {
    name: item.lab_profiles[0].name,
    address: item.lab_profiles[0].address,
    phone: item.lab_profiles[0].phone,
    id: item.lab_profiles[0].id,
  } : null,
      })
    }>
    <Text style={styles.name}>{item.name}</Text>
    <Text style={styles.tests}>Tests: {item.tests.join(', ')}</Text>

    {item.lab_profiles.length > 0 ? (
      item.lab_profiles.map((profile, index) => (
        <View key={index} style={styles.profileContainer}>
          <Text style={styles.profileText}><Text style={styles.boldLabel}>Lab Name:</Text> {profile.name}</Text>
          <Text style={styles.profileText}><Text style={styles.boldLabel}>Address:</Text> {profile.address}</Text>
          <Text style={styles.profileText}><Text style={styles.boldLabel}>Phone:</Text> {profile.phone}</Text>
          <Text style={styles.profileText}><Text style={styles.boldLabel}>ID:</Text> {profile.id}</Text>
        </View>
      ))
    ) : (
      <Text style={styles.tests}>Lab Profile: Not Available</Text>
    )}
  </TouchableOpacity>
);


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
      data={labTypes}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      ListHeaderComponent={
        <>
          {/* <Text style={styles.header}>Lab Types</Text> */}
          {loading && <ActivityIndicator size="large" color="#007BFF" />}
        </>
      }
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        !loading && <Text style={styles.noDataText}>No lab types found.</Text>
      }
    />
    </>
    
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
   
    flexGrow: 1, // Important to make sure the whole screen scrolls
  },

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
    backgroundColor: "#AFCBFF", // White background
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
    elevation: 2,
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
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tests: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  profileContainer: {
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  profileText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
  },
  boldLabel: {
    fontWeight: 'bold',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 16,
  },
 
});

export default LabTestClinics;
