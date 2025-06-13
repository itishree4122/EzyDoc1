import React, {useState,useEffect} from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useFCMSetup from '../util/useFCMSetup'; // Adjust path as needed
import moment from 'moment';
import { ActivityIndicator } from 'react-native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';



const DoctorDashboard = ({ navigation }) => {
  const { height } = Dimensions.get('window');
  const { width } = useWindowDimensions();
    
  const [menuVisible, setMenuVisible] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [specialist, setSpecialist] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentYear = moment().format('YYYY');
   const [totalAppointments, setTotalAppointments] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [selectedTab, setSelectedTab] = useState('today');

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
            console.error("Logout failed:", error);
            Alert.alert("Error", "Something went wrong while logging out.");
          }
        },
      },
    ],
    { cancelable: true }
  );
};


  const topHeight = height * 0.3;
  useEffect(() => {
    const getDoctorDetails = async () => {
      try {
        const name = await AsyncStorage.getItem('doctorName');
        const specialistData = await AsyncStorage.getItem('specialist');
        

        console.log('Fetched Doctor Details:', { name, specialistData});

        if (name) setDoctorName(name);
        if (specialistData) setSpecialist(specialistData);
        
      } catch (error) {
        console.error('Error fetching doctor details:', error);
      }
    };

    getDoctorDetails();
  }, []);

  useEffect(() => {
    const fetchDoctorId = async () => {
      try {
        const id = await AsyncStorage.getItem('doctorId');
        console.log('Fetched Doctor ID:', id);  // Check in console
        if (id !== null) {
          setDoctorId(id);
        }
      } catch (error) {
        console.error('Failed to fetch doctor ID:', error);
      }
    };

    fetchDoctorId();
  }, []);

  // Runs FCM logic only when patientId is available
