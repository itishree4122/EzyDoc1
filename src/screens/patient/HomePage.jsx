import React, { useState, useEffect } from "react";
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
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "../auth/Api";
import { fetchWithAuth } from '../auth/fetchWithAuth';
import { getToken } from '../auth/tokenHelper';
import { useLocation } from '../../context/LocationContext';
import moment from "moment";
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { checkUserProfileCompletion } from '../util/checkProfile';
import useFCMSetup from "../util/useFCMSetup";
const { width, height } = Dimensions.get('window');

const HomePage = () => {
  const navigation = useNavigation();
  const { selectedLocation, setSelectedLocation } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [patientId, setPatientId] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchResults, setSearchResults] = useState({doctors: [], labs: []});
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [labAppointments, setLabAppointments] = useState([]);
  const [firstName, setFirstName] = useState('User');
const [profileCompletion, setProfileCompletion] = useState(0);
const [profileIncomplete, setProfileIncomplete] = useState(false);
const [userDetails, setUserDetails] = useState(null);
  const now = new Date();

  // const specialists = [
  //   { name: "Cardiologist", icon: "favorite", color: "#FF6B6B" },
  //   { name: "Endocrinologist", icon: "healing", color: "#4ECDC4" },
  //   { name: "Orthopedic", icon: "accessible", color: "#45B7D1" },
  //   { name: "Dermatologist", icon: "spa", color: "#FFA07A" },
  //   { name: "Pediatrician", icon: "child-care", color: "#FFD166" },
  //   { name: "Eye Specialist", icon: "remove-red-eye", color: "#A78BFA" },
  //   { name: "ENT Specialist", icon: "hearing", color: "#68D391" },
  //   { name: "Urologist", icon: "sanitizer", color: "#48BB78" },
  // ];
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

  useFCMSetup();
// Fetch from AsyncStorage or API
useEffect(() => {
  const fetchFirstName = async () => {
  try {
    const userStr = await AsyncStorage.getItem('userData');
    console.log("User data fetched from AsyncStorage:", userStr);
    if (userStr) {
      console.log("Parsing user data...");
      const user = JSON.parse(userStr);
      console.log("Parsed user data:", user);
      setUserDetails({
          patientId: user.user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.mobile_number,
        });
      setFirstName(user.first_name || 'User');
    }
    console.log("First Name fetched:", firstName);
  } catch (e) {
    setFirstName('User');
  }
};
  fetchFirstName();
}, []);



// useEffect(() => {
//   const fetchProfileCompletion = async () => {
//     const userStr = await AsyncStorage.getItem('userData');
//     console.log(userStr);
//     if (userStr) {
//       const user = JSON.parse(userStr);
//       // Check required fields
//       const fields = [user.date_of_birth, user.address, user.gender];
//       const filled = fields.filter(Boolean).length;
//       const percent = Math.round((filled / fields.length) * 100);
//       setProfileCompletion(percent);
//       setProfileIncomplete(percent < 100);
//     }
//   };
//   fetchProfileCompletion();
// }, []);

