import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { getToken } from '../auth/tokenHelper'; // adjust path if needed
import { BASE_URL } from '../auth/Api'; // adjust path if needed
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';


import moment from 'moment';


const DoctorAppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const navigation = useNavigation();
  const [showDateModal, setShowDateModal] = useState(false);
  const [activeDateField, setActiveDateField] = useState(null);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showPicker, setShowPicker] = useState({ type: null, show: false });

  const itemsPerPage = 15;

  const handleDateChange = (event, selectedDate) => {
    setShowPicker({ type: null, show: false });
    if (!selectedDate) return;

    const formattedDate = selectedDate.toISOString().split("T")[0];

    if (showPicker.type === 'from') {
      setFromDate(formattedDate);
    } else if (showPicker.type === 'to') {
      setToDate(formattedDate);
    }
  };

  const filteredAppointments = useMemo(() => {
    const filtered = appointments.filter((item) => {
      const visitDate = item.date_of_visit;
      const matchesSearch =
        item.doctor_id?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.specialist?.toLowerCase().includes(searchQuery.toLowerCase());

      const inRange =
        (!fromDate || visitDate >= fromDate) &&
        (!toDate || visitDate <= toDate);

      return matchesSearch && inRange;
    });

    return filtered.sort((a, b) => new Date(b.booked_at) - new Date(a.booked_at));
  }, [appointments, searchQuery, fromDate, toDate]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredAppointments.length / itemsPerPage);
  }, [filteredAppointments]);

  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAppointments.slice(startIndex, endIndex);
  }, [filteredAppointments, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'No access token found');
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      Alert.alert('Error', 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

 const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: getRandomColor() }]}>
            <Text style={styles.avatarText}>{item.doctor_name.charAt(0)}</Text>
          </View>
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.nameText}>{item.doctor_name}</Text>
          <View style={styles.specialtyBadge}>
            <Text style={styles.specialtyText}>{item.specialist}</Text>
          </View>
          <Text style={styles.doctorId}>ID: {item.doctor_id}</Text>
        </View>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item) }]} />
          <Text style={styles.statusText}>{getStatusText(item)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.patientSection}>
        <View style={styles.patientHeader}>
          <MaterialIcons name="person-outline" size={18} color="#5d6d7e" />
          <Text style={styles.sectionTitle}>Patient Details</Text>
        </View>
        <View style={styles.patientDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{item.patient_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID:</Text>
            <Text style={styles.detailValue}>{item.patient_id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Age/Gender:</Text>
            <Text style={styles.detailValue}>{item.patient_age}yrs • {item.patient_gender}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{item.patient_number}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.appointmentSection}>
        <View style={styles.appointmentHeader}>
          <MaterialCommunityIcons name="calendar-clock" size={18} color="#5d6d7e" />
          <Text style={styles.sectionTitle}>Appointment Details</Text>
        </View>
        <View style={styles.timelineContainer}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Visit Date</Text>
              <Text style={styles.timelineValue}>{moment(item.date_of_visit,'YYYY-MM-DD').format('DD MMM YYYY')}</Text>
            </View>
          </View>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Time</Text>
              <Text style={styles.timelineValue}>{item.visit_time} ({item.shift})</Text>
            </View>
          </View>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Booked On</Text>
              <Text style={styles.timelineValue}>{moment(item.booked_at).format('DD MMM YYYY, hh:mm A')}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.regNumber}>Reg: {item.registration_number}</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>VIEW DETAILS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Appointments</Text>
          <Text style={styles.headerSubtitle}>Manage patient visits</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowSearchInput(prev => !prev)} 
          style={styles.searchButton}
        >
          <Feather name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {showSearchInput && (
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
          <TextInput
            placeholder="Search doctors, patients..."
            placeholderTextColor="#95a5a6"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Date Filter  */}
      <View style={styles.filterContainer}>

         <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsContainer}
      >
        <TouchableOpacity 
          style={[styles.filterChip, fromDate && styles.activeFilterChip]}
          onPress={() => setShowPicker({ type: 'from', show: true })}
        >
          <Text style={[styles.filterChipText, fromDate && styles.activeFilterChipText]}>
            {fromDate ? moment(fromDate).format('MMM DD') : 'From Date'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterChip, toDate && styles.activeFilterChip]}
          onPress={() => setShowPicker({ type: 'to', show: true })}
        >
          <Text style={[styles.filterChipText, toDate && styles.activeFilterChipText]}>
            {toDate ? moment(toDate).format('MMM DD') : 'To Date'}
          </Text>
        </TouchableOpacity>
        
        {(fromDate || toDate) && (
          <TouchableOpacity 
            style={styles.clearFilterChip}
            onPress={() => {
              setFromDate(null);
              setToDate(null);
            }}
          >
            <Text style={styles.clearFilterChipText}>Clear</Text>
            <Feather name="x" size={14} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </ScrollView>
      </View>
     

      {/* Date Pickers */}
      {showPicker.show && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Appointment List */}
      <View style={styles.listContainer}>
        {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingAnimation}>
            <Feather name="clock" size={40} color="#1c78f2" />
            <View style={styles.loadingDots}>
              <View style={styles.loadingDot} />
              <View style={styles.loadingDot} />
              <View style={styles.loadingDot} />
            </View>
          </View>
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : (
        <FlatList
          data={paginatedAppointments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="calendar" size={48} color="#bdc3c7" />
              <Text style={styles.emptyTitle}>No Appointments Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
            </View>
          }
        />
      )}

      </View>
      

      {/* Pagination */}
      {filteredAppointments.length > 0 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
          >
            <Feather name="chevron-left" size={20} color={currentPage === 1 ? "#bdc3c7" : "#1c78f2"} />
          </TouchableOpacity>
          
          <View style={styles.pageIndicator}>
            <Text style={styles.pageText}>{currentPage}</Text>
            <Text style={styles.pageSeparator}>/</Text>
            <Text style={styles.pageText}>{totalPages}</Text>
          </View>
          
          <TouchableOpacity
            onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
          >
            <Feather name="chevron-right" size={20} color={currentPage === totalPages ? "#bdc3c7" : "#1c78f2"} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// Helper functions
const getRandomColor = () => {
  const colors = ['#1c78f2', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getStatusColor = (item) => {
  // Implement your status logic here
  return '#2ecc71'; // Default to green
};

const getStatusText = (item) => {
  // Implement your status text logic here
  return 'Confirmed';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1c78f2',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  backButton: {
    padding: 8,
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  filterContainer: {
  backgroundColor: '#f5f7fa',
  borderBottomWidth: 1,
  borderBottomColor: '#ecf0f1',
},
listContainer: {
  flex: 1, // Takes up all remaining space
},
  filterChipsContainer: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  height: 50, // Fixed height
  alignItems: 'center', 
},
  filterChip: {
    backgroundColor: '#ecf0f1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterChip: {
    backgroundColor: '#1c78f2',
  },
  filterChipText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  activeFilterChipText: {
    color: '#fff',
  },
  clearFilterChip: {
    backgroundColor: '#fdedec',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearFilterChipText: {
    color: '#e74c3c',
    fontSize: 14,
    marginRight: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  doctorInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  specialtyBadge: {
    backgroundColor: '#e8f4fc',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  specialtyText: {
    color: '#1c78f2',
    fontSize: 12,
    fontWeight: '500',
  },
  doctorId: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  statusIndicator: {
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
  },
  patientSection: {
    padding: 16,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  patientDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    width: '50%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 4,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  appointmentSection: {
    padding: 16,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1c78f2',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  regNumber: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  actionButton: {
    backgroundColor: '#1c78f2',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 10,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1c78f2',
    marginHorizontal: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#95a5a6',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  paginationButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  pageText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  pageSeparator: {
    fontSize: 16,
    color: '#bdc3c7',
    marginHorizontal: 4,
  },
});

export default DoctorAppointmentList;
