import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import { BASE_URL } from '../auth/Api';
import IonIcon from 'react-native-vector-icons/Ionicons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const ITEMS_PER_PAGE = 15;

const PendingAccounts = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      // Fetch all users with is_active === false for all roles
      const roles = ['doctor', 'lab', 'ambulance'];
      let all = [];
      for (const role of roles) {
        const res = await fetchWithAuth(
          `${BASE_URL}/users/admin/list-users/?role=${role}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        if (res.ok) {
          const data = await res.json();
          all = all.concat(data.filter(u => !u.is_active));
        }
      }
      // Sort by created_at descending
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPendingUsers(all);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

 const paginatedUsers = useMemo(() => {
    const filtered = pendingUsers.filter(user =>
      (user.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.mobile_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.role || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [pendingUsers, searchQuery, currentPage]);

  const totalPages = useMemo(() => {
    const filteredLength = pendingUsers.filter(user =>
      (user.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.mobile_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.role || '').toLowerCase().includes(searchQuery.toLowerCase())
    ).length;
    return Math.ceil(filteredLength / ITEMS_PER_PAGE) || 1;
  }, [pendingUsers, searchQuery]);

  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Approve user
  const handleApprove = async (user_id) => {
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/users/admin/user/${user_id}/toggle-active/`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok) throw new Error('Failed to activate user');
      fetchPendingUsers();
      Alert.alert('Success', 'Account activated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to activate user');
    }
  };

  // Delete user
  const handleDelete = async (user_id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this account?',
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
              fetchPendingUsers();
              Alert.alert('Deleted', 'Account deleted successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  // Render user card
 const renderUser = ({ item }) => (
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
              <MCIcon
                name={
                  item.role === 'doctor'
                    ? 'stethoscope'
                    : item.role === 'lab'
                    ? 'microscope'
                    : 'ambulance'
                }
                size={14}
                color="white"
              />
              <Text style={styles.roleText}>
                {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <IonIcon name="time-outline" size={14} color="#f59e0b" />
            <Text style={styles.statusText}>Pending Review</Text>
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
          style={styles.approveButton}
          onPress={() => handleApprove(item.user_id)}
        >
          <IonIcon name="checkmark-circle" size={18} color="white" />
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        
        <View style={styles.buttonDivider} />
        
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleDelete(item.user_id)}
        >
          <IonIcon name="trash-bin-outline" size={18} color="white" />
          <Text style={styles.buttonText}>Reject</Text>
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
          
          <Text style={styles.headerTitle}>Pending Approvals</Text>
          
          <TouchableOpacity 
            onPress={() => setShowSearch(!showSearch)} 
            style={styles.headerButton}
          >
            <IonIcon name="search" size={22} color="#1c78f2" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerCurve} />
      </View>
      
      {/* Dynamic Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <IonIcon name="search" size={18} color="#8e9df6" style={styles.searchIcon} />
          <TextInput
            placeholder="Search pending accounts..."
            placeholderTextColor="#8e9df6"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
            onBlur={() => setShowSearch(false)}
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
            <Text style={styles.loadingText}>Loading pending accounts</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={paginatedUsers}
              renderItem={renderUser}
              keyExtractor={(item) => item.user_id.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <IonIcon name="file-tray-outline" size={48} color="#d1d8ff" />
                  <Text style={styles.emptyTitle}>No Pending Accounts</Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery ? 'No matches found' : 'All accounts are approved'}
                  </Text>
                </View>
              }
            />
            
            {/* Custom Pagination */}
            {paginatedUsers.length > 0 && (
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
    </SafeAreaView>
  );
};

export default PendingAccounts;

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
    backgroundColor: 'transparent',
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
});