import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BASE_URL } from '../auth/Api';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import { getToken } from '../auth/tokenHelper';
import useFCMSetup from '../util/useFCMSetup';

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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Initialize FCM
  useFCMSetup();

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
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
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

  const fetchDoctorProfile = async () => {
    try {
      const token = await getToken();
      const response = await fetchWithAuth(`${BASE_URL}/doctor/get/${doctorId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDoctorProfile(Array.isArray(data) ? data[0] : data);
      } else {
        setDoctorProfile(null);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setDoctorProfile(null);
    }
  };

  const getDoctorDetails = async () => {
    try {
      const name = await AsyncStorage.getItem('doctorName');
      const specialistData = await AsyncStorage.getItem('specialist');
      
      if (name) setDoctorName(name);
      if (specialistData) setSpecialist(specialistData);
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    }
  };

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

  const fetchAppointments1 = async () => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Missing authentication token');
      }

      const response = await fetchWithAuth(`${BASE_URL}/doctor/appointmentlist/`, {
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
      console.error('Appointments1 fetch error:', err);
      setError(err.message || 'Failed to load appointments');
    }
  };

  const fetchAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      const token = await getToken();
      if (!token || !doctorId) {
        throw new Error('Missing required data');
      }

      const response = await fetchWithAuth(`${BASE_URL}/doctor/appointmentlist/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch appointments');

      const allAppointments = await response.json();
      const todayDate = moment().format('YYYY-MM-DD');

      const doctorAppointments = allAppointments.filter(item =>
        item.doctor_id === doctorId &&
        item.checked === false &&
        item.cancelled === false
      );

      const todayList = doctorAppointments.filter(item =>
        item.date_of_visit === todayDate
      );

      const upcomingList = doctorAppointments.filter(item =>
        moment(item.date_of_visit).isAfter(todayDate)
      );

      setTodayAppointments(todayList);
      setUpcomingAppointments(upcomingList);

      // Update chart data
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

      setChartLabels(labels);
      setChartData(counts);
    } catch (error) {
      console.error('Appointments fetch error:', error);
      setTodayAppointments([]);
      setUpcomingAppointments([]);
      setError('Failed to load appointment data');
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const fetchDoctorId = async () => {
    try {
      const id = await AsyncStorage.getItem('doctorId');
      if (id !== null) {
        setDoctorId(id);
        return id;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch doctor ID:', error);
      throw error;
    }
  };

  const loadAllData = async () => {
    try {
      let currentDoctorId = doctorId;
      if (!currentDoctorId) {
        currentDoctorId = await fetchDoctorId();
        if (!currentDoctorId) {
          throw new Error('Doctor ID not found');
        }
        setDoctorId(currentDoctorId);
      }

      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchAppointments(),
        fetchAppointments1(),
        fetchDoctorProfile(),
        getDoctorDetails(),
        fetchUserDetails()
      ]);
      
      setInitialLoadComplete(true);
    } catch (error) {
      console.error('Load all data error:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await loadAllData();
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize dashboard');
        setLoading(false);
      }
    };

    if (!initialLoadComplete) {
      initializeDashboard();
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (initialLoadComplete && doctorId) {
        loadAllData();
      }
    }, [initialLoadComplete, doctorId])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadAllData();
  }, [doctorId]);

  if (loading && !initialLoadComplete) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1c78f2" />
        <Text style={{ marginTop: 10 }}>Loading dashboard...</Text>
      </View>
    );
  }

  const getBase64ImageSource = (base64String) => {
  if (!base64String) return null;
  
  // Check if it's already a data URI
  if (base64String.startsWith('data:image')) {
    return base64String;
  }

  // Default to JPEG if we can't determine the type
  return `data:image/jpeg;base64,${base64String}`;
};

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ff6b6b', textAlign: 'center', fontSize: 16 }}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={loadAllData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      
     <View style={styles.header}>
  <View style={styles.headerContent}>
    <TouchableOpacity
      onPress={() => navigation.navigate("DoctorProfile", { doctorId })}
      style={styles.profileButton}
    >
      {doctorProfile?.profile_image ? (
        <Image
          source={{ 
            uri: `data:image/jpeg;base64,${doctorProfile.profile_image}` 
          }}
          style={styles.profileImage}
          onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
        />
      ) : (
        <Image
          source={require('../assets/UserProfile/profile-circle-icon.png')}
          style={styles.profileImage}
        />
      )}
      <View style={styles.profileTextContainer}>
        <Text style={styles.greeting}>Hello, Dr.</Text>
        <Text style={styles.doctorName}>{firstName} {lastName}</Text>
      </View>
    </TouchableOpacity>
    
    <TouchableOpacity 
      onPress={handleLogout}
      style={styles.logoutButton}
    >
      <Icon name="log-out" size={24} color="#fff" />
    </TouchableOpacity>
  </View>
