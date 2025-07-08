import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import { useNavigation } from "@react-navigation/native";
import { useLocation } from '../../context/LocationContext';
import { fetchWithAuth } from '../auth/fetchWithAuth'
import Header from '../../components/Header';
import { checkUserProfileCompletion } from '../util/checkProfile';


const DoctorListScreen = ({route}) => {
  const {patientId} = route.params;
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
const [allDoctors, setAllDoctors] = useState([]); // full data set
const [searchQuery, setSearchQuery] = useState('');
const { selectedLocation } = useLocation();

const handleBook = async (item) => {
    const isComplete = await checkUserProfileCompletion(navigation);
    if (!isComplete) return;
    console.log("IsComplete",isComplete)
    navigation.navigate("BookingScreen", {
            doctor_name: item.doctor_name,
            specialist: item.specialist,
            doctor_user_id: item.doctor_user_id,
            clinic_name: item.clinic_name,
            clinic_address: item.clinic_address,
            experience: item.experience,
            location: item.location,
            bio: item.status,
            patientId,
              profile_image: item.profile_image

          })
  };
  const fetchDoctors = async () => {
    try {
      const token = await getToken();
      let url = `${BASE_URL}/doctor/get_all/`;
      if (selectedLocation && selectedLocation !== "Select Location" && selectedLocation !== "All") {
      url += `?location=${encodeURIComponent(selectedLocation)}`;
    }
    console.log("Fetching doctors from URL:", url);
      // const response = await fetch(url, {
      const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
        setAllDoctors(data); // store original list
      } else {
        console.error('Failed to fetch doctors:', response.status);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedLocation]);

  const filterDoctors = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setDoctors(allDoctors); // show all
      return;
    }
  
    const filtered = allDoctors.filter((doc) =>
      doc.doctor_name.toLowerCase().includes(query.toLowerCase()) ||
      doc.specialist.toLowerCase().includes(query.toLowerCase())
    );
  
    setDoctors(filtered);
  };
  
const renderProfileImage = (item) => {
  if (item.profile_image && item.profile_image.startsWith('data:image')) {
    // Already base64 data URI
    return (
      <Image
        source={{ uri: item.profile_image }}
        style={styles.profileImage}
      />
    );
  }
  if (item.profile_image && item.profile_image.length > 100) {
    // Assume base64 string, convert to data URI
    return (
      <Image
        source={{ uri: `data:image/jpeg;base64,${item.profile_image}` }}
        style={styles.profileImage}
      />
    );
  }
  if (item.profile_image) {
    // Assume it's a URL
    return (
      <Image
        source={{ uri: item.profile_image }}
        style={styles.profileImage}
      />
    );
  }
  // Fallback: show first letter
  const firstLetter = item.doctor_name ? item.doctor_name.charAt(0).toUpperCase() : "?";
  return (
    <View style={styles.profileImageFallback}>
      <Text style={styles.profileImageLetter}>{firstLetter}</Text>
    </View>
  );
};
  const renderDoctorCard = ({ item }) => {
    const defaultImage = require('../assets/UserProfile/profile-circle-icon.png'); // Replace with your default image path
    const imageSource = item.profile_image
      ? { uri: item.profile_image }
      : defaultImage;

    return (
      <View style={styles.card}>
      {/* Top Section: Profile + Doctor Info */}
      <View style={styles.topRow}>
        {/* <Image source={imageSource} style={styles.profileImage} /> */}
        {renderProfileImage(item)}
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.doctor_name}</Text>
          <Text style={styles.specialist}>{item.specialist}</Text>
          <Text style={styles.experience}>{`${item.experience} years of experience`}</Text>
        </View>
      </View>

      {/* Horizontal Line */}
      <View style={styles.horizontalLine} />

      {/* Address + Button Section */}
      <View style={styles.addressRow}>
        <View style={styles.addressContainer}>
          <Text style={styles.clinicName}>{item.clinic_name}</Text>
          <Text style={styles.clinicAddress}>{item.clinic_address}</Text>
          <Text style={styles.clinicLocation}>{item.location || 'Location not available'}</Text>
        </View>

        {/* <TouchableOpacity 
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
            patientId,
              profile_image: item.profile_image

          })}
        > */}
        <TouchableOpacity 
          style={styles.bookButton} 
  onPress={() => handleBook(item)}
        >
          <Text style={styles.bookButtonText}>Book a Visit</Text>
        </TouchableOpacity>
      </View>
    </View>
    
    );
  };

  return (
    <>
      {/* <View style={styles.toolbar}> */}
     {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <View style={styles.backIconContainer}>
                <Image
                  source={require("../assets/UserProfile/back-arrow.png")} // Replace with your back arrow image
                  style={styles.backIcon}
                />
              </View>
            </TouchableOpacity> */}
              {/* <BackButton /> */}


        
      {/* </View> */}
       {/* Search Bar */}
                     <Header/>

             <View style={styles.searchContainer}>
              <TextInput
                placeholder="Search for doctors..."
                placeholderTextColor="#888"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={filterDoctors}
              />
              <Image
                source={require("../assets/search.png")}
                style={styles.searchIcon}
              />
            </View>

            <Text style= {{display: 'none'}}>{patientId}</Text>

      <View style={styles.container}>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderDoctorCard}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
    </>
    
  );
};

export default DoctorListScreen;

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
    color: "#000",
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: "#999",
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 160,
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
  profileImageFallback: {
  width: 70,
  height: 70,
  borderRadius: 35,
  backgroundColor: "#e6f0ff",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "#1c78f2",
  marginRight: 15,
},
profileImageLetter: {
  fontSize: 32,
  color: "#1c78f2",
  fontWeight: "bold",
},
});
