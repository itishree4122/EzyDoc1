import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Modal
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import DropDownPicker from 'react-native-dropdown-picker';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import IonIcon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { locations } from "../../constants/locations";


const AmbulanceRegister = ({ route }) => {
  const navigation = useNavigation();
  const { ambulanceId } = route.params;

  const [service, setService] = useState('');
  const [ambulanceNumber, setAmbulanceNumber] = useState('');
  const [placeInput, setPlaceInput] = useState('');
  const [places, setPlaces] = useState([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [city, setCity] = useState('');
  const [cityModalVisible, setCityModalVisible] = useState(false);
  
  const [cityOpen, setCityOpen] = useState(false);
  const [cityValue, setCityValue] = useState(null);
  const [cityItems, setCityItems] = useState([
    { label: 'Bhubaneswar', value: 'Bhubaneswar' },
    { label: 'Bhadrak', value: 'Bhadrak' },
    { label: 'Cuttuck', value: 'Cuttuck' },
    { label: 'Puri', value: 'Puri' },
    { label: 'Rourkela', value: 'Rourkela' },
    { label: 'Angul', value: 'Angul' },
  ]);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !service.trim() ||
      !vehicleNumber.trim() ||
      !ambulanceNumber.trim() ||
      !whatsappNumber.trim() ||
      !city.trim() ||
      places.length === 0
    ) {
      Alert.alert('Validation Error', 'All fields are required including at least one place.');
      return;
    }

    setLoading(true);

    const token = await getToken();
    if (!token) {
      setLoading(false);
      Alert.alert('Error', 'Access token not found');
      return;
    }

    const payload = {
      ambulance_id: ambulanceId,
      service_name: service,
      vehicle_number: vehicleNumber,
      phone_number: ambulanceNumber,
      whatsapp_number: whatsappNumber,
      location: city,
      service_area: places.join(', '),
      active: true,
    };

    try {
      const response = await fetchWithAuth(`${BASE_URL}/ambulance/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        let errorMessage = 'Failed to register ambulance';
        if (data && typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          if (Array.isArray(data[firstKey])) {
            errorMessage = data[firstKey][0];
          }
        }
        Alert.alert('Error', errorMessage);
        return;
      }

      setLoading(false);
      Alert.alert('Success', 'Ambulance registered successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleAddPlace = () => {
    if (placeInput.trim() && places.length < 5) {
      setPlaces([...places, placeInput.trim()]);
      setPlaceInput('');
    }
  };

  const handleRemovePlace = (index) => {
    const updated = places.filter((_, i) => i !== index);
    setPlaces(updated);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <IonIcon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Registration</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introContainer}>
            <Text style={styles.introTitle}>Verify Your Information</Text>
            <Text style={styles.introSubtitle}>
              All fields are mandatory. Ensure that your ambulance number and service
              information is up-to-date.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ambulance Details</Text>

            <View style={[styles.inputGroup, {display:'none'}]}>
              <Text style={styles.inputLabel}>Ambulance ID</Text>
              <TextInput 
                style={[styles.input, styles.disabledInput]} 
                value={ambulanceId} 
                editable={false} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter service name"
                placeholderTextColor="#999"
                value={service}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^a-zA-Z]/g, '');
                  setService(cleaned);
                }}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicle Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter vehicle number"
                placeholderTextColor="#999"
                value={vehicleNumber}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^a-zA-Z0-9\-\/\_\\:]/g, '');
                  setVehicleNumber(cleaned);
                }}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.phonePrefix}>+91</Text>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  value={ambulanceNumber}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    if (cleaned.length <= 10) setAmbulanceNumber(cleaned);
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>WhatsApp Number *</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.phonePrefix}>+91</Text>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="Enter WhatsApp number"
                  placeholderTextColor="#999"
                  value={whatsappNumber}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    if (cleaned.length <= 10) setWhatsappNumber(cleaned);
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Service Area</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City *</Text>
              <TouchableOpacity
              style={[styles.input, { justifyContent: 'center' }]}
              onPress={() => setCityModalVisible(true)}
              activeOpacity={0.7}
              >
            <Text style={{ color: city ? '#333' : '#999' }}>
              {city || 'Select your city'}
            </Text>
            </TouchableOpacity>
          </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Service Areas *</Text>
                <Text style={styles.placeCounter}>{places.length}/5</Text>
              </View>
              
              <View style={styles.placeInputContainer}>
                <TextInput
                  style={[styles.input, styles.placeInput]}
                  placeholder="Add service area"
                  placeholderTextColor="#999"
                  value={placeInput}
                  onChangeText={setPlaceInput}
                  onSubmitEditing={handleAddPlace}
                  returnKeyType="done"
                />
                {placeInput.trim() && places.length < 5 && (
                  <TouchableOpacity 
                    style={styles.addPlaceButton} 
                    onPress={handleAddPlace}
                    activeOpacity={0.7}
                  >
                    <Feather name="plus-circle" size={24} color="#1c78f2" style={styles.addIcon} />

                  </TouchableOpacity>
                )}
              </View>
              
              {places.length > 0 && (
                <View style={styles.placesContainer}>
                  {places.map((place, index) => (
                    <View key={index} style={styles.placeTag}>
                      <Text style={styles.placeText}>{place}</Text>
                      <TouchableOpacity 
                        style={styles.removePlaceButton}
                        onPress={() => handleRemovePlace(index)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="close-circle" size={24} color="#f87171" style={styles.removeIcon} />


                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        <Modal
                        visible={cityModalVisible}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setCityModalVisible(false)}
                      >
                        <View style={styles.modalOverlay}>
                          <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select City</Text>
                            <FlatList
                              data={locations.filter(loc => loc !== "All")}
                              keyExtractor={(item) => item}
                              contentContainerStyle={styles.modalList}
                              renderItem={({ item }) => (
                                <TouchableOpacity
                                  style={[styles.modalItem, city === item && styles.modalItemSelected]}
                                  onPress={() => {
                                    setCity(item);
                                    setCityModalVisible(false);
                                  }}
                                >
                                  <Text style={styles.modalItemText}>{item}</Text>
                                </TouchableOpacity>
                              )}
                              keyboardShouldPersistTaps="handled"
                            />
                            <TouchableOpacity
                              style={styles.modalCloseButton}
                              onPress={() => setCityModalVisible(false)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.modalCloseButtonText}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </Modal>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Complete Registration</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  introContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeCounter: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#888',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phonePrefix: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    fontSize: 15,
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  dropdown: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    minHeight: 50,
  },
  dropdownPlaceholder: {
    color: '#999',
    fontSize: 15,
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    marginTop: 2,
    borderRadius: 8,
  },
  placeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeInput: {
    flex: 1,
  },
  addPlaceButton: {
    position: 'absolute',
    right: 10,
    padding: 10,
  },
  addIcon: {
    width: 30,
    height: 30,
    tintColor: '#3498db',
  },
  placesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  placeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fc',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  placeText: {
    fontSize: 13,
    color: '#2980b9',
    marginRight: 6,
  },
  removePlaceButton: {
    padding: 4,
  },
  removeIcon: {

    tintColor: '#e74c3c',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  submitButton: {
    backgroundColor: '#1c78f2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalList: {
    paddingBottom: 10,
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemSelected: {
    backgroundColor: '#e6f0ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AmbulanceRegister;