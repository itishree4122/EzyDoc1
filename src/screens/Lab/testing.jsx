import React, {useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ScrollView, TouchableOpacity, Modal,  ActivityIndicator, Alert } from 'react-native';

import { useWindowDimensions } from 'react-native';
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
const today = moment().startOf('day');
const todayLabTests = labTests.filter(test => moment(test.scheduled_date).isSame(today, 'day'));

const upcomingLabTests = labTests.filter(test => moment(test.scheduled_date).isAfter(today, 'day'));

 

  useEffect(() => {
  fetchAllData();
}, []);

const fetchAllData = async () => {
  setLoading(true);
  try {
    const token = await getToken();

    // Fetch lab profile
    // const profileRes = await fetch(`${BASE_URL}/labs/lab-profiles/`, {
    const profileRes = await fetchWithAuth(`${BASE_URL}/labs/lab-profiles/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!profileRes.ok) throw new Error("Failed to fetch lab profile");
    const profileData = await profileRes.json();
    setLabProfile(profileData[0] || null);

    // Fetch lab tests
    // const testsRes = await fetch(`${BASE_URL}/labs/lab-tests/`, {
    const testsRes = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/`, {
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

  return (
    <View style={{ flex: 1 }} >
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80, flexGrow: 1 }}>
      {/* Top Section */}

      <View style={[styles.profileCard, { backgroundColor: '#f0f4ff' }]}>
  <TouchableOpacity style={styles.leftSection} onPress={() => navigation.navigate("LabProfile")}>
    <Image source={require('../assets/UserProfile/profile-circle-icon.png')} style={styles.profileImageLarge} />
    <View style={styles.textContainer}>
     
      <Text style={styles.nameText}>{labProfile?.name || "Lab Name"}</Text>
      <Text style={styles.subText}>{labProfile?.address || "Lab Address"}</Text>
       <Text style={[styles.labId, { display: 'none' }]}>
              {labProfile?.user || ""}
            </Text>
    </View>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
    <Icon name="more-vertical" size={22} color="#333" />
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
              handleLogout();
            }}>
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
</View>

    

     {/* Today's LabTest */}
    
    <TouchableOpacity style={styles.cardContainer} onPress={() => navigation.navigate("TodaysLabTest", { viewType: 'today' })}>
  <View style={styles.cardHeader}>
    <LinearGradient colors={['#1c78f2', '#5ba4ff']} style={styles.gradientHeader}>
      <Text style={styles.cardTitle}>Today's Lab Test Appointments</Text>
    </LinearGradient>
  </View>

  <View style={styles.card}>
    {todayLabTests.length === 0 ? (
      <Text style={styles.noDataText}>No Lab Tests for Today</Text>
    ) : (
      todayLabTests.slice(0, 3).map((test, index) => (
        <View
          key={index}
          style={[
            styles.cardItem,
            index !== todayLabTests.slice(0, 3).length - 1 && styles.cardItemBorder
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardItemTitle}>{test.patient_name || "Unnamed Patient"}</Text>

            <View style={[styles.statusBadge, getStatusStyle(test.status), { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }]}>
              <Icon name={getStatusIcon(test.status)} size={12} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.statusText}>{(test.status || "Pending").toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.cardItemSubtitle}>{test.test_type || "Test Type"}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <FontAwesome name="clock-o" size={14} color="#6B7280" style={{ marginRight: 4, marginTop: 5 }} />
        <Text style={styles.cardItemDate}>
          {test.scheduled_date 
            ? moment(test.scheduled_date).format('DD MMM YYYY, hh:mm A')
            : "No Date"}
        </Text>
      </View>

        </View>
      ))
    )}

    <View style={styles.cardFooter}>
      <View style={styles.divider} />
      <TouchableOpacity onPress={() => navigation.navigate("TodaysLabTest")} style={styles.viewAllButton}>
        <Text style={styles.viewAllText}>View All Lab Tests</Text>
      </TouchableOpacity>
    </View>
  </View>
</TouchableOpacity>

     

{/* upcoming labtest */}
      
      <TouchableOpacity style={styles.cardContainer} onPress={() => navigation.navigate("TodaysLabTest", { viewType: 'upcoming' })}>
  <View style={styles.cardHeader}>
    <LinearGradient colors={['#1c78f2', '#5ba4ff']} style={styles.gradientHeader}>
      <Text style={styles.cardTitle}>Upcoming Lab Test Appointments</Text>
    </LinearGradient>
  </View>

  <View style={styles.card}>
    {upcomingLabTests.length === 0 ? (
      <Text style={styles.noDataText}>No Upcoming Lab Tests</Text>
    ) : (
      upcomingLabTests.slice(0, 3).map((test, index) => (
        <View
          key={index}
          style={[
            styles.cardItem,
            index !== upcomingLabTests.slice(0, 3).length - 1 && styles.cardItemBorder
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardItemTitle}>{test.patient_name || "Unnamed Patient"}</Text>

            <View style={[styles.statusBadge, getStatusStyle(test.status), { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }]}>
              <Icon name={getStatusIcon(test.status)} size={12} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.statusText}>{(test.status || "Pending").toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.cardItemSubtitle}>{test.test_type || "Test Type"}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <FontAwesome name="clock-o" size={14} color="#6B7280" style={{ marginRight: 4, marginTop: 5 }} />
              <Text style={styles.cardItemDate}>
              {test.scheduled_date 
                ? moment(test.scheduled_date).format('DD MMM YYYY, hh:mm A')
                : "No Date"}
            </Text>
          </View>
        </View>
      ))
    )}

    <View style={styles.cardFooter}>
      <View style={styles.divider} />
      <TouchableOpacity onPress={() => navigation.navigate("UpcomingLabTests")} style={styles.viewAllButton}>
        <Text style={styles.viewAllText}>View All Upcoming Tests</Text>
      </TouchableOpacity>
    </View>
  </View>
</TouchableOpacity>

      

      {/* status */}
  {/* Lab Test Status Summary */}
<View style={styles.cardContainer}>
  <View style={styles.cardHeader}>
    <LinearGradient colors={['#1c78f2', '#5ba4ff']} style={styles.gradientHeader}>
      <Text style={styles.cardTitle}>Lab Test Status Summary</Text>
    </LinearGradient>
  </View>

  <View style={styles.statusSummaryContainer}>
    {Object.keys(statusCounts).length === 0 ? (
      <Text style={styles.noDataText}>No Status Data Available</Text>
    ) : (
      Object.entries(statusCounts).map(([status, count], index) => (
        <View key={index} style={styles.statusSummaryCard}>
          <Icon
            name={getStatusIconName(status)}
            size={28}
            color={getStatusColor(status)}
          />
          <Text style={styles.statusTitle}>{capitalizeFirstLetter(status)}</Text>
          <Text style={styles.statusCount}>{count}</Text>
        </View>
      ))
    )}
  </View>
</View>

{/* Lab Test Status Chart */}
<View style={styles.cardContainer}>
  <View style={styles.cardHeader}>
    <LinearGradient colors={['#1c78f2', '#5ba4ff']} style={styles.gradientHeader}>
      <Text style={styles.cardTitle}>Lab Test Status Chart</Text>
    </LinearGradient>
  </View>

  <View style={styles.card}>
    {Object.keys(statusCounts).length === 0 ? (
      <Text style={styles.noDataText}>No Chart Data Available</Text>
    ) : (
      <BarChart
  data={{
    labels: Object.keys(statusCounts).map(status => capitalizeFirstLetter(status)),
    datasets: [
      {
        data: Object.values(statusCounts),
      },
    ],
  }}
  width={Dimensions.get('window').width - 40}
  height={220}
  yAxisLabel=""
  chartConfig={{
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(28, 120, 242, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#1c78f2",
    },
  }}
  style={{
    marginVertical: 8,
    borderRadius: 12,
  }}
  fromZero={true}  // <-- Add this line
/>

    )}
  </View>
</View>



    </ScrollView>

    {/* bottom navigation */}
    <View style={styles.bottomNav}>

  <TouchableOpacity
    style={styles.navItem}
    onPress={() => navigation.navigate('Analytics')}
  >
    <Icon name="bar-chart-2" size={24} color="#4A5568" />
    <Text style={styles.navText}>Analytics</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.navItem}
    onPress={() => navigation.navigate('LabTypes')}
  >
    <FontAwesome name="flask" size={24} color="#4A5568" />
    <Text style={styles.navText}>Lab Type</Text>
  </TouchableOpacity>

    <TouchableOpacity
    style={styles.navItem}
    onPress={() => navigation.navigate('UpcomingLabTest')}
  >
    <Icon name="file-text" size={24} color="#4A5568" />

    <Text style={styles.navText}>Report</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.navItem}
    onPress={() => navigation.navigate('LabSchedule')}
  >
    <Icon name="calendar" size={24} color="#4A5568" />
    <Text style={styles.navText}>Add Schedule</Text>
  </TouchableOpacity>
</View>

    </View>
  

    
  );
};

export default LabTestDashboard;