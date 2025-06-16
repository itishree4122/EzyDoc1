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
import { BarChart } from 'react-native-chart-kit';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import { Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';




const AdminDashboard = () => {
  const navigation = useNavigation();
  const [appointments, setAppointments] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
const [showEndPicker, setShowEndPicker] = useState(false);


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
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setAppointments(data);

    // Auto-set start and end date based on available data
    if (data.length > 0) {
  const sorted = [...data].sort((a, b) => new Date(b.date_of_visit) - new Date(a.date_of_visit));
  const recentDates = sorted.slice(0, 5).map(item => item.date_of_visit);
  const minDate = recentDates[recentDates.length - 1];
  const maxDate = recentDates[0];
  setStartDate(minDate);
  setEndDate(maxDate);
}

  } catch (error) {
    console.error('Failed to fetch appointment data:', error);
    Alert.alert('Error', 'Failed to fetch appointment data');
  }
};


  const filteredData = useMemo(() => {
    if (!startDate || !endDate) return [];

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    return appointments.filter(item => {
      const visitDate = parseISO(item.date_of_visit);
      return isWithinInterval(visitDate, { start, end });
    });
  }, [appointments, startDate, endDate]);



 const chartData = useMemo(() => {
  const grouped = {};

  filteredData.forEach(item => {
    const date = item.date_of_visit;
    grouped[date] = (grouped[date] || 0) + 1;
  });

  // Sort dates descending and limit to latest 5
  const sortedDates = Object.keys(grouped)
    .sort((a, b) => new Date(b) - new Date(a))
    .slice(0, 5)
    .reverse(); // To keep them in ascending order

  const labels = sortedDates.map(date => format(parseISO(date), 'MMM d'));
  const counts = sortedDates.map(date => grouped[date]);

  return {
    labels,
    datasets: [{ data: counts }],
  };
}, [filteredData]);



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#6495ED" barStyle="light-content" />

      {/* Top Half */}
      <View style={styles.topHalf}>
        <Text style={styles.title}>Admin Dashboard</Text>
      </View>

      {/* Overlapping Scrollable Cards */}
      <View style={styles.cardWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardContainer}
        >
          <TouchableOpacity style={styles.card} onPress={()=> navigation.navigate('RegisteredDoctor')}>
            <Text style={styles.cardTitle}>Doctor Management</Text>
            <Text style={styles.cardSubtitle}>Manage all doctors</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={()=> navigation.navigate('RegisteredLab')}>
            <Text style={styles.cardTitle}>Lab Management</Text>
            <Text style={styles.cardSubtitle}>Handle lab operations</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}
          onPress={() => navigation.navigate('RegisteredAmbulanceList')}>
            <Text style={styles.cardTitle}>Ambulance Management</Text>
            <Text style={styles.cardSubtitle}>Control ambulance services</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>



<View style={styles.cardSection}>
  {/* Title */}
  <Text style={styles.cardTitle}>Appointments Overview</Text>

   {/* Date Filter Inputs */}
     <View style={styles.dateInputRow}>
    <View style={styles.dateInputWithLabel}>
      <Text style={styles.dateLabel}>From</Text>
      <TouchableOpacity onPress={() => setShowStartPicker(true)}>
            <TextInput
              placeholder="Start Date"
              value={startDate}
              editable={false}
              style={{ borderWidth: 1, padding: 8, borderRadius: 6 }}
            />
          </TouchableOpacity>
      
    </View>

    <View style={styles.dateInputWithLabel}>
       <Text style={styles.dateLabel}>To</Text>
      <TouchableOpacity onPress={() => setShowEndPicker(true)}>
            <TextInput
              placeholder="End Date"
              value={endDate}
              editable={false}
              style={{ borderWidth: 1, padding: 8, borderRadius: 6 }}
            />
          </TouchableOpacity>
      
    </View>
  </View>

{showStartPicker && (
        <DateTimePicker
          value={startDate ? new Date(startDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) {
              setStartDate(format(selectedDate, 'yyyy-MM-dd'));
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate ? new Date(endDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) {
              setEndDate(format(selectedDate, 'yyyy-MM-dd'));
            }
          }}
        />
      )}


      {/* Bar Chart */}
      {chartData.labels.length > 0 && (
        <ScrollView horizontal contentContainerStyle={{ paddingHorizontal: 16 }}>
          <BarChart
            data={chartData}
            width={Math.max(chartData.labels.length * 40, Dimensions.get('window').width * 0.92 )}

            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(100, 149, 237, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 8,
              },
            }}
            style={{ marginVertical: 16, borderRadius: 8 }}
          />
        </ScrollView>
      )}

      {/* View All Section */}
          <TouchableOpacity
            style={styles.viewAllContainer}
            onPress={() => navigation.navigate('DoctorAppointmentList')} // Replace 'YourTargetScreen' with your actual route name
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Image
              source={require('../assets/right-arrow.png')} // Adjust path as per your assets folder
              style={styles.arrowIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

</View>
     

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
    backgroundColor: '#6495ED',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardWrapper: {
    marginTop: -40, // Negative margin to pull cards upward
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

    filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  // dateInput: {
  //   borderWidth: 1,
  //   borderColor: '#ccc',
  //   padding: 8,
  //   borderRadius: 4,
  //   width: '100%',
  //   backgroundColor: '#fff',
  // },

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

cardTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 12,
  color: '#333',
},

dateInputRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 8,
},

dateInputWithLabel: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
  marginRight: 8,
},

dateInput: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#ccc',
  padding: 8,
  borderRadius: 8,
  marginRight: 6,
  backgroundColor: '#f9f9f9',
},

dateLabel: {
  fontSize: 14,
  color: '#333',
  marginRight: 10,
},

viewAllContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center', // Align to right side
  paddingHorizontal: 16,
  marginBottom: 16,
},

viewAllText: {
  fontSize: 16,
  color: '#6495ED', // Or your theme color
  marginRight: 6,
  fontWeight: '600',
},

arrowIcon: {
  width: 16,
  height: 16,
  tintColor: '#6495ED', // optional tint if your icon is black or grey and you want it colored
},


});
