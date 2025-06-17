// LabTypesScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  TextInput,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import { useLocation } from '../../context/LocationContext';
const LabTestClinics = () => {
  const [labTypes, setLabTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLabType, setSelectedLabType] = useState(null);

  const navigation = useNavigation();
const { selectedLocation } = useLocation();

  const fetchLabTypes = async () => {
  try {
    const token = await getToken();
    if (!token) throw new Error('Token not found');
let url = `${BASE_URL}/labs/lab-types/`;
      if (selectedLocation && selectedLocation !== "Select Location" && selectedLocation !== "All") {
      url += `?location=${encodeURIComponent(selectedLocation)}`;
    }
    console.log("Fetching Labs from URL:", url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Unexpected response format');

    const normalizedData = data.map(item => ({
      ...item,
      lab_profiles: Array.isArray(item.lab_profiles) ? item.lab_profiles : [],
    }));

    setLabTypes(normalizedData);
  } catch (error) {
    console.error('Error fetching lab types:', error.message);
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchLabTypes();
  }, [selectedLocation]);

  const renderItem = ({ item }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => {
      setSelectedLabType(item); // Save full lab type object
      setModalVisible(true);    // Show lab selector
    }}
  >
    <Text style={styles.name}>{item.name}</Text>
    <Text style={styles.tests}>Tests: {item.tests.join(', ')}</Text>

    {item.lab_profiles.length > 0 ? (
      item.lab_profiles.map((profile, index) => (
        <View key={index} style={styles.profileContainer}>
          <Text style={styles.profileText}><Text style={styles.boldLabel}>Lab Name:</Text> {profile.name}</Text>
          <Text style={styles.profileText}><Text style={styles.boldLabel}>Address:</Text> {profile.address}</Text>
          <Text style={styles.profileText}><Text style={styles.boldLabel}>Phone:</Text> {profile.phone}</Text>
          <Text style={styles.profileText}><Text style={styles.boldLabel}>Home Sample Collection:</Text> {profile.home_sample_collection ? 'Yes' : 'No'}</Text>
          <Text style={styles.profileText}><Text style={styles.boldLabel}>ID:</Text> {profile.id}</Text>
        </View>
      ))
    ) : (
      <Text style={styles.tests}>Lab Profile: Not Available</Text>
    )}
  </TouchableOpacity>
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
                    onChangeText={setSearchQuery}
                  />
                  <Image
                    source={require("../assets/search.png")}
                    style={styles.searchIcon}
                  />
                </View>
    
    <FlatList
      data={labTypes}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      ListHeaderComponent={
        <>
          {/* <Text style={styles.header}>Lab Types</Text> */}
          {loading && <ActivityIndicator size="large" color="#007BFF" />}
        </>
      }
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        !loading && <Text style={styles.noDataText}>No lab types found.</Text>
      }
    />
    <Modal
  visible={modalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalHeader}>Select Lab Location</Text>

      <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}
>
        {selectedLabType?.lab_profiles?.map((profile) => (
          <TouchableOpacity
            key={profile.id}
            style={styles.profileCard}
            activeOpacity={0.85}
            onPress={() => {
              setModalVisible(false);
              navigation.navigate('BookingLabScreen', {
                labName: selectedLabType.name,
                services: selectedLabType.tests,
                labProfile: profile,
              });
            }}
          >
            <Text style={styles.labName}>{profile.name}</Text>
            <Text style={styles.labDetail}>📍 {profile.address}</Text>
            <Text style={styles.labDetail}>📞 {profile.phone}</Text>
            <Text style={styles.labDetail}>
              🧪 Home Collection: {profile.home_sample_collection ? 'Yes' : 'No'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
        <Text style={styles.closeBtnText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>



    </>
    
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
   
    flexGrow: 1, // Important to make sure the whole screen scrolls
  },

  toolbar: {
    backgroundColor: "#1c78f2",
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
    // elevation: 2,
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
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tests: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  profileContainer: {
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  profileText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
  },
  boldLabel: {
    fontWeight: 'bold',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 16,
  },
//  modal
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  justifyContent: 'center',
  alignItems: 'center',
},

modalContainer: {
  width: '90%',
  maxHeight: '90%',
  backgroundColor: '#ffffff',
  borderRadius: 16,
  paddingTop: 20,
  paddingHorizontal: 20,
  paddingBottom: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 10,
  elevation: 8,
},

modalHeader: {
  fontSize: 20,
  fontWeight: '700',
  textAlign: 'center',
  marginBottom: 16,
  color: '#1c1c1e',
},

modalBody: {
  height: '100%',
  width: '100%'
},

profileCard: {
  backgroundColor: '#f8f8f8',
  borderRadius: 10,
  padding: 14,
  marginBottom: 12,
  borderLeftWidth: 4,
  borderLeftColor: '#3478f6',
},

labName: {
  fontSize: 16,
  fontWeight: '600',
  color: '#222222',
  marginBottom: 4,
},

labDetail: {
  fontSize: 14,
  color: '#555555',
  marginBottom: 2,
},

closeBtn: {
  marginTop: 10,
  alignSelf: 'center',
  paddingVertical: 10,
  paddingHorizontal: 28,
  borderRadius: 8,
  backgroundColor: '#e0e0e0',
},

closeBtnText: {
  fontSize: 16,
  fontWeight: '500',
  color: '#1c1c1e',
},


});

export default LabTestClinics;
