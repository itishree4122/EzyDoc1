import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Button,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import DoctorAppointments1 from './DoctorAppointments1';
import { useNavigation } from "@react-navigation/native";
import { fetchWithAuth } from '../auth/fetchWithAuth';
import moment from 'moment';
import Header from '../../components/Header';
const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  
  const navigation = useNavigation();

//   to display reschedule modal
  const [isModalVisible, setModalVisible] = useState(false);
  const [doctorId, setDoctorId] = useState(null);  // fetched from AsyncStorage
  const [registrationNumber, setRegistrationNumber] = useState(null);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  

// api integration for appointment list
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
  const token = await getToken();
  if (!token) return;

  try {
    // const response = await fetch(`${BASE_URL}/patients/appointments/`, {
    const response = await fetchWithAuth(`${BASE_URL}/patients/appointments/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();

      // ✅ Filter only non-cancelled appointments
      const activeAppointments = data.filter(item => item.cancelled === false && item.checked === false);

      setAppointments(activeAppointments);
    } else {
      console.error('Failed to fetch appointments');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};


//   --------------------------------------------------------------------

//   divide the appointment list between past and upcoming
 const isPastAppointment = (appointment) => {
  const now = new Date();
  
  // Parse the appointment date and time
  const [year, month, day] = appointment.date_of_visit.split('-').map(Number);
  const [hours, minutes] = appointment.visit_time.split(':').map(Number);
  
  // Create date object for the appointment (in local timezone)
  const appointmentDate = new Date(year, month - 1, day, hours, minutes);
  
  // Compare directly
  return appointmentDate < now;
};


  const visibleAppointments = appointments
  .filter((item) => showPast ? isPastAppointment(item) : !isPastAppointment(item))
  .sort((a, b) => {
    const dateA = new Date(`${a.date_of_visit}T${a.visit_time}`);
    const dateB = new Date(`${b.date_of_visit}T${b.visit_time}`);

    // For past appointments, sort descending (recent first)
    // For upcoming appointments, sort ascending (soonest first)
    return showPast ? dateB - dateA : dateA - dateB;
  });

// --------------------------------------------------------------------
 

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
    const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

// --------------------------------------------------------------------------
const formatDoctorName = (name) => {
  if (!name) return '';
  const trimmedName = name.trim();
  const lower = trimmedName.toLowerCase();
  if (lower.startsWith('dr ') || lower.startsWith('dr.')) {
    return trimmedName;
  }
  return `Dr. ${trimmedName}`;
};

  const renderAppointment = ({ item }) => {
    const isPast = isPastAppointment(item);

    return (
  
       <View style={styles.card}>
        <Text style={styles.title}>
          {formatDoctorName(item.doctor_name)} ({item.specialist})
        </Text>
        <Text style={styles.title}>
        {item.doctor_id}
        </Text>
        <Text>
          Patient: {item.patient_name} ({item.patient_gender}, {item.patient_age})
        </Text>
        {/* <Text>
          Visit: {item.date_of_visit} at {item.visit_time} ({item.shift})
        </Text> */}
        <Text>
  Visit: {moment(item.date_of_visit,'YYYY-MM-DD').format('DD-MM-YYYY')} at {moment(item.visit_time, 'HH:mm:ss').format('hh:mm A')} ({capitalize(item.shift)})
 
</Text>
        <Text>Registration #: {item.registration_number}</Text>

        <View style={styles.horizontalLine} />

        <View style={styles.actionRow}>
          <TouchableOpacity
            disabled={isPast}
            // onPress={() => handleCancel(item.registration_number)}
            onPress={() => {
  Alert.alert(
    'Confirm Cancellation',
    'Are you sure you want to cancel this appointment?',
    [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: () => handleCancel(item.registration_number) },
    ]
  );
}}

          >
            <Text
              style={[
                styles.actionTextLeft,
                isPast && styles.disabledText,
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <View style={styles.verticalLine} />

          <TouchableOpacity
            disabled={isPast}
           onPress={() => {
                setDoctorId(item.doctor_id);  // Only setting appointmentId
                setRegistrationNumber(item.registration_number); // SET IT HERE
                setModalVisible(true);
            }}
          >
            <Text
              style={[
                styles.actionTextRight,
                isPast && styles.disabledText,
              ]}
            >
              Reschedule
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      
    );
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#0000ff" />;
  }
// ----------------------------------------------------------------------------------

  return (

    <>
    
   {/* <View style={styles.toolbar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <View style={styles.backIconContainer}>
              <Image
                source={require("../assets/UserProfile/back-arrow.png")}
                style={styles.backIcon}
              />
            </View>
          </TouchableOpacity>
        
          <Text style={styles.toolbarTitle}>Clinic Appointments</Text>
        </View> */}
   
<Header title="Clinic Appointments"/>


{/* Toggle Buttons Centered Below */}
    <View style={styles.toggleButtonsContainer}>
  <View style={styles.toggleButtons}>
    <TouchableOpacity
      style={[
        styles.toggleButton,
        !showPast && styles.activeButton,
        { marginRight: 5 },
      ]}
      onPress={() => setShowPast(false)}
    >
      <Text style={[
        styles.toggleText,
        !showPast && styles.activeText
      ]}>
        Upcoming Booking
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.toggleButton,
        showPast && styles.activeButton,
        { marginLeft: 5 },
      ]}
      onPress={() => setShowPast(true)}
    >
      <Text style={[
        styles.toggleText,
        showPast && styles.activeText
      ]}>
        Previous Booking
      </Text>
    </TouchableOpacity>
  </View>
</View>


         <View style={styles.container}>
     

      <FlatList
        data={visibleAppointments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAppointment}
        contentContainerStyle={styles.list}
      />

      {isModalVisible && doctorId && (
  <Modal
    visible={isModalVisible}
    animationType="slide"
    onRequestClose={() => setModalVisible(false)}
  >
    <DoctorAppointments1

      doctorId={doctorId}
      registrationNumber={registrationNumber} // PASS IT HERE
      // onClose={handleCloseModal}
      onUpdate={fetchAppointments} 
      onClose={() => setModalVisible(false)}
    />
  </Modal>
)}

    </View>

    </>
   
  );
};

export default DoctorAppointments;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#f8f9fb'
  },
toolbar: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 10,
  backgroundColor: '#1c78f2',
  borderBottomWidth: 1,
  borderBottomColor: '#ddd',
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  
},

backButton: {
  padding: 5,
},

backIconContainer: {
  width: 30,
    height: 30,
    backgroundColor: "#7EB8F9", 
    borderRadius: 20, 
    alignItems: "center",
    justifyContent: "center",
},

backIcon: {
  width: 20,
  height: 20,
  resizeMode: 'contain',
  tintColor: '#fff'
},

toolbarTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginLeft: 10,  // Creates spacing between the icon and title
  color: '#fff',
},
  list: {
    padding: 16,
  },
  toggleButtonsContainer: {
  width: '100%',
  alignItems: 'center',
  
  backgroundColor: '#f8f9fb',
  gap: 10,
},
 toggleButtons: {
  flexDirection: 'row',
  justifyContent: 'space-round',
  marginTop: 10,
 
},

toggleButton: {
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#1c78f2',
  marginHorizontal: 4,
  backgroundColor: 'transparent',
},

activeButton: {
  backgroundColor: '#1c78f2',
},

toggleText: {
  color: '#1c78f2',
  fontWeight: 'bold',
  fontWeight: '500'
},

activeText: {
  color: '#fff',

},
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 5,
    borderColor: '#e6e6e6',
    borderRightWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 4,
    borderWidth: 1,
    marginTop: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  horizontalLine: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalLine: {
    height: 30,
    width: 1,
    backgroundColor: '#ccc',
  },
  actionTextLeft: {
    fontSize: 14,
    color: '#007bff',
    marginRight: 70,
  },
  actionTextRight: {
    fontSize: 14,
    color: '#007bff',
    marginLeft: 60,
  },
  disabledText: {
    color: '#aaa',
  },
});
