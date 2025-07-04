import React, {useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useNavigation, useFocusEffect  } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import { fetchWithAuth } from '../auth/fetchWithAuth';
const AmbulanceDashboard = () => {
  const { height } = Dimensions.get('window');
  const { width } = useWindowDimensions();
      const [menuVisible, setMenuVisible] = useState(false);
  
    const navigation = useNavigation();
    const [ambulanceId, setAmbulanceId] = useState('');
    const [countData, setCountData] = useState(null);
    const [inactiveModalVisible, setInactiveModalVisible] = useState(false);
    const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [email, setEmail] = useState('');

const [inactiveAmbulances, setInactiveAmbulances] = useState([]);

  // const [loading, setLoading] = useState(true);
    


  const topHeight = height * 0.3;

  useEffect(() => {
    const fetchAmbulanceId = async () => {
      try {
        const id = await AsyncStorage.getItem('ambulanceId');
        console.log('Fetched Lab ID:', id);  // Check in console
        if (id !== null) {
          setAmbulanceId(id);
        }
      } catch (error) {
        console.error('Failed to fetch lab ID:', error);
      }
    };

    fetchAmbulanceId();
  }, []);

  useEffect(() => {
  const fetchUserDetails = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData !== null) {
        const user = JSON.parse(userData);
        setFirstName(user.first_name);
        setLastName(user.last_name);
        setEmail(user.email);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  fetchUserDetails();
}, []);


 useFocusEffect(
  useCallback(() => {
    const fetchData = async () => {
      try {
        const id = await AsyncStorage.getItem('ambulanceId');
        if (id) {
          setAmbulanceId(id);
          const token = await getToken();

          // const response = await fetch(`${BASE_URL}/ambulance/count/${id}/`, {
          const response = await fetchWithAuth(`${BASE_URL}/ambulance/count/${id}/`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            Alert.alert('Error', errorData.message || 'Failed to fetch ambulance count');
            return;
          }

          const data = await response.json();
          setCountData(data);
        }
      } catch (error) {
        console.error('Error fetching ambulance count:', error);
        Alert.alert('Error', 'Something went wrong');
      }
    };

    fetchData();
  }, [])
);


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
            const token = await getToken();
            await fetch(`${BASE_URL}/users/firebase-token/remove/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });
            await AsyncStorage.clear();
            console.log("User data cleared. Logged out.");

            // Navigate to login screen (adjust the route name as needed)
            // navigation.replace("Login");
            navigation.reset({
  index: 0,
  routes: [{ name: 'Login' }],
});
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50, flexGrow: 1 }}>
      {/* Top Section */}
      <View style={[styles.topSection, { height: topHeight }]}>
        {/* Top Row with Images */}
        <View style={styles.imageRow}>
          {/* Left Side - Image + Name/Subtext */}
          <TouchableOpacity style={styles.leftBox} >
            <Image
              source={require('../assets/UserProfile/profile-circle-icon.png')} // Replace with your image
              style={styles.icon}
            />
            
            <View style={styles.userInfoContainer}>
  <Text style={styles.labId}>{ambulanceId}</Text>
  <Text style={styles.labId}>Name: {firstName} {lastName}</Text>
  <Text style={styles.labId}>Email: {email}</Text>
</View>

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
                <TouchableOpacity style={styles.menuItem} onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("AmbulanceRegister", {ambulanceId});
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
        {/* Top Row - Active Ambulance */}
        <View style={styles.row}>
          <View>
            <Text style={styles.cardTitle}>Active Ambulance</Text>
            <Text style={styles.cardContent}>{countData?.active_count ?? 0}</Text>
          </View>
          <Image
            source={require('../assets/doctor/stats.png')}
            style={styles.cardImage}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom Row - Inactive Ambulance */}
        <TouchableOpacity >
  <View style={styles.row}>
    <View>
      <Text style={styles.cardTitle}>Inactive Ambulance</Text>
      <Text style={styles.cardContent}>{countData?.inactive_count ?? 0}</Text>
    </View>
    <Image
      source={require('../assets/doctor/bar-chart.png')}
      style={styles.cardImage}
    />
  </View>
</TouchableOpacity>

      </View>
    </View>


    <Modal
  visible={inactiveModalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setInactiveModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Inactive Ambulances</Text>
      <ScrollView>
        {inactiveAmbulances.map((ambulance, index) => (
          <View key={index} style={styles.ambulanceItem}>
            <Text style={styles.itemText}>Service Name: {ambulance.service_name}</Text>
            <Text style={styles.itemText}>Vehicle Number: {ambulance.vehicle_number}</Text>
            <Text style={styles.itemText}>Status: {ambulance.active ? 'Active' : 'Inactive'}</Text>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={() => setInactiveModalVisible(false)} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>




<View style={[styles.infoRowContainer]}>
  {/* Image with background */}
  <View style={styles.imageBox}>
    <View style={styles.imageBackground}>
      <Image
        source={require('../assets/ambulance/call.png')}
        style={styles.infoImage}
        resizeMode="contain"
      />
    </View>
    <View style={styles.verticalLine} />
  </View>

  {/* Right Side - Text and Card */}
  <View style={styles.infoTextContainer}>
    <Text style={styles.infoText}>Ambulance Availability Information</Text>

    {/* Small Card Below */}
    <View style={styles.availabilityContainer}>
  {/* Availability Card */}
  <View style={styles.availabilityCard}>
    <TouchableOpacity style={styles.scheduleRow} onPress={() => navigation.navigate("RegisteredAmbulance", {ambulanceId})}>
      {/* Left side - Texts */}
      <View style={styles.scheduleTextContainer}>
        <Text style={styles.scheduleTitle}>Registered Ambulance</Text>
        <Text style={styles.scheduleSubtitle}>List of all verified ambulance services.</Text>
      </View>

      {/* Right side - Image */}
      <Image
        source={require('../assets/ambulance/next.png')}
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

<View style={[styles.infoRowContainer]}>
  {/* Image with background */}
  <View style={styles.imageBox}>
    <View style={styles.imageBackground}>
      <Image
        source={require('../assets/ambulance/call.png')}
        style={styles.infoImage}
        resizeMode="contain"
      />
    </View>
    <View style={styles.verticalLine} />
  </View>

  {/* Right Side - Text and Card */}
  <View style={styles.infoTextContainer}>
    <Text style={styles.infoText}>Ambulance Status Information</Text>

    {/* Small Card Below */}
    <View style={styles.availabilityContainer}>
  {/* Availability Card */}
  <View style={styles.availabilityCard}>
    <TouchableOpacity style={styles.scheduleRow} onPress={() => navigation.navigate("ActiveAmbulance", {ambulanceId})}>
      {/* Left side - Texts */}
      <View style={styles.scheduleTextContainer}>
        <Text style={styles.scheduleTitle}>Ambulance Status</Text>
        <Text style={styles.scheduleSubtitle}>Monitor active and inactive ambulances in real time.</Text>
      </View>

      {/* Right side - Image */}
      <Image
        source={require('../assets/ambulance/next.png')}
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

   
    </ScrollView>
  );
};

export default AmbulanceDashboard;

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
  userInfoContainer: {
    marginTop: 10,
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
  width: 30,
  height: 30,
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





modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 10,
  textAlign: 'center',
},
ambulanceItem: {
  marginBottom: 15,
  padding: 10,
  backgroundColor: '#f2f2f2',
  borderRadius: 8,
},
itemText: {
  fontSize: 16,
  marginBottom: 5,
},
closeButton: {
  marginTop: 20,
  backgroundColor: '#007BFF',
  padding: 10,
  borderRadius: 5,
  alignItems: 'center',
},
closeButtonText: {
  color: '#fff',
  fontSize: 16,
},


});
