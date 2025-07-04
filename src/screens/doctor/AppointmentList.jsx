import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import moment from 'moment';
import { useNavigation } from "@react-navigation/native";
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

const AppointmentList = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { doctorId } = route.params;

  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('today');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [doctorId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token || !doctorId) {
        setError('Missing token or doctor ID');
        setLoading(false);
        return;
      }

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
      const doctorAppointments = data.filter(item => 
        item.doctor_id === doctorId && 
        item.checked === false && 
        item.cancelled === false
      );
      setAppointments(doctorAppointments);
      filterAppointments(doctorAppointments, selectedTab);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    filterAppointments(appointments, selectedTab);
  }, [selectedTab, appointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

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
          return dateA - dateB;
        }

        const shiftA = shiftOrder[a.shift] || 999;
        const shiftB = shiftOrder[b.shift] || 999;

        if (shiftA !== shiftB) {
          return shiftA - shiftB;
        }

        const timeA = moment(a.visit_time, 'HH:mm');
        const timeB = moment(b.visit_time, 'HH:mm');

        return timeA - timeB;
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
          const updatedAppointments = appointments.filter(
            item => item.registration_number !== registrationNumber
          );
          setAppointments(updatedAppointments);

          const updatedFiltered = filteredAppointments.filter(
            item => item.registration_number !== registrationNumber
          );
          setFilteredAppointments(updatedFiltered);

          Alert.alert('Success', 'Appointment marked as completed');
        } else {
          Alert.alert('Error', 'Failed to update appointment');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const handleCancel = async (registrationNumber) => {
    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this appointment?",
      [
        {
          text: "No",
          style: "cancel"
        },
        { 
          text: "Yes", 
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) {
                console.error('No token found');
                return;
              }

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
                  const updatedAppointments = appointments.filter(
                    item => item.registration_number !== registrationNumber
                  );
                  setAppointments(updatedAppointments);

                  const updatedFiltered = filteredAppointments.filter(
                    item => item.registration_number !== registrationNumber
                  );
                  setFilteredAppointments(updatedFiltered);

                  Alert.alert('Success', 'Appointment cancelled');
                } else {
                  Alert.alert('Error', 'Failed to cancel appointment');
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Something went wrong');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Icon name="account-circle" size={40} color="#1c78f2" />
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.patient_name}</Text>
          <Text style={styles.patientDetails}>
            {item.patient_age} • {item.patient_gender}
          </Text>
        </View>
        <View style={styles.regNumber}>
          <Text style={styles.regText}>#{item.registration_number}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Icon name="phone" size={16} color="#718096" />
          <Text style={styles.infoText}>{item.patient_number}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="calendar-month" size={16} color="#718096" />
          <Text style={styles.infoText}>
            {moment(item.date_of_visit,'YYYY-MM-DD').format('MMM D, YYYY')}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="clock-outline" size={16} color="#718096" />
          <Text style={styles.infoText}>
            {moment(item.visit_time, 'HH:mm:ss').format('h:mm A')} ({item.shift})
          </Text>
        </View>
      </View>

      {selectedTab === 'today' && (
        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancel(item.registration_number)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => handleMarkDone(item.registration_number)}
          >
            <Text style={styles.doneText}>Mark Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D5FEF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={48} color="#E53E3E" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchAppointments}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'today' && styles.activeTabButton
          ]}
          onPress={() => setSelectedTab('today')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'today' && styles.activeTabText
          ]}>
            Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === 'upcoming' && styles.activeTabButton
          ]}
          onPress={() => setSelectedTab('upcoming')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'upcoming' && styles.activeTabText
          ]}>
            Upcoming
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="calendar-blank" size={48} color="#A0AEC0" />
            <Text style={styles.emptyText}>
              No {selectedTab === 'today' ? 'today\'s' : 'upcoming'} appointments
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5D5FEF']}
            tintColor="#5D5FEF"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: '#1c78f2',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#718096',
  },
  activeTabText: {
    color: '#5D5FEF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#2D3748',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#5D5FEF',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#A0AEC0',
    fontWeight: '500',
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomWidth: 2,
    // elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  avatarContainer: {
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  patientDetails: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  regNumber: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  regText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4299E1',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#FED7D7',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: '#E53E3E',
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#C6F6D5',
    borderRadius: 8,
    alignItems: 'center',
  },
  doneText: {
    color: '#38A169',
    fontWeight: '600',
  },
});

export default AppointmentList;