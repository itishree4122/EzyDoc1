import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
    Button,
    Alert,
    Image,
  ScrollView,
  KeyboardAvoidingView,
  
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Header from '../../components/Header';
const LabAppointmentsScreen = () => {
  const navigation = useNavigation();

  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('SCHEDULED');
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newDateTime, setNewDateTime] = useState(new Date());
  const [availabilities, setAvailabilities] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  
  const fetchAvailabilities = async () => {
  try {
    const token = await getToken();
    // const response = await fetch(`${BASE_URL}/labs/availability/`, {
    const response = await fetchWithAuth(`${BASE_URL}/labs/availability/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      console.log('Fetched availabilities:', data);
      setAvailabilities(data);
    } else {
      setAvailabilities([]);
    }
  } catch (err) {
    setAvailabilities([]);
  }
};
  const fetchLabAppointments = async () => {
    const token = await getToken();

    if (!token) {
      console.warn('No token available, aborting fetch');
      setLoading(false);
      return;
    }

    try {
      // const response = await fetch(`${BASE_URL}/labs/lab-tests/`, {
      const response = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch lab appointments', response.status);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Fetched lab appointments:', data);
      setAppointments(data);
      filterAppointments(data, selectedStatus);
    } catch (error) {
      console.error('Error fetching lab appointments:', error);
    } finally {
      setLoading(false);
    }
  };
  const generateSlots = (start, end) => {
  const slots = [];
  let current = moment(start, "HH:mm:ss");
  const endMoment = moment(end, "HH:mm:ss");
  while (current < endMoment) {
    slots.push(current.format("HH:mm"));
    current.add(15, 'minutes');
  }
  return slots;
};
  // const handleReschedule = async () => {
  //   const token = await getToken();

  //   if (!token || !selectedAppointment) {
  //     console.warn('Missing token or appointment');
  //     return;
  //   }

  //   const url = `${BASE_URL}/labs/lab-tests/${selectedAppointment.id}/`;
  //   const payload = {
  //     lab_profile: selectedAppointment.lab_profile,
  //     test_type: selectedAppointment.test_type,
  //     scheduled_date: newDateTime.toISOString(),
  //   };

  //   try {
  //     const response = await fetch(url, {
  //       method: 'PATCH',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       console.error('Failed to reschedule appointment. Response:', errorText);
  //       return;
  //     }

  //     Alert.alert('Success', 'Appointment rescheduled successfully.');
  //     fetchLabAppointments();
  //     setRescheduleModalVisible(false);
  //   } catch (error) {
  //     console.error('Rescheduling error:', error);
  //     Alert.alert('Error', 'Failed to reschedule the appointment.');
  //   }
  // };

  const handleReschedule = async () => {
  const token = await getToken();

  if (!token || !selectedAppointment) {
    console.warn('Missing token or appointment');
    return;
  }

  if (!selectedSlot) {
    Alert.alert('Validation', 'Please select a time slot');
    return;
  }

  // Parse selectedSlot (format: "HH:mm")
  const [hour, minute] = selectedSlot.split(':');
  const updatedDate = new Date(newDateTime);
  updatedDate.setHours(Number(hour));
  updatedDate.setMinutes(Number(minute));
  updatedDate.setSeconds(0);
  updatedDate.setMilliseconds(0);

  const url = `${BASE_URL}/labs/lab-tests/${selectedAppointment.id}/`;
  const payload = {
    lab_profile: selectedAppointment.lab_profile,
    test_type: selectedAppointment.test_type,
    scheduled_date: updatedDate.toISOString(),
  };
  console.log('Rescheduling payload:', payload);
  try {
    // const response = await fetch(url, {
    const response = await fetchWithAuth(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // if (!response.ok) {
    //   const errorText = await response.text();
    //   console.error('Failed to reschedule appointment. Response:', errorText);
    //   Alert.alert('Error', 'Failed to reschedule the appointment.');
    //   return;
    // }
    if (!response.ok) {
  let errorMsg = 'Failed to reschedule the appointment.';
  try {
    const errorJson = await response.json();
    if (errorJson && errorJson.scheduled_date) {
      errorMsg = Array.isArray(errorJson.scheduled_date)
        ? errorJson.scheduled_date.join('\n')
        : errorJson.scheduled_date;
    }
  } catch (e) {
    const errorText = await response.text();
    if (errorText) errorMsg = errorText;
  }
  console.error('Failed to reschedule appointment. Response:', errorMsg);
  Alert.alert('Error', errorMsg);
  return;
}

    Alert.alert('Success', 'Appointment rescheduled successfully.');
    fetchLabAppointments();
    setRescheduleModalVisible(false);
  } catch (error) {
    console.error('Rescheduling error:', error);
    Alert.alert('Error', 'Failed to reschedule the appointment.');
  }
};
  const handleCancelAppointment = async (appointmentId) => {
    const token = await getToken();

    if (!token || !appointmentId) {
      console.warn('Missing token or appointment ID');
      return;
    }

    try {
      // const response = await fetch(`${BASE_URL}/labs/lab-tests/${appointmentId}/`, {
      const response = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/${appointmentId}/`, {
        // method: 'DELETE',
        // headers: {
        //   Authorization: `Bearer ${token}`,
        // },
        method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (response.status === 204 || response.status === 200) {
        Alert.alert('Deleted', 'Appointment cancelled successfully.');
        fetchLabAppointments();
      } else {
        const errorText = await response.text();
        console.error('Failed to delete appointment. Response:', errorText);
        Alert.alert('Error', 'Could not cancel the appointment.');
      }
    } catch (error) {
      console.error('Cancellation error:', error);
      Alert.alert('Error', 'An error occurred while cancelling the appointment.');
    }
  };

  const filterAppointments = (allAppointments, status) => {
    const filtered = allAppointments.filter(item => item.status === status);
    setFilteredAppointments(filtered);
  };

  const handleFilterChange = (status) => {
    setSelectedStatus(status);
    filterAppointments(appointments, status);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d) ? '' : d.toISOString().split('T')[0];
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d) ? '' : d.toTimeString().split(' ')[0];
  };

  useEffect(() => {
    fetchLabAppointments();
    fetchAvailabilities();
  }, []);

  useEffect(() => {
  if (!rescheduleModalVisible || !selectedAppointment) return;
  const dateStr = moment(newDateTime).format("YYYY-MM-DD");
  // Filter by lab_profile if needed:
  console.log('Selected Appointment:', selectedAppointment);
  console.log('Selected Date:', dateStr);
  console.log('Availabilities:', availabilities);
  const todaysAvailabilities = availabilities.filter(
    item =>
      item.date === dateStr &&
      item.available &&
      (item.lab === selectedAppointment.lab_profile_code)
  );
  let slots = [];
  todaysAvailabilities.forEach(slot => {
    slots = slots.concat(generateSlots(slot.start_time, slot.end_time));
  });
  setAvailableSlots(slots);
  setSelectedSlot(''); // reset slot on date change/modal open
}, [rescheduleModalVisible, newDateTime, availabilities, selectedAppointment]);
console.log('Available Slots:', availableSlots);

  const renderAppointment = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>Patient: {item.patient_name}</Text>
      <Text>Lab Name: {item.lab_profile_name}</Text>
      <Text>Test Type: {item.test_type}</Text>
      <Text>Status: {item.status}</Text>
      {/* <Text>Scheduled: {new Date(item.scheduled_date).toLocaleString()}</Text> */}
      <Text>Scheduled: {moment(item.scheduled_date).format('DD-MM-YYYY, hh:mm A')}</Text>
      <Text>Reg #: {item.registration_number}</Text>

      {item.status === 'SCHEDULED' && (
        <>
          <View style={styles.separator} />
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleCancelAppointment(item.id)}>
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.verticalSeparator} />
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedAppointment(item);
                setNewDateTime(new Date(item.scheduled_date));
                setRescheduleModalVisible(true);
              }}
            >
              <Text style={styles.actionText}>Reschedule</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Custom Toolbar */}
        {/* <View style={styles.toolbar}>
               <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                 <View style={styles.backIconContainer}>
                   <Image
                     source={require("../assets/UserProfile/back-arrow.png")}
                     style={styles.backIcon}
                   />
                 </View>
               </TouchableOpacity>
             
               <Text style={styles.toolbarTitle}>Appointment Booking</Text>
             </View> */}
