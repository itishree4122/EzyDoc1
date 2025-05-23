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

const ITEMS_PER_PAGE = 15;


const RegisteredDoctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDoctors = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${BASE_URL}/doctor/get_all/`, {
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
    <View style={styles.row}>
      <Text style={styles.cell}>{item.doctor_user_id}</Text>
      <Text style={styles.cell}>{item.doctor_name}</Text>
      <Text style={styles.cell}>{item.specialist}</Text>
      <Text style={styles.cell}>{item.experience} yrs</Text>
    </View>
  );

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
          onChangeText={(text) => {
            setSearchQuery(text);
            setCurrentPage(1); // Reset page when search changes
          }}
        />
                  <Image
                    source={require("../assets/search.png")}
                    style={styles.searchIcon}
                  />
                </View>

                 <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Registered Doctors</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6495ED" />
      ) : (
        <ScrollView horizontal={true}>
          <View>
            {/* Table Header */}
            <View style={[styles.row, styles.headerRow]}>
              <Text style={styles.headerCell}>ID</Text>
              <Text style={styles.headerCell}>Name</Text>
              <Text style={styles.headerCell}>Specialist</Text>
              <Text style={styles.headerCell}>Experience</Text>
            </View>

           <FlatList
                data={paginatedDoctors}
                renderItem={renderItem}
                keyExtractor={(item) => item.doctor_user_id.toString()}
                ListEmptyComponent={<Text style={styles.emptyText}>No doctors found.</Text>}
              />

          </View>
        </ScrollView>
      )}

      {/* Pagination Controls */}
        {!loading && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
              disabled={currentPage === 1}
              onPress={() => handlePageChange('prev')}
            >
              <Text style={styles.pageText}>Previous</Text>
            </TouchableOpacity>

            <Text style={styles.pageNumber}>
              Page {currentPage} of {totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
              disabled={currentPage === totalPages}
              onPress={() => handlePageChange('next')}
            >
              <Text style={styles.pageText}>Next</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F4F6FC',
    padding: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 8,
  },
  headerRow: {
    backgroundColor: '#6495ED',
  },
  cell: {
    width: 120,
    paddingHorizontal: 6,
    color: '#333',
  },
  headerCell: {
    width: 120,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    color: '#fff',
  },

  pagination: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  marginVertical: 10,
},
pageButton: {
  padding: 10,
  backgroundColor: '#6495ED',
  marginHorizontal: 5,
  borderRadius: 5,
},
disabledButton: {
  backgroundColor: '#ccc',
},
pageText: {
  color: '#fff',
  fontWeight: 'bold',
},
pageNumber: {
  fontSize: 16,
  marginHorizontal: 10,
},

});
