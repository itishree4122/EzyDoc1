import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BASE_URL } from '../auth/Api';
import { useNavigation } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import IonIcon from 'react-native-vector-icons/Ionicons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const ITEMS_PER_PAGE = 15;

const RegisteredDoctor = () => {
  const [doctors, setDoctors] = useState([]);
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
  role: 'doctor',
});
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [addLoading, setAddLoading] = useState(false);

  // Fetch doctors list
 const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/users/admin/list-users/?role=doctor`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) throw new Error('Failed to fetch doctors');
      const data = await response.json();
      const sortedDoctors = [...data].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setDoctors(sortedDoctors);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Pagination and search
  const paginatedDoctors = useMemo(() => {
    const filtered = doctors.filter(doctor =>
      (doctor.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.mobile_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.user_id || '').toString().includes(searchQuery.toLowerCase())
    );
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [doctors, searchQuery, currentPage]);

  const totalPages = useMemo(() => {
    const filteredLength = doctors.filter(doctor =>
      (doctor.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.mobile_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.user_id || '').toString().includes(searchQuery.toLowerCase())
    ).length;
    return Math.ceil(filteredLength / ITEMS_PER_PAGE) || 1;
  }, [doctors, searchQuery]);

  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleToggleActive = async (user_id, is_active) => {
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/users/admin/user/${user_id}/toggle-active/`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) throw new Error('Failed to toggle status');
      fetchDoctors();
      Alert.alert('Success', `Doctor ${is_active ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = async (user_id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this doctor?',
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
              fetchDoctors();
              Alert.alert('Deleted', 'Doctor deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete doctor');
            }
          },
        },
      ]
    );
  };

  const handleAddDoctor = async () => {
    const { first_name, last_name, email, mobile_number, password, confirm_password } = addForm;
    if (!first_name || !last_name || !email || !mobile_number || !password || !confirm_password) {
      Alert.alert('Validation', 'Please fill all fields');
      return;
    }
    if (password !== confirm_password) {
      Alert.alert('Validation', 'Passwords do not match');
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
            role: 'doctor',
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Error', data?.detail || 'Failed to add doctor');
      } else {
        setShowAddModal(false);
        setAddForm({
          first_name: '',
          last_name: '',
          email: '',
          mobile_number: '',
          password: '',
          confirm_password: '',
          role: 'doctor',
        });
        fetchDoctors();
        Alert.alert('Success', 'Doctor registered successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add doctor');
    } finally {
      setAddLoading(false);
    }
  };

  const renderDoctor = ({ item }) => (
    <View style={styles.card}>
      {/* Card Header with diagonal accent */}
      <View style={styles.cardHeader}>
        <View style={styles.headerAccent} />
        <View style={styles.headerContent}>
          <View style={styles.nameRoleContainer}>
            <Text style={styles.cardTitle}>
              {item.first_name} {item.last_name}
            </Text>
            <View style={styles.roleBadge}>
              <MCIcon name="stethoscope" size={14} color="white" />
              <Text style={styles.roleText}>Doctor</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#d1fae5' : '#fee2e2' }]}>
            <IonIcon 
              name={item.is_active ? "checkmark-circle" : "close-circle"} 
              size={14} 
              color={item.is_active ? "#059669" : "#b91c1c"} 
            />
            <Text style={[styles.statusText, { color: item.is_active ? "#059669" : "#b91c1c" }]}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Card Body with info strips */}
      <View style={styles.cardBody}>
        <View style={styles.infoStrip}>
          <View style={styles.infoIcon}>
            <IonIcon name="id-card-outline" size={16} color="#1c78f2" />
          </View>
          <Text style={styles.infoLabel}>ID:</Text>
          <Text style={styles.infoValue}>{item.user_id}</Text>
        </View>
        
        <View style={styles.infoStrip}>
          <View style={styles.infoIcon}>
            <IonIcon name="mail-outline" size={16} color="#1c78f2" />
          </View>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
            {item.email}
          </Text>
        </View>
        
        <View style={styles.infoStrip}>
          <View style={styles.infoIcon}>
            <IonIcon name="call-outline" size={16} color="#1c78f2" />
          </View>
          <Text style={styles.infoLabel}>Mobile:</Text>
          <Text style={styles.infoValue}>{item.mobile_number}</Text>
        </View>
        
        <View style={styles.infoStrip}>
          <View style={styles.infoIcon}>
            <IonIcon name="calendar-outline" size={16} color="#1c78f2" />
          </View>
          <Text style={styles.infoLabel}>Registered:</Text>
          <Text style={styles.infoValue}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      {/* Card Footer with action buttons */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: item.is_active ? '#f87171' : '#34d399' }]}
          onPress={() => handleToggleActive(item.user_id, item.is_active)}
        >
          <IonIcon 
            name={item.is_active ? "power" : "power-outline"} 
            size={18} 
            color="white" 
          />
          <Text style={styles.buttonText}>
            {item.is_active ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.buttonDivider} />
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#1c78f2' }]}
          onPress={() => navigation.navigate('DoctorProfile', { 
            doctorId: item.user_id, 
            fromAdmin: true 
          })}
        >
          <IonIcon name="document-text-outline" size={18} color="white" />
          <Text style={styles.buttonText}>Profile</Text>
        </TouchableOpacity>
        
        <View style={styles.buttonDivider} />
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
          onPress={() => handleDelete(item.user_id)}
        >
          <IonIcon name="trash-bin-outline" size={18} color="white" />
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

 return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fe" />
      
      {/* Custom Header with curved bottom */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.headerButton}
          >
            <IonIcon name="chevron-back" size={24} color="#1c78f2" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Registered Doctors</Text>
          
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity 
              onPress={() => setShowSearch(!showSearch)} 
              style={styles.headerButton}
            >
              <IonIcon name="search" size={22} color="#1c78f2" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)} 
              style={[styles.headerButton, { marginLeft: 8 }]}
            >
              <MCIcon name="account-plus" size={22} color="#1c78f2" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerCurve} />
      </View>
      
      {/* Dynamic Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <IonIcon name="search" size={18} color="#8e9df6" style={styles.searchIcon} />
          <TextInput
            placeholder="Search doctors..."
            placeholderTextColor="#8e9df6"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')} 
              style={styles.clearSearch}
            >
              <IonIcon name="close-circle" size={18} color="#8e9df6" />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Content Area */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <IonIcon name="cloud-download-outline" size={48} color="#d1d8ff" />
            <Text style={styles.loadingText}>Loading doctors list</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={paginatedDoctors}
              renderItem={renderDoctor}
              keyExtractor={(item) => item.user_id.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <IonIcon name="file-tray-outline" size={48} color="#d1d8ff" />
                  <Text style={styles.emptyTitle}>No Doctors Found</Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery ? 'No matches for your search' : 'No doctors registered yet'}
                  </Text>
                </View>
              }
            />
            
            {/* Custom Pagination */}
            {paginatedDoctors.length > 0 && (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[
                    styles.pageButton, 
                    currentPage === 1 && styles.disabledButton
                  ]}
                  disabled={currentPage === 1}
                  onPress={() => handlePageChange('prev')}
                >
                  <IonIcon name="chevron-back" size={20} color={currentPage === 1 ? "#c7d1ff" : "#1c78f2"} />
                </TouchableOpacity>
                
                <View style={styles.pageIndicator}>
                  <Text style={styles.currentPage}>{currentPage}</Text>
                  <Text style={styles.totalPages}>of {totalPages}</Text>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.pageButton, 
                    currentPage === totalPages && styles.disabledButton
                  ]}
                  disabled={currentPage === totalPages}
                  onPress={() => handlePageChange('next')}
                >
                  <IonIcon name="chevron-forward" size={20} color={currentPage === totalPages ? "#c7d1ff" : "#1c78f2"} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
      
      {/* Add Doctor Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Doctor</Text>
              <TouchableOpacity 
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseButton}
              >
                <IonIcon name="close" size={24} color="#1c78f2" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  value={addForm.first_name}
                  onChangeText={(text) => 
                    setAddForm(f => ({ ...f, first_name: text.replace(/[^a-zA-Z\s]/g, '') }))
                  }
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  value={addForm.last_name}
                  onChangeText={(text) => 
                    setAddForm(f => ({ ...f, last_name: text.replace(/[^a-zA-Z\s]/g, '') }))
                  }
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="john.doe@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={addForm.email}
                  onChangeText={(text) => 
                    setAddForm(f => ({ ...f, email: text.toLowerCase() }))
                  }
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.phonePrefix}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="9876543210"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={addForm.mobile_number}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, '');
                      if (cleaned.length <= 10) {
                        setAddForm(f => ({ ...f, mobile_number: cleaned }));
                      }
                    }}
                  />
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    value={addForm.password}
                    onChangeText={(text) => 
                      setAddForm(f => ({ ...f, password: text }))
                    }
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    <IonIcon 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#8e9df6" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    secureTextEntry={!showConfirmPassword}
                    value={addForm.confirm_password}
                    onChangeText={(text) => 
                      setAddForm(f => ({ ...f, confirm_password: text }))
                    }
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.passwordToggle}
                  >
                    <IonIcon 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#8e9df6" 
                    />
                  </TouchableOpacity>
                  {addForm.confirm_password.length > 0 && (
                    <View style={styles.passwordMatchIndicator}>
                      <IonIcon 
                        name={addForm.password === addForm.confirm_password ? 
                          "checkmark-circle" : "close-circle"}
                        size={20} 
                        color={addForm.password === addForm.confirm_password ? 
                          "#10b981" : "#ef4444"} 
                      />
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAddDoctor}
                disabled={addLoading}
              >
                {addLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Register Doctor</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default RegisteredDoctor;

const styles = StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: '#f8f9fe',
  },
  headerContainer: {
    backgroundColor: '#f8f9fe',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  headerCurve: {
    height: 16,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#1c78f2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1c78f2',
    height: '100%',
  },
  clearSearch: {
    padding: 4,
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#a0aec0',
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9edf7',
    shadowColor: '#1c78f2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    backgroundColor: '#f8f9fe',
    position: 'relative',
  },
  headerAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#1c78f2',
    opacity: 0.1,
    transform: [{ skewY: '-5deg' }],
  },
  headerContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginRight: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c78f2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 4,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#e9edf7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#718096',
    width: 90,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d3748',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1c78f2',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ff4757',
  },
  buttonDivider: {
    width: 1,
    backgroundColor: '#f1f5f9',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#a0aec0',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#cbd5e0',
    marginTop: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9edf7',
  },
  disabledButton: {
    backgroundColor: '#f8f9fe',
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginHorizontal: 16,
  },
  currentPage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c78f2',
    marginRight: 4,
  },
  totalPages: {
    fontSize: 14,
    color: '#a0aec0',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2d3748',
    backgroundColor: '#f8fafc',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  phonePrefix: {
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#4a5568',
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#2d3748',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#2d3748',
  },
  passwordToggle: {
    padding: 12,
  },
  passwordMatchIndicator: {
    paddingRight: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 16,
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#1c78f2',
    borderBottomRightRadius: 16,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
});