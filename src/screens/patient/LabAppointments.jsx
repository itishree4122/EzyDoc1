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
  const [cancellingId, setCancellingId] = useState(null);

  
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
  Alert.alert(
    "Confirm Cancellation",
    "Are you sure you want to cancel this appointment?",
    [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => console.log("Cancellation cancelled")
      },
      { 
        text: "Confirm", 
        onPress: async () => {
          setCancellingId(appointmentId);
          const token = await getToken();

          if (!token) {
            Alert.alert("Error", "Authentication failed. Please login again.");
            setCancellingId(null);
            return;
          }

          try {
            const response = await fetchWithAuth(
              `${BASE_URL}/labs/lab-tests/${appointmentId}/`, 
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'CANCELLED' }),
              }
            );

            if (response.ok) {
              Alert.alert(
                "Success", 
                "Appointment cancelled successfully",
                [
                  {
                    text: "OK",
                    onPress: () => fetchLabAppointments() // Refresh the list
                  }
                ]
              );
            } else {
              const errorData = await response.json();
              throw new Error(errorData.message || "Failed to cancel appointment");
            }
          } catch (error) {
            console.error("Cancellation error:", error);
            Alert.alert(
              "Error",
              error.message || "An error occurred while cancelling the appointment"
            );
          } finally {
            setCancellingId(null);
          }
        } 
      }
    ]
  );
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
          <TouchableOpacity 
            style={[
              styles.actionButton,
              cancellingId === item.id && styles.disabledButton
            ]} 
            onPress={() => handleCancelAppointment(item.id)}
            disabled={cancellingId === item.id}
          >
            {cancellingId === item.id ? (
              <ActivityIndicator size="small" color="#1C78F2" />
            ) : (
              <Text style={styles.actionText}>Cancel</Text>
            )}
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
  {/* Main overlay container */}
  <View style={styles.modalOverlay}>
    {/* Scrollable content - removed fixed width constraints */}
    <ScrollView
      contentContainerStyle={styles.modalScrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Actual modal content container */}
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Reschedule Appointment</Text>

        <Text style={styles.label}>Test Type</Text>
        <TextInput
          value={selectedAppointment?.test_type || ''}
          style={styles.input}
          editable={false}
        />

        <Text style={styles.label}>Available Dates</Text>
        <View style={styles.datesContainer}>
          {Array.from(new Set(availabilities.map(a => a.date))).map(date => (
            <TouchableOpacity
              key={date}
              style={[
                styles.dateButton,
                moment(newDateTime).format("YYYY-MM-DD") === date && styles.selectedDateButton
              ]}
              onPress={() => {
                const currentTime = moment(newDateTime);
                const updated = moment(date + ' ' + currentTime.format("HH:mm:ss"));
                setNewDateTime(updated.toDate());
              }}
            >
              <Text style={styles.dateButtonText}>
                {moment(date).format('DD-MM-YYYY')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Time Slot</Text>
        <View style={styles.slotsContainer}>
          {availableSlots.length === 0 ? (
            <Text style={styles.noSlotsText}>No slots available for this date.</Text>
          ) : (
            availableSlots.map(slot => {
              const slotDateTime = moment(`${moment(newDateTime).format("YYYY-MM-DD")} ${slot}`, "YYYY-MM-DD HH:mm");
              const isPast = slotDateTime.isBefore(moment());

              if (isPast) return null;

              return (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlotButton,
                    selectedSlot === slot && styles.selectedTimeSlotButton
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={styles.timeSlotText}>
                    {moment(slot, "HH:mm").format("hh:mm A")}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.modalButtonContainer}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setRescheduleModalVisible(false)}
          >
            <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modalButton, 
              styles.saveButton,
              !selectedSlot && styles.disabledButton
            ]}
            onPress={handleReschedule}
            disabled={!selectedSlot}
          >
            <Text style={[styles.modalButtonText, styles.saveButtonText]}>
              Save Changes
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    paddingTop: 5,
  },
  actionText: {
    color: '#1C78F2',
    fontWeight: '500',
  },
  verticalSeparator: {
    width: 1,
    height: 30,
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
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  padding: 20,
},
modalScrollContainer: {
  flexGrow: 1,
  justifyContent: 'center',
},
modalContent: {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 20,
  width: '100%', // Takes full width of parent
  maxWidth: '100%', // Ensures it doesn't exceed screen width
  alignSelf: 'center', // Centers the modal
},
modalTitle: {
  fontSize: 20,
  fontWeight: '600',
  marginBottom: 20,
  color: '#1C78F2',
  textAlign: 'center',
},
label: {
  fontSize: 14,
  fontWeight: '500',
  marginBottom: 8,
  color: '#333',
},
input: {
  borderWidth: 1,
  borderColor: '#D1D5DB',
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
  fontSize: 16,
  backgroundColor: '#FAFAFA',
},
datesContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginBottom: 16,
},
dateButton: {
  padding: 10,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#ccc',
  marginRight: 8,
  marginBottom: 8,
  backgroundColor: '#fff',
},
selectedDateButton: {
  backgroundColor: '#d0e8ff',
  borderColor: '#1c78f2',
},
dateButtonText: {
  fontWeight: '500',
  color: '#333',
},
slotsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginBottom: 20,
},
timeSlotButton: {
  padding: 10,
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  marginRight: 8,
  marginBottom: 8,
  backgroundColor: '#f8f9fa',
},
selectedTimeSlotButton: {
  backgroundColor: '#1c78f2',
  borderColor: '#1c78f2',
},
timeSlotText: {
  color: '#333',
  fontSize: 14,
},
selectedTimeSlotButtonText: {
  color: '#fff',
},
noSlotsText: {
  color: '#ff4444',
  marginBottom: 10,
  fontStyle: 'italic',
},
modalButtonContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
},
modalButton: {
  flex: 1,
  padding: 14,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
  marginHorizontal: 5,
},
cancelButton: {
  backgroundColor: '#f8f9fa',
  borderWidth: 1,
  borderColor: '#d1d5db',
},
saveButton: {
  backgroundColor: '#1c78f2',
},
disabledButton: {
  opacity: 0.6,
},
modalButtonText: {
  fontSize: 16,
  fontWeight: '600',
},
cancelButtonText: {
  color: '#333',
},
saveButtonText: {
  color: '#fff',
},
  disabledButton: {
  opacity: 0.6,
},

});
