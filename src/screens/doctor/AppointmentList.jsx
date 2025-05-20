import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import moment from 'moment';

const AppointmentList = () => {
  const route = useRoute();
  const { doctorId } = route.params;

  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('today');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = await getToken();
        if (!token || !doctorId) {
          setError('Missing token or doctor ID');
          setLoading(false);
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
          throw new Error('Failed to fetch appointments');
        }

        const data = await response.json();
        const doctorAppointments = data.filter(item => item.doctor_id === doctorId);
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
    const filtered =
      tab === 'today'
        ? data.filter(item => item.date_of_visit === todayDate)
        : data.filter(item => moment(item.date_of_visit).isAfter(todayDate));
    setFilteredAppointments(filtered);
  };

  const handleMarkDone = async (registrationNumber) => {
    try {
      const token = await getToken();
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch(`${BASE_URL}/doctor/appointment-checked/${registrationNumber}/`, {
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
          const updatedAppointments = appointments.map(item =>
            item.registration_number === registrationNumber
              ? { ...item, checked: true }
              : item
          );
          setAppointments(updatedAppointments);
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>Patient: {item.patient_name}</Text>
      <Text>Age: {item.patient_age} | Gender: {item.patient_gender}</Text>
      <Text>Number: {item.patient_number}</Text>
      <Text>Date: {item.date_of_visit}</Text>
      <Text>Time: {item.visit_time}</Text>
      <Text>Shift: {item.shift}</Text>
      <Text>Reg No: {item.registration_number}</Text>
      <Text>Checked: {item.checked ? 'Yes' : 'No'}</Text>
      <Text>Cancelled: {item.cancelled ? 'Yes' : 'No'}</Text>

      <View style={styles.horizontalLine} />

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton}>
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
    <View style={styles.container}>
      <Text style={styles.header}>Appointments for Doctor ID: {doctorId}</Text>

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

      {filteredAppointments.length === 0 ? (
        <Text style={styles.noAppointments}>No appointments found.</Text>
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

export default AppointmentList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  activeTab: {
    backgroundColor: '#0066cc',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
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
    color: 'red',
    fontWeight: 'bold',
  },
  doneText: {
    color: 'green',
    fontWeight: 'bold',
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
