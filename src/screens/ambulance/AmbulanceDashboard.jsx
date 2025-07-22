import React, {useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl , Image, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import { fetchWithAuth } from '../auth/fetchWithAuth';

const AmbulanceDashboard = () => {
  
  const navigation = useNavigation();
  const [ambulanceId, setAmbulanceId] = useState('');
  const [countData, setCountData] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [userAmbulances, setUserAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  // Fetch user data and ambulances
  useEffect(() => {
  fetchData(); // Initial data load
}, []);

// Rename onRefresh to fetchData for clarity
const fetchData = useCallback(async () => {
  setRefreshing(true);
  try {
    const id = await AsyncStorage.getItem('ambulanceId');
    if (id) {
      setAmbulanceId(id);
      
      // Get user details
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setFirstName(user.first_name);
        setLastName(user.last_name);
        setEmail(user.email);
      }

      // Get ambulance counts
      const token = await getToken();
      const countResponse = await fetchWithAuth(`${BASE_URL}/ambulance/count/${id}/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (countResponse.ok) {
        const countData = await countResponse.json();
        setCountData(countData);
      }

      // Get user's ambulances
      const ambulancesResponse = await fetch(`${BASE_URL}/ambulance/status/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (ambulancesResponse.ok) {
        const data = await ambulancesResponse.json();
        const filteredAmbulances = data.ambulances.filter(
          ambulance => ambulance.user === id
        );
        setUserAmbulances(filteredAmbulances);
      }
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    Alert.alert("Error", "Failed to load data");
  } finally {
    setRefreshing(false);
    setLoading(false);
  }
}, []);

// Then update your onRefresh to simply:
const onRefresh = useCallback(() => {
  fetchData();
}, [fetchData]);

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              await fetch(`${BASE_URL}/users/firebase-token/remove/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.log("Logout failed:", error);
              Alert.alert("Error", "Something went wrong while logging out.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
useFocusEffect(
  useCallback(() => {
    fetchData(); // Load data every time screen is focused
  }, [])
);
 
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            {/* <Image
              source={require('../assets/UserProfile/profile-circle-icon.png')}
              style={styles.profileImage}
            /> */}
            <View style={styles.profileImageContainer}>
            <Text style={styles.initialLetter}>
              {firstName?.charAt(0).toUpperCase() || 'A'}
            </Text>
            </View>
            <View style={styles.userTextContainer}>
              <Text style={styles.userName}>{firstName} {lastName}</Text>
              <Text style={styles.userEmail}>{email}</Text>
              <Text style={[styles.ambulanceId, { display: 'none' }]}>
                User ID: {ambulanceId}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={handleLogout}
            style={styles.logoutButton}
            >
            <Icon name="exit-to-app" size={24} color="#fff" />  // Alternative 1

        </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <ScrollView contentContainerStyle={styles.scrollContent}
      refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['#1a73e8']}
      tintColor="#1a73e8"
    />
  } 
      >
        <View style={styles.statsContainer}>
  {/* Active Ambulance Card */}
  <View style={[styles.statCard, styles.activeCard]}>
    <View style={styles.statContent}>
      <Text style={styles.statTitle}>Active Ambulance</Text>
      <Text style={styles.statValue}>{countData?.active_count ?? 0}</Text>
      <Text style={styles.statSubtitle}>Currently in service</Text>
    </View>
    <View style={styles.statIcon}>
      <Icon name="local-hospital" size={40} color="#4CAF50" />
    </View>
  </View>

  {/* Inactive Ambulance Card */}
  <View style={[styles.statCard, styles.inactiveCard]}>
    <View style={styles.statContent}>
      <Text style={styles.statTitle}>Inactive Ambulances</Text>
      <Text style={styles.statValue}>{countData?.inactive_count ?? 0}</Text>
      <Text style={styles.statSubtitle}>Currently not in service</Text>
    </View>
    <View style={styles.statIcon}>
      <Icon name="remove-circle-outline" size={40} color="#F44336" />
    </View>
  </View>
</View>


        {/* User's Ambulances Section */}
<View style={styles.section}>
  <View style={styles.sectionContainer}>
    {/* Section Header */}
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>All Ambulances</Text>
      {userAmbulances?.length > 0 && (
        <TouchableOpacity 
          onPress={() => navigation.navigate('RegisteredAmbulance',{ambulanceId: ambulanceId})}
          style={styles.viewAllButton}
        >
          <Text style={styles.seeAllText}>View All ({userAmbulances.length})</Text>
          <Icon name="chevron-right" size={18} color="#1a73e8" />
        </TouchableOpacity>
      )}
    </View>
    
    {/* Ambulance List */}
    {loading ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#1a73e8" />
        <Text style={styles.loadingText}>Loading ambulances...</Text>
      </View>
    ) : userAmbulances && userAmbulances.length > 0 ? (
      <View style={styles.ambulanceListContainer}>
        {userAmbulances.slice(0, 3).map((item) => (
         <View
  key={item.id ? item.id.toString() : Math.random().toString()}
  style={[
    styles.ambulanceCard,
    item.active ? styles.activeCard : styles.inactiveCard
  ]}
  onPress={() => navigation.navigate('AmbulanceDetail', { ambulance: item })}
>
  <View style={[
    styles.ambulanceIconContainer,
    item.active ? styles.activeIcon : styles.inactiveIcon
  ]}>
    <Icon 
      name="local-hospital"  // Changed from "ambulance" to "local-hospital"
      size={28} 
      color="#fff" 
    />
  </View>
  <View style={styles.ambulanceInfo}>
    <Text style={styles.ambulanceName} numberOfLines={1}>
      {item.service_name}
    </Text>
    <View style={styles.ambulanceMeta}>
      <Text style={styles.ambulanceNumber}>{item.vehicle_number}</Text>
      <View style={[
        styles.statusBadge,
        item.active ? styles.activeBadge : styles.inactiveBadge
      ]}>
        <Text style={styles.statusText}>
          {item.active ? "Active" : "Inactive"}
        </Text>
      </View>
    </View>
    <View style={styles.locationContainer}>
      <Icon name="location-on" size={16} color="#666" />
      <Text style={styles.ambulanceLocation} numberOfLines={1}>
        {item.location || "Location not specified"}
      </Text>
    </View>
  </View>
  <Icon name="chevron-right" size={20} color="#888" />
</View>
        ))}
      </View>
    ) : (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Icon name="directions-car" size={40} color="#ccc" />
        </View>
        <Text style={styles.emptyStateText}>No ambulances registered</Text>
        <Text style={styles.emptyStateSubtext}>Add your first ambulance to get started</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AmbulanceRegister', { ambulanceId: ambulanceId })}
        >
          <Text style={styles.addButtonText}>+ Register Ambulance</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
</View>

      </ScrollView>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa"
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#1a73e8',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  initialLetter: {
  fontSize: 28,
  fontWeight: 'bold',
  color: 'white',
  textAlign: 'center',
},
profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    // backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    borderWidth: 2,
    borderColor: '#fff',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 3 },
    // shadowOpacity: 0.2,
    // shadowRadius: 5,
    // elevation: 5,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  userTextContainer: {
    marginLeft: 15,
    flexShrink: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 2,
  },
  ambulanceId: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 2,
  },
  logoutButton: {
  padding: 8,
  marginLeft: 10,
},
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  activeCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  inactiveCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#2196F3',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statIcon: {
    marginLeft: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  seeAllText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
  ambulanceItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeAmbulance: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  inactiveAmbulance: {
    borderLeftWidth: 5,
    borderLeftColor: '#F44336',
  },
  ambulanceIcon: {
    marginRight: 15,
  },
  ambulanceInfo: {
    flex: 1,
  },
  ambulanceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  ambulanceNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  ambulanceLocation: {
    fontSize: 12,
    color: '#888',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 10,
    color: '#666',
    textAlign: 'center',
  },
   listContainer: {
    paddingBottom: 10,
  },
  addButton: {
    marginTop: 15,
    backgroundColor: '#1a73e8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 15,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },

  // 
 sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  seeAllText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },

  ambulanceListContainer: {
    gap: 12,
  },

  ambulanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },

  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },

  inactiveCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },

  ambulanceIconContainer: {
  width: 48,
  height: 48,
  borderRadius: 24,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 16,
},
activeIcon: {
  backgroundColor: '#4CAF50', // Green for active
},
inactiveIcon: {
  backgroundColor: '#F44336', // Red for inactive
},
activeBadge: {
  backgroundColor: '#E8F5E9', // Light green background
},
inactiveBadge: {
  backgroundColor: '#FFEBEE', // Light red background
},
statusText: {
  fontSize: 12,
  fontWeight: '500',
  color: '#333',
},

  ambulanceInfo: {
    flex: 1,
  },

  ambulanceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },

  ambulanceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  ambulanceNumber: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },

  statusBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },

  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ambulanceLocation: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
    flexShrink: 1,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },

  emptyIconContainer: {
    backgroundColor: '#f9f9f9',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },

  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    textAlign: 'center',
  },

  addButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  addButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default AmbulanceDashboard;