useEffect(() => {
  const fetchProfileCompletion = async () => {
    try {
      const token = await getToken();
      const res = await fetchWithAuth(`${BASE_URL}/patients/profiles/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const profileArray = await res.json();
      const profile = profileArray[0];

      // Check required fields
      const fields = [profile?.date_of_birth, profile?.address, profile?.gender];
      const filled = fields.filter(Boolean).length;
      let percent = Math.round((filled / fields.length) * 100);
      if(percent<100){
        percent = 74;
      }
      setProfileCompletion(percent);
      setProfileIncomplete(percent < 100);

    } catch (e) {
      setProfileCompletion(0);
      setProfileIncomplete(true);
    }
  };
  fetchProfileCompletion();
}, []);



const fetchAppointments = async () => {
    try {
      const token = await getToken();
      const response = await fetchWithAuth(`${BASE_URL}/doctor/appointmentlist/${patientId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

    const fetchLabAppointments = async () => {
    try {
      const token = await getToken();
      const response = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLabAppointments(data);
        console.log("Fetched lab appointments:", data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

 useFocusEffect(
  React.useCallback(() => {
    // Fetch appointments
    if (patientId) {
      fetchAppointments();
    }
    // Fetch lab appointments
    fetchLabAppointments();
  }, [patientId])
);
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

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const response = await fetchWithAuth(`${BASE_URL}/doctor/get_all/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setDoctors(data);
        } else {
          console.error('Failed to fetch doctors:', response.status);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    // const fetchAppointments = async () => {
    //   try {
    //     const token = await getToken();
    //     const response = await fetchWithAuth(`${BASE_URL}/doctor/appointmentlist/${patientId}/`, {
    //       method: 'GET',
    //       headers: {
    //         'Authorization': `Bearer ${token}`,
    //         'Content-Type': 'application/json',
    //       },
    //     });
    //     console.log("Fetching appointments for patientId:", patientId);
    //     console.log("response:", response);

    //     if (response.ok) {
    //       const data = await response.json();
    //       console.log("Fetched appointments:", data);
    //       setAppointments(data);
    //     }
    //   } catch (error) {
    //     console.error('Error fetching appointments:', error);
    //   }
    // };

    fetchDoctors();
    // fetchAppointments();
  }, []);

//   useEffect(() => {
//   if (!patientId) return;

//   const fetchAppointments = async () => {
//     try {
//       const token = await getToken();
//       const response = await fetchWithAuth(`${BASE_URL}/doctor/appointmentlist/${patientId}/`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
//       if (response.ok) {
//         const data = await response.json();
//         setAppointments(data);
//       }
//     } catch (error) {
//       console.error('Error fetching appointments:', error);
//     }
//   };

//   fetchAppointments();
// }, [patientId]);

//   useEffect(() => {

//   const fetchLabAppointments = async () => {
//     try {
//       const token = await getToken();
//       const response = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
//       if (response.ok) {
//         const data = await response.json();
//         setLabAppointments(data);
//         console.log("Fetched lab appointments:", data);
//       }
//     } catch (error) {
//       console.error('Error fetching appointments:', error);
//     }
//   };

//   fetchLabAppointments();
// }, []);

const upcomingAppointments = appointments
  .filter(app =>
    !app.cancelled &&
    !app.checked &&
    new Date(`${app.date_of_visit}T${app.visit_time}`) > now
  )
  .map(app => {
    const dateMoment = moment(app.date_of_visit);
    return {
      ...app,
      displayDate: dateMoment.isSame(moment(), 'day')
        ? "Today"
        : dateMoment.format("DD MMM"),
      displayTime: moment(app.visit_time, 'HH:mm:ss').format('hh:mm A'),
    };
  })
  .sort((a, b) =>
    new Date(`${a.date_of_visit}T${a.visit_time}`) - new Date(`${b.date_of_visit}T${b.visit_time}`)
  );


const getUpcomingLabAppointments = (labAppointments) => {
  const now = moment();
  return labAppointments
    .filter(app => {
      if (["COMPLETED", "CANCELLED"].includes(app.status?.toUpperCase())) return false;
      const scheduled = moment(app.scheduled_date);
      return scheduled.isSameOrAfter(now, 'minute');
    })
    .map(app => ({
      ...app,
      displayDate: moment(app.scheduled_date).isSame(now, 'day')
        ? "Today"
        : moment(app.scheduled_date).format("DD MMM"),
      displayTime: moment(app.scheduled_date).format("hh:mm A"),
    }))
    .sort((a, b) =>
      moment(a.scheduled_date).valueOf() - moment(b.scheduled_date).valueOf()
    );
};

const upcomingLabAppointments = getUpcomingLabAppointments(labAppointments);
{upcomingLabAppointments.map(app => (
  <View key={app.id}>
    <Text>{app.lab_profile_name}</Text>
    <Text>{app.displayDate}, {app.displayTime}</Text>
    <Text>Status: {app.status}</Text>
  </View>
))
console.log("Upcoming Lab Appointments:", upcomingLabAppointments);
}
const formatDate = (dateStr) => moment(dateStr).format("DD MMM");
  const handleSearchButton = async () => {
    if (!searchQuery.trim()) {
      setSearchResults({doctors: [], labs: []});
      setModalVisible(true);
      return;
    }
    
    setSearching(true);
    try {
      const response = await fetchWithAuth(`${BASE_URL}/labs/search/?q=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const doctors = (data.doctors || []).map(doc => ({
          ...doc,
          doctor_id: doc.doctor || doc.doctor_user_id,
        }));
        
        const labs = (data.labs || []).map(lab => {
          const allTests = (lab.lab_types_details || []).flatMap(type => type.tests || []);
          const uniqueTests = Array.from(new Set(allTests));
          return { ...lab, services: uniqueTests };
        });

        setSearchResults({ doctors, labs });
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

  const handleDoctorBook = async (item) => {
      const isComplete = await checkUserProfileCompletion(navigation);
      if (!isComplete) return;
      console.log("IsComplete",isComplete)
      setModalVisible(false);
      navigation.navigate("BookingScreen", {
              doctor_user_id: item.doctor_id,
          doctor_name: item.doctor_name || `${item.first_name || ""} ${item.last_name || ""}`,
          specialist: item.specialist,
          clinic_name: item.clinic_name,
          clinic_address: item.clinic_address,
          experience: item.experience,
          location: item.location,
          patientId: patientId,
  
            })
    };
  const handleLabBook = async (item) => {
      const isComplete = await checkUserProfileCompletion(navigation);
      if (!isComplete) return;
      console.log("IsComplete",isComplete)
      setModalVisible(false);
      navigation.navigate("BookingLabScreen", {
          labName: item.name,
          services: item.services || [],
          labProfile: item,
          patientId: patientId,
        });
    };
  const renderDoctorCard = ({ item }) => (
    // <TouchableOpacity
    //   style={styles.resultCard}
    //   onPress={() => {
    //     setModalVisible(false);
    //     navigation.navigate("BookingScreen", {
    //       doctor_user_id: item.doctor_id,
    //       doctor_name: item.doctor_name || `${item.first_name || ""} ${item.last_name || ""}`,
    //       specialist: item.specialist,
    //       clinic_name: item.clinic_name,
    //       clinic_address: item.clinic_address,
    //       experience: item.experience,
    //       location: item.location,
    //       patientId: patientId,
    //     });
    //   }}
    // >
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => handleDoctorBook(item)}
    >
      <Image
        source={item.profile_image ? { uri: item.profile_image } : require("../assets/profile-picture.png")}
        style={styles.resultAvatar}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.resultTitle}>{item.doctor_name || `${item.first_name} ${item.last_name}`}</Text>
        <Text style={styles.resultSubtitle}>{item.specialist}</Text>
        {/* <View style={styles.ratingContainer}>
          <Icon name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>4.8 (120 reviews)</Text>
        </View> */}
        <Text style={styles.resultInfo}>{item.clinic_name}</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#94A3B8" />
    </TouchableOpacity>
  );

  const renderLabCard = ({ item }) => (
    // <TouchableOpacity
    //   style={styles.resultCard}
    //   onPress={() => {
    //     setModalVisible(false);
    //     navigation.navigate("BookingLabScreen", {
    //       labName: item.name,
    //       services: item.services || [],
    //       labProfile: item,
    //       patientId: patientId,
    //     });
    //   }}
    // >
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => handleLabBook(item)}

    >
      <View style={[styles.labIconContainer, { backgroundColor: '#E3F2FD' }]}>
        <Icon name="medical-services" size={20} color="#1c78f2" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.resultTitle}>{item.name}</Text>
        <Text style={styles.resultSubtitle}>{item.address}</Text>
        <View style={styles.labDetails}>
          <Text style={styles.labDetail}>
            <Icon name="phone" size={12} color="#64748B" /> {item.phone}
          </Text>
          <Text style={styles.labDetail}>
            <Icon name="home" size={12} color="#64748B" /> 
            {item.home_sample_collection ? " Home Sample Available" : " Clinic Visit Only"}
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={20} color="#94A3B8" />
    </TouchableOpacity>
  );

  const ListHeaderComponent = (
    <>
{/* User Greetings + Profile */}
    {/* <View style={styles.userRow}>
  <View>
    <Text style={styles.helloText}>Hello,</Text>
    <Text style={styles.helloName}>{firstName}</Text>
  </View>
  <TouchableOpacity
    style={styles.profileCircle}
    onPress={() => navigation.navigate("UserProfile")}
    activeOpacity={0.7}
  >
    <Text style={styles.profileInitial}>
      {firstName ? firstName[0].toUpperCase() : 'U'}
    </Text>
  </TouchableOpacity>
</View> */}



      {/* Header with Search */}
      <View style={styles.headerContainer}>
        {/* {profileIncomplete && (
  <View style={{ alignItems: 'center', marginBottom: 12 }}>
    <AnimatedCircularProgress
      size={60}
      width={6}
      fill={profileCompletion}
      tintColor="#fbbf24"
      backgroundColor="#e5e7eb"
      rotation={0}
    >
      {() => (
        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
          {profileCompletion}%
        </Text>
      )}
    </AnimatedCircularProgress>
    <Text style={{ marginTop: 6, color: '#b45309', fontWeight: '600' }}>
      Complete your profile to book appointments
    </Text>
  </View>
)} */}


        {/* <View style={styles.userRowModern}>
  <View>
    <Text style={styles.helloTextModern}>Hello,</Text>
    <Text style={styles.helloNameModern}>{firstName}</Text>
  </View>
  <TouchableOpacity
    style={styles.profileCircleModern}
    onPress={() => navigation.navigate("UserProfile")}
    activeOpacity={0.8}
  >
    <Text style={styles.profileInitialModern}>
      {firstName ? firstName[0].toUpperCase() : 'U'}
    </Text>
  </TouchableOpacity>
</View> */}

<View style={styles.userRowModern}>
  <View>
    <Text style={styles.helloTextModern}>Hello,</Text>
    <Text style={styles.helloNameModern}>{firstName}</Text>
  </View>

<View style={{ flexDirection: "row", alignItems: "center" }}>
    <TouchableOpacity
      style={{ marginRight: 16 }}
      onPress={() => navigation.navigate("NotificationScreen")}
      activeOpacity={0.7}
    >
      <Icon name="notifications" size={24} color="#fff" />
      {/* Optionally, add a badge for unread notifications */}
      {/* <View style={{
        position: 'absolute', top: 2, right: 2, backgroundColor: '#ef4444',
        borderRadius: 8, width: 12, height: 12, justifyContent: 'center', alignItems: 'center'
      }}>
        <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>!</Text>
      </View> */}
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.profileProgressContainer}
      onPress={() =>
        profileIncomplete
          ? navigation.navigate("Profile", userDetails)
          : navigation.navigate("UserProfile")
      }
      activeOpacity={0.8}
    >
  {/* <TouchableOpacity
    style={styles.profileProgressContainer}
    onPress={() => profileIncomplete?navigation.navigate("Profile",userDetails):navigation.navigate("UserProfile")}
    activeOpacity={0.8}
  > */}
    <AnimatedCircularProgress
      size={50}
      width={4}
      fill={profileCompletion}
      // tintColor={profileIncomplete ? "#f59e0b" : "#10b981"}
      tintColor={profileIncomplete ? "#f59e0b" : "#14b8a6"}
      backgroundColor="#e5e7eb"
      rotation={0}
      duration={1200}
    >
      {
        () => (
          <View style={styles.profileCircleModern}>
            <Text style={styles.profileInitialModern}>
              {firstName ? firstName[0].toUpperCase() : 'U'}
            </Text>
          </View>
        )
        //  () => (
        //   <Text style={{ fontWeight: 'bold', fontSize: 16, color: "#fff" }}>
        //     {profileCompletion}%
        //   </Text>
        // )
      }
    </AnimatedCircularProgress>

    {profileIncomplete && (
      <View style={styles.profileBadge}>
        <Text style={styles.profileBadgeText}>Complete Profile</Text>
      </View>
    )}
  </TouchableOpacity>
</View>
</View>
        <View style={styles.locationContainer}>
          <Icon name="location-on" size={20} color="white" />
          <TouchableOpacity 
            onPress={() => navigation.navigate("LocationScreen", { setSelectedLocation })}
          >
          <Text style={styles.locationText}>{selectedLocation || 'Select location'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate("LocationScreen", { setSelectedLocation })}
            style={styles.locationButton}
          >
            <Icon name="arrow-drop-down" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.headerTitle}>Find Your Perfect Healthcare</Text>
        <Text style={styles.headerSubtitle}>Book appointments with top specialists near you</Text>
        
        <View style={styles.searchContainer}>
          {/* <Icon name="search" size={20} color="#64748B" style={styles.searchIcon} /> */}
          <TextInput
            placeholder="Search doctors, labs, clinics..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchButton}
            returnKeyType="search"
          />
          <TouchableOpacity 
            // style={styles.searchButton} 
            onPress={handleSearchButton}
          >
            {/* <Text style={styles.searchButtonText}>Search</Text> */}
            {/* <View style={styles.searchButtonIcon}> */}
                      <Icon name="search" size={20} color="#000" style={styles.searchIcon} />
                      {/* </View> */}

          </TouchableOpacity>
        </View>
      </View>

{/* ---------------------------------------------------------------------------------------------- */}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.quickAction, { backgroundColor: '#E3F2FD' }]}
          onPress={() => navigation.navigate("DoctorListScreen", {patientId})}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#1c78f2' }]}>
            <Icon name="local-hospital" size={24} color="white" />
          </View>
          <Text style={styles.quickActionText}>Clinic Visit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickAction, { backgroundColor: '#F0FDF4' }]}
          onPress={() => navigation.navigate("LabTestClinics")}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#10B981' }]}>
            <Icon name="science" size={24} color="white" />
          </View>
          <Text style={styles.quickActionText}>Lab Tests</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickAction, { backgroundColor: '#FEF2F2' }]}
          onPress={() => navigation.navigate("AmbulanceBooking")}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#EF4444' }]}>
            <Icon name="local-taxi" size={24} color="white" />
          </View>
          <Text style={styles.quickActionText}>Ambulance</Text>
        </TouchableOpacity>
      </View>

