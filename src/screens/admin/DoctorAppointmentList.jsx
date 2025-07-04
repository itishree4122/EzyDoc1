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
  Modal,
  TouchableOpacity
} from 'react-native';
import { getToken } from '../auth/tokenHelper'; // adjust path if needed
import { BASE_URL } from '../auth/Api'; // adjust path if needed
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import moment from 'moment';
const DoctorAppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const navigation = useNavigation();
  const [showDateModal, setShowDateModal] = useState(false);
  const [activeDateField, setActiveDateField] = useState(null); // 'from' or 'to'

  const [showSearchInput, setShowSearchInput] = useState(false);

  const itemsPerPage = 15;
 
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState(null);
const [toDate, setToDate] = useState(null);
const [showPicker, setShowPicker] = useState({ type: null, show: false });

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

  // ✅ Sort by booked_at descending (newest first)
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

      // const response = await fetch(`${BASE_URL}/doctor/appointmentlist/`, {
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
    {/* Top: Doctor & Patient Names */}
    <View style={styles.cardHeader}>
      <Text style={styles.nameText}>{item.doctor_name}</Text>
      <Text style={styles.subTitle}>Dr. ID: {item.doctor_id} | {item.specialist}</Text>
    </View>

    <View style={styles.divider} />

    {/* Patient Section */}
    <View style={styles.cardRow}>
      <View style={styles.half}>
        <Text style={styles.label}>Patient</Text>
        <Text style={styles.cardInfo}>{item.patient_name}</Text>
        <Text style={styles.cardSubInfo}>ID: {item.patient_id}</Text>
      </View>
      <View style={styles.half}>
        <Text style={styles.label}>Phone</Text>
        <Text style={styles.cardInfo}>{item.patient_number}</Text>
      </View>
    </View>

    <View style={styles.cardRow}>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>{item.patient_age} yrs</Text>
        <Text style={[styles.badge, { backgroundColor: item.patient_gender === 'Male' ? '#87CEEB' : '#FFB6C1' }]}>
          {item.patient_gender}
        </Text>
      </View>
    </View>

    <View style={styles.divider} />

    {/* Appointment Info */}
    <View style={styles.cardRow}>
      <View style={styles.half}>
        <Text style={styles.label}>Visit Date</Text>
        <Text style={styles.cardInfo}>{moment(item.date_of_visit,'YYYY-MM-DD').format('DD-MM-YYYY')}</Text>
      </View>
      <View style={styles.half}>
        <Text style={styles.label}>Time</Text>
        <Text style={styles.cardInfo}>
          {item.visit_time} <Text style={styles.shiftBadge}>{item.shift}</Text>
        </Text>
      </View>
    </View>

    <View style={styles.cardRow}>
      <View style={styles.half}>
        <Text style={styles.label}>Reg. No</Text>
        <Text style={styles.cardInfo}>{item.registration_number}</Text>
      </View>
      <View style={styles.half}>
        <Text style={styles.label}>Booked On</Text>
        <Text style={styles.cardInfo}>{item.booked_at.split("T")[0]}</Text>
      </View>
    </View>
  </View>
);


  return (

    <>
<View style={styles.toolbar}>
  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconContainer}>
    <Image
      source={require("../assets/UserProfile/back-arrow.png")}
      style={styles.backIcon}
    />
  </TouchableOpacity>

  <Text style={styles.toolbarTitle}>Clinic Appointments</Text>

  <TouchableOpacity onPress={() => setShowSearchInput(prev => !prev)} style={styles.searchIconWrapper}>
    <Image
      source={require("../assets/search.png")}
      style={styles.toolbarSearchIcon}
    />
  </TouchableOpacity>
</View>
{showSearchInput && (
  <View style={styles.searchContainer}>
    <TextInput
      placeholder="Search for doctors..."
      placeholderTextColor="#888"
      style={styles.searchInput}
      value={searchQuery}
      onChangeText={setSearchQuery}
      autoFocus
    />
  </View>
)}


 <View style={{ alignItems: 'flex-end', padding: 10 }}>
  <TouchableOpacity onPress={() => setShowDateModal(true)}>
    <Image
      source={require('../assets/homepage/calendar.png')}
      style={{ width: 24, height: 24 }}
    />
  </TouchableOpacity>
