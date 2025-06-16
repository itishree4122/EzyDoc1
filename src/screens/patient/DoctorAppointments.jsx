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
  Modal
} from 'react-native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import DoctorAppointments1 from './DoctorAppointments1';
import { useNavigation } from "@react-navigation/native";



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
    const response = await fetch(`${BASE_URL}/patients/appointments/`, {
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

  const shiftOffsets = {
    morning: 0,
    afternoon: 6,
    evening: 10,
    night: 14,
  };

  const [hours, minutes] = appointment.visit_time.split(':').map(Number);
  const shiftHourOffset = shiftOffsets[appointment.shift] || 0;

  const visitDateTime = new Date(appointment.date_of_visit);
  visitDateTime.setHours(hours + shiftHourOffset, minutes, 0, 0);

  return visitDateTime < now;
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

    const response = await fetch(`${BASE_URL}/doctor/appointment-cancelled/${registrationNumber}/`, {
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

// --------------------------------------------------------------------------

  const renderAppointment = ({ item }) => {
    const isPast = isPastAppointment(item);

    return (
  
       <View style={styles.card}>
        <Text style={styles.title}>
          Dr. {item.doctor_name} ({item.specialist})
        </Text>
        <Text style={styles.title}>
        {item.doctor_id}
        </Text>
        <Text>
          Patient: {item.patient_name} ({item.patient_gender}, {item.patient_age})
        </Text>
        <Text>
          Visit: {item.date_of_visit} at {item.visit_time} ({item.shift})
        </Text>
        <Text>Registration #: {item.registration_number}</Text>

        <View style={styles.horizontalLine} />

        <View style={styles.actionRow}>
          <TouchableOpacity
            disabled={isPast}
            onPress={() => handleCancel(item.registration_number)}
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
    
      <View style={styles.toolbar}>
  <View style={styles.toolbarContent}>
    {/* Back Icon */}
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <View style={styles.backIconContainer}>
                    <Image
                      source={require("../assets/UserProfile/back-arrow.png")} // Replace with your back arrow image
                      style={styles.backIcon}
                    />
                  </View>
                </TouchableOpacity>

    {/* Toggle Buttons Centered Below */}
    <View style={styles.toggleButtonsContainer}>
      <View style={styles.toggleButtons}>
        <TouchableOpacity
          style={[styles.toggleButton, !showPast && styles.activeButton]}
          onPress={() => setShowPast(false)}
        >
          <Text style={styles.toggleText}>Upcoming</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, showPast && styles.activeButton]}
          onPress={() => setShowPast(true)}
        >
          <Text style={styles.toggleText}>Past</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingTop: 16,
  },
toolbarContent: {
  flexDirection: 'column',
  alignItems: 'flex-start', // back icon aligns left
},
  toolbar: {
    backgroundColor: "#1c78f2",
    paddingTop: 70,
   
    paddingHorizontal: 10,
    
  },
  backButton: {
    marginRight: 10, // Adds spacing between icon and title
  },
  backIconContainer: {
    width: 30,
    height: 30,
    backgroundColor: "#AFCBFF", // White background
    borderRadius: 20, // Makes it circular
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
    
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
    
    
  },
  list: {
    padding: 16,
  },
  toggleButtonsContainer: {
  width: '100%',
  alignItems: 'center',
  marginTop: 8,
},
  toggleButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,       // Only bottom border
  borderBottomColor: 'transparent', // Bottom border color
  borderRadius: 0,
    marginHorizontal: 5,
  },
  activeButton: {
    // backgroundColor: '#6495ed',
    borderBottomWidth: 2,       // Only bottom border
  borderBottomColor: '#fff', // Bottom border color
  borderRadius: 0,
  },
  toggleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#f0f4f7',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 10,
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
    height: 20,
    width: 1,
    backgroundColor: '#ccc',
  },
  actionTextLeft: {
    fontSize: 14,
    color: '#007bff',
    marginRight: 16,
  },
  actionTextRight: {
    fontSize: 14,
    color: '#007bff',
    marginLeft: 16,
  },
  disabledText: {
    color: '#aaa',
  },
});