{/* ---------------------------------------------------------------------------------------------- */}


      {/* Specialist Section */}
      {/* <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Specialist Doctors</Text>
          <TouchableOpacity onPress={() => navigation.navigate("DoctorListScreen", {patientId})}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialistScroll}
        >
          {specialists.map((specialist, index) => (
            <TouchableOpacity
              key={index}
              style={styles.specialistCard}
              onPress={() => navigation.navigate("DoctorListScreen1", { 
                specialistName: specialist.name, 
                patientId 
              })}
            >
              <View style={[styles.specialistIconContainer, { backgroundColor: specialist.color + '20' }]}>
                <Icon name={specialist.icon} size={24} color={specialist.color} />
              </View>
              <Text style={styles.specialistName}>{specialist.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View> */}

      {/* Appointment Card */}
      {/* {appointments.length > 0 && (
        <TouchableOpacity 
          style={styles.appointmentCard}
          onPress={() => navigation.navigate("ClinicAppointment")}
        >
          <View style={styles.appointmentContent}>
            <View>
              <Text style={styles.appointmentTitle}>Your Next Appointment</Text>
              <Text style={styles.appointmentSubtitle}>
                {appointments[0].doctor_name} - {appointments[0].specialist}
              </Text>
              <Text style={styles.appointmentTime}>
                {new Date(appointments[0].date).toLocaleDateString()}, {appointments[0].time}
              </Text>
            </View>
            <View style={styles.appointmentButton}>
              <Text style={styles.appointmentButtonText}>View</Text>
            </View>
          </View>
        </TouchableOpacity>
      )} */}
{/* {upcomingAppointments.length > 0 && (
  <TouchableOpacity 
    style={styles.appointmentCard}
    onPress={() => navigation.navigate("DoctorAppointments")}
  >
    <View style={styles.appointmentContent}>
      <View>
        <Text style={styles.appointmentTitle}>Your Next Appointment</Text>
        <Text style={styles.appointmentSubtitle}>
          {upcomingAppointments[0].doctor_name} - {upcomingAppointments[0].specialist}
        </Text>
        <Text style={styles.appointmentTime}>
          {formatDate(upcomingAppointments[0].date_of_visit)}, {moment(upcomingAppointments[0].visit_time,'HH:mm:ss').format('hh:mm A')}
        </Text>
      </View>
      <View style={styles.appointmentButton}>
        <Text style={styles.appointmentButtonText}>View</Text>
      </View>
    </View>
  </TouchableOpacity>
)} */}

