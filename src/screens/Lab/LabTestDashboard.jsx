import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Modal,  
  ActivityIndicator, 
  Alert,
  RefreshControl,
  Animated,
  Easing
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from "../auth/Api";
import { getToken } from "../auth/tokenHelper";
import moment from "moment";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import { BarChart } from 'react-native-chart-kit';

const LabTestDashboard = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [labProfile, setLabProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalTests, setTotalTests] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [weeklyTests, setWeeklyTests] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [labTests, setLabTests] = useState([]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const statsSlideAnim = useRef(new Animated.Value(Dimensions.get('window').height * 0.1)).current;

  const today = moment().startOf('day');
  const todayLabTests = labTests.filter(test => moment(test.scheduled_date).isSame(today, 'day'));
  const upcomingLabTests = labTests.filter(test => moment(test.scheduled_date).isAfter(today, 'day'));

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(statsSlideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      )
    ]).start();

    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      // Fetch lab profile
      const profileRes = await fetchWithAuth(`${BASE_URL}/labs/lab-profiles/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileRes.ok) throw new Error("Failed to fetch lab profile");
      const profileData = await profileRes.json();
      setLabProfile(profileData[0] || null);

      // Fetch lab tests
      const testsRes = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!testsRes.ok) throw new Error("Failed to fetch lab tests");
      const testsData = await testsRes.json();
      setLabTests(testsData);

      // Calculate totals
      setTotalTests(testsData.length);
      const patientIds = new Set(testsData.map(t => t.patient?.id));
      setTotalPatients(patientIds.size);

      // Calculate weekly tests
      const weekCounts = [0, 0, 0, 0, 0, 0, 0];
      const now = moment();
      testsData.forEach(test => {
        const date = moment(test.scheduled_date);
        if (date.isSame(now, 'week')) {
          const dayIdx = date.isoWeekday() - 1;
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

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
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
              console.log("Logout failed:", error);
              Alert.alert("Error", "Something went wrong while logging out.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData();
  }, []);

  // Helper functions
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed': return '#10B981';
      case 'scheduled': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      case 'in progress': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusBackgroundColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed': return '#ECFDF5';
      case 'scheduled': return '#FFFBEB';
      case 'cancelled': return '#FEF2F2';
      case 'in progress': return '#EFF6FF';
      default: return '#F3F4F6';
    }
  };

  const getStatusIcon = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed': return 'check-circle';
      case 'scheduled': return 'clock';
      case 'cancelled': return 'x-circle';
      case 'in progress': return 'refresh-cw';
      default: return 'help-circle';
    }
  };

  const statusCounts = labTests.reduce((acc, test) => {
    const status = (test.status || 'Unknown').toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  if (!labProfile && !loading) {
    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.labIconContainer}>
          <MaterialCommunityIcons name="flask-outline" size={64} color="#1c78f2" />
        </View>
        <Text style={styles.emptyStateTitle}>No Lab Profile Found</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("LabRegister")}
        >
          <Text style={styles.buttonText}>Register Lab</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleLogout}
        >
          <Text style={styles.secondaryButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c78f2" />
      </View>
    );
  }

  const waveTranslateY = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header with Profile */}
      <LinearGradient 
        colors={['#1a73e8', '#4285f4']} 
        start={{x: 0, y: 0}} 
        end={{x: 1, y: 1}}
        style={styles.headerGradient}
      >
        {/* Animated wave effect at bottom */}
        <Animated.View style={[
          styles.waveEffect,
          { transform: [{ translateY: waveTranslateY }] }
        ]} />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.profileSection}
            onPress={() => navigation.navigate("LabProfile")}
            activeOpacity={0.8}
          >
            <Animated.View style={[
              styles.profileImageContainer,
              { transform: [{ scale: scaleAnim }] }
            ]}>
              <Image 
                source={labProfile?.logo ? {uri: labProfile.logo} : require('../assets/UserProfile/profile-circle-icon.png')} 
                style={styles.profileImage} 
              />
              <View style={styles.onlineIndicator} />
            </Animated.View>
            
            
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileTextContainer} onPress={() => navigation.navigate("LabProfile")}>
              {/* <Text style={styles.welcomeText}>Welcome back,</Text> */}
              <Text style={styles.labNameText} numberOfLines={1}>
                {labProfile?.name || "Lab Name"}
                {labProfile?.verified && (
                  <MaterialCommunityIcons name="check-decagram" size={16} color="#34a853" style={styles.verifiedIcon} />
                )}
              </Text>
              <View style={styles.locationContainer}>
                <MaterialCommunityIcons name="map-marker" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.subText} numberOfLines={1}>
                  {labProfile?.address || "Lab Address"}
                </Text>
              </View>
            </TouchableOpacity>
          
          <View style={styles.headerIcons}>
            
            
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity 
                onPress={handleLogout}
                style={styles.iconButton}
                activeOpacity={0.7}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <Icon name="log-out" size={20} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
        
        {/* Stats ribbon */}
        <Animated.View style={[
          styles.statsRibbon,
          { transform: [{ translateY: statsSlideAnim }] }
        ]}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalTests}</Text>
            <Text style={styles.statLabel}>Total Tests</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{todayLabTests.length}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statDivider}  />
          <View style={styles.statItem} onPress={() => navigation.navigate("LabRegister")}>
            <Text style={styles.statNumber}>{totalPatients}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1c78f2']}
            tintColor="#1c78f2"
          />
        }
      >
        {/* Status Summary */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Test Status</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusCardsContainer}
          >
            {Object.entries(statusCounts).map(([status, count], index) => (
              <View 
                key={index} 
                style={[
                  styles.statusCard,
                  { backgroundColor: getStatusBackgroundColor(status) }
                ]}
              >
                <View style={styles.statusIconContainer}>
                  <Icon 
                    name={getStatusIcon(status)} 
                    size={20} 
                    color={getStatusColor(status)} 
                  />
                </View>
                <Text style={styles.statusCardTitle}>{capitalizeFirstLetter(status)}</Text>
                <Text style={styles.statusCardCount}>{count}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Analytics Chart */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Test Distribution</Text>
            
          </View>
          
          {Object.keys(statusCounts).length > 0 ? (
            <View style={styles.chartContainer}>
              <BarChart
                data={{
                  labels: Object.keys(statusCounts).map(status => capitalizeFirstLetter(status)),
                  datasets: [{ data: Object.values(statusCounts) }],
                }}
                width={Dimensions.get('window').width - 80}
                height={220}
                yAxisLabel=""
                fromZero
                chartConfig={{
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(28, 120, 242, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                  style: { borderRadius: 12 },
                  propsForBackgroundLines: { strokeWidth: 0.5, stroke: '#e2e8f0' },
                  propsForLabels: { fontSize: 11 }
                }}
                style={styles.chart}
              />
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Icon name="bar-chart-2" size={40} color="#cbd5e1" />
              <Text style={styles.emptyChartText}>No data available</Text>
            </View>
          )}
        </View>

        {/* Today's Appointments */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate("TodaysLabTest", { viewType: 'today' })}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {todayLabTests.length > 0 ? (
            <View style={styles.appointmentsContainer}>
              {todayLabTests.slice(0, 3).map((test, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.appointmentCard}
                  onPress={() => navigation.navigate("LabTestDetails", { testId: test.id })}
                >
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.appointmentName}>{test.patient_name || "Unnamed Patient"}</Text>
                    <View style={[
                      styles.appointmentStatus,
                      { backgroundColor: getStatusBackgroundColor(test.status) }
                    ]}>
                      <Icon 
                        name={getStatusIcon(test.status)} 
                        size={12} 
                        color={getStatusColor(test.status)} 
                      />
                      <Text style={[
                        styles.appointmentStatusText,
                        { color: getStatusColor(test.status) }
                      ]}>
                        {(test.status || "Pending").toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.appointmentTest}>{test.test_type || "Test Type"}</Text>
                  <View style={styles.appointmentTime}>
                    <Icon name="clock" size={14} color="#64748b" />
                    <Text style={styles.appointmentTimeText}>
                      {test.scheduled_date 
                        ? moment(test.scheduled_date).format('hh:mm A')
                        : "No Time"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyAppointments}>
              <Icon name="calendar" size={40} color="#cbd5e1" />
              <Text style={styles.emptyAppointmentsText}>No appointments today</Text>
            </View>
          )}
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate("TodaysLabTest", { viewType: 'upcoming' })}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {upcomingLabTests.length > 0 ? (
            <View style={styles.upcomingList}>
              {upcomingLabTests.slice(0, 5).map((test, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.upcomingItem}
                  onPress={() => navigation.navigate("LabTestDetails", { testId: test.id })}
                >
                  <View style={[
                    styles.upcomingIndicator,
                    { backgroundColor: getStatusColor(test.status) }
                  ]} />
                  <View style={styles.upcomingContent}>
                    <Text style={styles.upcomingName}>{test.patient_name || "Unnamed Patient"}</Text>
                    <Text style={styles.upcomingTest}>{test.test_type || "Test Type"}</Text>
                  </View>
                  <View style={styles.upcomingTime}>
                    <Text style={styles.upcomingDay}>
                      {test.scheduled_date 
                        ? moment(test.scheduled_date).format('DD MMM')
                        : "No Date"}
                    </Text>
                    <Text style={styles.upcomingHour}>
                      {test.scheduled_date 
                        ? moment(test.scheduled_date).format('hh:mm A')
                        : "No Time"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyAppointments}>
              <Icon name="calendar" size={40} color="#cbd5e1" />
              <Text style={styles.emptyAppointmentsText}>No upcoming appointments</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('LabSchedule')}
      >
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity> */}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('LabTestDashboard')}
        >
          <Icon name="home" size={24} color="#1c78f2" />
          <Text style={styles.activeNavText}>Home</Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('LabTypes')}
        >
          <FontAwesome name="flask" size={24} color="#64748b" />
          <Text style={styles.navText}>Tests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('UpcomingLabTest')}
        >
          <Icon name="file-text" size={24} color="#64748b" />
          <Text style={styles.navText}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('LabSchedule')}
        >
          <Icon name="calendar" size={24} color="#64748b" />
          <Text style={styles.navText}>Schedule</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  labIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e6f0ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#1c78f2",
  },
  emptyStateTitle: {
    fontSize: 20,
    color: "#334155",
    marginBottom: 20,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#1c78f2",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
    marginTop: 14,
  },
  secondaryButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: '500',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  waveEffect: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34a853',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileTextContainer: {
    flex: 1,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 2,
  },
  labNameText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  verifiedIcon: {
    marginLeft: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginLeft: 4,
    maxWidth: '90%',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 10,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbc05',
  },
  statsRibbon: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 5,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 5,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 100,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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
    color: '#1e293b',
  },
  viewAllLink: {
    color: '#1c78f2',
    fontSize: 14,
    fontWeight: '500',
  },
  statusCardsContainer: {
    paddingBottom: 8,
  },
  statusCard: {
    width: 140,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
  },
  statusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusCardTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  statusCardCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  chartContainer: {
    marginTop: 8,
  },
  chart: {
    borderRadius: 12,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: '#94a3b8',
    marginTop: 8,
  },
  appointmentsContainer: {
    marginTop: 8,
  },
  appointmentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  appointmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  appointmentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  appointmentTest: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentTimeText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
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
  upcomingList: {
    marginTop: 8,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  upcomingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  upcomingTest: {
    fontSize: 13,
    color: '#64748b',
  },
  upcomingTime: {
    alignItems: 'flex-end',
  },
  upcomingDay: {
    fontSize: 13,
    color: '#64748b',
  },
  upcomingHour: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 85,
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
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  navText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  activeNavText: {
    fontSize: 12,
    color: '#1c78f2',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default LabTestDashboard;