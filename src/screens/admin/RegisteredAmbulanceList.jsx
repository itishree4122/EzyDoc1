import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { getToken } from '../auth/tokenHelper'; // adjust path if needed
import { BASE_URL } from '../auth/Api'; // adjust path if needed
import { useNavigation } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth'

const ITEMS_PER_PAGE = 15;

const RegisteredAmbulanceList = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const [showSearch, setShowSearch] = useState(false);

  

  const fetchAmbulances = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'No access token found');
        setLoading(false);
        return;
      }

      // const response = await fetch(`${BASE_URL}/ambulance/status/`, {
      const response = await fetchWithAuth(`${BASE_URL}/ambulance/status/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Sort: newest to oldest
      const sorted = [...(data.ambulances || [])].reverse();

      setAmbulances(sorted);
    } catch (error) {
      console.error('Error fetching ambulances:', error);
      Alert.alert('Error', 'Failed to fetch ambulance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const filteredAmbulances = useMemo(() => {
  return ambulances.filter(item => {
    const nameMatch = item.service_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const areaMatch = item.service_area?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || areaMatch;
  });
}, [ambulances, searchQuery]);

const pageCount = Math.ceil(filteredAmbulances.length / ITEMS_PER_PAGE);

const paginatedData = filteredAmbulances.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);

const renderItem = ({ item }) => (
  <View style={styles.ambulanceCard}>
    <View style={styles.cardTopStrip} />

    <View style={styles.cardBody}>
      <View style={styles.cardHeader}>
        <Text style={styles.serviceName}>{item.service_name}</Text>
        <View style={[styles.statusPill, { backgroundColor: item.active ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[styles.statusPillText, { color: item.active ? '#15803D' : '#B91C1C' }]}>
            {item.active ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>

      <View style={styles.cardInfoRow}>
        <InfoBox
          icon={require('../assets/admin/lighting.png')}
          title="Vehicle"
          value={item.vehicle_number}
          bgColor="#E0F2FE"
        />
        <InfoBox
          icon={require('../assets/admin/phone-call.png')}
          title="Phone"
          value={item.phone_number}
          bgColor="#FEF9C3"
        />
      </View>

      <View style={styles.cardInfoRow}>
        <InfoBox
          icon={require('../assets/admin/whatsapp.png')}
          title="WhatsApp"
          value={item.whatsapp_number}
          bgColor="#DCFCE7"
        />
        <InfoBox
          icon={require('../assets/admin/location.png')}
          title="Area"
          value={item.service_area?.split(',').join(', ')}
          bgColor="#F3E8FF"
        />
      </View>
    </View>
  </View>
);

const InfoBox = ({ icon, title, value, bgColor }) => (
  <View style={[styles.infoBox]}>
    <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
      <Image source={icon} style={styles.infoIcon} />
    </View>
    <View style={styles.infoTextGroup}>
      <Text style={styles.infoLabel}>{title}</Text>
      <Text style={styles.infoValue}>{value || 'N/A'}</Text>
    </View>
  </View>
);
  // Handle pagination
  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === 'next' && currentPage < pageCount) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  

  return (

    <>

  <View style={styles.toolbar}>
  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
    <Image
      source={require("../assets/UserProfile/back-arrow.png")}
      style={styles.backIcon}
    />
  </TouchableOpacity>

  <Text style={styles.toolbarTitle}>Registered Ambulance</Text>

  <TouchableOpacity onPress={() => setShowSearch(prev => !prev)} style={styles.searchButton}>
    <Image
      source={require("../assets/search.png")}
      style={styles.toolbarSearchIcon}
    />
  </TouchableOpacity>
</View>

 {showSearch && (
  <View style={styles.searchContainer}>
    <TextInput
      placeholder="Search ambulances..."
      placeholderTextColor="#888"
      style={styles.searchInput}
      value={searchQuery}
      onChangeText={setSearchQuery}
    />
    
  </View>
)}
    <SafeAreaView style={styles.container}>
  <View style={{ flex: 1 }}>
   <View style={styles.cardList}>
  {loading ? (
    <Text style={[styles.loadingText, { marginTop: 40 }]}>Loading data...</Text>
  ) : (
    <FlatList
      data={paginatedData}
      showsVerticalScrollIndicator={false}
      keyExtractor={(item, index) => `${item.vehicle_number}-${index}`}
      renderItem={renderItem}
      ListEmptyComponent={<Text style={styles.emptyText}>No ambulances found.</Text>}
    />
  )}
</View>


    {/* Padding added below to make space for fixed pagination */}
    <View style={{ height: 70 }} />
  </View>

  {/* Fixed Bottom Pagination */}
  <View style={styles.fixedPagination}>
  <TouchableOpacity
    disabled={currentPage === 1}
    onPress={() => handlePageChange('prev')}
  >
    <Image
      source={require('../assets/admin/backward-button.png')}
      style={[
        styles.paginationIcon,
        currentPage === 1 && styles.disabledIcon,
      ]}
    />
  </TouchableOpacity>

  <Text style={styles.pageNumber}>
    Page {currentPage} of {pageCount}
  </Text>

  <TouchableOpacity
    disabled={currentPage === pageCount}
    onPress={() => handlePageChange('next')}
  >
    <Image
      source={require('../assets/admin/forward-button.png')}
      style={[
        styles.paginationIcon,
        currentPage === pageCount && styles.disabledIcon,
      ]}
    />
  </TouchableOpacity>
</View>


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

backButton: {
  padding: 6,
  justifyContent: 'center',
  alignItems: 'center',
},

backIcon: {
  width: 22,
  height: 22,
  tintColor: "#000",
},

searchButton: {
  padding: 6,
},

toolbarSearchIcon: {
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

searchIcon: {
  width: 20,
  height: 20,
  tintColor: "#999",
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






pageText: {
  color: '#fff',
  fontWeight: 'bold',
},

pageNumber: {
  fontWeight: 'bold',
  fontSize: 15,
  color: '#444',
},


paginationIcon: {
  width: 20,
  height: 20,
  resizeMode: 'contain',
  tintColor: '#4169E1', // Optional: remove if icons are already colored
  marginHorizontal: 10,
},

disabledIcon: {
  tintColor: '#B0B0B0', // or 'gray' to show it's disabled
  opacity: 0.5,
},


iconButton: {
  padding: 8,
},


fixedPagination: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 20,
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
cardList: {
  
  paddingTop: 0,
  paddingBottom: 15,
  marginBottom: 30, // Adjusted to account for fixed pagination
},
ambulanceCard: {
  marginHorizontal: 5,
  marginVertical: 12,
  borderRadius: 16,
  backgroundColor: '#ffffff',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.0,
  shadowRadius: 5,
  elevation: 1,
},

cardTopStrip: {
  height: 6,
  backgroundColor: '#3B82F6',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
},

cardBody: {
  padding: 16,
},

cardHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 14,
},

serviceName: {
  fontSize: 18,
  fontWeight: '600',
  color: '#1E293B',
  flex: 1,
},

statusPill: {
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 50,
},

statusPillText: {
  fontSize: 12,
  fontWeight: '700',
},

cardInfoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 10,
  gap: 10,
},

infoBox: {
  flex: 1,
  backgroundColor: '#F9FAFB',
  borderRadius: 12,
  padding: 12,
  flexDirection: 'row',
  alignItems: 'center',
},

iconCircle: {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 10,
},

infoIcon: {
  width: 18,
  height: 18,
  tintColor: '#1E293B',
},

infoTextGroup: {
  flex: 1,
},

infoLabel: {
  fontSize: 12,
  color: '#6B7280',
  fontWeight: '500',
},

infoValue: {
  fontSize: 14,
  color: '#111827',
  fontWeight: '600',
  marginTop: 2,
},


});
