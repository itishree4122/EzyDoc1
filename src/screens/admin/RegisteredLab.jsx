import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import { useNavigation } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Icon from 'react-native-vector-icons/FontAwesome';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const ITEMS_PER_PAGE = 15;

const RegisteredLab = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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
    role: 'lab',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  // Fetch labs list
  const fetchLabs = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/users/admin/list-users/?role=lab`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch labs');
      const data = await response.json();
      // Sort by created_at descending (newest first)
      console.log("Lab Data: ",data);
      const sortedLabs = [...data].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setLabs(sortedLabs);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch labs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  // Pagination and search
  const paginatedLabs = useMemo(() => {
    const filtered = labs.filter((lab) =>
      (lab.user_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lab.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lab.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lab.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lab.mobile_number || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [labs, searchQuery, currentPage]);

  const totalPages = useMemo(() => {
    const filteredLength = labs.filter((lab) =>
      (lab.user_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lab.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lab.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lab.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lab.mobile_number || '').toLowerCase().includes(searchQuery.toLowerCase())
    ).length;
    return Math.ceil(filteredLength / ITEMS_PER_PAGE) || 1;
  }, [labs, searchQuery]);

  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

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
      fetchLabs();
      Alert.alert('Success', `Lab ${is_active ? 'deactivated' : 'activated'} successfully.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  // Delete lab
  const handleDelete = async (user_id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this lab?',
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
              fetchLabs();
              Alert.alert('Deleted', 'Lab deleted successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete lab');
            }
          },
        },
      ]
    );
  };

  // Add lab
  const handleAddLab = async () => {
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
          mobile_number, // send only the number, not with +91
          password,
            role: 'lab',
           
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Error', data?.detail || 'Failed to add lab');
      } else {
        setShowAddModal(false);
        setAddForm({
         first_name: '',
        last_name: '',
        email: '',
        mobile_number: '',
        password: '',
        confirm_password: '',
          role: 'lab',
        });
        fetchLabs();
        Alert.alert('Success', 'Lab registered successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add lab');
    } finally {
      setAddLoading(false);
    }
  };

  // Render lab card
  const renderItem = ({ item }) => (
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
        {/* <View style={styles.cardRow}>
          <Icon name="user" size={16} color="#4B5563" style={styles.icon} />
          <Text style={styles.cardLabel}>Name:</Text>
          <Text style={styles.cardValue}>{item.first_name + ' ' + item.last_name || '-'}</Text>
        </View> */}
        {/* <View style={styles.cardRow}>
          <MCIcon name="office-building-marker" size={16} color="#4B5563" style={styles.icon} />
          <Text style={styles.cardLabel}>Address:</Text>
          <Text style={styles.cardValue}>{item.address || '-'}</Text>
        </View> */}
        {/* <View style={styles.cardRow}>
          <MCIcon name="city" size={16} color="#4B5563" style={styles.icon} />
          <Text style={styles.cardLabel}>City:</Text>
          <Text style={styles.cardValue}>{item.city || '-'}</Text>
        </View> */}
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
          style={[styles.actionBtn, { backgroundColor: '#fbbf24' }]}
          onPress={() => navigation.navigate('LabProfile', { labId: item.user_id, fromAdmin: true })}
        >
          <Text style={styles.actionBtnText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
          onPress={() => handleDelete(item.user_id)}
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
          {/* <Icon name="arrow-left" size={20} color="#000" /> */}
          <Image source={require("../assets/UserProfile/back-arrow.png")}
                      style={styles.toolbarIcon}
                    />
        </TouchableOpacity>
        <Text style={styles.toolbarTitle}>Registered Labs</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setShowSearch((prev) => !prev)}
            style={styles.iconWrapper}
          >
            {/* <Icon name="search" size={20} color="#000" /> */}
            <Image source={require("../assets/search.png")}
                          style={styles.toolbarIcon}
                        />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={[styles.iconWrapper, { marginLeft: 8 }]}
          >
            <MCIcon name="hospital-box" size={22} color="#1c78f2" style={styles.toolbarIcon}/>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search for labs..."
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

      {/* Add Lab Modal */}
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
            <Text style={styles.modalTitle}>Register New Lab User</Text>
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
                onPress={handleAddLab}
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

      {/* Lab List */}
      <SafeAreaView style={styles.container}>
        {loading ? (
          <Text style={[styles.loadingText, { marginTop: 60 }]}>Loading data...</Text>
        ) : (
          <FlatList
            contentContainerStyle={{ paddingBottom: 100 }}
            data={paginatedLabs}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.user_id}-${index}`}
            ListEmptyComponent={<Text style={styles.emptyText}>No labs found.</Text>}
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
               <Image source={require('../assets/admin/backward-button.png')}
                              style={[styles.pageIcon, currentPage === 1 && styles.iconDisabled]}
                            />
              {/* <Icon name="chevron-left" size={20} color={currentPage === 1 ? "#9CA3AF" : "#1F2937"} /> */}
            </TouchableOpacity>
            <Text style={styles.pageNumber}>
              Page {currentPage} of {totalPages}
            </Text>
            <TouchableOpacity
              style={styles.iconButton}
              disabled={currentPage === totalPages}
              onPress={() => handlePageChange('next')}
            >
              <Image source={require('../assets/admin/forward-button.png')}
                              style={[styles.pageIcon, currentPage === totalPages && styles.iconDisabled]}
                            />
              {/* <Icon name="chevron-right" size={20} color={currentPage === totalPages ? "#9CA3AF" : "#1F2937"} /> */}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </>
  );
};

export default RegisteredLab;

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    height: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
    paddingVertical: 12,
  },
  iconWrapper: {
    padding: 8,
  },
  toolbarIcon: {
    width: 20,
    height: 20,
    tintColor: '#000',
  },
  toolbarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  searchInput: {
    height: 42,
    fontSize: 15,
    color: '#333',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingBottom: 80,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
    paddingVertical: 25,
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
  iconButton: {
    padding: 8,
  },
  pageIcon: {
    width: 20,
    height: 20,
    tintColor: '#1F2937',
  },
  iconDisabled: {
    tintColor: '#9CA3AF',
  },
  pageNumber: {
    fontSize: 14,
    color: '#374151',
    marginHorizontal: 10,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#6B7280',
    marginTop: 40,
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
});