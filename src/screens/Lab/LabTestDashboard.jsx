import React, {useState, useEffect} from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useWindowDimensions } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "../auth/Api";
import { getToken } from "../auth/tokenHelper";
import moment from "moment";
import { ActivityIndicator, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
const LabTestDashboard = () => {
  const { height } = Dimensions.get('window');
  const { width } = useWindowDimensions();
    const navigation = useNavigation();
    const [menuVisible, setMenuVisible] = useState(false);
    const [labId, setLabId] = useState('');
const [labProfile, setLabProfile] = useState(null);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [totalTests, setTotalTests] = useState(0);
const [totalPatients, setTotalPatients] = useState(0);
const [weeklyTests, setWeeklyTests] = useState([0, 0, 0, 0, 0, 0, 0]);
const [labTests, setLabTests] = useState([]);

  const topHeight = height * 0.3;

 

  // useEffect(() => {
  //   const getDoctorDetails = async () => {
  //     try {
  //       const name = await AsyncStorage.getItem('doctorName');
  //       const specialistData = await AsyncStorage.getItem('specialist');
        

  //       console.log('Fetched Doctor Details:', { name, specialistData});

  //       if (name) setDoctorName(name);
  //       if (specialistData) setSpecialist(specialistData);
        
  //     } catch (error) {
  //       console.error('Error fetching doctor details:', error);
  //     }
  //   };

  //   getDoctorDetails();
  // }, []);

  useEffect(() => {
  fetchAllData();
}, []);

const fetchAllData = async () => {
  setLoading(true);
  try {
    const token = await getToken();

    // Fetch lab profile
    const profileRes = await fetch(`${BASE_URL}/labs/lab-profiles/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!profileRes.ok) throw new Error("Failed to fetch lab profile");
    const profileData = await profileRes.json();
    setLabProfile(profileData[0] || null);

    // Fetch lab tests
    const testsRes = await fetch(`${BASE_URL}/labs/lab-tests/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!testsRes.ok) throw new Error("Failed to fetch lab tests");
    const testsData = await testsRes.json();
    setLabTests(testsData);

    // Calculate total tests and patients
    setTotalTests(testsData.length);
    const patientIds = new Set(testsData.map(t => t.patient?.id));
    setTotalPatients(patientIds.size);

    // Calculate weekly tests (Mon-Sun)
    const weekCounts = [0, 0, 0, 0, 0, 0, 0];
    const now = moment();
    testsData.forEach(test => {
      const date = moment(test.scheduled_date);
      if (date.isSame(now, 'week')) {
        const dayIdx = date.isoWeekday() - 1; // 0=Mon, 6=Sun
        if (dayIdx >= 0 && dayIdx < 7) weekCounts[dayIdx]++;
      }
    });
    setWeeklyTests(weekCounts);

  } catch (err) {
    Alert.alert("Error", "Unable to fetch lab data.");
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
const handleLogout = () => {
  Alert.alert(
    "Confirm Logout",
    "Are you sure you want to log out?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            console.log("User data cleared. Logged out.");

            // Navigate to login screen (adjust the route name as needed)
            navigation.replace("Login");
          } catch (error) {
            console.log("Logout failed:", error);
            Alert.alert("Error", "Something went wrong while logging out.");
          }
        },
      },
    ],
    { cancelable: true }
  );
};

const onRefresh = () => {
  setRefreshing(true);
  fetchAllData();
};

// if (loading) {
//   return (
//     <View style={styles.centered}>
//       <ActivityIndicator size="large" color="#6495ED" />
//       <Text style={{ color: "#6495ED", marginTop: 10 }}>Loading...</Text>
//     </View>
//   );
// }
if (!labProfile && !loading) {
  return (
    <View style={[styles.centered, { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }]}>
      {/* <Image
        source={require("../assets/labtests/microscope-cover.png")}
        style={{ width: 90, height: 90, marginBottom: 18, opacity: 0.7 }}
      /> */}
      <View style={styles.labIconContainer}>
        <MaterialCommunityIcons name="flask-outline" size={64} color="#1c78f2" />
      </View>
      <Text style={{ fontSize: 18, color: "#888", marginBottom: 18, fontWeight: "bold" }}>
        No Lab Profile Found
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: "#1c78f2",
          paddingVertical: 12,
          paddingHorizontal: 28,
          borderRadius: 8,
          marginTop: 10,
        }}
        onPress={() => navigation.navigate("LabRegister")}
      >
        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}>
      {/* Top Section */}
      <View style={[styles.topSection, { height: topHeight }]}>
        {/* Top Row with Images */}
        <View style={styles.imageRow}>
          {/* Left Side - Image + Name/Subtext */}
          <TouchableOpacity style={styles.leftBox} onPress={() => navigation.navigate("LabProfile")}>
            <Image
              source={require('../assets/UserProfile/profile-circle-icon.png')} // Replace with your image
              style={styles.icon}
            />
            <Text style={styles.nameText}>{labProfile?.name || "Lab Name"}</Text>
