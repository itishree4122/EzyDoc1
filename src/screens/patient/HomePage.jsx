import React, { useState, useEffect } from "react";
// import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import useFCMSetup from '../util/useFCMSetup'; // Adjust path as needed



const HomePage = () => {
  // const { firstName, lastName, email, phone } = route.params;
  const [searchText, setSearchText] = useState("");
  const navigation = useNavigation();
  const [selectedLocation, setSelectedLocation] = useState("Select Location");
  const [patientId, setPatientId] = useState('');
  

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

  
  // Runs once after login to fetch patientId
useEffect(() => {
  const fetchPatientId = async () => {
    try {
      const id = await AsyncStorage.getItem('patientId');
      if (id) {
        setPatientId(id);
      }
    } catch (error) {
      console.error('Error fetching patientId:', error);
    }
  };

  fetchPatientId();
}, []);

// Runs FCM logic only when patientId is available
useFCMSetup(); // <--- Now clean and modular


  
  const handleSpecialistPress = (specialistName) => {
    navigation.navigate('DoctorListScreen1', { specialistName, patientId });
  };


  const fetchDoctors = async () => {
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
    }, []);


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Top CardView with Location, Notification, Help Icons, Text & Search Bar */}
        <View style={styles.topCardView}>
          {/* Location and Icons */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.locationContainer}
            onPress={() => navigation.navigate("LocationScreen", { setSelectedLocation })} 
            >
              <Image source={require("../assets/homepage/location.png")} style={styles.locationIcon} />
              <Text style={styles.locationText}>{selectedLocation}</Text>
            </TouchableOpacity>
           
          </View>

          {/* Text Below the Icons */}
          <Text style={styles.messageText}>
            Find the best doctor and book your appointment now.
          </Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Find your doctor"
              placeholderTextColor="#333"
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity style={styles.searchButton}>
              <Image source={require("../assets/search.png")} style={styles.searchIcon} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.messageText, { display: 'none' }]}>{patientId}</Text>

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
          {/* Visit Clinic Card */}
          <TouchableOpacity style={styles.card}
          onPress={() => navigation.navigate("DoctorListScreen", {patientId})}
          >
            <Image source={require("../assets/homepage/medical-assistance.png")} style={styles.cardImage} />
            <Text style={styles.cardText}>Visit Clinic</Text>
          </TouchableOpacity>

          {/* Lab Tests Card */}
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
                source={require("../assets/ambulance/placeholder.png")} // replace with your actual image
                style={styles.tipImage}
              />
            </TouchableOpacity>

              {/* <Text style={{display: 'none'}}>Welcome, {firstName} {lastName}</Text>
      <Text style={{display: 'none'}}>Email: {email}</Text>
      <Text style={{display: 'none'}}>Phone: {phone}</Text> */}


              {/* <Text style={[styles.name, { display: 'none' }]}>{item.doctor_name}</Text>
              <Text style={[styles.name, { display: 'none' }]}>{item.doctor_user_id}</Text>
              <Text style={[styles.name, { display: 'none' }]}>{item.experience}</Text>
              <Text style={[styles.name, { display: 'none' }]}>{item.specialist}</Text>
              <Text style={[styles.name, { display: 'none' }]}>{item.clinic_name}</Text>
              <Text style={[styles.name, { display: 'none' }]}>{item.clinic_address}</Text>
             */}

      </ScrollView>

      {/* Floating Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}
        onPress={() => navigation.navigate("HomePage")}
        >
          <Image source={require("../assets/home.png")} style={styles.navIcon} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style={styles.navButton}>
          <Image source={require("../assets/pastinfo.png")} style={styles.navIcon} />
          <Text style={styles.navText}>Favorite</Text>
        </TouchableOpacity> */}
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
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
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

  // Specialist Section
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
    width: "23%", // 4 columns
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

  // Visit Clinic & Lab Test Cards
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
  // Scheduled Appointment Section
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
  width: 100,  // Adjusted doctor image size
  height: 100,
  resizeMode: "contain",
  marginRight: 12,
},

appointmentTextContainer: {
  flex: 1,  // Takes remaining space
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


 // Floating Bottom Navigation
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
});

export default HomePage;




