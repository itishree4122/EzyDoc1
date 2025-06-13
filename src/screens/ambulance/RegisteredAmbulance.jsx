import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Image, TextInput,Modal } from 'react-native';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import { useNavigation } from '@react-navigation/native';


const RegisteredAmbulance = ({ route }) => {
  const { ambulanceId } = route.params || {};
  const [ambulances, setAmbulances] = useState([]);
  const [filteredAmbulances, setFilteredAmbulances] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);

  const fetchAmbulances = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Error', 'Access token not found');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/ambulance/status/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      const allAmbulances = data.ambulances || [];

      const filtered = ambulanceId
        ? allAmbulances.filter((item) => item.user?.toString() === ambulanceId.toString())
        : allAmbulances;

      setAmbulances(filtered);
      setFilteredAmbulances(filtered);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const handleSearch = (text) => {
    setSearchText(text);
    applyFilters(text, selectedStatus);
  };

  const applyFilters = (text, status) => {
    const filtered = ambulances.filter((item) => {
      const matchesSearch =
        item.service_name?.toLowerCase().includes(text.toLowerCase()) ||
        item.vehicle_number?.toLowerCase().includes(text.toLowerCase()) ||
        item.service_area?.includes(text);

      const matchesStatus = status === 'all' || (status === 'active' ? item.active : !item.active);
      return matchesSearch && matchesStatus;
    });

    setFilteredAmbulances(filtered);
  };

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) setSearchText('');
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    applyFilters(searchText, status);
  };

  const handleDelete = async (userId, vehicleNumber) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this ambulance?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const token = await getToken();
          try {
            const response = await fetch(
              `${BASE_URL}/ambulance/delete/${userId}/${vehicleNumber}/`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            const result = await response.json();
            if (response.ok) {
              Alert.alert('Success', result.message || 'Deleted successfully');
              const updated = ambulances.filter(
                (item) => item.user !== userId || item.vehicle_number !== vehicleNumber
              );
              setAmbulances(updated);
              applyFilters(searchText, selectedStatus);
            } else {
              Alert.alert('Error', result.message || 'Delete failed');
            }
          } catch (err) {
            Alert.alert('Error', 'Something went wrong during deletion');
          }
        },
      },
    ]);
  };

  const handleCardPress = (item) => {
    setSelectedAmbulance(item);
  };

  const closeModal = () => setSelectedAmbulance(null);

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/left-arrow.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.title}>Registered Ambulance</Text>
        <TouchableOpacity onPress={toggleSearch}>
          <Image source={require('../assets/search.png')} style={styles.searchIcon} />
        </TouchableOpacity>
      </View>

      
                {searchVisible && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by service name, vehicle number..."
            value={searchText}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
        </View>
      )}

      {/* Filter Buttons */}
     {/* Filter Container Below Toolbar */}
  <View style={styles.segmentWrapper}>
    {['all', 'active', 'inactive'].map((status, index) => (
      <React.Fragment key={status}>
        <TouchableOpacity
          style={styles.segmentItem}
          onPress={() => handleStatusChange(status)}
        >
          <Text
            style={[
              styles.segmentText,
              selectedStatus === status && styles.segmentTextActive,
            ]}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </TouchableOpacity>
        {index < 2 && <View style={styles.segmentDivider} />}
      </React.Fragment>
    ))}
  </View>
    {loading ? (
  <ActivityIndicator size="large" color="#1c78f2" style={{ marginTop: 20 }} />
) : (
  <>
    {/* Sorting Controls */}
    <View style={{ flexDirection: 'row', justifyContent:'flex-start', marginBottom: 10, marginTop: 50, marginLeft: 10}}>
      <TouchableOpacity
        onPress={() => {
          const sorted = [...filteredAmbulances].sort((a, b) =>
            a.service_name?.localeCompare(b.service_name)
          );
          setFilteredAmbulances(sorted);
        }}
      >
        <Text style={{ fontSize: 14, color: '#1c78f2', marginHorizontal: 10 }}>Sort A-Z</Text>
      </TouchableOpacity>

      <Text style={{ color: '#aaa', fontSize: 16 }}>|</Text>

      <TouchableOpacity
        onPress={() => {
          const reversed = [...filteredAmbulances].reverse();
          setFilteredAmbulances(reversed);
        }}
      >
        <Text style={{ fontSize: 14, color: '#1c78f2', marginHorizontal: 10 }}>Newest First</Text>
      </TouchableOpacity>
    </View>

    {/* Ambulance List */}
    <FlatList
      data={filteredAmbulances}
      keyExtractor={(item, index) => `${item.user}-${item.vehicle_number}-${index}`}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleCardPress(item)}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#888' }}>Name</Text>
            <Text style={styles.serviceName}>{item.service_name}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#888' }}>Vehicle No</Text>
            <Text style={styles.vehicleNumber}>{item.vehicle_number}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#888' }}>Action</Text>
            <TouchableOpacity
              style={styles.deleteIconWrapper}
              onPress={() => handleDelete(item.user, item.vehicle_number)}
            >
              <Image source={require('../assets/doctor/bin.png')} style={styles.icon} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listWrapper}
    />
  </>
)}

      {/* Modal */}
   <Modal visible={!!selectedAmbulance} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      {/* Modal Header */}
      <Text style={styles.modalHeader}>{selectedAmbulance?.service_name}</Text>

      {/* Vehicle Number */}
      <View style={{ marginBottom: 10, alignItems: 'center' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>Vehicle Number</Text>
        <Text style={{ color: '#666', fontSize: 15 }}>{selectedAmbulance?.vehicle_number}</Text>
      </View>

      {/* Phone Number */}
      <View style={{ marginBottom: 10, alignItems: 'center' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>Phone Number</Text>
        <Text style={{ color: '#666', fontSize: 15 }}>{selectedAmbulance?.phone_number}</Text>
      </View>

      {/* WhatsApp */}
      <View style={{ marginBottom: 10, alignItems: 'center' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>WhatsApp</Text>
        <Text style={{ color: '#666', fontSize: 15 }}>{selectedAmbulance?.whatsapp_number}</Text>
      </View>

      {/* Area(s) */}
      <View style={{ marginBottom: 10, alignItems: 'center' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>Area(s)</Text>
        <Text style={{ color: '#666', fontSize: 15, textAlign: 'center' }}>
          {selectedAmbulance?.service_area?.split(',').join('\n')}
        </Text>
      </View>

      {/* Status */}
      <View style={{ marginBottom: 10, alignItems: 'center' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>Status</Text>
        <Text style={{ color: '#666', fontSize: 15 }}>
          {selectedAmbulance?.active ? 'Active' : 'Inactive'}
        </Text>
      </View>

      {/* Close Button */}
      <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
        <Text style={{ color: '#fff' }}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    </View>
  );
};

export default RegisteredAmbulance;



const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingTop: 50, // Adjusted for status bar
  },
  backIcon: {
    width: 22,
    height: 22,
    tintColor: '#000',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#000',
  },
  searchContainer: {
  backgroundColor: '#f0f0f0',
  paddingHorizontal: 20,
  paddingVertical: 8,
},

searchInput: {
  backgroundColor: '#fff',
  paddingHorizontal: 10,
  paddingVertical: 8,
  borderRadius: 8,
  borderColor: '#ccc',
  borderWidth: 1,
  fontSize: 16,
},
  segmentWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
    height: 50,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  segmentText: {
    fontSize: 14,
    color: '#666',
  },
  segmentTextActive: {
    fontWeight: 'bold',
    color: '#1c78f2',
  },
  segmentDivider: {
    width: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  listWrapper: {
    paddingBottom: 30,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: '#fff',
    marginVertical: 8,
    padding: 15,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  vehicleNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    marginTop: 4,
  },
  deleteIconWrapper: {
    backgroundColor: '#f44336',
    padding: 6,
    borderRadius: 20,
    marginTop: 5,
  },
  icon: {
    width: 16,
    height: 16,
    tintColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1c78f2',
    marginBottom: 15,
  },
  modalClose: {
    backgroundColor: '#1c78f2',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginTop: 20,
  },

});
