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
  Dimensions,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Button,
  ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { BASE_URL } from '../auth/Api'; // Adjust the import path as necessary


const DoctorRegister = ({route}) => {
  const navigation = useNavigation();
    const { doctorId } = route.params;

  const [doctor, setDoctor] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [specialist, setSpecialist] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [experience, setExperience] = useState('');
  const [status, setStatus] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // State for dropdown
const [specialistOpen, setSpecialistOpen] = useState(false);
const [specialistItems, setSpecialistItems] = useState([
  { label: 'Cardiologist', value: 'Cardiologist' },
  { label: 'Dermatologist', value: 'Dermatologist' },
  { label: 'Neurologist', value: 'Neurologist' },
  { label: 'Pediatrician', value: 'Pediatrician' },
  { label: 'Gynecologist', value: 'Gynecologist' },
  { label: 'General Physician', value: 'General Physician' },
]);

const [city, setCity] = useState('');
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
const handleDoctorRegister = async () => {
  if (
    !doctorName.trim() ||
    !specialist ||
    !licenseNumber.trim() ||
    !clinicName.trim() ||
    !clinicAddress.trim() ||
    !city.trim() ||
    !experience.trim() ||
    !bio.trim()
  ) {
    console.log('Validation Error: Missing required fields');
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
    formData.append('status', bio);  // You may want to change 'status' to 'bio' if backend expects that

    if (profileImage) {
  const uriParts = profileImage.split('/');
  const fileName = uriParts[uriParts.length - 1];
  const fileType = fileName.split('.').pop();

  formData.append('profile_image', {
    uri: profileImage,
    name: fileName,
    type: `image/${fileType}`,
  });
}


    const response = await fetch(`${BASE_URL}/doctor/register/`, {
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
        { text: 'OK', onPress: () => navigation.navigate('DoctorDashboard') },
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


  const handleImagePick = () => {
    const options = {
      mediaType: 'photo',
      maxWidth: 300,
      maxHeight: 300,
      quality: 0.7,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const uri = response.assets?.[0]?.uri;
        if (uri) {
          setProfileImage(uri);
        }
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Toolbar */}
      <View style={styles.toolbar}>
              <TouchableOpacity style={styles.backIconContainer} onPress={() => navigation.goBack()}>
                <Image
                  source={require('../assets/UserProfile/back-arrow.png')}
                  style={styles.backIcon}
                />
              </TouchableOpacity>
              <Text style={styles.toolbarText}>Complete Registration</Text>
            </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
        
<View style={styles.infoContainer}>
                <View style={styles.textContainer}>
                  <Text style={styles.loginHeading}>Verify Your Information</Text>
                  <Text style={styles.loginSubheading}>
                    All fields are mandatory. Ensure that your license number and clinic
                    name is up-to-date.
                  </Text>
                </View>
              </View>

          {/* Form */}
          <View style={styles.formContainer}>
            
            {/* doctor name */}
          <Text style={styles.label}>Id</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Your Id"
              placeholderTextColor={'#888'}
              value={doctorId}
              editable={false}
            />
            {/* doctor name */}
          <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Your Name"
              placeholderTextColor={'#888'}
              value={doctorName}
              onChangeText={setDoctorName}
            />
            {/* Specialist Picker */}
           <Text style={styles.label}>Specialist *</Text>
<DropDownPicker
  open={specialistOpen}
  value={specialist}
  items={specialistItems}
  setOpen={setSpecialistOpen}
  setValue={setSpecialist}
  setItems={setSpecialistItems}
  placeholder="Select Specialist"
  placeholderTextColor={'#888'}
  style={styles.dropdown}
  dropDownContainerStyle={styles.dropdownContainer}
/>

            <Text style={styles.label}>License Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter License Number"
              placeholderTextColor={'#888'}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
            />

            <Text style={styles.label}>Clinic Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Clinic Name"
              placeholderTextColor={'#888'}
              value={clinicName}
              onChangeText={setClinicName}
            />

            <Text style={styles.label}>City *</Text>
                <DropDownPicker
                  open={cityOpen}
                  value={cityValue}
                  items={cityItems}
                  setOpen={setCityOpen}
                  setValue={(callback) => {
                    const val = callback(cityValue);
                    setCityValue(val);
                    setCity(val);
                  }}
                  setItems={setCityItems}
                  placeholder="Select City"
                  placeholderTextColor={'#888'}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                />

            <Text style={styles.label}>Clinic Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Clinic Address"
              placeholderTextColor={'#888'}
              value={clinicAddress}
              onChangeText={setClinicAddress}
              multiline
            />

            <Text style={styles.label}>Experience (in years) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Experience"
              placeholderTextColor={'#888'}
              value={experience}
              onChangeText={setExperience}
              keyboardType="numeric"
            />

              <Text style={styles.label}>Bio *</Text>
              <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Write something about yourself"
              placeholderTextColor="#888"
              value={bio}
              onChangeText={setBio}
              multiline
            />

                // Profile Picture
                <Text style={styles.label}>Profile Picture</Text>
                <View style={styles.imagePickerContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.imagePreview} />
              ) : (
                <Text style={styles.placeholderText}>No image selected</Text>
              )}
              <Button title="Choose Image" onPress={handleImagePick} />
            </View>
          </View>
           
          
        </ScrollView>

        {/* Submit Button fixed at bottom */}
  <View style={styles.footerButtonContainer}>
    <TouchableOpacity
  style={styles.loginButton}
  onPress={handleDoctorRegister}
  disabled={isLoading} // Optional: disables the button while loading
>
  {isLoading ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={styles.buttonText}>Submit</Text>
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
    backgroundColor: "#fff",
  },
  scrollContainer: {
padding: 16, 
},
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingTop: 50,
  },
  backIconContainer: {
    paddingRight: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  toolbarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
   infoContainer: {
    marginBottom: 20,
    backgroundColor: '#e8f0fe',
    padding: 16,
    borderRadius: 12,
  },
  textContainer: {
    marginBottom: 12,
  },
  loginHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 4,
  },
  loginSubheading: {
    fontSize: 14,
    color: '#5f6368',
  },
   formContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 80,
  },
  
  
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
    marginTop: 10,
    fontWeight: 'bold',
    
  },
  input: {
    backgroundColor: '#f1f3f4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    height: 48,
    fontSize: 16,
    color: '#000', // Ensure text is visible
    marginBottom: 12,
  },
  input1: {
    backgroundColor: '#f1f3f4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    height: 50,
    fontSize: 16,
    color: '#000', // Ensure text is visible
    marginBottom: 12,
  },

footerButtonContainer: {
  padding: 15,
 
},
  loginButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#1c78f2",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
    
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  imagePickerContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  placeholderText: {
    color: '#888',
    marginBottom: 10,
  },
  dropdown: {
  borderColor: '#ccc',
  borderWidth: 1,
  borderRadius: 8,
  marginBottom: 16,
  paddingHorizontal: 10,
  height: 50,
  backgroundColor: '#f1f3f4',
  color: '#000', // Ensure text is visible
  zIndex: 1000, // Prevent overlapping with other dropdowns
},
dropdownContainer: {
  borderColor: '#ccc',
  zIndex: 1000,
}
});

export default DoctorRegister;
