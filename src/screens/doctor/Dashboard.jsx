import React, {useState, useEffect} from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useFCMSetup from '../util/useFCMSetup';
import moment from 'moment';
import { ActivityIndicator } from 'react-native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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

  useEffect(() => {
    if (!doctorId) return;

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
        setDoctorProfile(null);
      }
    };

    fetchDoctorProfile();
  }, [doctorId]);

  useEffect(() => {
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

    getDoctorDetails();
  }, []);

  useEffect(() => {
    const fetchDoctorId = async () => {
      try {
        const id = await AsyncStorage.getItem('doctorId');
        if (id !== null) {
          setDoctorId(id);
        }
      } catch (error) {
        console.error('Failed to fetch doctor ID:', error);
      }
    };

    fetchDoctorId();
  }, []);

  useFCMSetup();

  useEffect(() => {
    if (!doctorId) return; 

    const fetchAppointments = async () => {
      try {
        const token = await getToken();
        if (!token || !doctorId) {
          setError('Missing token or doctor ID');
          setLoading(false);
          return;
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
        setAppointments(doctorAppointments);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;

    const fetchAppointments1 = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setError('Missing token');
          setLoading(false);
          return;
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
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments1();
  }, [doctorId]);

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

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setAppointmentsLoading(true);
        const token = await getToken();
        if (!token || !doctorId) return;

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
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setTodayAppointments([]);
        setUpcomingAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    fetchAppointments();
  }, [doctorId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2a7fba" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ff6b6b', textAlign: 'center', fontSize: 16 }}>{error}</Text>
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
            <Image
              source={require('../assets/UserProfile/profile-circle-icon.png')}
              style={styles.profileImage}
            />
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

      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
            <Text style={styles.viewAllText}> View All</Text>
          </View>

          <View style={styles.sectionContent}>
            {appointmentsLoading ? (
              <ActivityIndicator size="small" color="#2a7fba" />
            ) : todayAppointments.length === 0 ? (
              <View style={styles.emptyAppointments}>
                  <Icon name="calendar" size={40} color="#cbd5e1" />
                  <Text style={styles.emptyAppointmentsText}>No appointments scheduled for today</Text>
              </View>
              // <Text style={styles.noDataText}>No appointments scheduled for today</Text>
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
            <Text style={styles.viewAllText}> View All</Text>
          </View>

          <View style={styles.sectionContent}>
            {appointmentsLoading ? (
              <ActivityIndicator size="small" color="#2a7fba" />
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

      {/* Floating Action Button */}
            <TouchableOpacity 
              style={styles.fab}
              onPress={() => navigation.navigate('MonthAvailability')}
            >
              <Icon name="plus" size={24} color="#fff" />
            </TouchableOpacity>

      {/* Bottom Navigation */}
      {/* <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('GraphScreen', { doctorId })}
        >
          <Icon name="bar-chart-2" size={24} color="#2a7fba" />
          <Text style={styles.navButtonText}>Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('MonthAvailability')}
        >
          <FontAwesome name="calendar-plus-o" size={22} color="#2a7fba" />
          <Text style={styles.navButtonText}>Schedule</Text>
        </TouchableOpacity>
      </View> */}
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  menuButton: {
    padding: 8,
  },
  scrollContainer: {
    paddingBottom: 10,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  viewAllText: {
    
    color: '#1c78f2',
    fontSize: 14,
    fontWeight: '500',
  
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  sectionContent: {
    marginTop: 8,
  },
emptyAppointments: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAppointmentsText: {
    color: '#94a3b8',
    marginTop: 8,
  },
  appointmentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateBadge: {
    backgroundColor: '#f0fdf4',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1c78f2',
  },
  patientDetails: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
  },
  chartContainer: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    width: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 15,
    color: '#334155',
  },
  logoutText: {
    color: '#ef4444',
  },
   fab: {
    position: 'absolute',
    right: 24,
    bottom: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1c78f2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    alignItems: 'center',
    padding: 8,
  },
  navButtonText: {
    fontSize: 12,
    color: '#2a7fba',
    marginTop: 4,
  },
  logoutButton: {
  padding: 8,
  marginLeft: 10,
},
});

export default DoctorDashboard;