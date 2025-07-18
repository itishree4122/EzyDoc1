import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locations } from "../../constants/locations";
import { fetchWithAuth } from '../auth/fetchWithAuth';
import IonIcon from 'react-native-vector-icons/Ionicons';

const LabRegister = ({ route }) => {
  const navigation = useNavigation();

  // Form state
  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [homeSampleCollection, setHomeSampleCollection] = useState(false);
  const [labTypes, setLabTypes] = useState([]);
  const [selectedLabTypes, setSelectedLabTypes] = useState([]);
  const [loadingLabTypes, setLoadingLabTypes] = useState(true);
  const [city, setCity] = useState("");
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const endpoint = '/labs/lab-profiles/';
  const userId = route?.params?.labId;
  const fromAdmin = route?.params?.fromAdmin;

  // Fetch lab types from API
  useEffect(() => {
    const fetchLabTypes = async () => {
      try {
        const response = await fetchWithAuth(`${BASE_URL}/labs/lab-types/`);
        const data = await response.json();
        if (response.ok) {
          setLabTypes(data);
        } else {
          Alert.alert('Error', 'Failed to fetch lab types');
        }
      } catch (error) {
        Alert.alert('Error', 'Could not fetch lab types');
      } finally {
        setLoadingLabTypes(false);
      }
    };
    fetchLabTypes();
  }, []);

  // Toggle selection for lab types
  const toggleLabType = (id) => {
    setSelectedLabTypes((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const registerLab = async () => {
    if (!city) {
      Alert.alert('Validation Error', 'Please select a city');
      return;
    }

    if (selectedLabTypes.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one lab type');
      return;
    }

    if (!registrationNumber || registrationNumber.length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    const labData = {
      name,
      address: clinicAddress,
      phone: registrationNumber,
      home_sample_collection: homeSampleCollection,
      lab_types: selectedLabTypes,
      location: city,
    };

    if (fromAdmin && userId) {
      labData.user = userId;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(labData),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('labTypeId', data.id);
        Alert.alert('Success', 'Lab registered successfully!', [
          {
            text: 'OK',
            onPress: () => {
              if (fromAdmin) {
                navigation.replace('RegisteredLab');
              } else {
                navigation.navigate('LabTestDashboard');
              }
            },
          },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Introduction */}
          <View style={styles.introContainer}>
            <Text style={styles.introTitle}>Verify Your Information</Text>
            <Text style={styles.introSubtitle}>
              All fields are mandatory. Ensure your registration number and service information is up-to-date.
            </Text>
          </View>

          {/* Lab Details Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lab Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lab Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter lab name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={(text) => {
                  const filtered = text.replace(/[^a-zA-Z\s]/g, '');
                  setName(filtered);
                }}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.prefix}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#999"
                  value={registrationNumber}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '');
                    if (cleaned.length <= 10) setRegistrationNumber(cleaned);
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address *</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Enter full lab address"
                placeholderTextColor="#999"
                value={clinicAddress}
                onChangeText={setClinicAddress}
                multiline
              />
            </View>

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
              <Text style={styles.inputLabel}>Home Sample Collection</Text>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setHomeSampleCollection(!homeSampleCollection)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, homeSampleCollection && styles.checkboxChecked]}>
                  {homeSampleCollection && <View style={styles.checkboxInner} />}
                </View>
                <Text style={styles.checkboxLabel}>Available</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lab Types Card */}
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Lab Services *</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('LabTypes')}
              >
                <Text style={styles.addButtonText}>+ Add New</Text>
              </TouchableOpacity>
            </View>

            {loadingLabTypes ? (
              <ActivityIndicator size="small" color="#1c78f2" style={{ marginVertical: 20 }} />
            ) : (
              labTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.checkboxContainer}
                  onPress={() => toggleLabType(type.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, selectedLabTypes.includes(type.id) && styles.checkboxChecked]}>
                    {selectedLabTypes.includes(type.id) && <View style={styles.checkboxInner} />}
                  </View>
                  <Text style={styles.checkboxLabel}>{type.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        {/* Fixed Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={registerLab}
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

      {/* City Selection Modal */}
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
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#333',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  prefix: {
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#f0f0f0',
    height: '100%',
    textAlignVertical: 'center',
  },
  phoneInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    borderColor: '#1c78f2',
    backgroundColor: '#1c78f2',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#333',
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e6f0ff',
    borderRadius: 6,
  },
  addButtonText: {
    color: '#1c78f2',
    fontSize: 14,
    fontWeight: '500',
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

export default LabRegister;