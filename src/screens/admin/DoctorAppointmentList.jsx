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


const DoctorAppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
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

      const response = await fetch(`${BASE_URL}/doctor/appointmentlist/`, {
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
  

  const renderHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.cell, styles.headerCell]}>ID</Text>
      <Text style={[styles.cell, styles.headerCell]}>Doctor ID</Text>
      <Text style={[styles.cell, styles.headerCell]}>Doctor Name</Text>
      <Text style={[styles.cell, styles.headerCell]}>Specialist</Text>
      <Text style={[styles.cell, styles.headerCell]}>Patient ID</Text>
      <Text style={[styles.cell, styles.headerCell]}>Patient Name</Text>
      <Text style={[styles.cell, styles.headerCell]}>Patient Number</Text>
      <Text style={[styles.cell, styles.headerCell]}>Age</Text>
      <Text style={[styles.cell, styles.headerCell]}>Gender</Text>
      <Text style={[styles.cell, styles.headerCell]}>Visit Date</Text>
      <Text style={[styles.cell, styles.headerCell]}>Shift</Text>
      <Text style={[styles.cell, styles.headerCell]}>Visit Time</Text>
      <Text style={[styles.cell, styles.headerCell]}>Booked At</Text>
      <Text style={[styles.cell, styles.headerCell]}>Reg. Number</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.id}</Text>
      <Text style={styles.cell}>{item.doctor_id}</Text>
      <Text style={styles.cell}>{item.doctor_name}</Text>
      <Text style={styles.cell}>{item.specialist}</Text>
      <Text style={styles.cell}>{item.patient_id}</Text>
      <Text style={styles.cell}>{item.patient_name}</Text>
      <Text style={styles.cell}>{item.patient_number}</Text>
      <Text style={styles.cell}>{item.patient_age}</Text>
      <Text style={styles.cell}>{item.patient_gender}</Text>
      <Text style={styles.cell}>{item.date_of_visit}</Text>
      <Text style={styles.cell}>{item.shift}</Text>
      <Text style={styles.cell}>{item.visit_time}</Text>
      <Text style={styles.cell}>{item.booked_at.split('T')[0]}</Text>
      <Text style={styles.cell}>{item.registration_number}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#6495ED" />
      </SafeAreaView>
    );
  }

  return (

    <>
    <View style={styles.toolbar}>
               <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                      <View style={styles.backIconContainer}>
                        <Image
                          source={require("../assets/UserProfile/back-arrow.png")} // Replace with your back arrow image
                          style={styles.backIcon}
                        />
                      </View>
                    </TouchableOpacity>
                
              </View>
               {/* Search Bar */}
                     <View style={styles.searchContainer}>
                      <TextInput
                        placeholder="Search for doctors..."
                        placeholderTextColor="#888"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                      <Image
                        source={require("../assets/search.png")}
                        style={styles.searchIcon}
                      />
                    </View>


                    <View style={styles.dateRangeContainer}>
  <TouchableOpacity
    style={styles.dateInput}
    onPress={() => setShowPicker({ type: 'from', show: true })}
  >
    <Text style={styles.dateText}>
      {fromDate ? `From: ${fromDate}` : 'Select From Date'}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.dateInput}
    onPress={() => setShowPicker({ type: 'to', show: true })}
  >
    <Text style={styles.dateText}>
      {toDate ? `To: ${toDate}` : 'Select To Date'}
    </Text>
  </TouchableOpacity>
</View>

{showPicker.show && (
  <DateTimePicker
    value={new Date()}
    mode="date"
    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
    onChange={handleDateChange}
  />
)}



                    

                    <SafeAreaView style={styles.container}>
      <ScrollView horizontal>
        <View>
          {renderHeader()}
          <FlatList
            data={paginatedAppointments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No appointments found.</Text>
            }
          />




        </View>
      </ScrollView>

      <View style={styles.paginationContainer}>
  <TouchableOpacity
    onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
    style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
  >
    <Text style={styles.pageButtonText}>Previous</Text>
  </TouchableOpacity>

  <Text style={styles.pageNumber}>{`Page ${currentPage} of ${totalPages}`}</Text>

  <TouchableOpacity
    onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
    style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
  >
    <Text style={styles.pageButtonText}>Next</Text>
  </TouchableOpacity>
</View>
    </SafeAreaView>
    </>
    
  );
};

export default DoctorAppointmentList;

const styles = StyleSheet.create({

  toolbar: {
    backgroundColor: "#6495ED",
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
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
  
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: "#333",
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: "#999",
  },
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
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
    backgroundColor: '#6495ED',
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
  backgroundColor: '#f5f5f5',
},
pageButton: {
  backgroundColor: '#6495ED',
  paddingVertical: 8,
  paddingHorizontal: 16,
  marginHorizontal: 8,
  borderRadius: 5,
},
disabledButton: {
  backgroundColor: '#ccc',
},
pageButtonText: {
  color: 'white',
  fontWeight: 'bold',
},
pageNumber: {
  fontSize: 16,
  fontWeight: '600',
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


});