<Text style={styles.subText}>{labProfile?.address || "Lab Address"}</Text>
<Text style={styles.labId}>{labProfile?.user || ""}</Text>
          </TouchableOpacity>

          {/* Right Side - Image Only */}
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Image
            source={require('../assets/dashboard/threedots.png')} // Replace with your image
            style={styles.icon}
          />
          </TouchableOpacity>
          
          <Modal
  visible={menuVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setMenuVisible(false)}
>
  <TouchableOpacity
    style={styles.modalOverlay}
    activeOpacity={1}
    onPressOut={() => setMenuVisible(false)}
  >
    <View style={styles.menuContainer}>
      {/* <TouchableOpacity style={styles.menuItem} onPress={() => {
        setMenuVisible(false);
        navigation.navigate("LabRegister", { doctorName: doctor.name });
      }}>
        <Text style={styles.menuText}>Register</Text>
      </TouchableOpacity> */}

      <TouchableOpacity style={styles.menuItem} onPress={() => {
        setMenuVisible(false);
        navigation.navigate("LabTypes");
      }}>
        <Text style={styles.menuText}>Lab Type</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => {
        setMenuVisible(false);
        handleLogout();
      }}>
        <Text style={styles.menuText}>Logout</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
</Modal>

        </View>
            
      </View>

      {/* Floating Card */}
      <View style={styles.cardContainer}>
  <View style={styles.card}>
    {/* Top Row - Appointments */}
    <View style={styles.row}>
      <View>
        <Text style={styles.cardTitle}>Total Tests</Text>
<Text style={styles.cardContent}>{totalTests}</Text>
      </View>
      <Image
        source={require('../assets/doctor/stats.png')} // Replace with your image
        style={styles.cardImage}
      />
    </View>

    {/* Divider */}
    <View style={styles.divider} />

    {/* Bottom Row - Patients */}
    <View style={styles.row}>
      <View>
        <Text style={styles.cardTitle}>Total Patients</Text>
        <Text style={styles.cardContent}>{totalPatients}</Text>
      </View>
      <Image
        source={require('../assets/doctor/bar-chart.png')} // Replace with your image
        style={styles.cardImage}
      />
    </View>
  </View>
</View>

{/* Bar Graph Showing Patient Visits per Day */}
<View style={[styles.cardContainer, { marginTop: 20 }]}>
  <View style={styles.card}>
    <Text style={styles.cardTitle}>Weekly Tests</Text>
    <BarChart
  data={{
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: weeklyTests }]
  }}
  width={width - 64} // 32 padding on both sides inside card (or match your card's internal padding)
  height={220}
  fromZero={true}
  showValuesOnTopOfBars={true}
  chartConfig={{
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForBackgroundLines: { stroke: '#e3e3e3' },
  }}
  style={{
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 25,
    
  }}
/>

  </View>
</View>


<View style={[styles.infoRowContainer]}>
  {/* Image with background */}
  <View style={styles.imageBox}>
    <View style={styles.imageBackground}>
      <Image
        source={require('../assets/doctor/deadline.png')}
        style={styles.infoImage}
        resizeMode="contain"
      />
    </View>
    <View style={styles.verticalLine} />
  </View>

  {/* Right Side - Text and Card */}
  <View style={styles.infoTextContainer}>
    <Text style={styles.infoText}>Lab Availability</Text>

    {/* Small Card Below */}
    <View style={styles.availabilityContainer}>
  {/* Availability Card */}
  <View style={styles.availabilityCard}>
    <TouchableOpacity style={styles.scheduleRow} onPress={() => navigation.navigate("LabSchedule")}>
      {/* Left side - Texts */}
      <View style={styles.scheduleTextContainer}>
        <Text style={styles.scheduleTitle}>Add Schedules</Text>
        <Text style={styles.scheduleSubtitle}>Easily manage and add availability</Text>
      </View>

      {/* Right side - Image */}
      {/* <View style={styles.patientCountCircle}>
          <Text style={styles.patientCountText}>12</Text>
        </View> */}
    </TouchableOpacity>
  </View>

  {/* Horizontal Line */}
  <View style={styles.horizontalLine} />
</View>


  </View>
</View>


<View style={[styles.infoRowContainer]}>
  {/* Image with background */}
  <View style={styles.imageBox}>
    <View style={styles.imageBackground}>
      <Image
        source={require('../assets/doctor/deadline.png')}
        style={styles.infoImage}
        resizeMode="contain"
      />
    </View>
    <View style={styles.verticalLine} />
  </View>

  {/* Right Side - Text and Card */}
  <View style={styles.infoTextContainer}>
    <Text style={styles.infoText}>Lab Tests</Text>

    {/* Small Card Below */}
    <View style={styles.availabilityContainer}>
  {/* Availability Card */}
  <View style={styles.availabilityCard}>
    <TouchableOpacity style={styles.scheduleRow} onPress={() => navigation.navigate("TodaysLabTest")}>
      {/* Left side - Texts */}
      <View style={styles.scheduleTextContainer}>
        <Text style={styles.scheduleTitle}>Today's Lab Tests</Text>
        <Text style={styles.scheduleSubtitle}>Your lab test list, organized and on time.</Text>
      </View>

      {/* Right side - Image */}
      {/* <View style={styles.patientCountCircle}>
          <Text style={styles.patientCountText}>12</Text>
        </View> */}
    </TouchableOpacity>
  </View>

  {/* Horizontal Line */}
  <View style={styles.horizontalLine} />
