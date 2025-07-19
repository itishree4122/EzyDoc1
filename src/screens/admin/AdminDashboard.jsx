import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
  StatusBar,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';


const AdminDashboard = () => {
  const navigation = useNavigation();
  const [appointments, setAppointments] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [doctorCount, setDoctorCount] = useState(0);
  const [labCount, setLabCount] = useState(0);
  const [ambulanceCount, setAmbulanceCount] = useState(0);
  const [recentDoctors, setRecentDoctors] = useState([]);
  const [recentLabs, setRecentLabs] = useState([]);
  const [recentAmbulances, setRecentAmbulances] = useState([]);
  const [activeTab, setActiveTab] = useState('doctors'); // Add this line
  const screenWidth = Dimensions.get('window').width;

 

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAppointments(),
        fetchLabTests(),
        fetchUsersByRole('doctor'),
        fetchUsersByRole('lab'),
        fetchUsersByRole('ambulance'),
        fetchPendingAccounts(),
        fetchRecentDoctors(),
        fetchRecentLabs(),
        fetchRecentAmbulances(),
       
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoadingCharts(true);
      const response = await fetchWithAuth(`${BASE_URL}/doctor/appointmentlist/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Failed to fetch appointment data:', error);
      Alert.alert('Error', 'Failed to fetch appointment data');
    } finally {
      setLoadingCharts(false);
    }
  };

  const shiftChartData = useMemo(() => {
    const shiftMap = {};

    appointments.forEach(item => {
      const shift = item.shift?.toLowerCase() || 'unknown';
      if (shift !== 'night') {
        shiftMap[shift] = (shiftMap[shift] || 0) + 1;
      }
    });

    const labels = Object.keys(shiftMap);
    const counts = Object.values(shiftMap);

    return {
      labels,
      datasets: [{ data: counts }],
    };
  }, [appointments]);


  const fetchLabTests = async () => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLabTests(data);
    } catch (error) {
      console.error('Failed to fetch lab tests:', error);
      Alert.alert('Error', 'Failed to fetch lab tests');
    }
  };

  const testTypeBarData = useMemo(() => {
    const typeMap = {};

    labTests.forEach(test => {
      const types = test.test_type?.split(',') || [];
      const uniqueTypes = [...new Set(types.map(t => t.trim()))];

      uniqueTypes.forEach(type => {
        if (type) {
          typeMap[type] = (typeMap[type] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);
    const topItems = sorted.slice(0, 8);

    const labels = topItems.map(([type]) =>
      type.length > 12 ? `${type.slice(0, 10)}…` : type
    );

    const data = topItems.map(([, count]) => count);

    return {
      labels,
      datasets: [{ data }],
    };
  }, [labTests]);

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
              console.error("Logout failed:", error);
              Alert.alert("Error", "Something went wrong while logging out.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };


  // Function to fetch users by role and update counts
 const fetchUsersByRole = async (role) => {
  setLoading(true);
  try {
    const response = await fetchWithAuth(
      `${BASE_URL}/users/admin/list-users/?role=${role}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) throw new Error(`Failed to fetch ${role}s`);
    
    const data = await response.json();
    console.log(`${role} Data:`, data);
    
    // Count active users only (if needed)
    const activeUsers = data.filter(user => user.is_active).length;
    
    // Set the appropriate count based on role
    switch(role) {
      case 'doctor':
        setDoctorCount(data.length); // or activeUsers
        break;
      case 'lab':
        setLabCount(data.length); // or activeUsers
        break;
      case 'ambulance':
        setAmbulanceCount(data.length); // or activeUsers
        break;
      default:
        console.warn(`Unknown role: ${role}`);
    }
    
    return data;
  } catch (error) {
    console.error(`${role} fetch error:`, error);
    Alert.alert('Error', `Failed to fetch ${role}s`);
    return [];
  } finally {
    setLoading(false);
  }
};