{upcomingAppointments.length > 0 && (
  <TouchableOpacity 
    style={styles.appointmentCardModern}
    onPress={() => navigation.navigate("DoctorAppointments")}
    activeOpacity={0.85}
  >
    <View style={styles.appointmentPillRow}>
      <Text style={styles.pillDate}>
        {upcomingAppointments[0].displayDate}
      </Text>
      <Text style={styles.pillTime}>
        {upcomingAppointments[0].displayTime}
      </Text>
      <Text style={styles.pillSpecialist}>
        {upcomingAppointments[0].specialist}
      </Text>
    </View>
    <View style={styles.appointmentModernContent}>
      <View style={{flex: 1}}>
        <Text style={styles.appointmentModernTitle}>Your Next Appointment</Text>
        <Text style={styles.appointmentModernDoctor}>
          {/^dr[\.\s]/i.test(upcomingAppointments[0].doctor_name.trim()) 
            ? upcomingAppointments[0].doctor_name.trim() 
            : `Dr. ${upcomingAppointments[0].doctor_name.trim()}`}
        </Text>
      </View>
      <View style={styles.appointmentModernButton}>
        <Text style={styles.appointmentModernButtonText}>View</Text>
      </View>
    </View>
  </TouchableOpacity>
)}

{upcomingLabAppointments.length > 0 && (
  <TouchableOpacity
    style={styles.appointmentCardModern}
    onPress={() => navigation.navigate("LabAppointments")}
    activeOpacity={0.85}
  >
    <View style={styles.appointmentPillRow}>
      <Text style={styles.pillDate}>
        {upcomingLabAppointments[0].displayDate}
      </Text>
      <Text style={styles.pillTime}>
        {upcomingLabAppointments[0].displayTime}
      </Text>
      <Text style={styles.pillSpecialist}>
        {upcomingLabAppointments[0].test_type}
      </Text>
    </View>
    <View style={styles.appointmentModernContent}>
      <View style={{ flex: 1 }}>
        <Text style={styles.appointmentModernTitle}>Your Next Lab Test</Text>
        <Text style={styles.appointmentModernDoctor}>
          {upcomingLabAppointments[0].lab_profile_name}
        </Text>
      </View>
      <View style={styles.appointmentModernButton}>
        <Text style={styles.appointmentModernButtonText}>View</Text>
      </View>
    </View>
  </TouchableOpacity>
)}

