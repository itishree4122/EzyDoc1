import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity,
  ActivityIndicator, Image, TextInput, Modal
} from 'react-native';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import { useNavigation } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth';

const LabTestList = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
const [selectedReports, setSelectedReports] = useState([]);


  const fetchLabAppointments = async () => {
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // const response = await fetch(`${BASE_URL}/labs/lab-tests/`, {
      const response = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      console.log('Fetched data:', data);

      if (Array.isArray(data)) {
        setAppointments(data);
        setFilteredAppointments(data);
      } else {
        console.error("Unexpected response format:", data);
        setAppointments([]);
        setFilteredAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching:', error);
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [filter, searchQuery, appointments]);

  const filterAppointments = () => {
    let result = [...appointments];

    if (filter !== 'ALL') {
      result = result.filter((a) => a.status.toLowerCase() === filter.toLowerCase());
    }

    if (searchQuery.trim() !== '') {
      result = result.filter((a) =>
        a.test_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.lab_profile?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAppointments(result);
  };

  // if (loading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  return (
    <ScrollView style={styles.container}>
      {/* Toolbar */}
       {/* Toolbar with Back, Title, Search */}
  <View style={styles.toolbar}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
      <Image
        source={require('../assets/UserProfile/back-arrow.png')}
        style={styles.backIcon}
      />
    </TouchableOpacity>

    <Text style={styles.toolbarTitle}>Lab Tests</Text>

    <TouchableOpacity onPress={() => setShowSearchInput(prev => !prev)} style={styles.iconButton}>
      <Image
        source={require('../assets/search.png')}
        style={styles.searchIcon}
      />
    </TouchableOpacity>
  </View>

  {/* Search Input shown only if toggled */}
  {showSearchInput && (
    <View style={styles.searchContainer}>
      <TextInput
        placeholder="Search by test type or lab profile..."
        placeholderTextColor="#888"
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoFocus
      />
    </View>
  )}


      {/* Filter Buttons */}
      <View style={styles.buttonContainer}>
        {['ALL', 'SCHEDULED', 'COMPLETED'].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setFilter(type)}
            style={[
              styles.filterButton,
              filter === type && styles.activeFilterButton
            ]}
          >
            <Text style={[
              styles.filterText,
              filter === type && styles.activeFilterText
            ]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

              {loading && (
  <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 16, color: '#555' }}>
    Loading data...
  </Text>
)}

      {/* Appointment Cards */}
      {Array.isArray(filteredAppointments) && filteredAppointments.length > 0 ? (
        filteredAppointments.map((appt) => (
          <View key={appt.id} style={styles.card}>
            {/* Header section */}
            <View style={styles.cardHeader}>
              <View style={styles.statusBar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{appt.patient_name} ({appt.registration_number})</Text>
                <Text style={styles.profile}>{appt.lab_profile}</Text>
              </View>
            </View>

            {/* Patient info */}
            <View style={styles.section}>
              <View style={styles.detailsRow}>
                <Text style={styles.label}>Gender:</Text>
                <Text style={styles.value}>{appt.patient.gender}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.label}>Age:</Text>
                <Text style={styles.value}>{appt.patient.age}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>{appt.patient.address}</Text>
              </View>
            </View>

            {/* Test info */}
            <View style={styles.section}>
              <View style={styles.detailsContainer}>
                  <View style={styles.detailsRow}>
                    <Text style={styles.label}>ID:</Text>
                    <Text style={styles.value}>{appt.lab_profile_code}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.label}>Clinic Name:</Text>
                    <Text style={styles.value}>{appt.lab_profile_name}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.label}>Test Type:</Text>
                    <Text style={styles.value}>{appt.test_type}</Text>
                  </View>
                </View>
              <View style={styles.detailsRow}>
                <Text style={styles.label}>Scheduled:</Text>
                <Text style={styles.value}>
                  {new Date(appt.scheduled_date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.label}>Status:</Text>
                <Text style={[styles.value, { textTransform: 'capitalize', fontWeight: 'bold', color: '#1c78f2' }]}>{appt.status}</Text>
              </View>
            </View>

            {/* Reports */}
            <View style={styles.section}>
            <Text style={styles.reportHeader}>Reports:</Text>
            {appt.reports.length === 0 ? (
                <Text style={styles.noReport}>No Reports</Text>
            ) : (
                <TouchableOpacity
                onPress={() => {
                    setSelectedReports(appt.reports);
                    setModalVisible(true);
                }}
                >
                <Text style={styles.link}>View Reports ({appt.reports.length})</Text>
                </TouchableOpacity>
            )}
            </View>

          </View>
        ))
      ) : (
        !loading && (
    <Text style={styles.noResults}>No Appointments Found</Text>
  )
      )}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
        >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Lab Reports</Text>
            <ScrollView style={{ maxHeight: 300 }}>
                {selectedReports.map((report) => (
                <TouchableOpacity
                    key={report.id}
                    onPress={() => Linking.openURL(report.file)}
                >
                    <Text style={styles.link}>• {report.description}</Text>
                </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
            >
                <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            </View>
        </View>
        </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f1f2f3',
  },
  toolbar: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#fff',
  height: 60,
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#ccc',
},

toolbarTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
  textAlign: 'center',
  flex: 1,
},

iconButton: {
  padding: 6,
},

backIcon: {
  width: 22,
  height: 22,
  resizeMode: 'contain',
},

searchIcon: {
  width: 20,
  height: 20,
  tintColor: '#333',
  resizeMode: 'contain',
},

searchContainer: {
  backgroundColor: 'transparent',
  paddingHorizontal: 16,
  paddingVertical: 8,
},

searchInput: {
  height: 40,
  borderColor: '#ccc',
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 10,
  fontSize: 16,
  backgroundColor: '#f2f2f2',
},
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    marginTop: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderColor: '#1c78f2',
    borderWidth: 1,
    borderRadius: 20,
  },
  activeFilterButton: {
    backgroundColor: '#1c78f2',
  },
  filterText: {
    fontWeight: 'bold',
    color: '#333',
  },
  activeFilterText: {
    color: 'white',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBar: {
    width: 6,
    height: '100%',
    backgroundColor: '#1c78f2',
    borderRadius: 4,
    marginRight: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1c78f2',
  },
  profile: {
    fontSize: 15,
    marginBottom: 5,
    fontWeight: '600',
    color: '#444',
  },
  section: {
    marginTop: 8,
    marginBottom: 6,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  detailsContainer: {
  marginBottom: 8,
},
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
    width: 90,
    color: '#555',
  },
  value: {
    color: '#000',
  },
  reportHeader: {
    marginBottom: 4,
    fontWeight: 'bold',
    color: '#333',
  },
  link: {
    color: '#1c78f2',
    textDecorationLine: 'underline',
    marginVertical: 2,
  },
  noReport: {
    color: '#777',
    fontStyle: 'italic',
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContainer: {
  width: '85%',
  backgroundColor: '#fff',
  padding: 20,
  borderRadius: 12,
  elevation: 5,
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 12,
  color: '#1c78f2',
},
modalCloseButton: {
  marginTop: 20,
  alignSelf: 'flex-end',
  paddingVertical: 6,
  paddingHorizontal: 14,
  backgroundColor: '#1c78f2',
  borderRadius: 8,
},
modalCloseText: {
  color: '#fff',
  fontWeight: 'bold',
},
});

export default LabTestList;
