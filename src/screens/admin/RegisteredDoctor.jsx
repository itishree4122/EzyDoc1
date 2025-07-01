import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput
} from 'react-native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import { useNavigation } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth';
const ITEMS_PER_PAGE = 15;


const RegisteredDoctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigation = useNavigation();
  const [showSearch, setShowSearch] = useState(false);



  const fetchDoctors = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      // const response = await fetch(`${BASE_URL}/doctor/get_all/`, {
      const response = await fetchWithAuth(`${BASE_URL}/doctor/get_all/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();

      // Sort newest to oldest (assuming latest ones have higher doctor_user_id)
      const sortedDoctors = [...data].sort(
        (a, b) => b.doctor_user_id - a.doctor_user_id
      );

      setDoctors(sortedDoctors);
    } catch (error) {
      console.error('Error fetching doctor data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filtered and paginated data using useMemo
 const paginatedDoctors = useMemo(() => {
  const filtered = doctors.filter((doctor) =>
    doctor.doctor_user_id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🔍 Detect duplicate doctor_user_id values
  const ids = new Set();
  filtered.forEach((doc) => {
    if (ids.has(doc.doctor_user_id)) {
      console.warn('❗ Duplicate doctor_user_id detected:', doc.doctor_user_id);
    } else {
      ids.add(doc.doctor_user_id);
    }
  });

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  return filtered.slice(startIndex, endIndex);
}, [doctors, searchQuery, currentPage]);


  const totalPages = useMemo(() => {
    const filteredLength = doctors.filter((doctor) =>
      doctor.doctor_user_id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialist.toLowerCase().includes(searchQuery.toLowerCase())
    ).length;

    return Math.ceil(filteredLength / ITEMS_PER_PAGE);
  }, [doctors, searchQuery]);

  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };



const renderItem = ({ item }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{item.doctor_name}</Text>
      <View style={styles.tag}>
        <Text style={styles.tagText}>{item.specialist}</Text>
      </View>
    </View>

    <View style={styles.cardBody}>
      <View style={styles.cardRow}>
        <Image source={require('../assets/admin/user.png')} style={styles.icon} />
        <Text style={styles.cardLabel}>ID:</Text>
        <Text style={styles.cardValue}>{item.doctor_user_id}</Text>
      </View>

      <View style={styles.cardRow}>
        <Image source={require('../assets/admin/suitcase.png')} style={styles.icon} />
        <Text style={styles.cardLabel}>Experience:</Text>
        <Text style={styles.cardValue}>{item.experience} yrs</Text>
      </View>
    </View>
  </View>
);





  return (

    <>

    {/* Custom Toolbar */}
<View style={styles.toolbar}>
  {/* Back Button */}
  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconWrapper}>
    <Image
      source={require("../assets/UserProfile/back-arrow.png")}
      style={styles.toolbarIcon}
    />
  </TouchableOpacity>

  {/* Title */}
  <Text style={styles.toolbarTitle}>Registered Doctor</Text>

  {/* Search Toggle Button */}
  <TouchableOpacity
    onPress={() => setShowSearch((prev) => !prev)}
    style={styles.iconWrapper}
  >
    <Image
      source={require("../assets/search.png")}
      style={styles.toolbarIcon}
    />
  </TouchableOpacity>
</View>

{/* Toggleable Search Input Field */}
{showSearch && (
  <View style={styles.searchContainer}>
    <TextInput
      placeholder="Search for doctors..."
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

                 <SafeAreaView style={styles.container}>
      
      {loading ? (
        <Text style={[styles.loadingText, { marginTop: 60 }]}>Loading data...</Text>
      ) : (
        <FlatList
  contentContainerStyle={{ paddingBottom: 100 }}
  data={paginatedDoctors}
  renderItem={renderItem}
  keyExtractor={(item, index) => `${item.doctor_user_id}-${index}`}
  ListEmptyComponent={<Text style={styles.emptyText}>No doctors found.</Text>}
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

export default RegisteredDoctor;

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
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: '#6B7280',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingBottom: 80,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  tableWrapper: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 6,
  backgroundColor: '#ffffff',
  marginHorizontal: 20,
  marginBottom: 20,
  overflow: 'hidden',
},
headerRow: {
    flexDirection: 'row',
    backgroundColor: '#D1D5DB',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
  },
  headerCell: {
    
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  cell: {
    
    fontSize: 13,
    color: '#1F2937',
    textAlign: 'center',
  },
rowEven: {
  backgroundColor: '#ffffff',
},
rowOdd: {
  backgroundColor: '#F3F4F6',
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
  pageButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  pageText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 13,
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

tag: {
  backgroundColor: '#dbeafe',
  borderRadius: 12,
  paddingHorizontal: 10,
  paddingVertical: 4,
},

tagText: {
  fontSize: 12,
  color: '#1c78f2',
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



});

