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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Picker } from '@react-native-picker/picker';
import { ActivityIndicator } from 'react-native';
import { BASE_URL } from "../auth/Api";

const screenHeight = Dimensions.get("window").height;

const RegisterScreen = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const navigation = useNavigation();
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  // modal 
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [contactInfo, setContactInfo] = useState(""); // phone or email
  const [verifying, setVerifying] = useState(false);


const handleRegister = async () => {
  setLoading(true); // Start loading

  // Check if all fields are empty
  if (
    !firstName.trim() &&
    !lastName.trim() &&
    !email.trim() &&
    !mobileNumber.trim() &&
    !password &&
    !password2 &&
    !role
  ) {
    console.log('Validation Error: All fields are empty');
    setLoading(false);
    Alert.alert('Error', 'Fill up all fields');
    return;
  }

  // Individual field validation
  if (!firstName.trim()) {
    console.log('Validation Error: First name is empty');
    setLoading(false);
    Alert.alert('Error', 'Please enter your first name');
    return;
  }

  if (!lastName.trim()) {
    console.log('Validation Error: Last name is empty');
    setLoading(false);
    Alert.alert('Error', 'Please enter your last name');
    return;
  }

  if (!email.trim()) {
    console.log('Validation Error: Email is empty');
    setLoading(false);
    Alert.alert('Error', 'Please enter your email');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('Validation Error: Invalid email format');
    setLoading(false);
    Alert.alert('Error', 'Please enter a valid email address');
    return;
  }

  if (!mobileNumber.trim()) {
    console.log('Validation Error: Mobile number is empty');
    setLoading(false);
    Alert.alert('Error', 'Please enter your mobile number');
    return;
  }

  if (!password) {
    console.log('Validation Error: Password is empty');
    setLoading(false);
    Alert.alert('Error', 'Please enter your password');
    return;
  }

  if (!password2) {
    console.log('Validation Error: Confirm password is empty');
    setLoading(false);
    Alert.alert('Error', 'Please confirm your password');
    return;
  }

  if (password !== password2) {
    console.log('Validation Error: Passwords do not match');
    setLoading(false);
    Alert.alert('Error', 'Passwords do not match');
    return;
  }

  if (!role) {
    console.log('Validation Error: Role not selected');
    setLoading(false);
    Alert.alert('Error', 'Please select a role');
    return;
  }

  const user = {
    first_name: firstName,
    last_name: lastName,
    email: email,
    mobile_number: mobileNumber,
    password: password,
    password2: password2,
    role: role,
  };

  try {
    const response = await fetch(`${BASE_URL}/users/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    const data = await response.json();

    if (response.ok) {
  console.log('Registration successful:', data);
  setShowOtpModal(true);
  setContactInfo(mobileNumber || email);
} else {
  console.log('Backend error response:', data);

  const errors = data.errors;

  if (errors) {
    if (errors.email && errors.email[0]) {
      console.log('Backend Error: Email already registered');
      Alert.alert('Error', 'User already registered with this email');
    } else if (errors.mobile_number && errors.mobile_number[0]) {
      console.log('Backend Error: Mobile number already registered');
      Alert.alert('Error', 'User already registered with this mobile number');
    } else {
      console.log('Backend Error: Other validation errors', errors);
      Alert.alert('Error', 'Registration failed. Please check your details.');
    }
  } else {
    console.log('Backend Error: No "errors" object in response');
    Alert.alert('Error', data.message || 'Registration failed. Please try again.');
  }
}

  } catch (error) {
    console.error('Network Error during registration:', error);
    Alert.alert('Error', 'Network error');
  } finally {
    setLoading(false); // Always stop loading
  }
  };
const isEmail = (value) => /\S+@\S+\.\S+/.test(value);


const handleVerifyOtp = async () => {
  if (!otpInput) {
    Alert.alert('Error', 'Please enter OTP');
    return;
  }

  if (!contactInfo) {
    Alert.alert('Error', 'Missing contact information');
    return;
  }

  setVerifying(true);

  try {
    const isContactEmail = isEmail(contactInfo);
    const payload = isContactEmail
      ? { email: contactInfo, otp: otpInput }
      : { mobile_number: contactInfo, otp: otpInput };

    // Choose endpoint based on contact type
    const endpoint = isContactEmail
      ? `${BASE_URL}/users/verify-email-otp/`
      : `${BASE_URL}/users/verify-sms-otp/`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      Alert.alert('Success', data?.message || 'OTP verified successfully', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      setShowOtpModal(false);
    } else {
      console.log('OTP Verification Error:', data);
      Alert.alert('Error', data?.message || 'OTP verification failed');
    }
  } catch (error) {
    console.error('Network Error:', error);
    Alert.alert('Error', 'Network error');
  } finally {
    setVerifying(false);
  }
};



  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Register</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topHalf} />
          <View style={styles.bottomHalf} />

          <View style={styles.centeredContainer}>
            <View style={styles.formContainer}>
              <Text style={styles.loginHeading}>Create Account</Text>
              <Text style={styles.loginSubheading}>Fill in your details below</Text>

              {/* Banner */}
              <View style={styles.bannerContainer}>
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.bannerTitle}>Quick & Easy Signup</Text>
                  <Text style={styles.bannerSubtitle}>Get started by creating your account today.</Text>
                </View>
                <View style={styles.bannerImageWrapper}>
                  <Image
                    source={require("../assets/auth/register-button.png")}
                    style={styles.bannerImage}
                    resizeMode="contain"
                  />
                  <Image
                    source={require("../assets/auth/cursor1.png")}
                    style={styles.cornerImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Input fields */}
              <View style={styles.nameRow}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="First Name"
                  placeholderTextColor='#888'
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Last Name"
                  placeholderTextColor='#888'
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              <View style={styles.phoneInputContainer}>
                <Text style={styles.prefix}>+91</Text>
                    <TextInput
                                            style={styles.phoneInput}
                                            placeholder="Enter Phone Number"
                                            placeholderTextColor={'#888'}
                                            value={mobileNumber}
                                            onChangeText={(text) => {
                                              const cleaned = text.replace(/[^0-9]/g, '');
                                              if (cleaned.length <= 10) setMobileNumber(cleaned);
                                            }}
                                            keyboardType="numeric"
                                            maxLength={10}
                                          />
                                        </View>

                          <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                placeholderTextColor='#888'
                autoCapitalize="none"
                value={email}
                onChangeText={text => setEmail(text.toLowerCase())}
              />


              <View>
      {/* Password Field */}
     {/* Password Field */}
<View style={{ position: 'relative' }}>
  <TextInput
    style={styles.input}
    placeholder="Password"
    placeholderTextColor="#888"
    secureTextEntry={!showPassword}
    value={password}
    onChangeText={setPassword}
  />
  <TouchableOpacity
    onPress={() => setShowPassword(!showPassword)}
    style={styles.iconTouchable}
  >
    <Image
      source={
        showPassword
          ? require('../assets/auth/hide.png')
          : require('../assets/auth/visible.png')
      }
      style={styles.icon1}
      resizeMode="contain"
    />
  </TouchableOpacity>
</View>

{/* Confirm Password Field */}
<View style={{ position: 'relative' }}>
  <TextInput
    style={styles.input}
    placeholder="Confirm Password"
    placeholderTextColor="#888"
    secureTextEntry
    value={password2}
    onChangeText={setPassword2}
  />
  <View style={styles.iconTouchable}>
    {password2.length > 0 && (
      <Image
        source={
          password === password2
            ? require('../assets/auth/icons8-check-mark-48.png')  // check icon
            : require('../assets/auth/icons8-cross-48.png')  // cross icon
        }
        style={styles.icon1}
        resizeMode="contain"
      />
    )}
  </View>
</View>

      
    </View>

<View style={styles.input}>
      <Picker
        selectedValue={role}
        onValueChange={(itemValue) => setRole(itemValue)}
        mode="dropdown"
      >
        <Picker.Item label="Select Role" value="" enabled={false} />
        <Picker.Item label="patient" value="patient" />
        <Picker.Item label="doctor" value="doctor" />
        <Picker.Item label="ambulance" value="ambulance" />
        <Picker.Item label="lab" value="lab" />
      </Picker>
    </View>

              <TouchableOpacity style={styles.loginButton} onPress={handleRegister} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Register</Text>
                  )}
              </TouchableOpacity>

              <View style={styles.createAccountContainer}>
                <Text style={styles.noAccountText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.createAccountText}>Login</Text>
                </TouchableOpacity>
              </View>


              {/* account verification section */}
              <Modal
                visible={showOtpModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowOtpModal(false)}
                >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Verify OTP</Text>

                      <TextInput
                        style={styles.input}
                        placeholder="Enter phone or email"
                        placeholderTextColor='#888'
                        autoCapitalize="none"
                        value={email}
                        onChangeText={text => setEmail(text.toLowerCase())}
                      />

                    <TextInput
                      style={styles.input}
                      placeholder="Enter OTP"
                      placeholderTextColor='#888'
                      value={otpInput}
                      onChangeText={setOtpInput}
                      keyboardType="numeric"
                    />

                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={handleVerifyOtp}
                      disabled={verifying}
                    >
                      {verifying ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Submit</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

            </View>
          </View>
        </ScrollView>
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
    backgroundColor: "#fff",
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    zIndex: 2,
  },
  toolbarTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  topHalf: {
    position: "absolute",
    top: 0,
    height: screenHeight * 0.5,
    width: "100%",
    backgroundColor: "#1c78f2",
  },
  bottomHalf: {
    position: "absolute",
    bottom: 0,
    height: screenHeight * 0.5,
    width: "100%",
    backgroundColor: "#fff",
  },
  centeredContainer: {
    marginTop: 30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  formContainer: {
    backgroundColor: "#f9f9f9",
    padding: 20,
    width: "90%",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  loginHeading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 5,
  },
  loginSubheading: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  bannerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F0FF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: "#555",
  },
  bannerImageWrapper: {
    width: 100,
    height: 100,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  cornerImage: {
    width: 28,
    height: 28,
    position: "absolute",
    bottom: 0,
    right: 5,
    top: 58,
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
    color: '#000',
  },
  phoneInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  paddingHorizontal: 10,
  marginBottom: 15,
  colors: '#000',
  backgroundColor: '#fff'
},

prefix: {
  fontSize: 16,
  marginRight: 6,
  color: '#333',
},

phoneInput: {
  flex: 1,
  fontSize: 16,
  paddingVertical: 8,
  height: 45,
  color: '#000', // Ensure text is visible
},
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  halfInput: {
    width: "48%",
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
  createAccountContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  noAccountText: {
    fontSize: 14,
    color: "#666",
  },
  createAccountText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1c78f2",
    marginTop: 5,
  },
 
  matchText: {
    color: 'green',
    fontWeight: 'bold',
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  iconTouchable: {
  position: 'absolute',
  right: 15,
  top: '45%',
  transform: [{ translateY: -12 }], 
  zIndex: 1,
},
  icon1: {
    width: 24,
    height: 24,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContainer: {
  width: '90%',
  backgroundColor: 'white',
  borderRadius: 10,
  padding: 20,
  elevation: 5,
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 15,
  textAlign: 'center',
},
phoneInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  paddingHorizontal: 10,
  marginBottom: 15,
  colors: '#000',
  backgroundColor: '#fff'
},
prefix: {
  fontSize: 16,
  marginRight: 6,
  color: '#333',
},
});

export default RegisterScreen;
