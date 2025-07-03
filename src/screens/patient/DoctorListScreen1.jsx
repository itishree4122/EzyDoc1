import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { BASE_URL } from "../auth/Api";
import { getToken } from "../auth/tokenHelper";
import { useNavigation } from "@react-navigation/native";
import { useLocation } from '../../context/LocationContext';
import { fetchWithAuth } from '../auth/fetchWithAuth';
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
        console.log("Fetching doctors from URL:", url);
    // const response = await fetch(url, {
    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`, // <-- Add the token here
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch doctors');
    }
    
    const data = await response.json();

    // Filter doctors by specialistName
    const filteredDoctors = data.filter(
      (doc) => doc.specialist.toLowerCase() === specialistName.toLowerCase()
    );
    setDoctors(filteredDoctors);
  } catch (error) {
    console.error(error);
    // Handle error (show alert or error message)
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


  const renderItem = ({ item }) => (
    <View style={styles.doctorCard}>
      <Text style={styles.doctorName}>{item.doctor_name}</Text>
      <Text>Clinic: {item.clinic_name}</Text>
      <Text>Address: {item.clinic_address}</Text>
      <Text>Experience: {item.experience} years</Text>
      {/* You can show profile image if available */}
      {item.profile_image && (
        <Image source={{ uri: item.profile_image }} style={styles.profileImage} />
      )}
      <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate("BookingScreen",
                {
                  doctor_name: item.doctor_name,
                  specialist: item.specialist,
                  doctor_user_id: item.doctor_user_id,
                  clinic_name: item.clinic_name,
                  clinic_address: item.clinic_address,
                  experience: item.experience,
                  patientId
                }
              )}>
                <Text style={styles.bookButtonText}>Book Now</Text>
              </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (doctors.length === 0) {
    return (
      <View style={styles.noData}>
        
        <Text>No doctors found for {specialistName}</Text>
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
      data={filteredDoctors}
      keyExtractor={(item) => item.doctor_user_id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
    
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
  doctorCard: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#e6e6e6',
    // borderTopWidth:4,
    borderBottomWidth: 4,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    elevation: 0,
    borderRightWidth: 2,
  borderLeftWidth: 2,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: 8,
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noData: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 20 },
  bookButton: {
    marginTop: 10,
    backgroundColor: '#1c78f2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'center',
    width: '100%',
    marginLeft: 10,
    marginRight: 10,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DoctorListScreen1;
