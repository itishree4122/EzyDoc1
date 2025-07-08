import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import { useNavigation } from "@react-navigation/native";
import { useLocation } from '../../context/LocationContext';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Header from '../../components/Header';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const AmbulanceBooking = () => {
  const navigation = useNavigation();
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedLocation } = useLocation();

  const fetchAmbulances = async () => {
    const token = await getToken();
    if (!token) {
      console.error('Token not available');
      Alert.alert('Error', 'Access token not found');
      return;
    }

    let url = `${BASE_URL}/ambulance/status/`;
    if (
      selectedLocation &&
      selectedLocation !== 'Select Location' &&
      selectedLocation !== 'All'
    ) {
      url += `?location=${encodeURIComponent(selectedLocation)}`;
    }

    console.log('Fetching ambulance from URL:', url);

    try {
      const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching ambulances:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to fetch ambulance list');
        return;
      }

      const data = await response.json();
      const allAmbulances = data.ambulances || [];
      const activeAmbulances = allAmbulances.filter((amb) => amb.active === true);
      setAmbulances(activeAmbulances);
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Something went wrong while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmbulances();
  }, [selectedLocation]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.ambulanceIconContainer}>
          <Icon name="local-hospital" size={24} color="#fff" />
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.service_name}</Text>
          <View style={styles.locationContainer}>
            <Icon name="location-on" size={14} color="#ff6b6b" />
            <Text style={styles.areas}>{item.service_area}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.contactContainer}>
        <TouchableOpacity
          style={[styles.contactButton, styles.callButton]}
          onPress={() => {
            if (item.phone_number) {
              Linking.openURL(`tel:${item.phone_number}`);
            }
          }}
        >
          <Icon name="call" size={18} color="#fff" />
          <Text style={styles.contactButtonText}>Call Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactButton, styles.whatsappButton]}
          onPress={() => {
            if (item.whatsapp_number) {
              const phone = item.whatsapp_number.replace(/[^\d]/g, '');
              const url = `https://wa.me/${phone}`;
              Linking.openURL(url).catch(() => {
                Alert.alert("Error", "WhatsApp is not installed or the number is invalid.");
              });
            }
          }}
        >
          <FontAwesome name="whatsapp" size={18} color="#fff" />
          <Text style={styles.contactButtonText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Icon name="phone" size={16} color="#4e54c8" />
          <Text style={styles.detailText}>{item.phone_number}</Text>
        </View>
        {item.whatsapp_number && (
          <View style={styles.detailRow}>
            <FontAwesome name="whatsapp" size={16} color="#25D366" />
            <Text style={styles.detailText}>{item.whatsapp_number}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const filteredAmbulances = useMemo(() => {
    return ambulances.filter(
      (item) =>
        item.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.service_area?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ambulances, searchQuery]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4e54c8" />
        <Text style={styles.loadingText}>Finding available ambulances...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Emergency Ambulance Services" />
      
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="Search ambulance services..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* {selectedLocation && selectedLocation !== 'All' && (
        <View style={styles.locationTag}>
          <Icon name="location-on" size={16} color="#fff" />
          <Text style={styles.locationTagText}>{selectedLocation}</Text>
        </View>
      )} */}

      <FlatList
        data={filteredAmbulances}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.noData}>
            <Icon name="error-outline" size={40} color="#ccc" />
            <Text style={styles.noDataText}>
              No ambulances found{searchQuery ? ` for "${searchQuery}"` : ""}
            </Text>
            <Text style={styles.noDataSubtext}>
              Try changing your location or search term
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    height: 45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#333',
    fontSize: 15,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4e54c8',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 10,
  },
  locationTagText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    // borderBottomWidth: 3,
    // borderWidth: 1,
    // borderColor: '#e0e0e0',
    // borderLeftWidth: 1,
    // borderLeftColor: '#4a8fe7',
    // elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ambulanceIconContainer: {
    backgroundColor: '#ff6b6b',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  areas: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  contactButton: {
    borderRadius: 25,
    paddingVertical: 10,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButton: {
    backgroundColor: '#4e54c8',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  detailsContainer: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 15,
    color: '#666',
    fontSize: 16,
  },
  noData: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default AmbulanceBooking;