</View>
<Modal
  visible={showDateModal}
  transparent
  animationType="slide"
  onRequestClose={() => setShowDateModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Select Date Range</Text>

      <TouchableOpacity
        style={styles.dateField}
        onPress={() => setActiveDateField('from')}
      >
        <Text style={styles.dateFieldText}>
          {fromDate ? `From: ${fromDate}` : 'Select From Date'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dateField}
        onPress={() => setActiveDateField('to')}
      >
        <Text style={styles.dateFieldText}>
          {toDate ? `To: ${toDate}` : 'Select To Date'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.applyButton}
        onPress={() => setShowDateModal(false)}
      >
        <Text style={styles.buttonText}>Apply</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{activeDateField && (
  <DateTimePicker
    value={new Date()}
    mode="date"
    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
    onChange={(event, selectedDate) => {
      setActiveDateField(null);
      if (!selectedDate) return;
      const formatted = selectedDate.toISOString().split('T')[0];
      if (activeDateField === 'from') setFromDate(formatted);
      else if (activeDateField === 'to') setToDate(formatted);
    }}
  />
)}


{showPicker.show && (
  <DateTimePicker
    value={new Date()}
    mode="date"
    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
    onChange={handleDateChange}
  />
)}
  <SafeAreaView style={styles.container}>
                     {loading ? (
                             <Text style={[styles.loadingText, { marginTop: 40 }]}>Loading data...</Text>
                           ) : (
  <FlatList
    data={paginatedAppointments}
    showsVerticalScrollIndicator={false}
    keyExtractor={(item) => item.id.toString()}
    renderItem={renderItem}
    ListEmptyComponent={
      <Text style={styles.emptyText}>No appointments found.</Text>
    }
    contentContainerStyle={{ paddingBottom: 80 }} // 👈 Add extra padding
  />
)}


   <View style={styles.paginationContainer}>
  <TouchableOpacity
    onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
    style={styles.iconButton}
  >
    <Image
      source={require('../assets/admin/backward-button.png')}
      style={[
        styles.icon,
        currentPage === 1 && styles.disabledIcon
      ]}
    />
  </TouchableOpacity>

  <Text style={styles.pageNumber}>{`Page ${currentPage} of ${totalPages}`}</Text>

  <TouchableOpacity
    onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
    style={styles.iconButton}
  >
    <Image
      source={require('../assets/admin/forward-button.png')}
      style={[
        styles.icon,
        currentPage === totalPages && styles.disabledIcon
      ]}
    />
  </TouchableOpacity>
</View>

    </SafeAreaView>
    </>
    
  );
};

export default DoctorAppointmentList;

const styles = StyleSheet.create({

  toolbar: {
  backgroundColor: "#fff",
  paddingVertical: 12,
  paddingBottom: 16,
  paddingHorizontal: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},
backIconContainer: {
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
},
backIcon: {
  width: 20,
  height: 20,
  tintColor: "#000",
},
toolbarTitle: {
  fontSize: 18,
  color: "#000",
  fontWeight: "bold",
},
searchIconWrapper: {
  padding: 6,
},
toolbarSearchIcon: {
  width: 22,
  height: 22,
  tintColor: "#000",
},
searchContainer: {
  flexDirection: "row",
  backgroundColor: "#F3F4F6",
  marginHorizontal: 20,
  marginTop: 10,
  marginBottom: 10,
  paddingHorizontal: 15,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#D1D5DB',
  alignItems: "center",
  
},
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: 'transparent',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    minHeight: 40,
    alignItems: 'center',
  },
  headerRow: {
    backgroundColor: '#1c78f2',
  },
  cell: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    width: 120,
    fontSize: 12,
    color: '#333',
  },
  headerCell: {
    color: '#fff',
    fontWeight: 'bold',
    width: 120,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },

  paginationContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 12,
  backgroundColor: '#F8F9FA',
  borderTopWidth: 1,
  borderTopColor: '#ddd',
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 10,
  height: 50,
},

iconButton: {
  padding: 10,
},

icon: {
  width: 20,
  height: 20,
  tintColor: '#1c78f2',
},

disabledIcon: {
  tintColor: '#ccc',
},

pageNumber: {
  fontSize: 16,
  fontWeight: '600',
  marginHorizontal: 12,
},

// date range
dateRangeContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginHorizontal: 16,
  marginBottom: 10,
},

dateInput: {
  borderWidth: 1,
  borderColor: '#ccc',
  padding: 10,
  borderRadius: 8,
  width: '48%',
  backgroundColor: '#fff',
},

dateText: {
  color: '#333',
  textAlign: 'center',
},

  loadingText: {
  textAlign: 'center',
  fontSize: 16,
  color: '#555',
  paddingVertical: 20,
},
card: {
  backgroundColor: '#fff',
  borderRadius: 14,
  padding: 16,
  marginHorizontal: 12,
  marginBottom: 16,
  elevation: 4,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
  borderLeftWidth: 6,
  borderLeftColor: '#1c78f2',
},

cardHeader: {
  marginBottom: 8,
},

nameText: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#2c3e50',
},

subTitle: {
  fontSize: 13,
  color: '#666',
  marginTop: 2,
},

divider: {
  height: 1,
  backgroundColor: '#eee',
  marginVertical: 10,
},

cardRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 6,
},

half: {
  width: '48%',
},

label: {
  fontSize: 12,
  color: '#888',
},

cardInfo: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
},

cardSubInfo: {
  fontSize: 12,
  color: '#999',
},

badgeRow: {
  flexDirection: 'row',
  gap: 8,
  marginTop: 6,
},

badge: {
  backgroundColor: '#eee',
  color: '#444',
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 16,
  fontSize: 12,
  overflow: 'hidden',
  marginRight: 10,
},

shiftBadge: {
  backgroundColor: '#FFD700',
  color: '#333',
  fontSize: 11,
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 10,
  overflow: 'hidden',
},
modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
},
modalContainer: {
  width: '85%',
  backgroundColor: 'white',
  padding: 20,
  borderRadius: 10,
  elevation: 5,
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 20,
  textAlign: 'center',
},
dateField: {
  padding: 12,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 6,
  marginBottom: 15,
},
dateFieldText: {
  fontSize: 16,
  color: '#333',
},
applyButton: {
  backgroundColor: '#007BFF',
  padding: 12,
  borderRadius: 6,
  alignItems: 'center',
},
buttonText: {
  color: '#fff',
  fontWeight: 'bold',
},

});
