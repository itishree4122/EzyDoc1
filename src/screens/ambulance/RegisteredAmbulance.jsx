import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, RefreshControl, TextInput,Modal } from 'react-native';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import { useNavigation, useIsFocused  } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

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
  const [refreshing, setRefreshing] = useState(false);
const [editMode, setEditMode] = useState(false);
const [editFields, setEditFields] = useState({
  phone_number: '',
  whatsapp_number: '',
  service_area: [],
});
const [serviceAreaInput, setServiceAreaInput] = useState('');
const isFocused = useIsFocused();
  const fetchAmbulances = async (isRefreshing = false) => {
  if (isRefreshing) {
    setRefreshing(true);
  } else {
    setLoading(true);
  }
  
  const token = await getToken();
  if (!token) {
    Alert.alert('Error', 'Access token not found');
    setRefreshing(false);
    setLoading(false);
    return;
  }

  try {
    const response = await fetchWithAuth(`${BASE_URL}/ambulance/status/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    console.log('Ambulance data:', data);
    const allAmbulances = data.ambulances || [];

    const filtered = ambulanceId
      ? allAmbulances.filter((item) => item.user?.toString() === ambulanceId.toString())
      : allAmbulances;

    setAmbulances(filtered);
    setFilteredAmbulances(filtered);
  } catch (error) {
    Alert.alert('Error', 'Something went wrong while fetching data');
  } finally {
    setRefreshing(false);
    setLoading(false);
  }
};

// Update your useEffect to use the modified fetchAmbulances
useEffect(() => {
  fetchAmbulances();
}, []);

useEffect(() => {
  if (isFocused) {
    fetchAmbulances();
  }
}, [isFocused]);
// Add this refresh handler
const handleRefresh = useCallback(() => {
  fetchAmbulances(true);
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
            // const response = await fetch(
            const response = await fetchWithAuth(
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
              fetchAmbulances();
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
    setEditMode(false);
  setEditFields({
    phone_number: item.phone_number || '',
    whatsapp_number: item.whatsapp_number || '',
    // service_area: item.service_area || '',
        // service_area: item.service_area ? item.service_area.split(',').map(s => s.trim()) : [],
        service_area: typeof item.service_area === 'string'
    ? item.service_area.split(',').map(s => s.trim()).filter(Boolean)
    : Array.isArray(item.service_area)
      ? item.service_area
      : [],

  });
  setServiceAreaInput('');

  };

 const handleToggleStatus = async (ambulance) => {
  try {
    const token = await getToken();
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    const newStatus = !ambulance.active;
    const response = await fetchWithAuth(
      `${BASE_URL}/ambulance/toggle/${ambulance.user}/${ambulance.vehicle_number}/`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus ? 'active' : 'inactive'
        })
      }
    );

    const result = await response.json();

    if (response.ok) {
      // Update local state only after successful API call
      const updatedAmbulances = ambulances.map(a => 
        a.vehicle_number === ambulance.vehicle_number 
          ? {...a, active: newStatus} 
          : a
      );
      
      setAmbulances(updatedAmbulances);
      applyFilters(searchText, selectedStatus);

      Alert.alert('Success', result.message);
      fetchAmbulances();

    } else {
      Alert.alert('Error', result.message || 'Failed to update status');
    }
  } catch (error) {
    console.error('Toggle status error:', error);
    Alert.alert('Error', 'Failed to update ambulance status');
  }
};

const handleEdit = (item) => {
    navigation.navigate('AmbulanceRegister', { 
      ambulanceId,
      editData: item,
      isEdit: true
    });
  };

  const closeModal = () => setSelectedAmbulance(null);

   return (
     <View style={styles.container}>
    {/* Header */}
    {/* Header */}
<View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
    <Icon name="arrow-back" size={24} color="#fff" />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Registered Ambulances</Text>
  
  <View style={styles.headerRightButtons}>
    {/* <TouchableOpacity 
      onPress={() => navigation.navigate('AmbulanceRegister', { ambulanceId })}
      style={styles.addButtonHeader}
    >
      <Icon name="add" size={24} color="#fff" />
    </TouchableOpacity> */}
    <TouchableOpacity onPress={toggleSearch} style={styles.searchButton}>
      <Icon name={searchVisible ? "close" : "search"} size={24} color="#fff" />
    </TouchableOpacity>
  </View>
</View>

    {/* Search Bar */}
    {searchVisible && (
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ambulances..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>
    )}

    {/* Status Filter - Fixed Height Container */}
    <View style={styles.filterWrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {['all', 'active', 'inactive'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterPill,
              selectedStatus === status && styles.filterPillActive
            ]}
            onPress={() => handleStatusChange(status)}
          >
            <Text style={[
              styles.filterText,
              selectedStatus === status && styles.filterTextActive
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>

    {/* Sorting Options - Fixed Height */}
    <View style={styles.sortContainer}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      <TouchableOpacity
        style={styles.sortOption}
        onPress={() => {
          const sorted = [...filteredAmbulances].sort((a, b) =>
            a.service_name?.localeCompare(b.service_name)
          );
          setFilteredAmbulances(sorted);
        }}
      >
        <Text style={styles.sortText}>Name (A-Z)</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.sortOption}
        onPress={() => {
          const reversed = [...filteredAmbulances].reverse();
          setFilteredAmbulances(reversed);
        }}
      >
        <Text style={styles.sortText}>Newest First</Text>
      </TouchableOpacity>
    </View>

    {/* Content Area - Takes remaining space */}
    <View style={styles.contentArea}>
  {loading ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1c78f2" />
      <Text style={styles.loadingText}>Loading ambulances...</Text>
    </View>
  ) : filteredAmbulances.length > 0 ? (
    <FlatList
      data={filteredAmbulances}
      keyExtractor={(item, index) => `${item.user}-${item.vehicle_number}-${index}`}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#1c78f2']}
          tintColor="#1c78f2"
        />
      }
      renderItem={({ item }) => (
    <TouchableOpacity 
      style={[
        styles.ambulanceCard,
        item.active ? styles.cardActive : styles.cardInactive
      ]}
      onPress={() => handleCardPress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot,
            item.active ? styles.activeDot : styles.inactiveDot
          ]} />
          <Text style={styles.statusText}>
            {item.active ? 'Active' : 'Inactive'}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          
          <TouchableOpacity
            onPress={() => handleToggleStatus(item)}
            style={[
              styles.statusButton,
              item.active ? styles.inactiveButton : styles.activeButton
            ]}
          >
            <Text style={styles.statusButtonText}>
              {item.active ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
            onPress={() => handleEdit(item)}
            style={styles.editButton}
          >
            <Icon name="edit" size={20} color="#1c78f2" />
          </TouchableOpacity> */}
          <TouchableOpacity
            onPress={() => handleDelete(item.user, item.vehicle_number)}
            style={styles.deleteButton}
          >
            <Icon name="delete" size={20} color="#FF5252" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <Icon name="local-hospital" size={20} color="#1c78f2" />
          <Text style={styles.serviceName} numberOfLines={1}>
            {item.service_name}
          </Text>
        </View>
        
        <View style={styles.cardRow}>
          <Icon name="directions-car" size={20} color="#1c78f2" />
          <Text style={styles.vehicleNumber}>{item.vehicle_number}</Text>
        </View>
        
        <View style={styles.cardRow}>
          <Icon name="location-on" size={20} color="#1c78f2" />
          <Text style={styles.locationText} numberOfLines={1}>
            {/* {item.service_area || 'Not specified'} */}
            {item.service_area
    ? (Array.isArray(item.service_area)
        ? item.service_area.join(', ')
        : item.service_area)
    : 'Not specified'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>View details</Text>
        <Icon name="chevron-right" size={20} color="#1c78f2" />
      </View>
    </TouchableOpacity>
  )}
/>
      ) : (
        <View style={styles.emptyState}>
      <Icon name="directions-car" size={60} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>
        {selectedStatus === 'all' 
          ? 'No ambulances found' 
          : selectedStatus === 'active' 
            ? 'No active ambulances' 
            : 'No inactive ambulances'
        }
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedStatus === 'all' 
          ? 'Register your first ambulance to get started'
          : selectedStatus === 'active'
            ? 'All ambulances are currently inactive'
            : 'All ambulances are currently active'
        }
      </Text>
      
      {/* Show register button only when viewing all ambulances */}
      {selectedStatus === 'all' && !searchText && (
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => navigation.navigate('AmbulanceRegister', { ambulanceId })}
        >
          <Text style={styles.registerButtonText}>+ Register Ambulance</Text>
        </TouchableOpacity>
      )}
    </View>
      )}
    </View>

      {/* Ambulance Details Modal */}
      <Modal visible={!!selectedAmbulance} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedAmbulance?.service_name}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* <ScrollView style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Icon name="directions-car" size={20} color="#1c78f2" style={styles.detailIcon} />
                <View>
                  <Text style={styles.detailLabel}>Vehicle Number</Text>
                  <Text style={styles.detailValue}>{selectedAmbulance?.vehicle_number}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Icon name="phone" size={20} color="#1c78f2" style={styles.detailIcon} />
                <View>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>{selectedAmbulance?.phone_number || 'Not provided'}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Icon name="whatsapp" size={20} color="#1c78f2" style={styles.detailIcon} />
                <View>
                  <Text style={styles.detailLabel}>WhatsApp</Text>
                  <Text style={styles.detailValue}>{selectedAmbulance?.whatsapp_number || 'Not provided'}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Icon name="location-on" size={20} color="#1c78f2" style={styles.detailIcon} />
                <View>
                  <Text style={styles.detailLabel}>Service Area</Text>
                  <Text style={styles.detailValue}>
                    {selectedAmbulance?.service_area?.split(',').join('\n') || 'Not specified'}
                  </Text>
                </View>
              </View> */}
              <ScrollView style={styles.modalBody}>
  <View style={styles.detailRow}>
    <MCIcon name="car-info" size={20} color="#6D4C41" style={styles.detailIcon} />
    <View>
      <Text style={styles.detailLabel}>Vehicle Number</Text>
      <Text style={styles.detailValue}>{selectedAmbulance?.vehicle_number}</Text>
    </View>
  </View>

  {/* Editable fields */}
  <View style={styles.detailRow}>
    <MCIcon name="phone" size={20} color="#1E88E5" style={styles.detailIcon} />
    <View style={{flex: 1}}>
      <Text style={styles.detailLabel}>Phone Number</Text>
      {editMode ? (
  <TextInput
    style={styles.inputBox}
    placeholder="Enter phone number"
    placeholderTextColor="#aaa"
    value={editFields.phone_number}
    onChangeText={t => setEditFields(f => ({ ...f, phone_number: t }))}
    keyboardType="phone-pad"
  />
) : (
  <Text style={styles.detailValue}>{selectedAmbulance?.phone_number || 'Not provided'}</Text>
)}
    </View>
  </View>

  <View style={styles.detailRow}>
    {/* <Icon name="whatsapp" size={20} color="#1c78f2" style={styles.detailIcon} /> */}
    <MCIcon name="whatsapp" size={20} color="#25D366" style={styles.detailIcon} />

    <View style={{flex: 1}}>
      <Text style={styles.detailLabel}>WhatsApp</Text>
      {editMode ? (
  <TextInput
    style={styles.inputBox}
    placeholder="Enter WhatsApp number"
    placeholderTextColor="#aaa"
    value={editFields.whatsapp_number}
    onChangeText={t => setEditFields(f => ({ ...f, whatsapp_number: t }))}
    keyboardType="phone-pad"
  />
) : (
  <Text style={styles.detailValue}>{selectedAmbulance?.whatsapp_number || 'Not provided'}</Text>
)}
    </View>
  </View>

  {/* <View style={styles.detailRow}>
    <Icon name="location-on" size={20} color="#1c78f2" style={styles.detailIcon} />
    <View style={{flex: 1}}>
      <Text style={styles.detailLabel}>Service Area</Text>
      {editMode ? (
        <TextInput
          style={styles.detailValue}
          value={editFields.service_area}
          onChangeText={t => setEditFields(f => ({ ...f, service_area: t }))}
          multiline
        />
      ) : (
        <Text style={styles.detailValue}>
          {selectedAmbulance?.service_area || 'Not specified'}
        </Text>
      )}
    </View>
  </View> */}
  <View style={styles.detailRow}>
  <MCIcon name="map-marker-radius" size={20} color="#1c78f2" style={styles.detailIcon} />
  <View style={{flex: 1}}>
    <Text style={styles.detailLabel}>Service Area</Text>
    {editMode ? (
      <>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <TextInput
            // style={[styles.detailValue, { flex: 1 }]}
            style={[styles.inputBox, { flex: 1 }]}
            placeholder="Add service area"
            placeholderTextColor="#aaa"
            value={serviceAreaInput}
            onChangeText={setServiceAreaInput}
            onSubmitEditing={() => {
              // if (serviceAreaInput.trim() && editFields.service_area.length < 5) {
                setEditFields(f => ({
                  ...f,
                  service_area: [...f.service_area, serviceAreaInput.trim()],
                }));
                setServiceAreaInput('');
              // }
            }}
            returnKeyType="done"
          />
          {/* {serviceAreaInput.trim() && editFields.service_area.length < 5 && ( */}
          {serviceAreaInput.trim() && (
            <TouchableOpacity
              style={{ marginLeft: 8 }}
              onPress={() => {
                // if (serviceAreaInput.trim() && editFields.service_area.length < 5) {
                if (serviceAreaInput.trim()) {
                  setEditFields(f => ({
                    ...f,
                    service_area: [...f.service_area, serviceAreaInput.trim()],
                  }));
                  setServiceAreaInput('');
                }
              }}
            >
              <MCIcon name="plus-circle-outline" size={24} color="#1c78f2" />
            </TouchableOpacity>
          )}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {editFields.service_area.map((area, idx) => (
            <View key={idx} style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#e8f4fc',
              borderRadius: 16,
              paddingVertical: 6,
              paddingHorizontal: 12,
              marginRight: 8,
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 13, color: '#2980b9', marginRight: 6 }}>{area}</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditFields(f => ({
                    ...f,
                    service_area: f.service_area.filter((_, i) => i !== idx),
                  }));
                }}
              >
                <MCIcon name="close-circle-outline" size={18} color="#f87171" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        {/* <Text style={{ fontSize: 12, color: '#7f8c8d', marginTop: 2 }}>
          {editFields.service_area.length}/5
        </Text> */}
      </>
    ) : (
      // <Text style={styles.detailValue}>
      //   {selectedAmbulance?.service_area
      //     ? selectedAmbulance.service_area.split(',').map(s => s.trim()).join(', ')
      //     : 'Not specified'}
      // </Text>
      <Text style={styles.detailValue}>
  {selectedAmbulance?.service_area
    ? (Array.isArray(selectedAmbulance.service_area)
        ? selectedAmbulance.service_area.join(', ')
        : selectedAmbulance.service_area)
    : 'Not specified'}
</Text>
    )}
  </View>
</View>

              <View style={styles.detailRow}>
                <MCIcon name="alert-circle-outline" size={20} color="#1c78f2" style={styles.detailIcon} />
                <View>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[
                    styles.detailValue,
                    selectedAmbulance?.active ? styles.activeStatus : styles.inactiveStatus
                  ]}>
                    {selectedAmbulance?.active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                
              </View>
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16 }}>
  {editMode ? (
    <>
      <TouchableOpacity
        style={[styles.modalButton, { backgroundColor: '#ccc', marginRight: 10 }]}
        onPress={() => setEditMode(false)}
      >
        <Text style={styles.modalButtonText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modalButton, { backgroundColor: '#1c78f2' }]}
        onPress={async () => {
          // PATCH API call
          try {
            const token = await getToken();
            const response = await fetchWithAuth(
              `${BASE_URL}/ambulance/update/${selectedAmbulance.user}/${selectedAmbulance.vehicle_number}/`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                // body: JSON.stringify(editFields),
                body: JSON.stringify({
  ...editFields,
  service_area: editFields.service_area.join(', '),
}),
              }
            );
            const result = await response.json();
            if (response.ok) {
              Alert.alert('Success', 'Ambulance updated');
              // Update local state
              const updated = ambulances.map(a =>
                a.user === selectedAmbulance.user && a.vehicle_number === selectedAmbulance.vehicle_number
                  ? { ...a, ...editFields, service_area: editFields.service_area.join(', ') }
                  : a
              );
              setAmbulances(updated);
              setFilteredAmbulances(updated);
              setSelectedAmbulance({ ...selectedAmbulance, ...editFields, service_area: editFields.service_area.join(', ') 
 });
              setEditMode(false);
              fetchAmbulances();
            } else {
              Alert.alert('Error', result.message || 'Update failed');
            }
          } catch (e) {
            Alert.alert('Error', 'Failed to update ambulance');
          }
        }}
      >
        <Text style={styles.modalButtonText}>Save</Text>
      </TouchableOpacity>
    </>
  ) : (
    <TouchableOpacity
      style={[styles.modalButton, { backgroundColor: '#1c78f2' }]}
      onPress={() => setEditMode(true)}
    >
      <Text style={styles.modalButtonText}>Edit</Text>
    </TouchableOpacity>
  )}
  </View>
            {/* <TouchableOpacity 
              style={styles.modalButton}
              onPress={closeModal}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity> */}

          </View>
          
        </View>
      </Modal>

      {/* Floating Action Button */}
{filteredAmbulances.length > 0 && (
  <TouchableOpacity
    style={styles.fab}
    onPress={() => navigation.navigate('AmbulanceRegister', { ambulanceId })}
  >
    <Icon name="add" size={28} color="#fff" />
  </TouchableOpacity>
)}
    </View>
  );
};

export default RegisteredAmbulance;



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#1c78f2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingTop: 50,
    elevation: 3,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  searchButton: {
    marginLeft: 15,
  },
  searchContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    margin: 15,
    borderRadius: 10,
    elevation: 2,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#333',
    fontSize: 16,
  },
 filterContainer: {
  paddingHorizontal: 15,
  paddingVertical: 8,
  height: 50, // Fixed height for the container
  alignItems: 'center', // Vertically center items
},
filterPill: {
  backgroundColor: '#fff',
  borderRadius: 20,
  paddingHorizontal: 20,
  paddingVertical: 10, // Increased vertical padding
  marginRight: 10,
  borderWidth: 1,
  borderColor: '#E0E0E0',
  height: 36, // Fixed height for consistent sizing
  justifyContent: 'center', // Center text vertically
  alignItems: 'center', // Center text horizontally
  minWidth: 80, // Minimum width for better touch targets
},
filterPillActive: {
  backgroundColor: '#1c78f2',
  borderColor: '#1c78f2',
},
filterText: {
  color: '#666',
  fontSize: 14,
  fontWeight: '500',
  textAlign: 'center', // Ensure text is centered
},
filterTextActive: {
  color: '#fff',
},
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  sortLabel: {
    color: '#666',
    fontSize: 14,
    marginRight: 10,
  },
  sortOption: {
    backgroundColor: '#EDF2F7',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 10,
  },
  sortText: {
    color: '#1c78f2',
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  listContainer: {
    padding: 15,
  },
  ambulanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
  
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardActive: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  cardInactive: {
    borderLeftWidth: 5,
    borderLeftColor: '#F44336',
  },
  cardHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  activeDot: {
    backgroundColor: '#4CAF50',
  },
  inactiveDot: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
 actionButtons: {
  flexDirection: 'row',
  alignItems: 'center',
},
statusButton: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 15,
  marginRight: 10,
},
activeButton: {
  backgroundColor: '#4CAF50', // Green for activate
},
inactiveButton: {
  backgroundColor: '#F44336', // Red for deactivate
},
statusButtonText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: '500',
},
  deleteButton: {
    padding: 5,
  },
  editButton: {
    padding: 5,
    marginRight: 5,
  },
  cardContent: {
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  vehicleNumber: {
    fontSize: 15,
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
  },
  viewDetailsText: {
    color: '#1c78f2',
    fontSize: 14,
    marginRight: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: '#1c78f2',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  // modalBody: {
  //   padding: 20,
  // },
  modalBody: {
    padding: 20,
    backgroundColor: '#f6fafd',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  detailIcon: {
    marginRight: 15,
    marginTop: 3,
  },
  detailLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  activeStatus: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  inactiveStatus: {
    color: '#F44336',
    fontWeight: '500',
  },
  modalButton: {
    backgroundColor: '#1c78f2',
    padding: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
// 
filterWrapper: {
    height: 60, // Fixed height for filter section
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  filterScrollContent: {
    alignItems: 'center',
    paddingRight: 15,
  },
  filterPill: {
    height: 36, // Fixed height
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    marginRight: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterPillActive: {
    backgroundColor: '#1c78f2',
    borderColor: '#1c78f2',
  },
  sortContainer: {
    height: 50, // Fixed height
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contentArea: {
    flex: 1, // Takes remaining space
  },
  // 
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonHeader: {
    marginRight: 15,
  },
  // 
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    backgroundColor: '#1c78f2',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  inputBox: {
  borderWidth: 1,
  borderColor: '#d0d7de',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 8,
  fontSize: 16,
  color: '#222',
  backgroundColor: '#f9fbfd',
  marginTop: 2,
  marginBottom: 2,
},
inputBoxMultiline: {
  minHeight: 40,
  textAlignVertical: 'top',
},
inputBoxError: {
  borderColor: '#F44336',
},
});