<Header title="Lab Appointments"/>

        <View style={styles.buttonGroup}>
          {['SCHEDULED', 'COMPLETED', 'CANCELLED'].map(status => (
            <TouchableOpacity
              key={status}
              onPress={() => handleFilterChange(status)}
              style={[
                styles.filterButton,
                selectedStatus === status && styles.activeFilterButton
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedStatus === status && styles.activeFilterText
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <FlatList
            data={filteredAppointments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderAppointment}
            ListEmptyComponent={<Text style={styles.emptyText}>No appointments found.</Text>}
          />
        )}
      </SafeAreaView>

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
           <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    style={{ flex: 1, width: '100%' }}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
  >
          {/* <View style={styles.modalContainer}> */}
          <ScrollView
      contentContainerStyle={styles.modalContainer}
      keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>

            {/* <Text>Lab Profile</Text>
            <TextInput
              value={selectedAppointment?.lab_profile || ''}
              style={styles.input}
              editable={false}
            /> */}

            <Text>Test Type</Text>
            <TextInput
              value={selectedAppointment?.test_type || ''}
              style={styles.input}
              editable={false}
            />

            {/* <Text>Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
              <Text>{formatDate(newDateTime)}</Text>
            </TouchableOpacity> */}
            <Text style={{ marginBottom: 8 }}>Available Dates</Text>
<View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
  {Array.from(new Set(availabilities.map(a => a.date))).map(date => (
    <TouchableOpacity
      key={date}
      style={[
        {
          padding: 10,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#ccc',
          marginRight: 8,
          marginBottom: 8,
          backgroundColor: moment(newDateTime).format("YYYY-MM-DD") === date ? '#d0e8ff' : '#fff',
        }
      ]}
      onPress={() => {
        const currentTime = moment(newDateTime);
        const updated = moment(date + ' ' + currentTime.format("HH:mm:ss"));
        setNewDateTime(updated.toDate());
      }}
    >
      <Text style={{ fontWeight: '500' }}>{moment(date).format('DD-MM-YYYY')}</Text>
    </TouchableOpacity>
  ))}
</View>


            {/* <Text>Time</Text>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.input}>
              <Text>{formatTime(newDateTime)}</Text>
            </TouchableOpacity> */}

            <Text>Time Slot</Text>
<View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
  {availableSlots.length === 0 ? (
  <Text style={{ color: '#c00', marginBottom: 10 }}>No slots available for this date.</Text>
) : (
  availableSlots.map(slot => {
    // Combine selected date + slot time
    const slotDateTime = moment(`${moment(newDateTime).format("YYYY-MM-DD")} ${slot}`, "YYYY-MM-DD HH:mm");
    const isPast = slotDateTime.isBefore(moment());

    if (isPast) return null; // Hide past slots

    return (
      <TouchableOpacity
        key={slot}
        style={[
          {
            padding: 8,
            borderWidth: 1,
            borderColor: '#888',
            borderRadius: 6,
            marginRight: 8,
            marginBottom: 8,
            backgroundColor: selectedSlot === slot ? '#d0e8ff' : '#fff',
          }
        ]}
        onPress={() => setSelectedSlot(slot)}
      >
        <Text
          style={{
            color: '#000',
            fontWeight: selectedSlot === slot ? 'bold' : 'normal',
          }}
        >
          {moment(slot, "HH:mm").format("hh:mm A")}
        </Text>
      </TouchableOpacity>
    );
  })
)}

  {/* {availableSlots.length === 0 ? (
    <Text style={{ color: '#c00', marginBottom: 10 }}>No slots available for this date.</Text>
  ) : (
    availableSlots.map(slot => (
      <TouchableOpacity
        key={slot}
        style={[
          {
            padding: 8,
            borderWidth: 1,
            borderColor: '#888',
            borderRadius: 6,
            marginRight: 8,
            marginBottom: 8,
            backgroundColor: selectedSlot === slot ? '#d0e8ff' : '#fff',
          }
        ]}
        onPress={() => setSelectedSlot(slot)}
      >
        <Text style={{
          color: '#000',
          fontWeight: selectedSlot === slot ? 'bold' : 'normal'
        }}>
          {moment(slot, "HH:mm").format("hh:mm A")}
        </Text>
      </TouchableOpacity>
    ))
  )} */}
</View>


            {showDatePicker && (
              <DateTimePicker
                value={newDateTime}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    selectedDate.setHours(12);
                    const updated = new Date(newDateTime);
                    updated.setFullYear(selectedDate.getFullYear());
                    updated.setMonth(selectedDate.getMonth());
                    updated.setDate(selectedDate.getDate());
                    setNewDateTime(updated);
                  }
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={newDateTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) {
                    const updated = new Date(newDateTime);
                    updated.setHours(selectedTime.getHours());
                    updated.setMinutes(selectedTime.getMinutes());
                    updated.setSeconds(0);
                    updated.setMilliseconds(0);
                    setNewDateTime(updated);
                  }
                }}
              />
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <Button title="Cancel" onPress={() => setRescheduleModalVisible(false)} />
              <Button title="Save" onPress={handleReschedule} />
            </View>
            
          {/* </View> */}
              </ScrollView>
            </KeyboardAvoidingView>

        </View>
      </Modal>
    </>
  );
};

export default LabAppointmentsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fb' },

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

  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1c78f2',
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#1c78f2',
  },
  filterText: {
    color: '#1c78f2',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderColor: '#e6e6e6',
    borderRightWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 4,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#1C1C1E',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionText: {
    color: '#1C78F2',
    fontWeight: '500',
  },
  verticalSeparator: {
    width: 1,
    backgroundColor: '#ccc',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    width: '90%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1C78F2',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
});