useFCMSetup(); // <--- Now clean and modular

 
useEffect(() => {
  if (!doctorId) return; // ⛔ Skip until doctorId is ready

  const fetchAppointments = async () => {
    try {
      const token = await getToken();
      if (!token || !doctorId) {
        setError('Missing token or doctor ID');
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/doctor/appointmentlist/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      const doctorAppointments = data.filter(item => item.doctor_id === doctorId);

      // Last 5 days including today
      const lastFiveDays = Array.from({ length: 5 }, (_, i) =>
        moment().subtract(4 - i, 'days')
      );

      const labels = lastFiveDays.map(date => date.format('DD MMM'));
      const counts = lastFiveDays.map(date => {
        const dateStr = date.format('YYYY-MM-DD');
        return doctorAppointments.filter(
          app => app.date_of_visit.trim() === dateStr
        ).length;
      });

      console.log('Chart Labels:', labels);
      console.log('Chart Data:', counts);

      setChartLabels(labels);
      setChartData(counts);
      setAppointments(doctorAppointments);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  fetchAppointments();
}, [doctorId]);



  // Filter appointments by tab
  const filterAppointments = (allAppointments, tab) => {
    const today = moment().format('YYYY-MM-DD');
    switch (tab) {
      case 'today':
        return allAppointments.filter(item => item.date_of_visit === today);
      case 'upcoming':
        return allAppointments.filter(item =>
          moment(item.date_of_visit).isAfter(today)
        );
      case 'past':
        return allAppointments.filter(item =>
          moment(item.date_of_visit).isBefore(today)
        );
      default:
        return allAppointments;
    }
  };

 useEffect(() => {
  if (!doctorId) return; // Prevent fetching until doctorId is available

  const fetchAppointments1 = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError('Missing token');
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/doctor/appointmentlist/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      const doctorAppointments = data.filter(item => item.doctor_id === doctorId);

      const uniquePatients = new Set(doctorAppointments.map(item => item.patient_name));

      setAppointments(doctorAppointments);
      setTotalAppointments(doctorAppointments.length);
      setTotalPatients(uniquePatients.size);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  fetchAppointments1();
}, [doctorId]);


  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}>
      {/* Top Section */}
      <View style={[styles.topSection, { height: topHeight }]}>
        {/* Top Row with Images */}
        <View style={styles.imageRow}>
          {/* Left Side - Image + Name/Subtext */}
          <View style={styles.leftBox} >
            <Image
              source={require('../assets/UserProfile/profile-circle-icon.png')} // Replace with your image
              style={styles.icon}
            />
            <Text style={styles.nameText}>{doctorName ?`Dr. ${doctorName}`:''}
            </Text>
            <Text style={styles.subText}>{specialist }</Text>
            <Text style={styles.doctorId}>{doctorId}</Text>
          </View>

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
      <TouchableOpacity style={styles.menuItem} onPress={() => {
        setMenuVisible(false);
        navigation.navigate("DoctorRegister",{doctorId});
      }}>
        <Text style={styles.menuText}>Register</Text>
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
        <Text style={styles.cardTitle}>Total Appointments</Text>
        <Text style={styles.cardContent}>{totalAppointments}</Text>
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
        <Text style={styles.cardTitle}>Patient Visit Overview</Text>
        <Text style={{ fontSize: 14, color: 'gray', marginBottom: 8 }}>
          Year: {currentYear}
        </Text>

        {chartData.every(value => value === 0) ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>
            No patient visits in the last 5 days.
          </Text>
        ) : (
          <BarChart
            data={{
              labels: chartLabels,
              datasets: [{ data: chartData }],
            }}
            width={width - 64}
            height={220}
            fromZero={true}
            showValuesOnTopOfBars={true}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 70, 700, ${opacity})`,
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
        )}
      </View>
    </View>


<View style={[styles.infoRowContainer]}>
  {/* Image with background */}
  <View style={styles.imageBox}>
    <View style={styles.imageBackground}>
      <Image
        source={require('../assets/doctor/calendar1.png')}
        style={styles.infoImage}
        resizeMode="contain"
      />
    </View>
    <View style={styles.verticalLine} />
  </View>

  {/* Right Side - Text and Card */}
  <View style={styles.infoTextContainer}>
    <Text style={styles.infoText}>Doctor Availability Information</Text>

    {/* Small Card Below */}
    <View style={styles.availabilityContainer}>
  {/* Availability Card */}
  <View style={styles.availabilityCard}>
    <TouchableOpacity style={styles.scheduleRow} onPress={() => navigation.navigate("MonthAvailability")}>
      {/* Left side - Texts */}
      <View style={styles.scheduleTextContainer}>
        <Text style={styles.scheduleTitle}>Add Schedules</Text>
        <Text style={styles.scheduleSubtitle}>Easily manage and add availability</Text>
      </View>

      {/* Right side - Image */}
      <Image
        source={require('../assets/doctor/add.png')}
        style={styles.scheduleImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
  </View>

  {/* Horizontal Line */}
  <View style={styles.horizontalLine} />
</View>


  </View>
</View>
{/* -------------------------------------------------------------------------- */}
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
    <Text style={styles.infoText}>Patient Availability Information</Text>

    {/* Small Card Below */}
    <View style={styles.availabilityContainer}>
  {/* Availability Card */}
  <View style={styles.availabilityCard}>
    <TouchableOpacity style={styles.scheduleRow} onPress={() => navigation.navigate("AppointmentList",{doctorId})}>
      {/* Left side - Texts */}
      <View style={styles.scheduleTextContainer}>
        <Text style={styles.scheduleTitle}>Patient Visit</Text>
        <Text style={styles.scheduleSubtitle}>Your patient list, organized and on time.</Text>
      </View>

     
     {/* Right side - Image */}
      <Image
        source={require('../assets/doctor/alarm.png')}
        style={styles.scheduleImage1}
        resizeMode="contain"
      />
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

export default DoctorDashboard;

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
  doctorId: {
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
    elevation: 5,
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
  elevation: 3,
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
scheduleImage1: {
  width: 35,
  height: 35,
  marginLeft: 8,
  
  
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

});
