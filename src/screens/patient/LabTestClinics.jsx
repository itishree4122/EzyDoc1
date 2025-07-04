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
import { fetchWithAuth } from '../auth/fetchWithAuth'
import LinearGradient from 'react-native-linear-gradient';


const LabTestClinics = () => {
  const [labTypes, setLabTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLabType, setSelectedLabType] = useState(null);
  const [expandedLabId, setExpandedLabId] = useState(null);

  const navigation = useNavigation();
  const { selectedLocation } = useLocation();

  const fetchLabTypes = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Token not found');
      let url = `${BASE_URL}/labs/lab-types/`;
      if (
        selectedLocation &&
        selectedLocation !== 'Select Location' &&
        selectedLocation !== 'All'
      ) {
        url += `?location=${encodeURIComponent(selectedLocation)}`;
      }

      // const response = await fetch(url, {
      const response = await fetchWithAuth(url, {
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
        lab_profiles: Array.isArray(item.lab_profiles)
          ? item.lab_profiles
          : [],
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
  <View style={styles.labCard}>
    {/* Top Section: Icon + Name */}
    <View style={styles.topSection}>
      <View style={styles.iconContainer}>
        <Image
          source={require('../assets/labtests/laboratorium.png')}
          style={styles.iconImage}
        />
      </View>
      <Text style={styles.labTitle}>{item.name}</Text>
    </View>

    {/* Tests Provided */}
    <Text style={styles.labTests}>
      {item.tests && item.tests.length > 0
        ? `Tests: ${item.tests.join(', ')}`
        : 'No tests available'}
    </Text>

    {/* Lab Profiles Horizontal Scroll (always visible) */}
    {item.lab_profiles && item.lab_profiles.length > 0 && (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.profilesContainer}
      >
        {item.lab_profiles.map(profile => (
          <TouchableOpacity
            key={profile.id}
            style={styles.profileCard}
            activeOpacity={0.9}
            onPress={() => {
              navigation.navigate('BookingLabScreen', {
                labName: item.name,
                services: item.tests,
                labProfile: profile,
              });
            }}
          >
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileInfo}>{profile.address}</Text>
            <Text style={[styles.profileInfo, { opacity: 0, height: 0 }]}>
              {profile.phone}
            </Text>

                   <Text style={[styles.profileInfo, ]}>
                      Home Collection:{' '}
                      <Text style={{
                        fontWeight: 'bold',
                        color: profile.home_sample_collection ? '#000' : '#e74c3c'
                      }}>
                        {profile.home_sample_collection ? 'Yes' : 'No'}
                      </Text>
                    </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )}
  </View>
);


  const filteredLabTypes = labTypes.filter(item => {
  const query = searchQuery.toLowerCase();

  const matchName = item.name?.toLowerCase().includes(query);
  const matchTest = item.tests?.some(test =>
    test.toLowerCase().includes(query)
  );
  const matchProfileName = item.lab_profiles?.some(profile =>
    profile.name?.toLowerCase().includes(query)
  );
  const matchAddress = item.lab_profiles?.some(profile =>
    profile.address?.toLowerCase().includes(query)
  );

  return matchName || matchTest || matchProfileName || matchAddress;
});


  return (
    <>
      <View style={styles.toolbar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <View style={styles.backIconContainer}>
            <Image
              source={require('../assets/UserProfile/back-arrow.png')}
              style={styles.backIcon}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search for doctors..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Image
          source={require('../assets/search.png')}
          style={styles.searchIcon}
        />
      </View>

   <FlatList
  data={filteredLabTypes}
  keyExtractor={item => item.id.toString()}
  renderItem={renderItem}
  numColumns={1}  // ✅ Single column (one card per row)
  contentContainerStyle={styles.container}
  ListHeaderComponent={
    <>
      {loading && (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginVertical: 16 }} />
      )}
    </>
  }
  ListEmptyComponent={
    !loading && (
      <Text style={styles.noDataText}>No lab types found.</Text>
    )
  }
/>


    </>
  );
};

const styles = StyleSheet.create({
  container: {
    
    backgroundColor: 'sstransparent',
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
    backgroundColor: "#7EB8F9", // White background
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
  labCard: {
  backgroundColor: '#fff',
  borderRadius: 0,
  padding: 16,
  marginBottom: 16,
  
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
},

topSection: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},

iconContainer: {
  backgroundColor: '#e6f0ff',
  borderRadius: 25,
  padding: 10,
  marginRight: 10,
},

iconImage: {
  width: 30,
  height: 30,
  resizeMode: 'contain',
  tintColor: '#0047ab'
},

labTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
},

labTests: {
  marginTop: 8,
  fontSize: 14,
  color: '#555',
  marginBottom: 12,
},

profilesContainer: {
  paddingVertical: 8,
},

profileCard: {
  backgroundColor: '#fff',
  borderRadius: 2,
  padding: 12,
  marginRight: 12,
  width: 230,
  borderWidth: 1,
  borderColor: '#ccc',
   // iOS Shadow
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},

profileName: {
  fontSize: 15,
  fontWeight: 'bold',
  marginBottom: 6,
},

profileInfo: {
  fontSize: 13,
  color: '#666',
  marginBottom: 4,
},




closeBtn: {
  marginTop: 14,
  alignSelf: 'center',
  paddingVertical: 10,
  paddingHorizontal: 28,
  backgroundColor: '#1c78f2',
  borderRadius: 8,
  position: 'absolute',
  bottom: 20,
  
},

closeBtnText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},
// banner contant
bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  leftContent: {
    flex: 1,
  },
  featureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 12,
    marginBottom: 10,
  },
 
  featureText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  bannerImage: {
    width: 100,
    height: 100,
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
});

export default LabTestClinics;
