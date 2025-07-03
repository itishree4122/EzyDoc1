import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import { useNavigation } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Icon from 'react-native-vector-icons/FontAwesome';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const ITEMS_PER_PAGE = 10;

const RegisteredAmbulanceList = () => {
  const [users, setUsers] = useState([]); // Each user has vehicles array
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const [showSearch, setShowSearch] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile_number: '',
    password: '',
    confirm_password: '',
    role: 'ambulance',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  // Fetch ambulance users and their vehicles
  const fetchAmbulanceUsers = async () => {
  setLoading(true);
  try {
    // 1. Fetch all ambulance users
    const response = await fetchWithAuth(
      `${BASE_URL}/users/admin/list-users/?role=ambulance`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch ambulance users');
    const usersData = await response.json();

    // 2. Fetch all ambulances ONCE
    const token = await getToken();
    const vehicleRes = await fetchWithAuth(
      `${BASE_URL}/ambulance/status/`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const vehicleData = await vehicleRes.json();
    const allAmbulances = vehicleData.ambulances || [];

    // 3. For each user, filter ambulances by user.user_id
    const usersWithVehicles = usersData.map(user => ({
      ...user,
      vehicles: allAmbulances.filter(a => a.user === user.user_id)
    }));

    // Sort users by created_at (newest first)
    const sorted = [...usersWithVehicles].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    setUsers(sorted);
  } catch (error) {
    Alert.alert('Error', 'Failed to fetch ambulance users');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchAmbulanceUsers();
  }, []);

  // Pagination and search
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      (user.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.mobile_number || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const pageCount = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Toggle active status
  const handleToggleActive = async (user_id, is_active) => {
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/users/admin/user/${user_id}/toggle-active/`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok) throw new Error('Failed to toggle status');
      fetchAmbulanceUsers();
      Alert.alert('Success', `Ambulance user ${is_active ? 'deactivated' : 'activated'} successfully.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  // Delete ambulance user
  const handleDeleteUser = async (user_id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this ambulance user and all their vehicles?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetchWithAuth(
                `${BASE_URL}/users/admin/user/${user_id}/delete/`,
                { method: 'DELETE' }
              );
              if (!response.ok) throw new Error('Failed to delete');
              fetchAmbulanceUsers();
              Alert.alert('Deleted', 'Ambulance user deleted successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete ambulance user');
            }
          },
        },
      ]
    );
  };

  // Add ambulance user
  const handleAddAmbulanceUser = async () => {
    const { first_name, last_name, email, mobile_number, password, confirm_password } = addForm;
    if (!first_name || !last_name || !email || !mobile_number || !password || !confirm_password) {
      Alert.alert('Validation', 'Please fill all fields.');
      return;
    }
    if (password !== confirm_password) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }
    setAddLoading(true);
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/users/admin/add-user/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name,
            last_name,
            email,
            mobile_number,
            password,
            role: 'ambulance',
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Error', data?.detail || 'Failed to add ambulance user');
      } else {
        setShowAddModal(false);
        setAddForm({
          first_name: '',
          last_name: '',
          email: '',
          mobile_number: '',
          password: '',
          confirm_password: '',
          role: 'ambulance',
        });
        fetchAmbulanceUsers();
        Alert.alert('Success', 'Ambulance user registered successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add ambulance user');
    } finally {
      setAddLoading(false);
    }
  };

  // Pagination controls
  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === 'next' && currentPage < pageCount) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Render ambulance user card
  const renderUser = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.first_name} {item.last_name}
        </Text>
        <View style={[styles.statusTag, { backgroundColor: item.is_active ? '#d1fae5' : '#fee2e2' }]}>
          <Text style={[styles.statusText, { color: item.is_active ? '#059669' : '#b91c1c' }]}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Icon name="id-badge" size={16} color="#4B5563" style={styles.icon} />
          <Text style={styles.cardLabel}>ID:</Text>
          <Text style={styles.cardValue}>{item.user_id}</Text>
        </View>
        <View style={styles.cardRow}>
          <Icon name="envelope" size={16} color="#4B5563" style={styles.icon} />
          <Text style={styles.cardLabel}>Email:</Text>
          <Text style={styles.cardValue}>{item.email}</Text>
        </View>
        <View style={styles.cardRow}>
          <Icon name="phone" size={16} color="#4B5563" style={styles.icon} />
          <Text style={styles.cardLabel}>Mobile:</Text>
          <Text style={styles.cardValue}>{item.mobile_number}</Text>
        </View>
      </View>
      {/* Vehicles List */}
      <View style={{ marginTop: 10 }}>
  <Text style={styles.vehicleListTitle}>Ambulance Vehicles:</Text>
  {item.vehicles.length === 0 ? (
    <Text style={styles.noVehicleText}>No vehicles registered.</Text>
  ) : (
    item.vehicles.map((v, idx) => (
      <View key={v.vehicle_number + idx} style={styles.vehicleCard}>
  <View style={styles.vehicleCardTopStrip} />
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
    <Text style={styles.vehicleCardTitle}>{v.service_name || 'Ambulance'}</Text>
    <View style={[
      styles.vehicleStatusPill,
      { backgroundColor: v.active ? '#DCFCE7' : '#FEE2E2' }
    ]}>
      <Text style={[
        styles.vehicleStatusText,
        { color: v.active ? '#15803D' : '#B91C1C' }
      ]}>
        {v.active ? 'ACTIVE' : 'INACTIVE'}
      </Text>
    </View>
  </View>
  <View style={{ padding: 4 }}>
    <View style={styles.vehicleInfoRow}>
      <View style={[styles.vehicleInfoBox, { backgroundColor: '#E0F2FE' }]}>
        <Icon name="ambulance" size={18} color="#1c78f2" style={styles.vehicleInfoIcon} />
        <View>
          <Text style={styles.vehicleInfoLabel}>Vehicle</Text>
          <Text style={styles.vehicleInfoValue}>{v.vehicle_number}</Text>
        </View>
      </View>
      <View style={[styles.vehicleInfoBox, { backgroundColor: '#FEF9C3' }]}>
        <Icon name="phone" size={18} color="#F59E42" style={styles.vehicleInfoIcon} />
        <View>
          <Text style={styles.vehicleInfoLabel}>Phone</Text>
          <Text style={styles.vehicleInfoValue}>{v.phone_number}</Text>
        </View>
      </View>
    </View>
    <View style={styles.vehicleInfoRow}>
      <View style={[styles.vehicleInfoBox, { backgroundColor: '#DCFCE7' }]}>
        <Icon name="whatsapp" size={18} color="#25D366" style={styles.vehicleInfoIcon} />
        <View>
          <Text style={styles.vehicleInfoLabel}>WhatsApp</Text>
          <Text style={styles.vehicleInfoValue}>{v.whatsapp_number}</Text>
        </View>
      </View>
      <View style={[styles.vehicleInfoBox, { backgroundColor: '#F3E8FF' }]}>
        <Icon name="map-marker" size={18} color="#A21CAF" style={styles.vehicleInfoIcon} />
        <View>
          <Text style={styles.vehicleInfoLabel}>Area</Text>
          <Text style={styles.vehicleInfoValue}>{v.service_area}</Text>
        </View>
      </View>
    </View>
  </View>
</View>
    ))
  )}
