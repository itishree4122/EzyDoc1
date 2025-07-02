import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import { BASE_URL } from '../auth/Api';
import Icon from 'react-native-vector-icons/FontAwesome';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const ITEMS_PER_PAGE = 15;

const PendingAccounts = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  // Pagination and search
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
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.first_name} {item.last_name}
        </Text>
        <View style={[styles.statusTag, { backgroundColor: '#fee2e2' }]}>
          <Text style={[styles.statusText, { color: '#b91c1c' }]}>Inactive</Text>
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
        <View style={styles.cardRow}>
          <MCIcon
            name={
              item.role === 'doctor'
                ? 'doctor'
                : item.role === 'lab'
                ? 'hospital-box'
                : 'ambulance'
            }
            size={16}
            color={
              item.role === 'doctor'
                ? '#1c78f2'
                : item.role === 'lab'
                ? '#059669'
                : '#f59e42'
            }
            style={styles.icon}
          />
          <Text style={styles.cardLabel}>Role:</Text>
          <Text style={styles.cardValue}>{item.role.charAt(0).toUpperCase() + item.role.slice(1)}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#34d399' }]}
          onPress={() => handleApprove(item.user_id)}
        >
          <Text style={styles.actionBtnText}>Accept</Text>
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
          <Image
            source={require("../assets/UserProfile/back-arrow.png")}
            style={styles.toolbarIcon}
          />
        </TouchableOpacity>
        <Text style={styles.toolbarTitle}>Pending Accounts</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search for users..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setCurrentPage(1);
          }}
        />
      </View>

      {/* Pending Users List */}
      <SafeAreaView style={styles.container}>
        {loading ? (
          <Text style={[styles.loadingText, { marginTop: 60 }]}>Loading data...</Text>
        ) : (
          <FlatList
            contentContainerStyle={{ paddingBottom: 100 }}
            data={paginatedUsers}
            renderItem={renderUser}
            keyExtractor={(item, index) => `${item.user_id}-${index}`}
            ListEmptyComponent={<Text style={styles.emptyText}>No pending accounts found.</Text>}
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
              Page {currentPage} of {totalPages}
            </Text>
            <TouchableOpacity
              style={styles.iconButton}
              disabled={currentPage === totalPages}
              onPress={() => handlePageChange('next')}
            >
              <Image
                source={require('../assets/admin/forward-button.png')}
                style={[styles.pageIcon, currentPage === totalPages && styles.iconDisabled]}
              />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </>
  );
};

export default PendingAccounts;

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
    // elevation: 5,
    borderLeftWidth: 6,
    // borderLeftColor: '#fbbf24',
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
});