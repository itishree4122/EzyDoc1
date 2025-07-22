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
  Modal,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { BASE_URL } from '../auth/Api'; // Adjust the import path as necessary
import { fetchWithAuth } from '../auth/fetchWithAuth';
import IonIcon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { locations } from "../../constants/locations";
import { useEffect } from "react";
const DoctorRegister = ({ route }) => {
  const navigation = useNavigation();
  const { doctorId, fromAdmin } = route.params || {};
  
  // Form state
  const [doctorName, setDoctorName] = useState('');
  const [specialist, setSpecialist] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [city, setCity] = useState('');
  const [cityModalVisible, setCityModalVisible] = useState(false);
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');

  // Dropdown states
  const [specialistOpen, setSpecialistOpen] = useState(false);
  const [specialistItems] = useState([
    { label: 'Cardiologist', value: 'Cardiologist' },
    { label: 'Dermatologist', value: 'Dermatologist' },
    { label: 'Neurologist', value: 'Neurologist' },
    { label: 'Pediatrician', value: 'Pediatrician' },
    { label: 'Gynecologist', value: 'Gynecologist' },
    { label: 'General Physician', value: 'General Physician' },
  ]);


const handleDoctorRegister = async () => {
  if (
    !doctorName.trim() ||
    !specialist ||
    !licenseNumber.trim() ||
    !clinicName.trim() ||
    !clinicAddress.trim() ||
    !city.trim() ||
    !experience.trim()
    // !bio.trim()
  ) {
    console.log('Validation Error: Missing required fields');
    console.log({ doctorName, specialist, licenseNumber, clinicName, clinicAddress, city, experience });
    Alert.alert('Validation Error', 'Please fill in all required fields marked with *');
    return;
  }

  try {
    setIsLoading(true);

    const formData = new FormData();
    formData.append('doctor', doctorId);
    formData.append('doctor_name', doctorName);
    formData.append('specialist', specialist);
    formData.append('license_number', licenseNumber);
    formData.append('clinic_name', clinicName);
    formData.append('clinic_address', clinicAddress);
    formData.append('location', city);
    formData.append('experience', parseInt(experience));
    // formData.append('status', bio);  // You may want to change 'status' to 'bio' if backend expects that
    formData.append('status', true);

    if (profileImage) {
  const uriParts = profileImage.split('/');
  const fileName = uriParts[uriParts.length - 1];
  const fileType = fileName.split('.').pop();

  // formData.append('profile_image', {
  //   uri: profileImage,
  //   name: fileName,
  //   type: `image/${fileType}`,
  // });
  formData.append('profile_image', profileImage.split(',')[1]);

}


    // const response = await fetch(`${BASE_URL}/doctor/register/`, {
    const response = await fetchWithAuth(`${BASE_URL}/doctor/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Success:', data);
      await AsyncStorage.setItem('doctorName', data.data.doctor_name);
      await AsyncStorage.setItem('specialist', data.data.specialist);
      Alert.alert('Success', data.message, [
        // { text: 'OK', onPress: () => navigation.navigate('DoctorDashboard') },
        {
          text: 'OK',
          onPress: () => {
            if (fromAdmin) {
              // navigation.goBack();
              navigation.replace('RegisteredDoctor');
            } else {
              navigation.navigate('DoctorDashboard');
            }
          },
        },
      ]);
    } else {
      if (data?.message?.includes('already registered') || data?.detail?.includes('already')) {
        console.log('Doctor already registered:', data);
        Alert.alert('Error', 'Doctor is already registered with this ID or license number.');
      } else {
        console.log('Other server error:', data);
        Alert.alert('Error', data.message || 'Something went wrong. Please try again.');
      }
    }
  } catch (error) {
    console.log('Network or unexpected error:', error);
    Alert.alert('Error', 'Network error. Please check your internet connection.');
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  const fetchUserData = async () => {
    const userData = await AsyncStorage.getItem('userData');
    if (userData !== null) {
      const user = JSON.parse(userData);
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setDoctorName(`${user.first_name} ${user.last_name}`);
    }
  };

  fetchUserData();
}, []);

  const handleImagePick = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: true,
      maxWidth: 300,
      maxHeight: 300,
      quality: 0.7,
    };

    launchImageLibrary(options, (response) => {
    if (response.didCancel || !response.assets || !response.assets[0]) return;

    const asset = response.assets[0];

    // 1. File size check (500 KB)
    const MAX_IMAGE_SIZE = 500 * 1024;
    if (asset.fileSize > MAX_IMAGE_SIZE) {
      Alert.alert("Image Too Large", "Please select an image smaller than 500 KB.");
      return;
    }

    // 2. File type check
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(asset.type)) {
      Alert.alert("Invalid Image Format", "Please select a JPEG or PNG image.");
      return;
    }

    // 3. Base64 check
    if (!asset.base64) {
      Alert.alert("Image Error", "Could not process the selected image. Please try another.");
      return;
    }

    // Set as base64 string for preview and upload
    setProfileImage(`data:${asset.type};base64,${asset.base64}`);
  });
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
              All fields are mandatory. Ensure that your license number and clinic
              information is up-to-date.
            </Text>
          </View>

          {/* Doctor Details Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={[styles.inputGroup,{display: 'none'}]}>
              <Text style={styles.inputLabel}>Doctor ID</Text>
              <TextInput 
                style={[styles.input, styles.disabledInput]} 
                value={doctorId} 
                editable={false} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              {/* <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={doctorName}
                onChangeText={(text) => {
                  const filtered = text.replace(/[^a-zA-Z\s]/g, '');
                  setDoctorName(filtered);
                }}
                autoCapitalize="words"
              /> */}
              <TextInput
    style={[styles.input, { backgroundColor: '#f0f0f0' }]}
    value={`${firstName} ${lastName}`}
    editable={false} // Makes it read-only
    selectTextOnFocus={false}
  />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Specialization *</Text>
              <DropDownPicker
                open={specialistOpen}
                value={specialist}
                items={specialistItems}
                setOpen={setSpecialistOpen}
                setValue={setSpecialist}
                setItems={() => {}}
                placeholder="Select your specialization"
                placeholderStyle={styles.dropdownPlaceholder}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
                listMode="SCROLLVIEW"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>License Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter license number"
                placeholderTextColor="#999"
                value={licenseNumber}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^a-zA-Z0-9\-\/\_\\:]/g, '');
                  setLicenseNumber(cleaned);
                }}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Clinic Information Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Clinic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Clinic Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter clinic name"
                placeholderTextColor="#999"
                value={clinicName}
                onChangeText={(text) => {
                  const filtered = text.replace(/[^a-zA-Z\s]/g, '');
                  setClinicName(filtered);
                }}
                autoCapitalize="words"
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
              <Text style={styles.inputLabel}>Clinic Address *</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Enter full clinic address"
                placeholderTextColor="#999"
                value={clinicAddress}
                onChangeText={setClinicAddress}
                multiline
              />
            </View>
          </View>

          {/* Professional Details Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Professional Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Experience (years) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter years of experience"
                placeholderTextColor="#999"
                value={experience}
                onChangeText={setExperience}
                keyboardType="numeric"
              />
            </View>

            {/* <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio *</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="Tell patients about your expertise"
                placeholderTextColor="#999"
                value={bio}
                onChangeText={setBio}
                multiline
              />
            </View> */}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Profile Picture</Text>
              <TouchableOpacity 
                style={styles.imagePicker} 
                onPress={handleImagePick}
                activeOpacity={0.7}
              >
                {profileImage ? (
                  <Image 
                    source={{ uri: profileImage }} 
                    style={styles.imagePreview} 
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons 
                      name="camera-plus-outline" 
                      size={32} 
                      color="#888" 
                    />
                    <Text style={styles.imagePlaceholderText}>
                      Tap to add profile photo
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {profileImage && (
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setProfileImage(null)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name="close-circle" 
                    size={24} 
                    color="#f87171" 
                  />
                </TouchableOpacity>
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

        {/* Fixed Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleDoctorRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
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
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#888',
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
  // dropdownContainer: {
  //   backgroundColor: '#fff',
  //   borderColor: '#e0e0e0',
  //   marginTop: 2,
  //   borderRadius: 8,
  // },
  dropdownContainer: {
  backgroundColor: '#fff',
  borderColor: '#e0e0e0',
  marginTop: -30,
  borderRadius: 8,
  zIndex: 1000,         // High z-index to render above other components (for iOS)
  elevation: 20,        // Elevation for Android
  position: 'relative', // Ensure stacking context is respected
},

  imagePicker: {
    height: 120,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
  },
  removeImageButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 4,
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

export default DoctorRegister;