</View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: item.is_active ? '#f87171' : '#34d399' },
          ]}
          onPress={() => handleToggleActive(item.user_id, item.is_active)}
        >
          <Text style={styles.actionBtnText}>
            {item.is_active ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
          onPress={() => handleDeleteUser(item.user_id)}
        >
          <Text style={styles.actionBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconWrapper}>
          <Image
            source={require("../assets/UserProfile/back-arrow.png")}
            style={styles.toolbarIcon}
          />
        </TouchableOpacity>
        <Text style={styles.toolbarTitle}>Registered Ambulance</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setShowSearch((prev) => !prev)}
            style={styles.iconWrapper}
          >
            <Image
              source={require("../assets/search.png")}
              style={styles.toolbarIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={[styles.iconWrapper, { marginLeft: 8 }]}
          >
            <MCIcon name="ambulance" size={22} color="#1c78f2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search for ambulance users..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1);
            }}
          />
        </View>
      )}

      {/* Add Ambulance User Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Register New Ambulance User</Text>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="#888"
                value={addForm.first_name}
                onChangeText={(text) => setAddForm((f) => ({ ...f, first_name: text.replace(/[^a-zA-Z\s]/g, '') }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="#888"
                value={addForm.last_name}
                onChangeText={(text) => setAddForm((f) => ({ ...f, last_name: text.replace(/[^a-zA-Z\s]/g, '') }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                value={addForm.email}
                onChangeText={(text) => setAddForm((f) => ({ ...f, email: text.toLowerCase() }))}
              />
              {/* Phone input with +91 prefix */}
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#fff', marginBottom: 12 }}>
                <Text style={{ fontSize: 16, marginLeft: 10, color: '#333' }}>+91</Text>
                <TextInput
                  style={{ flex: 1, fontSize: 16, paddingVertical: 8, height: 45, color: '#000', paddingHorizontal: 10 }}
                  placeholder="Enter Phone Number"
                  placeholderTextColor={'#888'}
                  value={addForm.mobile_number}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    if (cleaned.length <= 10) setAddForm((f) => ({ ...f, mobile_number: cleaned }));
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              {/* Password Field */}
              <View style={{ position: 'relative', marginBottom: 12 }}>
                <TextInput
                  style={[styles.input, { color: '#000', paddingRight: 40 }]}
                  placeholder="Password"
                  placeholderTextColor="#888"
                  secureTextEntry={!showPassword}
                  value={addForm.password}
                  onChangeText={(text) => setAddForm((f) => ({ ...f, password: text }))}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 15, top: 15 }}
                >
                  <Icon name={showPassword ? 'eye-slash' : 'eye'} size={20} color="#888" />
                </TouchableOpacity>
              </View>
              {/* Confirm Password Field */}
              <View style={{ position: 'relative', marginBottom: 12 }}>
                <TextInput
                  style={[styles.input, { color: '#000', paddingRight: 40 }]}
                  placeholder="Confirm Password"
                  placeholderTextColor="#888"
                  secureTextEntry={!showConfirmPassword}
                  value={addForm.confirm_password}
                  onChangeText={(text) => setAddForm((f) => ({ ...f, confirm_password: text }))}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: 15, top: 15 }}
                >
                  <Icon name={showConfirmPassword ? 'eye-slash' : 'eye'} size={20} color="#888" />
                </TouchableOpacity>
                {/* Password match indicator */}
                {addForm.confirm_password.length > 0 && (
                  <View style={{ position: 'absolute', right: 45, top: 15 }}>
                    <Icon
                      name={addForm.password === addForm.confirm_password ? 'check-circle' : 'times-circle'}
                      size={20}
                      color={addForm.password === addForm.confirm_password ? 'green' : 'red'}
                    />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddAmbulanceUser}
                disabled={addLoading}
              >
                <Text style={styles.submitButtonText}>
                  {addLoading ? 'Registering...' : 'Register'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Ambulance User List */}
      <SafeAreaView style={styles.container}>
        {loading ? (
          <Text style={[styles.loadingText, { marginTop: 60 }]}>Loading data...</Text>
        ) : (
          <FlatList
            contentContainerStyle={{ paddingBottom: 100 }}
            data={paginatedUsers}
            renderItem={renderUser}
            keyExtractor={(item, index) => `${item.user_id}-${index}`}
            ListEmptyComponent={<Text style={styles.emptyText}>No ambulance users found.</Text>}
          />
        )}

        {/* Pagination Controls */}
        {!loading && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={styles.iconButton}
              disabled={currentPage === 1}
              onPress={() => handlePageChange('prev')}
            >
              <Image
                source={require('../assets/admin/backward-button.png')}
                style={[styles.pageIcon, currentPage === 1 && styles.iconDisabled]}
              />
            </TouchableOpacity>
            <Text style={styles.pageNumber}>
              Page {currentPage} of {pageCount}
            </Text>
            <TouchableOpacity
              style={styles.iconButton}
              disabled={currentPage === pageCount}
              onPress={() => handlePageChange('next')}
            >
              <Image
                source={require('../assets/admin/forward-button.png')}
                style={[styles.pageIcon, currentPage === pageCount && styles.iconDisabled]}
              />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </>
  );
};

