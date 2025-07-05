import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { BASE_URL } from "../auth/Api";
import { getToken } from "../auth/tokenHelper";
import { useNavigation } from "@react-navigation/native";
import { useLocation } from '../../context/LocationContext';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Header from '../../components/Header';


const DoctorListScreen1 = ({ route }) => {
  const { specialistName, patientId } = route.params;
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const { selectedLocation } = useLocation();

  const fetchDoctors = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert("Error", "Access token not found");
      return;
    }

    try {
      let url = `${BASE_URL}/doctor/get_all/`;
      if (selectedLocation && selectedLocation !== "Select Location" && selectedLocation !== "All") {
        url += `?location=${encodeURIComponent(selectedLocation)}`;
      }

      const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      const filteredDoctors = data.filter(
        (doc) => doc.specialist.toLowerCase() === specialistName.toLowerCase()
      );
      setDoctors(filteredDoctors);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedLocation]);

  const filteredDoctors = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return doctors.filter((doc) =>
      doc.doctor_name.toLowerCase().includes(query) ||
      doc.clinic_name.toLowerCase().includes(query)
    );
  }, [doctors, searchQuery]);

  const renderItem = ({ item }) => {
    const defaultImage = require('../assets/UserProfile/profile-circle-icon.png');
    const imageSource = item.profile_image ? { uri: item.profile_image } : defaultImage;

    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Image source={imageSource} style={styles.profileImage} />
          <View style={styles.textContainer}>
            <Text style={styles.name}>{item.doctor_name}</Text>
            <Text style={styles.specialist}>{item.specialist}</Text>
            <Text style={styles.experience}>{`${item.experience} years of experience`}</Text>
          </View>
        </View>

        <View style={styles.horizontalLine} />

        <View style={styles.addressRow}>
          <View style={styles.addressContainer}>
            <Text style={styles.clinicName}>{item.clinic_name}</Text>
            <Text style={styles.clinicAddress}>{item.clinic_address}</Text>
            <Text style={styles.clinicLocation}>{item.location || 'Location not available'}</Text>
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => navigation.navigate("BookingScreen", {
              doctor_name: item.doctor_name,
              specialist: item.specialist,
              doctor_user_id: item.doctor_user_id,
              clinic_name: item.clinic_name,
              clinic_address: item.clinic_address,
              experience: item.experience,
              location: item.location,
              bio: item.status,
              patientId
            })}
          >
            <Text style={styles.bookButtonText}>Book a Visit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <>
    <Header/>

      {/* <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.backIconContainer}>
            <Image
              source={require("../assets/UserProfile/back-arrow.png")}
              style={styles.backIcon}
            />
          </View>
        </TouchableOpacity>
      </View> */}

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

      {filteredDoctors.length > 0 ? (
        <FlatList
          data={filteredDoctors}
          keyExtractor={(item) => item.doctor_user_id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.noData}>
          <Text>No doctors found for {specialistName}</Text>
        </View>
      )}
    </>
  );
};


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
    marginTop: -10,
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  specialist: {
    fontSize: 15,
    color: '#666',
    marginBottom: 2,
  },
  experience: {
    fontSize: 13,
    color: '#888',
  },
  horizontalLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginVertical: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressContainer: {
    flex: 1,
  },
  clinicName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  clinicAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  clinicLocation: {
    fontSize: 12,
    color: '#999',
  },
  bookButton: {
    backgroundColor: '#1c78f2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 10,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noData: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 20, paddingHorizontal: 16, },
  noData: {
  padding: 20,
  alignItems: 'center',
},

});

export default DoctorListScreen1;