// show pending accounts
const fetchPendingAccounts = async () => {
    setLoading(true);
    try {
      const roles = ['doctor', 'lab', 'ambulance'];
      let allPending = [];
      
      for (const role of roles) {
        const res = await fetchWithAuth(
          `${BASE_URL}/users/admin/list-users/?role=${role}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        
        if (res.ok) {
          const data = await res.json();
          allPending = allPending.concat(data.filter(u => !u.is_active));
        }
      }
      
      // Sort by newest first and take at least 3
      allPending.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPendingUsers(allPending);
    } catch (error) {
      console.error('Failed to fetch pending accounts:', error);
    } finally {
      setLoading(false);
    }
  };

 const renderPendingAccount = ({ item, index }) => (
    <View style={[
      styles.pendingItem,
      index === 2 && pendingUsers.length > 3 ? styles.lastItem : null
    ]}>
      <View style={[
        styles.avatarContainer,
        { 
          backgroundColor: 
            item.role === 'doctor' ? '#e0f2fe' :
            item.role === 'lab' ? '#dcfce7' : '#fef3c7'
        }
      ]}>
        <MCIcon
          name={
            item.role === 'doctor' ? 'doctor' :
            item.role === 'lab' ? 'hospital-box' : 'ambulance'
          }
          size={24}
          color={
            item.role === 'doctor' ? '#1c78f2' :
            item.role === 'lab' ? '#059669' : '#f59e42'
          }
        />
      </View>
      <View style={styles.pendingInfo}>
        <Text style={styles.pendingName} numberOfLines={1}>
          {item.first_name} {item.last_name}
        </Text>
        <View style={styles.detailRow}>
          <MaterialIcons name="email" size={14} color="#6b7280" style={styles.detailIcon} />
          <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="phone" size={14} color="#6b7280" style={styles.detailIcon} />
          <Text style={styles.detailText}>{item.mobile_number}</Text>
        </View>
      </View>
      {index === 2 && pendingUsers.length > 3 ? (
        <Text style={styles.moreText}>+{pendingUsers.length - 3} more</Text>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.acceptButton]} activeOpacity={0.7}>
            
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.deleteButton]} activeOpacity={0.7}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
const fetchRecentDoctors = async () => {
  try {
    const data = await fetchUsersByRole('doctor');
    // Sort by newest first and take first 3
    const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setRecentDoctors(sorted.slice(0, 3));
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
  }
};
const renderDoctorItem = ({ item, index }) => (
  <TouchableOpacity style={[
    styles.doctorItem,
    index === 2 && recentDoctors.length > 3 ? styles.lastItem : null
  ]} onPress={() => navigation.navigate('RegisteredDoctor')}>
    <View style={[
      styles.avatarContainer,
      { backgroundColor: item.is_active ? '#e0f2fe' : '#fee2e2' }
    ]}>
      <MCIcon
        name="doctor"
        size={24}
        color={item.is_active ? '#1c78f2' : '#ef4444'}
      />
    </View>
    <View style={styles.doctorInfo}>
      <Text style={styles.doctorName} numberOfLines={1}>
        {item.first_name} {item.last_name}
      </Text>
      <View style={styles.detailRow}>
        <MaterialIcons name="badge" size={14} color="#6b7280" style={styles.detailIcon} />
        <Text style={styles.detailText}>ID: {item.user_id}</Text>
      </View>
      <View style={styles.detailRow}>
        <MaterialIcons name="email" size={14} color="#6b7280" style={styles.detailIcon} />
        <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
      </View>
    </View>
    {index === 2 && recentDoctors.length > 3 ? (
      <Text style={styles.moreText}>+{recentDoctors.length - 3} more</Text>
    ) : (
      <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#d1fae5' : '#fee2e2' }]}>
        <Text style={{ color: item.is_active ? '#059669' : '#b91c1c', fontSize: 12 }}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

const fetchRecentLabs = async () => {
  try {
    const data = await fetchUsersByRole('lab');
    // Sort by newest first and take first 3
    const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setRecentLabs(sorted.slice(0, 3));
  } catch (error) {
    console.error('Failed to fetch labs:', error);
  }
};

const renderLabItem = ({ item, index }) => (
  <TouchableOpacity style={[
    styles.labItem,
    index === 2 && recentLabs.length > 3 ? styles.lastItem : null
  ]} onPress={() => navigation.navigate('RegisteredLab')}>
    <View style={[
      styles.avatarContainer,
      { backgroundColor: item.is_active ? '#e0f2fe' : '#fee2e2' }
    ]}>
      <MCIcon
        name="hospital-box"
        size={24}
        color={item.is_active ? '#1c78f2' : '#ef4444'}
      />
    </View>
    <View style={styles.labInfo}>
      <Text style={styles.labName} numberOfLines={1}>
        {item.first_name} {item.last_name}
      </Text>
      <View style={styles.detailRow}>
        <MaterialIcons name="badge" size={14} color="#6b7280" style={styles.detailIcon} />
        <Text style={styles.detailText}>ID: {item.user_id}</Text>
      </View>
      <View style={styles.detailRow}>
        <MaterialIcons name="email" size={14} color="#6b7280" style={styles.detailIcon} />
        <Text style={styles.detailText} numberOfLines={1}>{item.email}</Text>
      </View>
    </View>
    {index === 2 && recentLabs.length > 3 ? (
      <Text style={styles.moreText}>+{recentLabs.length - 3} more</Text>
    ) : (
      <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#d1fae5' : '#fee2e2' }]}>
        <Text style={{ color: item.is_active ? '#059669' : '#b91c1c', fontSize: 12 }}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

const fetchRecentAmbulances = async () => {
  try {
    const data = await fetchUsersByRole('ambulance');
    // Sort by newest first and take first 3
    const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setRecentAmbulances(sorted.slice(0, 3));
  } catch (error) {
    console.error('Failed to fetch ambulances:', error);
  }
};

const renderAmbulanceItem = ({ item, index }) => (
  <TouchableOpacity style={[
    styles.ambulanceItem,
    index === 2 && recentAmbulances.length > 3 ? styles.lastItem : null
  ]} onPress={() => navigation.navigate('RegisteredAmbulanceList')}>
    <View style={[
      styles.avatarContainer,
      { backgroundColor: item.is_active ? '#e0f2fe' : '#fee2e2' }
    ]}>
      <MCIcon
        name="ambulance"
        size={24}
        color={item.is_active ? '#1c78f2' : '#ef4444'}
      />
    </View>
    <View style={styles.ambulanceInfo}>
      <Text style={styles.ambulanceName} numberOfLines={1}>
        {item.first_name} {item.last_name}
      </Text>
      <View style={styles.detailRow}>
        <MaterialIcons name="badge" size={14} color="#6b7280" style={styles.detailIcon} />
        <Text style={styles.detailText}>ID: {item.user_id}</Text>
      </View>
      <View style={styles.detailRow}>
        <MaterialIcons name="phone" size={14} color="#6b7280" style={styles.detailIcon} />
        <Text style={styles.detailText}>{item.mobile_number}</Text>
      </View>
    </View>
    {index === 2 && recentAmbulances.length > 3 ? (
      <Text style={styles.moreText}>+{recentAmbulances.length - 3} more</Text>
    ) : (
      <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#d1fae5' : '#fee2e2' }]}>
        <Text style={{ color: item.is_active ? '#059669' : '#b91c1c', fontSize: 12 }}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c78f2" />
      </View>
    );
  }

   return (
    <View style={styles.fullFlex}>
      <SafeAreaView style={styles.fullFlex}>
        <StatusBar backgroundColor="#1c78f2" barStyle="light-content" />
        
        {/* Floating Header */}
        <View style={styles.floatingHeader}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greetingText}>Welcome back,</Text>
              <Text style={styles.adminTitle}>Administrator</Text>
            </View>
            <TouchableOpacity onPress={handleLogout}>
                  <View style={styles.navItem}>
                    <Icon name="logout" size={24} color="#fff" />
                  </View>
                </TouchableOpacity>

          </View>
        </View>

            {/* Menu Modal */}
            {/* <Modal
              visible={menuVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setMenuVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPressOut={() => setMenuVisible(false)}
              >
                <View 
                  animation="fadeInUp"
                  duration={300}
                  style={styles.menuContainer}
                >
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => {
                      setMenuVisible(false);
                      handleLogout();
                    }}
                  >
                    <Icon name="logout" size={20} color="#ef4444" style={styles.menuIcon} />
                    <Text style={[styles.menuText, { color: '#ef4444' }]}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal> */}

           <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchAllData}
              colors={['#1c78f2']}
              tintColor="#1c78f2"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Cards - Hexagonal Design */}
          <View style={styles.statsContainer}>
            <View style={[styles.hexagonCard, styles.doctorCard]}>
              <View style={styles.hexagon}>
                <View style={styles.hexagonInner}>
                  <Icon name="medical-services" size={32} color="#fff" />
                </View>
                <View style={styles.hexagonBefore} />
                <View style={styles.hexagonAfter} />
              </View>
              <Text style={styles.statNumber}>{doctorCount}</Text>
              <Text style={styles.statLabel}>Doctors</Text>
            </View>

            <View style={[styles.hexagonCard, styles.labCard]}>
              <View style={styles.hexagon}>
                <View style={styles.hexagonInner}>
                  <Icon name="science" size={32} color="#fff" />
                </View>
                <View style={styles.hexagonBefore} />
                <View style={styles.hexagonAfter} />
              </View>
              <Text style={styles.statNumber}>{labCount}</Text>
              <Text style={styles.statLabel}>Labs</Text>
            </View>

            <View style={[styles.hexagonCard, styles.ambulanceCard]}>
              <View style={styles.hexagon}>
                <View style={styles.hexagonInner}>
                  <Icon name="local-hospital" size={32} color="#fff" />
                </View>
                <View style={styles.hexagonBefore} />
                <View style={styles.hexagonAfter} />
              </View>
              <Text style={styles.statNumber}>{ambulanceCount}</Text>
              <Text style={styles.statLabel}>Ambulances</Text>
            </View>
          </View>

          {/* Appointments Section - Glass Morphism Design */}
          <TouchableOpacity style={styles.glassCard} onPress={() => navigation.navigate('DoctorAppointmentList')}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerIcon}>
                <Icon name="insert-chart" size={24} color="#1c78f2" />
              </View>
              <Text style={styles.sectionTitle}>Appointments Analytics</Text>
              <View style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>Details</Text>
                <Icon name="chevron-right" size={18} color="#1c78f2" />
              </View>
            </View>

            {loadingCharts ? (
              <View style={styles.chartLoading}>
                <ActivityIndicator size="small" color="#1c78f2" />
              </View>
            ) : appointments.length > 0 ? (
              <View style={styles.chartContainer}>
                <BarChart
                  data={shiftChartData}
                  width={screenWidth - 60}
                  height={220}
                  chartConfig={{
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: '#1c78f2'
                    }
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="event-busy" size={48} color="#c7d2fe" />
                <Text style={styles.emptyText}>No appointments data</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Lab Tests Section - Neumorphic Design */}
          <TouchableOpacity style={styles.neumorphicCard} onPress={() => navigation.navigate('LabTestList')}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerIcon}>
                <Icon name="biotech" size={24} color="#10b981" />
              </View>
              <Text style={[styles.sectionTitle, {color: '#10b981'}]}>Lab Tests Analysis</Text>
              <View style={styles.viewAllButton}>
                <Text style={[styles.viewAllText, {color: '#10b981'}]}>Details</Text>
                <Icon name="chevron-right" size={18} color="#10b981" />
              </View>
            </View>

            {loadingCharts ? (
              <View style={styles.chartLoading}>
                <ActivityIndicator size="small" color="#10b981" />
              </View>
            ) : labTests.length > 0 ? (
              <View style={styles.chartContainer}>
                <BarChart
                  data={testTypeBarData}
                  width={Math.max(testTypeBarData.labels.length * 60, screenWidth - 60)}
                  height={220}
                  chartConfig={{
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    }
                  }}
                  style={styles.chart}
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="science" size={48} color="#a7f3d0" />
                <Text style={[styles.emptyText, {color: '#10b981'}]}>No lab tests data</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Pending Approvals - Card with Folded Corner */}
          <TouchableOpacity style={styles.foldedCard} onPress={() => navigation.navigate('PendingAccounts')}>
            <View style={styles.foldCorner} />
            <View style={styles.sectionHeader}>
              <View style={styles.headerIcon}>
                <Icon name="pending-actions" size={24} color="#f59e0b" />
              </View>
              <View style={styles.titleWithBadge}>
                <Text style={[styles.sectionTitle, {color: '#f59e0b'}]}>Pending Approvals</Text>
                {pendingUsers.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingUsers.length}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={[styles.viewAllText, {color: '#f59e0b'}]}>View All</Text>
                <Icon name="chevron-right" size={18} color="#f59e0b" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color="#f59e0b" style={styles.loader} />
            ) : pendingUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="check-circle" size={48} color="#fde68a" />
                <Text style={[styles.emptyText, {color: '#f59e0b'}]}>All caught up!</Text>
              </View>
            ) : (
              <FlatList
                data={pendingUsers.slice(0, 3)}
                renderItem={renderPendingAccount}
                keyExtractor={(item) => item.user_id.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </TouchableOpacity>

          
         {/* Recent Registrations - Tabbed Interface */}
<View style={styles.tabbedContainer}>
  <View style={styles.tabHeader}>
    <View style={styles.headerIcon}>
      <Icon name="group-add" size={24} color="#1c78f2" />
    </View>
    <Text style={styles.sectionTitle}>Recent Registrations</Text>
  </View>
  
  <View style={styles.tabs}>
    <TouchableOpacity 
      style={[
        styles.tab, 
        activeTab === 'doctors' && styles.activeTab
      ]}
      onPress={() => setActiveTab('doctors')}
    >
      <Text style={[
        styles.tabText,
        activeTab === 'doctors' && styles.activeTabText
      ]}>
        Doctors
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[
        styles.tab, 
        activeTab === 'labs' && styles.activeTab
      ]}
      onPress={() => setActiveTab('labs')}
    >
      <Text style={[
        styles.tabText,
        activeTab === 'labs' && styles.activeTabText
      ]}>
        Labs
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[
        styles.tab, 
        activeTab === 'ambulances' && styles.activeTab
      ]}
      onPress={() => setActiveTab('ambulances')}
    >
      <Text style={[
        styles.tabText,
        activeTab === 'ambulances' && styles.activeTabText
      ]}>
        Ambulances
      </Text>
    </TouchableOpacity>
  </View>

  <View style={styles.tabContent}>
    {activeTab === 'doctors' && (
      recentDoctors.length > 0 ? (
        <FlatList
          data={recentDoctors}
          renderItem={renderDoctorItem}
          keyExtractor={(item) => item.user_id.toString()}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon name="medical-services" size={48} color="#c7d2fe" />
          <Text style={styles.emptyText}>No recent doctors</Text>
        </View>
      )
    )}

    {activeTab === 'labs' && (
      recentLabs.length > 0 ? (
        <FlatList
          data={recentLabs}
          renderItem={renderLabItem}
          keyExtractor={(item) => item.user_id.toString()}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon name="science" size={48} color="#a7f3d0" />
          <Text style={[styles.emptyText, {color: '#10b981'}]}>No recent labs</Text>
        </View>
      )
    )}

    {activeTab === 'ambulances' && (
      recentAmbulances.length > 0 ? (
        <FlatList
          data={recentAmbulances}
          renderItem={renderAmbulanceItem}
          keyExtractor={(item) => item.user_id.toString()}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon name="local-hospital" size={48} color="#fde68a" />
          <Text style={[styles.emptyText, {color: '#f59e0b'}]}>No recent ambulances</Text>
        </View>
      )
    )}
  </View>
</View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullFlex: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    paddingTop: 100,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1c78f2',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 30,
    zIndex: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    color: '#e0e7ff',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  adminTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  menuButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 15,
  },
  hexagonCard: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  doctorCard: {
    backgroundColor: '#eef2ff',
  },
  labCard: {
    backgroundColor: '#ecfdf5',
  },
  ambulanceCard: {
    backgroundColor: '#fffbeb',
  },
  hexagon: {
    width: 60,
    height: 34.64,
    position: 'relative',
    marginBottom: 15,
  },
  hexagonInner: {
    width: 60,
    height: 34.64,
    backgroundColor: '#1c78f2',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  hexagonBefore: {
    position: 'absolute',
    top: -17.32,
    left: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 30,
    borderLeftColor: 'transparent',
    borderRightWidth: 30,
    borderRightColor: 'transparent',
    borderBottomWidth: 17.32,
    borderBottomColor: '#1c78f2',
  },
  hexagonAfter: {
    position: 'absolute',
    bottom: -17.32,
    left: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 30,
    borderLeftColor: 'transparent',
    borderRightWidth: 30,
    borderRightColor: 'transparent',
    borderTopWidth: 17.32,
    borderTopColor: '#1c78f2',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    backdropFilter: 'blur(10px)',
  },
  neumorphicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#e2e8f0',
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  foldedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  foldCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderRightWidth: 40,
    borderTopWidth: 40,
    borderRightColor: 'transparent',
    borderTopColor: '#fef3c7',
    transform: [{ rotate: '180deg' }],
  },
  tabbedContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    flex: 1,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#b91c1c',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1c78f2',
    marginRight: 4,
  },
  chartContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 16,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1c78f2',
    marginTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 16,
  },
  tab: {
    paddingBottom: 8,
    marginRight: 16,
  },
  activeTab: {
  borderBottomWidth: 2,
  borderBottomColor: '#1c78f2',
},
activeTabText: {
  color: '#1c78f2',
  fontFamily: 'Inter-SemiBold',
},
tabHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 16,
},
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  tabContent: {
    minHeight: 200,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#d1fae5',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  buttonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  moreText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginLeft: 8,
  },
   /* Doctor Item Styles */
  doctorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1c78f2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  doctorName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 6,
  },
  doctorSpecialty: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },

  /* Lab Item Styles */
  labItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  labInfo: {
    flex: 1,
    marginLeft: 12,
  },
  labName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 6,
  },
  labType: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },

  /* Ambulance Item Styles */
  ambulanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  ambulanceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  ambulanceName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 6,
  },
  ambulanceNumber: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },

  /* Shared Status Styles */
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeStatus: {
    backgroundColor: '#d1fae5',
  },
  inactiveStatus: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  activeText: {
    color: '#059669',
  },
  inactiveText: {
    color: '#b91c1c',
  },

  /* Detail Chip Styles */
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },

  /* Last Item Indicator */
  lastItem: {
    position: 'relative',
    paddingBottom: 24,
  },
  moreText: {
    position: 'absolute',
    bottom: 8,
    right: 16,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
});


export default AdminDashboard;