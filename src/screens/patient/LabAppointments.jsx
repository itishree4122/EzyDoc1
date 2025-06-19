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
  
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';

import { useNavigation } from '@react-navigation/native';

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

  const fetchLabAppointments = async () => {
    const token = await getToken();

    if (!token) {
      console.warn('No token available, aborting fetch');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/labs/lab-tests/`, {
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
      setAppointments(data);
      filterAppointments(data, selectedStatus);
    } catch (error) {
      console.error('Error fetching lab appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    const token = await getToken();

    if (!token || !selectedAppointment) {
      console.warn('Missing token or appointment');
      return;
    }

    const url = `${BASE_URL}/labs/lab-tests/${selectedAppointment.id}/`;
    const payload = {
      lab_profile: selectedAppointment.lab_profile,
      test_type: selectedAppointment.test_type,
      scheduled_date: newDateTime.toISOString(),
    };

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to reschedule appointment. Response:', errorText);
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
      const response = await fetch(`${BASE_URL}/labs/lab-tests/${appointmentId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
  }, []);

  const renderAppointment = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>Patient: {item.patient_name}</Text>
      <Text>Test Type: {item.test_type}</Text>
      <Text>Status: {item.status}</Text>
      <Text>Scheduled: {new Date(item.scheduled_date).toLocaleString()}</Text>
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
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconWrapper}>
            <Image
              source={require('../assets/left-arrow.png')}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.header}>Lab Appointments</Text>
        </View>

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
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>

            <Text>Lab Profile</Text>
            <TextInput
              value={selectedAppointment?.lab_profile || ''}
              style={styles.input}
              editable={false}
            />

            <Text>Test Type</Text>
            <TextInput
              value={selectedAppointment?.test_type || ''}
              style={styles.input}
              editable={false}
            />

            <Text>Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
              <Text>{formatDate(newDateTime)}</Text>
            </TouchableOpacity>

            <Text>Time</Text>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.input}>
              <Text>{formatTime(newDateTime)}</Text>
            </TouchableOpacity>

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
          </View>
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
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    zIndex: 1000,
    position: 'relative',
    height: 60,

  },
  backIconWrapper: {
    marginRight: 12,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#000',
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
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
    borderColor: '#4C9CFA',
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#4C9CFA',
  },
  filterText: {
    color: '#4C9CFA',
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
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