{/* This is to Show all the upcoming lab tests */}
{/* {upcomingLabAppointments.length > 0 && upcomingLabAppointments.map((app, idx) => (
  <TouchableOpacity
    key={app.id}
    style={styles.appointmentCardModern}
    onPress={() => navigation.navigate("LabAppointments")}
    activeOpacity={0.85}
  >
    <View style={styles.appointmentPillRow}>
      <Text style={styles.pillDate}>{app.displayDate}</Text>
      <Text style={styles.pillTime}>{app.displayTime}</Text>
      <Text style={styles.pillSpecialist}>{app.lab_profile_name}</Text>
    </View>
    <View style={styles.appointmentModernContent}>
      <View style={{ flex: 1 }}>
        <Text style={styles.appointmentModernTitle}>Upcoming Lab Test</Text>
        <Text style={styles.appointmentModernDoctor}>{app.test_type}</Text>
      </View>
      <View style={styles.appointmentModernButton}>
        <Text style={styles.appointmentModernButtonText}>View</Text>
      </View>
    </View>
  </TouchableOpacity>
))} */}

{/* ---------------------------------------------------------------------------------------------- */}


 {/* Doctor Specialist Section */}
      <View style={styles.specialistCard}>
        <Text style={styles.specialistHeading}>Doctor Specialists</Text>
        <View style={styles.specialistGrid}>
          {specialists.map((specialist, index) => (
            <TouchableOpacity
              key={index}
              style={styles.specialistContainer}
              // onPress={() => handleSpecialistPress(specialist.name)}
              onPress={() => navigation.navigate("DoctorListScreen1", { 
                specialistName: specialist.name, 
                patientId 
              })}
            >
              <View style={styles.specialistCircle}>
                <Image source={specialist.image} style={styles.specialistImage} />

              </View>
              <Text style={styles.specialistText}>{specialist.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
{/* ---------------------------------------------------------------------------------------------- */}


      {/* Health Tips */}
      {/* <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Health Tips</Text>
        </View>
        <View style={styles.tipCard}>
          <Image
            source={require("../assets/health-tip.jpg")}
            style={styles.tipImage}
          />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Stay Hydrated During Summer</Text>
            <Text style={styles.tipText}>Drink at least 8 glasses of water daily to maintain proper hydration levels.</Text>
            <TouchableOpacity style={styles.tipButton}>
              <Text style={styles.tipButtonText}>Read More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View> */}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1c78f2" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
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
        onRequestClose={() => {
          setModalVisible(false);
          setSearchResults({doctors: [], labs: []});
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Results</Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                setSearchResults({doctors: [], labs: []});
              }}>
                <Icon name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            {searching ? (
              <View style={styles.loadingModal}>
                <ActivityIndicator size="large" color="#1c78f2" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : (
              <FlatList
                data={[...(searchResults.doctors || []), ...(searchResults.labs || [])]}
                keyExtractor={(item, index) => item.doctor_id || item.id || index.toString()}
                renderItem={({ item }) => {
                  if (item.doctor_id) return renderDoctorCard({ item });
                  if (item.name) return renderLabCard({ item });
                  return null;
                }}
                ListEmptyComponent={
                  <View style={styles.emptyResults}>
                    <Icon name="search-off" size={40} color="#CBD5E1" />
                    <Text style={styles.emptyText}>No results found</Text>
                    <Text style={styles.emptySubtext}>Try different keywords</Text>
                  </View>
                }
                contentContainerStyle={styles.modalList}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      {/* <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navButtonActive}
          onPress={() => navigation.navigate("HomePage")}
        >
          <Icon name="home" size={24} color="#1c78f2" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate("UserProfile")}
        >
          <Icon name="person" size={24} color="#64748B" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate("ClinicAppointment")}
        >
          <Icon name="event" size={24} color="#64748B" />
          <Text style={styles.navText}>Appointments</Text>
        </TouchableOpacity>
      </View> */}
      <View style={styles.bottomNavModern}>
  <TouchableOpacity 
    style={styles.navButtonModern}
    onPress={() => navigation.navigate("HomePage")}
    activeOpacity={0.8}
  >
    <View style={[styles.navIconWrapper, { backgroundColor: '#E3F2FD' }]}>
      <Icon name="home" size={24} color="#1c78f2" />
    </View>
    <Text style={[styles.navTextModern, { color: '#1c78f2', fontWeight: 'bold' }]}>Home</Text>
  </TouchableOpacity>
  <TouchableOpacity 
    style={styles.navButtonModern}
    onPress={() => navigation.navigate("ClinicAppointment")}
    activeOpacity={0.8}
  >
    <View style={styles.navIconWrapper}>
      <Icon name="event" size={24} color="#64748B" />
    </View>
    <Text style={styles.navTextModern}>Appointments</Text>
  </TouchableOpacity>
  <TouchableOpacity 
    style={styles.navButtonModern}
    onPress={() => navigation.navigate("LabReport")}
    activeOpacity={0.8}
  >
    <View style={styles.navIconWrapper}>
      <Icon name="description" size={24} color="#64748B" />
    </View>
    <Text style={styles.navTextModern}>Lab Reports</Text>
  </TouchableOpacity>
  
  
  
</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContainer: {
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header Styles
  headerContainer: {
    backgroundColor: '#1c78f2',
    padding: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '300',
    marginLeft: 8,
  },
  locationButton: {
    marginLeft: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        // elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
    // color: '#64748B',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: 4,
  },
  searchButton: {
    backgroundColor: '#1c78f2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchButtonIcon: {
    backgroundColor: '#1c78f2',
    // borderWidth:2,
    borderRadius: 100,
    // paddingHorizontal: 8,
    // paddingVertical: 8,
    padding:16,
    height:10,
    width:10,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: -16,
    marginBottom: 24,
  },
  quickAction: {
    width: '30%',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        // elevation: 10,
        borderBottomWidth: 4,
        borderWidth: 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        // borderColor: "#000",
        borderColor: '#E5E7EB',
      },
      
    }),
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E293B',
    textAlign: 'center',
  },
  
  // Sections
  sectionContainer: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  seeAllText: {
    fontSize: 14,
    color: '#1c78f2',
    fontWeight: '500',
  },
  
  // Specialist Cards
  specialistScroll: {
    paddingRight: 24,
  },
  specialistCard: {
    width: 120,
    marginRight: 16,
  },
  specialistIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  specialistName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
    textAlign: 'center',
  },
  
  // Appointment Card
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  appointmentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  appointmentSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 13,
    color: '#1c78f2',
    fontWeight: '500',
  },
  appointmentButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  appointmentButtonText: {
    color: '#1c78f2',
    fontWeight: '500',
  },
  // .............................

appointmentCardModern: {
  backgroundColor: '#fff',
  borderRadius: 16,
  marginHorizontal: 24,
  marginTop: 28,
  padding: 0,
  shadowColor: "#2563eb",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 9,
  overflow: 'hidden',
  // borderBottomWidth: 4,
  // borderWidth: 0.5,
  // borderColor: '#E5E7EB',
},

appointmentPillRow: {
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center',
  paddingHorizontal: 18,
  paddingTop: 18,
  gap: 8,
},

pillDate: {
  backgroundColor: '#1c78f2',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 13,
  borderRadius: 16,
  paddingHorizontal: 14,
  paddingVertical: 4,
  marginRight: 8,
  overflow: 'hidden',
  letterSpacing: 0.5,
},

pillTime: {
  backgroundColor: '#FDE68A',
  color: '#B45309',
  fontWeight: 'bold',
  fontSize: 13,
  borderRadius: 16,
  paddingHorizontal: 14,
  paddingVertical: 4,
  marginRight: 8,
  overflow: 'hidden',
  letterSpacing: 0.5,
},

pillSpecialist: {
  backgroundColor: '#E0E7FF',
  color: '#3730A3',
  fontWeight: 'bold',
  fontSize: 13,
  borderRadius: 16,
  paddingHorizontal: 14,
  paddingVertical: 4,
  overflow: 'hidden',
  letterSpacing: 0.5,
},

appointmentModernContent: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 18,
  paddingBottom: 18,
  paddingTop: 18,
},

appointmentModernTitle: {
  fontSize: 15,
  fontWeight: '600',
  color: '#64748B',
  marginBottom: 4,
},

appointmentModernDoctor: {
  fontSize: 17,
  fontWeight: 'bold',
  color: '#1c78f2',
  marginBottom: 0,
},

appointmentModernButton: {
  backgroundColor: '#1c78f2',
  borderRadius: 10,
  paddingHorizontal: 18,
  paddingVertical: 8,
  marginLeft: 12,
},

appointmentModernButtonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 15,
  letterSpacing: 0.5,
},
  // Health Tip Card
  tipCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tipImage: {
    width: '100%',
    height: 120,
  },
  tipContent: {
    padding: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  tipButton: {
    alignSelf: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#1c78f2',
  },
  tipButtonText: {
    color: '#1c78f2',
    fontWeight: '500',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width > 400 ? 380 : width - 40,
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalList: {
    padding: 16,
  },
  loadingModal: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
  },
  emptyResults: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CBD5E1',
    marginTop: 8,
  },
  
  // Result Cards
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  resultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: '#E3F2FD',
  },
  labIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  resultInfo: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  labDetails: {
    marginTop: 8,
  },
  labDetail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  
  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  navButtonActive: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  navText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  navTextActive: {
    fontSize: 12,
    color: '#1c78f2',
    marginTop: 4,
    fontWeight: '500',
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
    tintColor: "#1c78f2"
  },
  specialistText: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
userRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 24,
  paddingTop: 24,
  marginBottom: 8,
},
helloText: {
  fontSize: 14,
  color: '#64748B',
  fontWeight: '500',
},
helloName: {
  fontSize: 20,
  color: '#1c78f2',
  fontWeight: 'bold',
  marginTop: -2,
},
profileCircle: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#E3F2FD',
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 2,
  shadowColor: '#2563eb',
  shadowOpacity: 0.12,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
},
profileInitial: {
  fontSize: 20,
  color: '#1c78f2',
  fontWeight: 'bold',
},
userRowModern: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  // backgroundColor: '#fff',
  // marginHorizontal: 18,
  // marginTop: 18,
  marginBottom: 8,
  // paddingHorizontal: 10,
  // paddingVertical: 14,
  paddingBottom: 16,
  borderRadius: 18,
  shadowColor: '#2563eb',
  shadowOpacity: 0.10,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  // elevation: 4,
},

helloTextModern: {
  fontSize: 15,
  // color: '#64748B',
  color: '#fff',
  fontWeight: '500',
  marginBottom: 2,
  letterSpacing: 0.2,
},

helloNameModern: {
  fontSize: 24,
  // color: '#1c78f2',
  color: '#fff',
  fontWeight: 'bold',
  letterSpacing: 0.2,
},

