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

const ITEMS_PER_PAGE = 15;

const RegisteredAmbulanceList = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
  

  const fetchAmbulances = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'No access token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/ambulance/status/`, {
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


  const renderHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.cell, styles.headerCell]}>Service Name</Text>
      <Text style={[styles.cell, styles.headerCell]}>Vehicle No.</Text>
      <Text style={[styles.cell, styles.headerCell]}>Phone</Text>
      <Text style={[styles.cell, styles.headerCell]}>WhatsApp</Text>
      <Text style={[styles.cell, styles.headerCell]}>Service Area</Text>
      <Text style={[styles.cell, styles.headerCell]}>Active</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.service_name}</Text>
      <Text style={styles.cell}>{item.vehicle_number}</Text>
      <Text style={styles.cell}>{item.phone_number}</Text>
      <Text style={styles.cell}>{item.whatsapp_number}</Text>
      <Text style={styles.cell}>
  {item.service_area
    .split(',')
    .map((area) => area.trim())
    .join('\n')}
</Text>

      <Text style={styles.cell}>{item.active ? 'Yes' : 'No'}</Text>
    </View>
  );

  

  const handlePageChange = (direction) => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    } else if (direction === 'next' && currentPage < pageCount) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#6495ED" />
      </SafeAreaView>
    );
  }

  return (

    <>

    <View style={styles.toolbar}>
                   <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                          <View style={styles.backIconContainer}>
                            <Image
                              source={require("../assets/UserProfile/back-arrow.png")} // Replace with your back arrow image
                              style={styles.backIcon}
                            />
                          </View>
                        </TouchableOpacity>
                    
                  </View>
                   {/* Search Bar */}
                         <View style={styles.searchContainer}>
                          <TextInput
                            placeholder="Search for doctors..."
                            placeholderTextColor="#888"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                          />
                          <Image
                            source={require("../assets/search.png")}
                            style={styles.searchIcon}
                          />
                        </View>
    <SafeAreaView style={styles.container}>

        <View style={styles.tableContainer}>

            <ScrollView horizontal>
        <View>
          {renderHeader()}
          <FlatList
            data={paginatedData}
            keyExtractor={(item, index) => `${item.vehicle_number}-${index}`}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={styles.emptyText}>No ambulances found.</Text>}
          />
        </View>
      </ScrollView>
        </View>
      

      {/* Pagination Controls */}
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
          disabled={currentPage === 1}
          onPress={() => handlePageChange('prev')}
        >
          <Text style={styles.pageText}>Previous</Text>
        </TouchableOpacity>

        <Text style={styles.pageNumber}>
          Page {currentPage} of {pageCount}
        </Text>

        <TouchableOpacity
          style={[styles.pageButton, currentPage === pageCount && styles.disabledButton]}
          disabled={currentPage === pageCount}
          onPress={() => handlePageChange('next')}
        >
          <Text style={styles.pageText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    
    </>
    
  );
};

export default RegisteredAmbulanceList;

const styles = StyleSheet.create({
    tableContainer: {
  margin: 16, // adjust to your desired space
  backgroundColor: '#fff',
  
  
  overflow: 'hidden',
},

  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff'
  },
   toolbar: {
    backgroundColor: "#6495ED",
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 10, // Adds spacing between icon and title
  },
  backIconContainer: {
    width: 30,
    height: 30,
    backgroundColor: "#AFCBFF", // White background
    borderRadius: 20, // Makes it circular
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
    
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
    
    
  },
  
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  headerRow: {
    backgroundColor: '#6495ED', // Blue header
  },
  cell: {
    width: 150,
    fontSize: 14,
    paddingHorizontal: 5,
    flexShrink: 1,
  },
  headerCell: {
    fontWeight: 'bold',
    color: 'white',
  },
  emptyText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#888',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  pageButton: {
    backgroundColor: '#6495ED',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  pageText: {
    color: 'white',
    fontWeight: '600',
  },
  pageNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#a0bfe4',
  },
});