export default RegisteredAmbulanceList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f1f2f3',
    position: 'relative',
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  toolbarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  iconWrapper: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarIcon: {
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
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: "#333",
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#555',
    paddingVertical: 20,
  },
  pageNumber: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#444',
  },
  pageIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#4169E1',
    marginHorizontal: 10,
  },
  iconDisabled: {
    tintColor: '#B0B0B0',
    opacity: 0.5,
  },
  pagination: {
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
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderLeftWidth: 6,
    borderLeftColor: '#1c78f2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  statusTag: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    marginTop: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    marginRight: 4,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  icon: {
    width: 16,
    height: 16,
    tintColor: '#4B5563',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  vehicleListTitle: {
    fontWeight: 'bold',
    color: '#1c78f2',
    marginBottom: 4,
    marginTop: 8,
  },
  noVehicleText: {
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
    marginLeft: 8,
  },
  vehicleCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    marginLeft: 8,
    marginRight: 8,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  vehicleIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
    tintColor: '#1c78f2',
  },
  vehicleLabel: {
    fontSize: 13,
    color: '#555',
    marginRight: 4,
    fontWeight: '500',
  },
  vehicleValue: {
    fontSize: 13,
    color: '#222',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    borderRadius: 14,
    padding: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c78f2',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#F9FAFB',
  },
  submitButton: {
    backgroundColor: '#1c78f2',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#888',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  vehicleCardTopStrip: {
  height: 5,
  backgroundColor: '#1c78f2',
  borderTopLeftRadius: 8,
  borderTopRightRadius: 8,
},
vehicleInfoRow: {
  // flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 8,
  gap: 10,
},
vehicleInfoBox: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: 8,
  padding: 5,
  marginRight: 4,
  gap: 8,
},
vehicleInfoIcon: {
  marginRight: 8,
},
vehicleInfoLabel: {
  fontSize: 12,
  color: '#6B7280',
  fontWeight: '500',
},
vehicleInfoValue: {
  fontSize: 14,
  color: '#111827',
  fontWeight: '600',
},
vehicleCardTitle: {
  marginTop: 4,
  fontWeight: 'bold',
  fontSize: 15,
  color: '#1c78f2',
},
vehicleStatusPill: {
  marginTop: 4,
  paddingHorizontal: 10,
  paddingVertical: 3,
  borderRadius: 12,
  alignSelf: 'flex-start',
},
vehicleStatusText: {
  fontSize: 12,
  fontWeight: '700',
},

});