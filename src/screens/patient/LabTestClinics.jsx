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
    <TouchableOpacity
      style={styles.labCard}
      activeOpacity={0.9}
      onPress={() => {
        setSelectedLabType(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.labHeader}>
        <Text style={styles.labTitle}>{item.name}</Text>
        <Text style={styles.labTestCount}>
          {item.tests.length} Test{item.tests.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <Text style={styles.labTests} numberOfLines={2}>
        {item.tests.join(', ')}
      </Text>

      <View style={styles.labFooter}>
        <Text style={styles.labProfilesCount}>
          {item.lab_profiles.length > 0
            ? `${item.lab_profiles.length} Location${
                item.lab_profiles.length !== 1 ? 's' : ''
              } Available`
            : 'No Lab Location Available'}
        </Text>
        <Text style={styles.labTapInfo}>Tap to view details</Text>
      </View>
    </TouchableOpacity>
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
        ListHeaderComponent={
          <>
            {loading && <ActivityIndicator size="large" color="#007BFF" />}
          </>
        }
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.noDataText}>No lab types found.</Text>
          )
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
      <Text style={styles.modalHeader}>Available Lab Locations</Text>

      <ScrollView
        style={styles.modalBody}
        contentContainerStyle={{ paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {selectedLabType?.lab_profiles?.map(profile => (
          <TouchableOpacity
            key={profile.id}
            style={styles.profileCard}
            activeOpacity={0.9}
            onPress={() => {
              setModalVisible(false);
              navigation.navigate('BookingLabScreen', {
                labName: selectedLabType.name,
                services: selectedLabType.tests,
                labProfile: profile,
              });
            }}
          >
            <Text style={styles.profileName}>{profile.name}</Text>

            <View style={styles.iconRow}>
              <Image
                source={require('../assets/visitclinic/icons8-location-24.png')}
                style={styles.icon}
              />
              <Text style={styles.profileInfo}>{profile.address}</Text>
            </View>

            <View style={styles.iconRow}>
              <Image
                source={require('../assets/ambulance/icons8-call-46.png')}
                style={styles.icon}
              />
              <Text style={styles.profileInfo}>{profile.phone}</Text>
            </View>

            <View style={styles.iconRow}>
              <Image
                source={require('../assets/labtests/icons8-lab-48.png')}
                style={styles.icon}
              />
              <Text style={styles.profileInfo}>
                Home Collection:{' '}
                <Text style={{
                  fontWeight: 'bold',
                  color: profile.home_sample_collection ? '#1c78f2' : '#e74c3c'
                }}>
                  {profile.home_sample_collection ? 'Yes' : 'No'}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        onPress={() => setModalVisible(false)}
        style={styles.closeBtn}
      >
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
  borderRadius: 12,
  padding: 16,
  marginVertical: 8,
  marginHorizontal: 16,
  elevation: 0,
  borderRightWidth: 2,
  borderLeftWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
  borderBottomWidth: 4,
  borderColor: '#e6e6e6',
},

labHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 6,
},

labTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#1c1c1e',
},

labTestCount: {
  fontSize: 14,
  color: '#666',
},

labTests: {
  fontSize: 14,
  color: '#444',
  marginBottom: 10,
},

labFooter: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

labProfilesCount: {
  fontSize: 13,
  color: '#888',
},

labTapInfo: {
  fontSize: 13,
  color: '#007BFF',
},

container: {
  paddingBottom: 24,
  backgroundColor: 'transparent',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
},

modalContainer: {
  width: '90%',
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 20,
  height: '90%',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 5,
},

modalHeader: {
  fontSize: 18,
  fontWeight: '700',
  marginBottom: 16,
  color: '#1c1c1e',
},

modalBody: {
  maxHeight: '100%',
},

iconRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 6,
},

icon: {
  width: 18,
  height: 18,
  marginRight: 6,
  resizeMode: 'contain',
  tintColor: '#1c78f2',
},

profileCard: {
  backgroundColor: '#F5FAFF',
  padding: 16,
  borderRadius: 12,
  marginBottom: 14,
  borderLeftWidth: 4,
  borderLeftColor: '#1c78f2',
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
},

profileName: {
  fontSize: 17,
  fontWeight: '700',
  color: '#1c1c1e',
  marginBottom: 10,
},

profileInfo: {
  fontSize: 14,
  color: '#444',
  flex: 1,
  flexWrap: 'wrap',
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


});

export default LabTestClinics;