profileProgressContainer: {
  position: 'relative',
  alignItems: 'center',
  justifyContent: 'center',
},

profileBadge: {
  // position: 'absolute',
  top: -8,
  // right: -8,
  backgroundColor: '#facc15', // yellow
  paddingHorizontal: 10,
  paddingVertical: 2,
  borderRadius: 12,
  zIndex: 10,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowOffset: { width: 0, height: 1 },
  shadowRadius: 2,
  // elevation: 2,
},

profileBadgeText: {
  color: '#000',
  fontSize: 10,
  fontWeight: '600',
},

// profileCircleModern: {
//   backgroundColor: '#e0f2fe',
//   width: 40,
//   height: 40,
//   borderRadius: 20,
//   alignItems: 'center',
//   justifyContent: 'center',
// },

// profileInitialModern: {
//   fontSize: 18,
//   fontWeight: 'bold',
//   color: '#1d4ed8',
// },


profileCircleModern: {
  width: 45,
  height: 45,
  borderRadius: 24,
  backgroundColor: '#E3F2FD',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: '#1c78f2',
  shadowColor: '#2563eb',
  shadowOpacity: 0.15,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
},

profileInitialModern: {
  fontSize: 22,
  color: '#1c78f2',
  fontWeight: 'bold',
  letterSpacing: 1,
},
bottomNavModern: {
  position: 'absolute',
  bottom: 18,
  left: 18,
  right: 18,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  // backgroundColor: '#e3f2fd',
backgroundColor: '#ffffff',
  borderRadius: 28,
  paddingVertical: 12,
  paddingHorizontal: 18,
  shadowColor: '#2563eb',
  shadowOpacity: 0.10,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 4 },
  elevation: 20,
  zIndex: 10,
},

navButtonModern: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},

navIconWrapper: {
  width: 44,
  height: 44,
  borderRadius: 22,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 2,
},

navTextModern: {
  fontSize: 12,
  color: '#64748B',
  marginTop: 2,
  fontWeight: '500',
},
});

export default HomePage;