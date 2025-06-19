import React, {useMemo, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  StatusBar,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import { Dimensions } from 'react-native';

const AdminDashboard = () => {
  const navigation = useNavigation();
  const [appointments, setAppointments] = useState([]);
  const [labTests, setLabTests] = useState([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'No access token found');
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Failed to fetch appointment data:', error);
      Alert.alert('Error', 'Failed to fetch appointment data');
    }
  };

  const chartData = useMemo(() => {
    const today = new Date();
    const last7DaysMap = {};

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const iso = date.toISOString().split('T')[0];
      last7DaysMap[iso] = 0;
    }

    appointments.forEach(item => {
      const date = item.date_of_visit;
      if (last7DaysMap[date] !== undefined) {
        last7DaysMap[date]++;
      }
    });

    const labels = Object.keys(last7DaysMap).map(date =>
      format(parseISO(date), 'MMM d')
    );
    const counts = Object.values(last7DaysMap);

    return {
      labels,
      datasets: [{ data: counts }],
    };
  }, [appointments]);

  const shiftChartData = useMemo(() => {
    const shiftMap = {};

    appointments.forEach(item => {
      const shift = item.shift?.toLowerCase() || 'unknown';
      if (shift !== 'night') {
        shiftMap[shift] = (shiftMap[shift] || 0) + 1;
      }
    });

    const labels = Object.keys(shiftMap);
    const counts = Object.values(shiftMap);

    return {
      labels,
      datasets: [{ data: counts }],
    };
  }, [appointments]);

  const statusChartData = useMemo(() => {
    const statusMap = { active: 0, cancelled: 0 };

    appointments.forEach(item => {
      const status = item.status?.toLowerCase();
      if (status === 'cancelled') {
        statusMap.cancelled += 1;
      } else {
        statusMap.active += 1;
      }
    });

    return [
      {
        name: 'Active',
        count: statusMap.active,
        color: '#4CAF50',
        legendFontColor: '#333',
        legendFontSize: 14,
      },
      {
        name: 'Cancelled',
        count: statusMap.cancelled,
        color: '#FF5252',
        legendFontColor: '#333',
        legendFontSize: 14,
      },
    ];
  }, [appointments]);

  useEffect(() => {
  fetchAppointments();
  fetchLabTests(); // Fetch lab tests on mount
}, []);

  const fetchLabTests = async () => {
  try {
    const token = await getToken();
    if (!token) {
      Alert.alert('Error', 'No access token found');
      return;
    }

    const response = await fetch(`${BASE_URL}/labs/lab-tests/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setLabTests(data);
  } catch (error) {
    console.error('Failed to fetch lab tests:', error);
    Alert.alert('Error', 'Failed to fetch lab tests');
  }
};

const labStatusChartData = useMemo(() => {
  const statusMap = { COMPLETED: 0, SCHEDULED: 0 };

  labTests.forEach(item => {
    const status = item.status?.toUpperCase();
    if (statusMap[status] !== undefined) {
      statusMap[status]++;
    }
  });

  return [
    {
      name: 'Completed',
      count: statusMap.COMPLETED,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Scheduled',
      count: statusMap.SCHEDULED,
      color: '#FF9800',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
  ];
}, [labTests]);

const testTypeBarData = useMemo(() => {
  const typeMap = {};

  labTests.forEach(test => {
    const types = test.test_type?.split(',') || [];

    // To avoid duplicate test type count from the same test (if type repeats in string)
    const uniqueTypes = [...new Set(types.map(t => t.trim()))];

    uniqueTypes.forEach(type => {
      if (type) {
        typeMap[type] = (typeMap[type] || 0) + 1;
      }
    });
  });

  // Sort test types by total count descending
  const sorted = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);

  const topItems = sorted.slice(0, 8); // Top 8 test types

  const labels = topItems.map(([type]) =>
    type.length > 12 ? `${type.slice(0, 10)}…` : type
  );

  const data = topItems.map(([, count]) => count);

  return {
    labels,
    datasets: [{ data }],
  };
}, [labTests]);






  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1c78f2" barStyle="light-content" />
      <ScrollView>
        {/* Top Section */}
        <View style={styles.topHalf}>
          <Text style={styles.title}>Admin Dashboard</Text>
        </View>

        {/* Scrollable Card Buttons */}
        <View style={styles.cardWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardContainer}>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RegisteredDoctor')}>
              <Text style={styles.cardTitle}>Doctor Management</Text>
              <Text style={styles.cardSubtitle}>Manage all doctors</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RegisteredLab')}>
              <Text style={styles.cardTitle}>Lab Management</Text>
              <Text style={styles.cardSubtitle}>Handle lab operations</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RegisteredAmbulanceList')}>
              <Text style={styles.cardTitle}>Ambulance Management</Text>
              <Text style={styles.cardSubtitle}>Control ambulance services</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

       

        {/* Appointments Insights */}
        <View style={styles.cardSection}>
          <Text style={styles.cardTitle}>Appointments Insights</Text>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {/* By Shift */}
            <View style={{ width: Dimensions.get('window').width - 32 }}>
              <Text style={[styles.chartSubtitle, { paddingLeft: 4 }]}>By Shift</Text>
              {shiftChartData.labels.length > 0 && (
                <BarChart
                  data={shiftChartData}
                  width={Math.max(shiftChartData.labels.length * 70, Dimensions.get('window').width * 0.92)}
                  height={220}
                  fromZero
                  yAxisLabel=""
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(28, 120, 242, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  style={{ marginVertical: 16, borderRadius: 8, marginLeft: -8 }}
                />
              )}
            </View>

            {/* Status Pie Chart */}
            <View style={{ width: Dimensions.get('window').width - 32, alignItems: 'flex-start' }}>
              <View style={{ alignSelf: 'flex-start', paddingLeft: 50 }}>
                {/* <Text style={styles.chartSubtitle}>Cancelled vs Active</Text> */}
              </View>

              <PieChart
                data={statusChartData}
                width={Dimensions.get('window').width - 64}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                hasLegend={false}
              />

              {/* Custom Legend */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
                {statusChartData.map((item, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: item.color,
                        marginRight: 6,
                        borderRadius: 2,
                      }}
                    />
                    <Text style={{ fontSize: 14, color: item.legendFontColor }}>
                      {item.name} ({item.count})
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* View All for Appointments Insights */}
          <View style={styles.viewAllContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('DoctorAppointmentList')}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Image
                source={require('../assets/right-arrow.png')}
                style={styles.arrowIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        
        {/* Lab Tests Insights */}
      <View style={styles.cardSection}>
        <Text style={styles.cardTitle}>Lab Tests Insights</Text>

        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          
          <View style={{ alignItems: 'flex-start' }}>
            <Text style={[styles.chartSubtitle, { paddingLeft: 4 }]}>By Test Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
  <BarChart
    data={testTypeBarData}
    width={Math.max(testTypeBarData.labels.length * 80, Dimensions.get('window').width - 32)}
    height={220}
    fromZero
    chartConfig={{
      backgroundColor: '#fff',
      backgroundGradientFrom: '#fff',
      backgroundGradientTo: '#fff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(28, 120, 242, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      propsForLabels: {
        fontSize: 10,
      },
    }}
    style={{ marginVertical: 16, borderRadius: 8 }}
  />
</ScrollView>

          </View>

        </ScrollView>

        
        <View style={styles.viewAllContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('LabTestList')}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Image
            source={require('../assets/right-arrow.png')}
            style={styles.arrowIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      </View>


      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FC',
  },
  topHalf: {
    height: 200,
    backgroundColor: '#1c78f2',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardWrapper: {
    marginTop: -40,
    zIndex: 1,
  },
  cardContainer: {
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#fff',
    width: 250,
    marginRight: 16,
    borderRadius: 4,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  cardSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  viewAllContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
    marginRight: 8,
  },
  viewAllText: {
    fontSize: 16,
    color: '#1c78f2',
    marginRight: 6,
    fontWeight: '600',
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: '#1c78f2',
  },
  chartSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    textAlign: 'left',
    marginTop: 8,
  },
});
