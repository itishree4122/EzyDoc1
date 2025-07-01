import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  TextInput
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import moment from 'moment';
import { useNavigation } from "@react-navigation/native";
import { fetchWithAuth } from '../auth/fetchWithAuth';

const AppointmentList = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { doctorId } = route.params;

  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = await getToken();
        if (!token || !doctorId) {
          setError('Missing token or doctor ID');
          setLoading(false);
          return;
        }

        // const response = await fetch(`${BASE_URL}/doctor/appointmentlist/`, {
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
        const doctorAppointments = data.filter(item => item.doctor_id === doctorId && item.checked === false && item.cancelled === false);
        setAppointments(doctorAppointments);
        filterAppointments(doctorAppointments, selectedTab);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [doctorId]);

  useEffect(() => {
    filterAppointments(appointments, selectedTab);
  }, [selectedTab, appointments]);

  const filterAppointments = (data, tab) => {
  const todayDate = moment().format('YYYY-MM-DD');

  let filtered = [];

  if (tab === 'today') {
    filtered = data.filter(item => item.date_of_visit === todayDate);
  } else if (tab === 'upcoming') {
    filtered = data.filter(item => moment(item.date_of_visit).isAfter(todayDate));
  }

  if (tab === 'today' || tab === 'upcoming') {
    const shiftOrder = { Morning: 1, Afternoon: 2, Evening: 3 };

    filtered = filtered.sort((a, b) => {
      const dateA = moment(a.date_of_visit);
      const dateB = moment(b.date_of_visit);

      if (!dateA.isSame(dateB)) {
        return dateA - dateB; // Sort by date
      }

      const shiftA = shiftOrder[a.shift] || 999;
      const shiftB = shiftOrder[b.shift] || 999;

      if (shiftA !== shiftB) {
        return shiftA - shiftB; // Sort by shift
      }

      const timeA = moment(a.visit_time, 'HH:mm');
      const timeB = moment(b.visit_time, 'HH:mm');

      return timeA - timeB; // Sort by time
    });
  }

  setFilteredAppointments(filtered);
};

  const handleMarkDone = async (registrationNumber) => {
  try {
    const token = await getToken();
    if (!token) {
      console.error('No token found');
      return;
    }

    // const response = await fetch(`${BASE_URL}/doctor/appointment-checked/${registrationNumber}/`, {
    const response = await fetchWithAuth(`${BASE_URL}/doctor/appointment-checked/${registrationNumber}/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ checked: "true" }),
    });

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      if (response.ok) {
        console.log('Checked updated:', data);

        // Remove from both lists
        const updatedAppointments = appointments.filter(
          item => item.registration_number !== registrationNumber
        );
        setAppointments(updatedAppointments);

        const updatedFiltered = filteredAppointments.filter(
          item => item.registration_number !== registrationNumber
        );
        setFilteredAppointments(updatedFiltered);

        Alert.alert('Success', 'Appointment marked as done');
      } else {
        console.error('API error response:', data);
        Alert.alert('Error', 'Failed to update appointment');
      }
    } else {
      const text = await response.text();
      console.error('Unexpected response:', text);
      Alert.alert('Error', 'Unexpected server response');
    }
  } catch (error) {
    console.error('Fetch error in handleMarkDone:', error);
    Alert.alert('Error', 'Something went wrong');
  }
};

const handleCancel = async (registrationNumber) => {
  try {
    const token = await getToken();
    if (!token) {
      console.error('No token found');
      return;
    }

    // const response = await fetch(`${BASE_URL}/doctor/appointment-cancelled/${registrationNumber}/`, {
    const response = await fetchWithAuth(`${BASE_URL}/doctor/appointment-cancelled/${registrationNumber}/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancelled: true }),
    });

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();

      if (response.ok) {
        console.log('Appointment cancelled:', data);

        // Remove from both lists
        const updatedAppointments = appointments.filter(
          item => item.registration_number !== registrationNumber
        );
        setAppointments(updatedAppointments);

        const updatedFiltered = filteredAppointments.filter(
          item => item.registration_number !== registrationNumber
        );
        setFilteredAppointments(updatedFiltered);

        Alert.alert('Success', 'Appointment cancelled successfully');
      } else {
        console.error('API error response:', data);
        Alert.alert('Error', 'Failed to cancel appointment');
      }
    } else {
      const text = await response.text();
      console.error('Unexpected response:', text);
      Alert.alert('Error', 'Unexpected server response');
    }
  } catch (error) {
    console.error('Fetch error in handleCancel:', error);
    Alert.alert('Error', 'Something went wrong');
  }
};



  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>Patient: {item.patient_name} ({item.patient_age}, {item.patient_gender})</Text>
      <Text>Phone: {item.patient_number}</Text>
      <Text>Visit:{item.date_of_visit} at {item.visit_time} ({item.shift})</Text>
      <Text>Reg No: {item.registration_number}</Text>
      {/* <Text>Checked: {item.checked ? 'Yes' : 'No'}</Text>
      <Text>Cancelled: {item.cancelled ? 'Yes' : 'No'}</Text> */}

      {selectedTab === 'today' && (
  <>
    <View style={styles.horizontalLine} />

    <View style={styles.bottomActions}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleCancel(item.registration_number)}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      <View style={styles.verticalLine} />

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleMarkDone(item.registration_number)}
      >
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>
    </View>
  </>
)}


    {/* )} */}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (

    <>

    <View style={{ backgroundColor: '#fff' }}>

    </View>
    
     <View style={styles.toolbar}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
      <Image source={require('../assets/left-arrow.png')} style={styles.backIcon} />
      </TouchableOpacity>
      <Text style={styles.toolbarTitle}>Clinic Appointments</Text>
    </View>


     {/* Toggle Buttons Centered Below */}
        <View style={styles.toggleButtonsContainer}>
          <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'today' && styles.activeTab]}
          onPress={() => setSelectedTab('today')}
        >
          <Text style={[styles.tabText, selectedTab === 'today' && styles.activeTabText]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
          onPress={() => setSelectedTab('upcoming')}
        >
          <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
      </View>
        </View>

                 <View style={styles.container}>
      {filteredAppointments.length === 0 ? (
        <Text style={styles.noAppointments}>No appointments found.</Text>
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
    </>
   
  );
};

export default AppointmentList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#transparent',
  },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c78f2',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  backIcon: {
    width: 22,
    height: 22,
    tintColor: 'white',
  },
  toolbarTitle: {
    color: 'white',
    fontSize: 20,
    marginLeft: 8,
  },
  toggleButtonsContainer: {
  width: '100%',
  alignItems: 'center',
  marginTop: 8,
},
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    
    gap: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,       // Only bottom border
      borderColor: '#1c78f2', // Bottom border color
      borderRadius: 16,
    marginHorizontal: 5,
  
  },
  activeTab: {
      borderWidth: 1,       // Only bottom border
      borderColor: '#1c78f2', // Bottom border color
      borderRadius: 16,
      backgroundColor: '#1c78f2'
  },
  tabText: {
    fontSize: 14,
    color: '#1c78f2',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
    
  },
  
  card: {
  backgroundColor: '#fff',
  padding: 12,
  borderRadius: 8,
  marginBottom: 12,

  // Android shadow
  elevation: 4,

  // iOS shadow
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
},

  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  horizontalLine: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  cancelText: {
    color: '#6495ed',
    fontWeight: 'bold',
  },
  doneText: {
    color: '#6495ed',
    fontWeight: 'bold',
  },
  disabledButton: {
  backgroundColor: '#ccc', // light gray
  borderColor: '#aaa',
},

disabledText: {
  color: '#777',
},

  verticalLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#ccc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  noAppointments: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
  },
  listContent: {
    paddingBottom: 20,
  },
});