</View>

      {/* Menu Modal */}
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
            {!doctorProfile && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("DoctorRegister", { doctorId });
                }}
              >
                <Text style={styles.menuText}>Complete Registration</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("DoctorProfile", { doctorId });
              }}
            >
              <Text style={styles.menuText}>My Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleLogout();
              }}
            >
              <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1c78f2']}
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{totalAppointments}</Text>
              <Text style={styles.statLabel}>Total Appointments</Text>
            </View>
            <View style={styles.statIcon}>
              <MaterialIcons name="event-note" size={28} color="#fff" />
            </View>
          </View>

          <View style={[styles.statCard, styles.secondaryCard]}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{totalPatients}</Text>
              <Text style={styles.statLabel}>Total Patients</Text>
            </View>
            <View style={styles.statIcon}>
              <FontAwesome name="users" size={24} color="#fff" />
            </View>
          </View>
        </View>

        {/* Schedule Button */}
        <View style={styles.scheduleButtonContainer}>
          <TouchableOpacity 
            style={styles.scheduleButton}
            onPress={() => navigation.navigate('MonthAvailability')}
          >
            <Text style={styles.scheduleButtonText}>Schedule Your Time</Text>
            <Icon name="calendar" size={20} color="#fff" style={styles.scheduleButtonIcon} />
          </TouchableOpacity>
        </View>

        {/* Patient Visit Chart */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Patient Visits</Text>
            <Text style={styles.chartSubtitle}>Last 5 Days</Text>
          </View>

          <View style={styles.chartContainer}>
            {chartData.every(value => value === 0) ? (
              <View style={styles.emptyAppointments}>
                  <Icon name="calendar" size={40} color="#cbd5e1" />
                  <Text style={styles.emptyAppointmentsText}>No patient visit record</Text>
              </View>
            ) : (
              <BarChart
                data={{
                  labels: chartLabels,
                  datasets: [{ data: chartData }],
                }}
                width={width - 80}
                height={220}
                fromZero={true}
                showValuesOnTopOfBars={true}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#f8fafc',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(28, 120, 242, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForBackgroundLines: { 
                    stroke: '#e5e7eb',
                    strokeWidth: 1,
                    strokeDasharray: '0'
                  },
                  propsForLabels: {
                    fontSize: 12,
                    fontWeight: '500'
                  },
                  barPercentage: 0.8,
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 12,
                }}
              />
            )}
          </View>
        </View>

        {/* Today's Appointments */}
        <TouchableOpacity 
          onPress={() => navigation.navigate("AppointmentList", { doctorId, tab: 'today' })} 
          style={styles.sectionContainer}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Appointments</Text>
            <Text style={styles.viewAllText}>View All</Text>
          </View>

          <View style={styles.sectionContent}>
            {appointmentsLoading ? (
              <ActivityIndicator size="small" color="#1c78f2" />
            ) : todayAppointments.length === 0 ? (
              <View style={styles.emptyAppointments}>
                  <Icon name="calendar" size={40} color="#cbd5e1" />
                  <Text style={styles.emptyAppointmentsText}>No appointments scheduled for today</Text>
              </View>
            ) : (
              todayAppointments.slice(0, 3).map((appointment, index) => (
                <View key={index} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.patientName}>{appointment.patient_name}</Text>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeText}>
                        {moment(appointment.visit_time, 'HH:mm:ss').format('hh:mm A')}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.patientDetails}>
                    <View style={styles.detailRow}>
                      <Icon name="user" size={14} color="#6b7280" />
                      <Text style={styles.detailText}>{appointment.patient_age} yrs • {appointment.patient_gender === 'M' ? 'Male' : 'Female'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon name="clock" size={14} color="#6b7280" />
                      <Text style={styles.detailText}>{appointment.shift} Shift</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </TouchableOpacity>

        {/* Upcoming Appointments */}
        <TouchableOpacity 
          style={styles.sectionContainer}
          onPress={() => navigation.navigate("AppointmentList", { doctorId, tab: 'upcoming' })}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <Text style={styles.viewAllText}>View All</Text>
          </View>

          <View style={styles.sectionContent}>
            {appointmentsLoading ? (
              <ActivityIndicator size="small" color="#1c78f2" />
            ) : upcomingAppointments.length === 0 ? (
              <View style={styles.emptyAppointments}>
                  <Icon name="calendar" size={40} color="#cbd5e1" />
                  <Text style={styles.emptyAppointmentsText}>No Upcoming Appointments</Text>
              </View>
            ) : (
              upcomingAppointments.slice(0, 3).map((appointment, index) => (
                <View key={index} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.patientName}>{appointment.patient_name}</Text>
                    <View style={[styles.timeBadge, styles.dateBadge]}>
                      <Text style={styles.timeText}>
                        {moment(appointment.date_of_visit).format('MMM D')}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.patientDetails}>
                    <View style={styles.detailRow}>
                      <Icon name="clock" size={14} color="#6b7280" />
                      <Text style={styles.detailText}>
                        {moment(appointment.visit_time, 'HH:mm:ss').format('hh:mm A')} ({appointment.shift})
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon name="user" size={14} color="#6b7280" />
                      <Text style={styles.detailText}>{appointment.patient_age} yrs • {appointment.patient_gender === 'M' ? 'Male' : 'Female'}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1c78f2',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  profileTextContainer: {
    flexDirection: 'column',
  },
  greeting: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  doctorName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '80%',
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuText: {
    fontSize: 16,
    color: '#334155',
  },
  logoutText: {
    color: '#ef4444',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
  },
  primaryCard: {
    backgroundColor: '#1c78f2',
  },
  secondaryCard: {
    backgroundColor: '#38bdf8',
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#e0f2fe',
    fontSize: 14,
  },
  statIcon: {
    paddingLeft: 10,
  },
  scheduleButtonContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  scheduleButton: {
    backgroundColor: '#1c78f2',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  scheduleButtonIcon: {
    marginTop: 2,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  viewAllText: {
    color: '#1c78f2',
    // color: '#2a7fba',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionContent: {
    marginTop: 8,
  },
  appointmentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  timeBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateBadge: {
    backgroundColor: '#f0fdf4',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0369a1',
  },
  patientDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#64748b',
  },
  emptyAppointments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyAppointmentsText: {
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#1c78f2',
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DoctorDashboard;