</View>


  </View>
</View>

<View style={[styles.infoRowContainer]}>
  {/* Image with background */}
  <View style={styles.imageBox}>
    <View style={styles.imageBackground}>
      <Image
        source={require('../assets/doctor/calendar.png')}
        style={styles.infoImage}
        resizeMode="contain"
      />
    </View>
    <View style={styles.verticalLine} />
  </View>

  {/* Right Side - Text and Card */}
  <View style={styles.infoTextContainer}>
    <Text style={styles.infoText}>Lab Reports</Text>

    {/* Small Card Below */}
    <View style={styles.availabilityContainer}>
  {/* Availability Card */}
  <View style={styles.availabilityCard}>
    <TouchableOpacity style={styles.scheduleRow} onPress={() => navigation.navigate("UpcomingLabTest")}>
      {/* Left side - Texts */}
      <View style={styles.scheduleTextContainer}>
        <Text style={styles.scheduleTitle}>Lab Test Reports</Text>
        <Text style={styles.scheduleSubtitle}>Manage report for lab tests, all in one place.</Text>
      </View>

      {/* Right side - Image */}
      {/* <View style={styles.patientCountCircle}>
          <Text style={styles.patientCountText}>30</Text>
        </View> */}
    </TouchableOpacity>
  </View>

  {/* Horizontal Line */}
  <View style={styles.horizontalLine} />
</View>


  </View>
</View>


   
    </ScrollView>
  );
};

export default LabTestDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  topSection: {
    backgroundColor: '#1c78f2',
    paddingTop: 20,
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  leftBox: {
    alignItems: 'flex-start',
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#fff',
  },
  nameText: {
    color: '#fff',
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subText: {
    color: '#f0f8ff',
    fontSize: 18,
  },
  labId: {
    color: '#f0f8ff',
    fontSize: 18,
  },
  cardContainer: {
    marginTop: -80,
    marginLeft: 20,
    marginRight: 20,
    zIndex: 10,
  },
  graphPlaceholder: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 40,
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  cardImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    tintColor: "#0047ab"
    
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 15,
    color: '#555',
  },
  bottomSection: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bottomText: {
    fontSize: 18,
    color: '#333',
  },
//information section
infoRowContainer: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginTop: 30,
  marginLeft: 20,
  marginRight: 20,
},

imageBox: {
  alignItems: 'center',
  marginRight: 16,
},

imageBackground: {
  backgroundColor: '#e6f0ff', // Light blue background
  padding: 10,
  borderRadius: 16,
  justifyContent: 'center',
  alignItems: 'center',
  width: 40,
  height: 40,
},

infoImage: {
  width: 24,
  height: 24,
  tintColor: "#0047ab"
},

verticalLine: {
  width: 2,
  height: 150,
  backgroundColor: '#ccc',
  marginTop: 8,
},
horizontalLine: {
  height: 2,
  backgroundColor: '#ccc',
  marginTop: 40,
  width: '100%',
},


infoTextContainer: {
  flex: 1,
  justifyContent: 'center',
},

infoText: {
  fontSize: 16,
  color: '#333',
  fontWeight: '500',
},
availabilityContainer: {
  // paddingHorizontal: 10, // controls horizontal alignment
  marginTop: 40,
},

availabilityCard: {
  backgroundColor: '#fff',
  padding: 12,
  borderRadius: 10,
  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  width: '100%',
},

scheduleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 10,
},

scheduleTextContainer: {
  flex: 1,
},

scheduleTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#333',
},

scheduleSubtitle: {
  fontSize: 13,
  color: '#666',
  marginTop: 4,
},

scheduleImage: {
  width: 35,
  height: 35,
  marginLeft: 8,
  tintColor: "#1c78f2"
},
//Modal
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.3)',
  justifyContent: 'flex-start',
  alignItems: 'flex-end',
  padding: 10,
},

menuContainer: {
  backgroundColor: '#fff',
  borderRadius: 8,
  paddingVertical: 8,
  paddingHorizontal: 12,
  elevation: 5,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowOffset: { width: 0, height: 2 },
},

menuItem: {
  paddingVertical: 10,
},

menuText: {
  fontSize: 16,
  color: '#333',
},
patientCountCircle: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#1c78f2', // You can change this to your desired color
  justifyContent: 'center',
  alignItems: 'center',
  alignSelf: 'center',
},

patientCountText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 16,
},
labIconContainer: {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: "#e6f0ff",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 18,
  borderWidth: 2,
  borderColor: "#1c78f2",
},
});
