import React, { useState, useEffect, useRef } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
  ScrollView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import useFCMSetup from '../util/useFCMSetup'; 
import { getToken } from '../auth/tokenHelper';
const { width } = Dimensions.get('window');
import { BASE_URL } from "../auth/Api";
const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();
  const [selectedLocation, setSelectedLocation] = useState("Select Location");
  const [patientId, setPatientId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [labs, setLabs] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchResults, setSearchResults] = useState({doctors: [], labs: []});

  const specialists = [
    { name: "Cardiologist", image: require("../assets/specialists/cardio.png") },
    { name: "Endocrinologist", image: require("../assets/specialists/endocrine.png") },
    { name: "Orthopedic", image: require("../assets/specialists/joint.png") },
    { name: "Dermatologist", image: require("../assets/specialists/dermatology.png") },
    { name: "Pediatrician", image: require("../assets/specialists/doctor.png") },
    { name: "Eye Specialist", image: require("../assets/specialists/testingglasses.png") },
    { name: "ENT Specialist", image: require("../assets/specialists/throat.png") },
    { name: "Urologist", image: require("../assets/specialists/endocrine.png") },
  ];
  // Fetch patientId from storage
  useEffect(() => {
    const fetchPatientId = async () => {
      try {
        const id = await AsyncStorage.getItem('patientId');
        if (id) setPatientId(id);
      } catch (error) {
        console.error('Error fetching patientId:', error);
      }
    };
    fetchPatientId();
  }, []);

  // FCM setup
  useFCMSetup();

  // Fetch all doctors on mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/doctor/get_all/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
        setAllDoctors(data);
      } else {
        setDoctors([]);
        setAllDoctors([]);
        console.error('Failed to fetch doctors:', response.status);
      }
    } catch (error) {
      setDoctors([]);
      setAllDoctors([]);
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search on button click
  const handleSearchButton = async () => {
    if (!searchQuery.trim()) {
      setSearchResults({doctors: [], labs: []});
      setModalVisible(true);
      return;
    }
    setSearching(true);
    try {
      console.log('BASE_URL:', BASE_URL);

      // const token = await getToken();
      const response = await fetch(`${BASE_URL}/labs/search/?q=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          // 'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
          console.log('API data:', data); // <-- Add this

        const doctors = (data.doctors || []).map(doc => ({
          ...doc,
          doctor_id: doc.doctor || doc.doctor_user_id,
        }));
        console.log('Search response:', response);
      console.log('Search query:', searchQuery);
      console.log('Search encode query:', encodeURIComponent(searchQuery));
        setSearchResults({
          doctors,
          labs: data.labs || []
        });
      } else {
        console.error('Search failed:', response.status);
        setSearchResults({doctors: [], labs: []});
      }
    } catch (error) {
      console.error('Error during search:', error);
      setSearchResults({doctors: [], labs: []});
    } finally {
      setSearching(false);
      setModalVisible(true);
    }
  };

  const handleSpecialistPress = (specialistName) => {
    navigation.navigate('DoctorListScreen1', { specialistName, patientId });
  };

  // Doctor card renderer for modal
  const renderDoctorCard = ({ item }) => (
  <TouchableOpacity
    style={styles.resultCard}
    onPress={() => {
      setModalVisible(false);
      navigation.navigate("BookingScreen", {
        doctor_user_id: item.doctor_id,
        doctor_name: item.doctor_name || `${item.first_name || ""} ${item.last_name || ""}`,
        specialist: item.specialist,
        clinic_name: item.clinic_name,
        clinic_address: item.clinic_address,
        experience: item.experience,
        patientId: patientId,
      });
    }}
  >
    <Image
      source={item.profile_image ? { uri: item.profile_image } : require("../assets/profile-picture.png")}
      style={styles.resultAvatar}
    />
    <View style={{ flex: 1 }}>
      <Text style={styles.resultTitle}>{item.doctor_name || item.first_name + " " + item.last_name}</Text>
      <Text style={styles.resultSubtitle}>{item.specialist}</Text>
      <Text style={styles.resultInfo}>Experience: {item.experience} yrs</Text>
      <Text style={styles.resultInfo}>{item.clinic_name}</Text>
    </View>
  </TouchableOpacity>
);
  // Lab card renderer for modal
  // const renderLabCard = ({ item }) => (
  //   <TouchableOpacity
  //     style={styles.resultCard}
  //     onPress={() => {
  //       setModalVisible(false);
  //       navigation.navigate("LabTestClinics", { lab: item });
  //     }}
  //   >
  //     <Image
  //       source={require("../assets/homepage/blood-test.png")}
  //       style={styles.resultAvatar}
  //     />
  //     <View style={{ flex: 1 }}>
  //       <Text style={styles.resultTitle}>{item.name}</Text>
  //       <Text style={styles.resultSubtitle}>{item.address}</Text>
  //       <Text style={styles.resultInfo}>Phone: {item.phone}</Text>
  //       <Text style={styles.resultInfo}>
  //         {item.home_sample_collection ? "Home Sample: Yes" : "Home Sample: No"}
  //       </Text>
  //     </View>
  //   </TouchableOpacity>
  // );
  const renderLabCard = ({ item }) => (
  <TouchableOpacity
    style={styles.resultCard}
    onPress={() => {
      setModalVisible(false);
      navigation.navigate("BookingLabScreen", {
        lab: item,
        patientId: patientId,
      });
    }}
  >
    <Image
      source={require("../assets/homepage/blood-test.png")}
      style={styles.resultAvatar}
    />
    <View style={{ flex: 1 }}>
      <Text style={styles.resultTitle}>{item.name}</Text>
      <Text style={styles.resultSubtitle}>{item.address}</Text>
      <Text style={styles.resultInfo}>Phone: {item.phone}</Text>
      <Text style={styles.resultInfo}>
        {item.home_sample_collection ? "Home Sample: Yes" : "Home Sample: No"}
      </Text>
    </View>
  </TouchableOpacity>
);

  // Header for FlatList (all your top content)
  const ListHeaderComponent = (
    <>
      {/* Top CardView with Location, Notification, Help Icons, Text & Search Bar */}
      <View style={styles.topCardView}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.locationContainer}
            onPress={() => navigation.navigate("LocationScreen", { setSelectedLocation })}
          >
            <Image source={require("../assets/homepage/location.png")} style={styles.locationIcon} />
            <Text style={styles.locationText}>{selectedLocation}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.messageText}>
          Find the best doctor and book your appointment now.
        </Text>
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search for doctors or labs..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchButton}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchButton}>
            <Image
              source={require("../assets/search.png")}
              style={styles.searchIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Doctor Specialist Section */}
      <View style={styles.specialistCard}>
        <Text style={styles.specialistHeading}>Doctor Specialists</Text>
        <View style={styles.specialistGrid}>
          {specialists.map((specialist, index) => (
            <TouchableOpacity
              key={index}
              style={styles.specialistContainer}
              onPress={() => handleSpecialistPress(specialist.name)}
            >
              <View style={styles.specialistCircle}>
                <Image source={specialist.image} style={styles.specialistImage} />
              </View>
              <Text style={styles.specialistText}>{specialist.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Visit Clinic & Lab Test Cards */}
      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.card}
          onPress={() => navigation.navigate("DoctorListScreen", { patientId })}
        >
          <Image source={require("../assets/homepage/medical-assistance.png")} style={styles.cardImage} />
          <Text style={styles.cardText}>Visit Clinic</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card}
          onPress={() => navigation.navigate("LabTests")}
        >
          <Image source={require("../assets/homepage/blood-test.png")} style={styles.cardImage} />
          <Text style={styles.cardText}>Lab Tests</Text>
        </TouchableOpacity>
      </View>

      {/* Scheduled Appointment Card */}
      <TouchableOpacity style={styles.appointmentCard}
        onPress={() => navigation.navigate("ClinicAppointment")}
      >
        <Image source={require("../assets/homepage/wdoctor1.jpg")} style={styles.doctorImage} />
        <View style={styles.appointmentTextContainer}>
          <Text style={styles.appointmentTitle}>Your Scheduled Appointment</Text>
          <Text style={styles.appointmentSubtitle}>We look forward to providing you with the best care.</Text>
        </View>
      </TouchableOpacity>

      {/* Health Tips Card */}
      <TouchableOpacity style={styles.tipCard} onPress={() => navigation.navigate("AmbulanceBooking")}>
        <View style={styles.tipTextContainer}>
          <Text style={styles.tipTitle}>Emergency Ambulance Services</Text>
          <Text style={styles.tipSubtitle}>Fast, reliable, and lifesaving assistance when you need it most.</Text>
        </View>
        <Image
          source={require("../assets/ambulance/placeholder.png")}
          style={styles.tipImage}
        />
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      {loading ? (
  <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 40 }} />
) : (
 <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }} 
        showsVerticalScrollIndicator={false}
      >
        {ListHeaderComponent}
      </ScrollView>
)}

      {/* Search Results Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        // onRequestClose={() => setModalVisible(false)}
        onRequestClose={() => {
  setModalVisible(false);
  setSearchResults({doctors: [], labs: []});
}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Results</Text>
              {/* <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity> */}
              <TouchableOpacity onPress={() => {
  setModalVisible(false);
  setSearchResults({doctors: [], labs: []});
}}>
  <Text style={styles.modalClose}>✕</Text>
</TouchableOpacity>
            </View>
            {searching ? (
              <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 30 }} />
            ) : (
              <FlatList
              
                data={[
                  ...(searchResults.doctors || []),
                  ...(searchResults.labs || [])
                ]}
                keyExtractor={(item, index) => item.doctor_id || item.id || index.toString()}
                renderItem={({ item }) => {
                  if (item.doctor_id) return renderDoctorCard({ item });
                  if (item.name) return renderLabCard({ item });
                  return null;
                }}
                ListEmptyComponent={
                  <Text style={{ textAlign: 'center', marginTop: 30, color: '#888' }}>
                    No results found.
                  </Text>
                }
                // contentContainerStyle={{ paddingBottom: 20 }}
                  contentContainerStyle={styles.modalList}
                style={{ maxHeight: Platform.OS === "web" ? 400 : width > 400 ? 400 : 300 }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Floating Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}
          onPress={() => navigation.navigate("HomePage")}
        >
          <Image source={require("../assets/home.png")} style={styles.navIcon} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}
          onPress={() => navigation.navigate("UserProfile")}
        >
          <Image source={require("../assets/profile-picture.png")} style={styles.navIcon} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(30,41,59,0.10)', // lighter, subtle overlay
  justifyContent: 'center',
  alignItems: 'center',
},
modalContent: {
  width: width > 400 ? 370 : width - 32,
  backgroundColor: '#fff',
  borderRadius: 18,
  paddingHorizontal: 0,
  paddingVertical: 0,
  maxHeight: 440,
  // No shadow, no elevation
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: '#f0f0f0',
},
modalHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingTop: 16,
  paddingBottom: 8,
  backgroundColor: '#f8fafb',
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  borderBottomWidth: 1,
  borderBottomColor: '#f0f0f0',
},
modalTitle: {
  fontSize: 17,
  fontWeight: '600',
  color: '#22223b',
  letterSpacing: 0.1,
},
modalClose: {
  fontSize: 22,
  color: '#64748b',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 16,
  backgroundColor: '#f3f4f6',
  overflow: 'hidden',
},
modalList: {
  paddingHorizontal: 14,
  paddingVertical: 10,
  backgroundColor: '#fff',
},
resultCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f6f8fa',
  borderRadius: 10,
  padding: 12,
  marginBottom: 10,
  // No shadow, no elevation
  borderWidth: 1,
  borderColor: '#f0f0f0',
},
resultAvatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 12,
  backgroundColor: '#e3e3e3',
},
resultTitle: {
  fontSize: 15,
  fontWeight: '600',
  color: '#22223b',
},
resultSubtitle: {
  fontSize: 12,
  color: '#64748b',
  marginTop: 2,
},
resultInfo: {
  fontSize: 11,
  color: '#94a3b8',
  marginTop: 1,
},
  // ...keep all your previous styles below...
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  list: {
    paddingBottom: 120,
  },
  topCardView: {
    backgroundColor: "#6495ED",
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
    marginRight: 8,
  },
  locationText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 22,
    height: 22,
    tintColor: "#fff",
    marginLeft: 15,
  },
  messageText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  searchButton: {
    padding: 8,
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: "#333",
    resizeMode: "contain",
  },
  specialistCard: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginHorizontal: 16,
    marginTop: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
  },
  specialistHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  specialistGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  specialistContainer: {
    width: "23%",
    alignItems: "center",
    marginBottom: 15,
  },
  specialistCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  specialistImage: {
    width: 25,
    height: 25,
    resizeMode: "contain",
  },
  specialistText: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginTop: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: "#6495ED",
    width: "45%",
    alignItems: "center",
    padding: 9,
    justifyContent:'center',
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 0,
  },
  cardImage: {
    width: 30,
    height: 30,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  appointmentCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 15,
    padding: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 0,
    alignItems: "center",
  },
  doctorImage: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginRight: 12,
  },
  appointmentTextContainer: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  appointmentSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 15,
    padding: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 0,
    alignItems: "center",
    height: 120,
  },
  tipTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  tipSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  tipImage: {
    width: 75,
    height: 74,
    borderRadius: 10,
    resizeMode: "cover",
  },
  bottomNav: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#6495ED",
    borderRadius: 30,
    paddingVertical: 10,
    elevation: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 0 },
  },
  navButton: { alignItems: "center" },
  navIcon: { width: 24, height: 24, resizeMode: "contain", marginBottom: 3 },
  navText: { fontSize: 12, color: "#fff" },
  labCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderColor: '#e6e6e6',
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    elevation: 0,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  labCardContent: {
    flexDirection: 'column',
  },
  labName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  labAddress: {
    fontSize: 13,
    color: '#666',
  },
  labPhone: {
    fontSize: 13,
    color: '#007BFF',
  },
  labHomeSample: {
    fontSize: 13,
    color: '#009688',
  }
});

export default HomePage;