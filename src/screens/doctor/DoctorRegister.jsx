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
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';


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
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);


const handleDoctorRegister = async () => {
  // Validate required fields
  if (
    !doctorName.trim() ||
    !specialist ||
    !licenseNumber.trim() ||
    !clinicName.trim() ||
    !clinicAddress.trim() ||
    !experience.trim() ||
    !status.trim()
  ) {
    Alert.alert('Validation Error', 'Please fill in all required fields marked with *');
    return;
  }

  const doctorData = {
    doctor: doctorId,
    doctor_name: doctorName,
    specialist: specialist,
    license_number: licenseNumber,
    clinic_name: clinicName,
    clinic_address: clinicAddress,
    experience: experience,
    status: status,
  };

  try {
    setIsLoading(true); // Start loading

    const response = await fetch('https://ezydoc.pythonanywhere.com/doctor/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doctorData),
    });

    const data = await response.json();

    if (response.ok) {
      await AsyncStorage.setItem('doctorName', data.data.doctor_name);
      await AsyncStorage.setItem('specialist', data.data.specialist);
      Alert.alert('Success', data.message, [
        {
          text: 'OK',
          onPress: () => navigation.navigate('DoctorDashboard'),
        },
      ]);
    } else {
      if (data?.message?.includes('already registered') || data?.detail?.includes('already')) {
        Alert.alert('Error', 'Doctor is already registered with this ID or license number.');
      } else {
        Alert.alert('Error', data.message || 'Something went wrong. Please try again.');
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    Alert.alert('Error', 'Network error. Please check your internet connection.');
  } finally {
    setIsLoading(false); // End loading
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
        <TouchableOpacity style={styles.backIconContainer} onPress={()=>navigation.goBack()}>
        <Image
          source={require("../assets/UserProfile/back-arrow.png")}
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
        
<Text style={styles.loginHeading}>Verify Your Information</Text>
            <Text style={styles.loginSubheading}>
              All fields are mandatory. Ensure that your license and clinic information is up-to-date.
            </Text>

          {/* Form */}
          <View style={styles.formContainer}>
            
            {/* doctor name */}
          <Text style={styles.label}>Id</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Your Id"
              value={doctorId}
              editable={false}
            />
            {/* doctor name */}
          <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Your Name"
              value={doctorName}
              onChangeText={setDoctorName}
            />
            {/* Specialist Picker */}
            <Text style={styles.label}>Specialist *</Text>
            <View style={styles.input}>
              <Picker
                selectedValue={specialist}
                onValueChange={(itemValue) => setSpecialist(itemValue)}
                mode="dropdown"
              >
                <Picker.Item label="Select Specialist" value="" enabled={false} />
                <Picker.Item label="Cardiologist" value="Cardiologist" />
                <Picker.Item label="Dermatologist" value="Dermatologist" />
                <Picker.Item label="Neurologist" value="Neurologist" />
                <Picker.Item label="Pediatrician" value="Pediatrician" />
                <Picker.Item label="Gynecologist" value="Gynecologist" />
                <Picker.Item label="General Physician" value="General Physician" />
              </Picker>
            </View>

            <Text style={styles.label}>License Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter License Number"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
            />

            <Text style={styles.label}>Clinic Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Clinic Name"
              value={clinicName}
              onChangeText={setClinicName}
            />

            <Text style={styles.label}>Clinic Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Clinic Address"
              value={clinicAddress}
              onChangeText={setClinicAddress}
              multiline
            />

            <Text style={styles.label}>Experience (in years) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Experience"
              value={experience}
              onChangeText={setExperience}
              keyboardType="numeric"
            />

              <Text style={styles.label}>Bio *</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="Write something about yourself"
                value={status}
                onChangeText={setStatus}
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
    paddingBottom: 40,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: StatusBar.currentHeight || 40,
    paddingHorizontal: 15,
    paddingBottom: 12,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  backIconContainer: {
    width: 25,
    height: 25,
    backgroundColor: "#ccc", // White background
    borderRadius: 20, // Makes it circular
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
    
  },
  backIcon: {
    width: 15,
    height: 15,
    tintColor: "#fff", // Matches your theme
  },
  toolbarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  titleContainer: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#6495ED",
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  instructionSubtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  formContainer: {
    // backgroundColor: "#f9f9f9",
    // padding: 20,
    width: "90%",
    alignSelf: "center",
    marginTop: 100,
    borderRadius: 8,
    // shadowColor: "#000",
    // shadowOpacity: 0.1,
    // shadowRadius: 10,
    // elevation: 5,
  },
  loginHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 5,
    position: 'absolute',
    top: 10,
    left: 15,
  },
  loginSubheading: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    position: 'absolute',
    top: 40,
    left: 15,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
    marginTop: 10,
    fontWeight: 'bold',
    
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
    justifyContent: "center",
  },
//   footerButtonContainer: {
//   position: "absolute",
//   bottom: 20,
//   left: 20,
//   right: 20,
// },
footerButtonContainer: {
  padding: 15,
 
},
  loginButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#6495ED",
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
  
});

export default DoctorRegister;
