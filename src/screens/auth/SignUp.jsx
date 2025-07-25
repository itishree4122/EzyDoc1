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
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Picker } from '@react-native-picker/picker';
import DropDownPicker from 'react-native-dropdown-picker';
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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleOptins, setRoleOptions] = useState([
      { label: 'Patient', value: 'patient' },
      { label: 'Doctor', value: 'doctor' },
      { label: 'Lab', value: 'lab' },
      { label: 'Ambulance', value: 'ambulance' },
      
    ]);

  // modal 
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [contactInfo, setContactInfo] = useState(""); // phone or email
  const [verifying, setVerifying] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

const [verificationMethod, setVerificationMethod] = useState(null); // <-- add this

 
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
  if (email) {
  setContactInfo(email);
} else if (mobileNumber) {
  setContactInfo(mobileNumber);
}
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


const handleVerifySmsOtp = async () => {
  if (!otpInput || !mobileNumber) {
    Alert.alert('Error', 'Missing phone number or OTP');
    return;
  }

  setVerifying(true);
  try {
    const response = await fetch(`${BASE_URL}/users/verify-sms-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_number: mobileNumber, otp: otpInput }),
    });

    const data = await response.json();

    if (response.ok) {
      Alert.alert('Success', data?.message || 'Phone OTP verified', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      setShowOtpModal(false);
    } else {
      console.log('Phone OTP Verification Error:', data);
      Alert.alert('Error', data?.message || 'Phone OTP verification failed');
    }
  } catch (error) {
    console.error('Network Error:', error);
    Alert.alert('Error', 'Network error');
  } finally {
    setVerifying(false);
  }
};

const handleVerifyEmailOtp = async () => {
  if (!otpInput || !email) {
    Alert.alert('Error', 'Missing email or OTP');
    return;
  }

  setVerifying(true);
  try {
    const response = await fetch(`${BASE_URL}/users/verify-email-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, otp: otpInput }),
    });

    const data = await response.json();

    if (response.ok) {
      Alert.alert('Success', data?.message || 'Email OTP verified', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
      setShowOtpModal(false);
    } else {
      console.log('Email OTP Verification Error:', data);
      Alert.alert('Error', data?.message || 'Email OTP verification failed');
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
        // behavior={Platform.OS === "ios" ? "padding" : undefined}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              <Text style={styles.loginHeading}>Create Your Account</Text>
<Text style={styles.loginSubheading}>Fill in your details below</Text>
{/* <Text style={styles.loginSubheading}>Sign up to get started</Text> */}
              {/* <Text style={styles.loginHeading}>Create Account</Text>
              <Text style={styles.loginSubheading}>Fill in your details below</Text> */}

              {/* Banner */}
              {/* <View style={styles.bannerContainer}>
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
              </View> */}

              {/* Input fields */}
              <View style={styles.nameRow}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="First Name"
                  placeholderTextColor='#888'
                  value={firstName}
                  onChangeText={(text) => {
                  const filtered = text.replace(/[^a-zA-Z\s]/g, '');
                  setFirstName(filtered);
                }}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Last Name"
                  placeholderTextColor='#888'
                  value={lastName}
                  onChangeText={(text) => {
                  const filtered = text.replace(/[^a-zA-Z\s]/g, '');
                  setLastName(filtered);
                }}
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
    style={[styles.input, { color: '#000' }]}
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
    style={[styles.input, { color: '#000' }]}
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


      <View style={{ zIndex: 1000 }}>
            <DropDownPicker
              open={open}
              value={role}
              items={roleOptins}
              setOpen={setOpen}
              setValue={setRole}
              setItems={setRoleOptions}
              placeholder="Select Role"
              style={styles.input}
              placeholderStyle={{ color: '#888' }}
              dropDownContainerStyle={{ borderColor: '#ccc' }}
              textStyle={{ fontSize: 14 }}
            />
          </View>

    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
  <TouchableOpacity onPress={() => setAgreedToTerms(!agreedToTerms)} style={{
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: agreedToTerms ? '#1c78f2' : '#fff',
    marginRight: 10,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    {agreedToTerms && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>}
  </TouchableOpacity>

  <Text style={{ color: '#333', flex: 1, flexWrap: 'wrap' }}>
    I agree to the{' '}
    <Text
      style={{ color: '#1c78f2', textDecorationLine: 'underline' }}
      onPress={() => {
        // Open the policy link using Linking
        Linking.openURL(`${BASE_URL}/users/privacy-policy/`);
      }}
    >
      Terms & Conditions
  </Text>
  {' '}and{' '}
  <Text
    style={{ color: '#1c78f2', textDecorationLine: 'underline' }}
    onPress={() => Linking.openURL(`${BASE_URL}/users/privacy-policy/`)}
  >
    Privacy Policy
  </Text>
  </Text>
</View>


              <TouchableOpacity   style={[styles.loginButton, { opacity: agreedToTerms ? 1 : 0.5 }]}
 onPress={handleRegister} 
  disabled={!agreedToTerms || loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Register</Text>
                  )}
              </TouchableOpacity>

              <View style={styles.createAccountContainer}>
                <Text style={styles.noAccountText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: "Login" }] })}>
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

              {!verificationMethod && (
                <>
                  <Text style={{ fontSize: 16, marginBottom: 10 }}>
                    Choose a method to verify your account:
                  </Text>

                  {mobileNumber && (
                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={() => {
                        setVerificationMethod('sms');
                        setOtpInput('');
                      }}
                    >
                      <Text style={styles.buttonText}>Verify OTP with Phone</Text>
                    </TouchableOpacity>
                  )}

                  {email && (
                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={() => {
                        setVerificationMethod('email');
                        setOtpInput('');
                      }}
                    >
                      <Text style={styles.buttonText}>Verify OTP with Email</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {verificationMethod === 'sms' && (
                <>
                  <Text style={{ fontSize: 16, marginBottom: 10 }}>
                    OTP sent to phone: {mobileNumber}
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Enter OTP"
                    placeholderTextColor="#888"
                    value={otpInput}
                    onChangeText={setOtpInput}
                    keyboardType="numeric"
                  />

                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleVerifySmsOtp}
                    disabled={verifying}
                  >
                    {verifying ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Submit</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setVerificationMethod(null)} style={{ marginTop: 10 }}>
                    <Text style={{ color: '#007BFF', textAlign: 'center' }}>Back</Text>
                  </TouchableOpacity>
                </>
              )}

              {verificationMethod === 'email' && (
                <>
                  <Text style={{ fontSize: 16, marginBottom: 10 }}>
                    OTP sent to email: {email}
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Enter OTP"
                    placeholderTextColor="#888"
                    value={otpInput}
                    onChangeText={setOtpInput}
                    keyboardType="numeric"
                  />

                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleVerifyEmailOtp}
                    disabled={verifying}
                  >
                    {verifying ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Submit</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setVerificationMethod(null)} style={{ marginTop: 10 }}>
                    <Text style={{ color: '#007BFF', textAlign: 'center' }}>Back</Text>
                  </TouchableOpacity>
                </>
              )}
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
  // formContainer: {
  //   backgroundColor: "#f9f9f9",
  //   padding: 20,
  //   width: "90%",
  //   borderRadius: 15,
  //   shadowColor: "#000",
  //   shadowOpacity: 0.1,
  //   shadowRadius: 10,
  //   elevation: 5,
  // },
  formContainer: {
  backgroundColor: "#fff",
  padding: 24,
  width: "92%",
  borderRadius: 24,
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 8,
  borderColor: "#eee",
  borderWidth:1,
  borderBottomWidth:4,
  // elevation: 10,
  marginTop: 24,
},
  // loginHeading: {
  //   fontSize: 22,
  //   fontWeight: "bold",
  //   color: "#333",
  //   textAlign: "center",
  //   marginBottom: 5,
  // },
  // loginSubheading: {
  //   fontSize: 14,
  //   color: "#666",
  //   textAlign: "center",
  //   marginBottom: 15,
  // },
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
  // input: {
  //   width: "100%",
  //   height: 50,
  //   borderWidth: 1,
  //   borderColor: "#ccc",
  //   borderRadius: 8,
  //   paddingHorizontal: 15,
  //   backgroundColor: "#fff",
  //   marginBottom: 10,
  //   color: '#000',
  // },
  loginHeading: {
  fontSize: 24,
  fontWeight: "700",
  color: "#1c78f2",
  textAlign: "center",
  marginBottom: 4,
  letterSpacing: 0.5,
},
loginSubheading: {
  fontSize: 15,
  color: "#555",
  textAlign: "center",
  marginBottom: 18,
  fontWeight: "400",
},
input: {
  width: "100%",
  height: 48,
  borderWidth: 1,
  borderColor: "#e0e0e0",
  borderRadius: 8,
  paddingHorizontal: 14,
  backgroundColor: "#fafbfc",
  marginBottom: 12,
  color: "#222",
  fontSize: 15,
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
  // loginButton: {
  //   width: "100%",
  //   height: 50,
  //   backgroundColor: "#1c78f2",
  //   justifyContent: "center",
  //   alignItems: "center",
  //   borderRadius: 8,
  //   marginTop: 10,
  // },
  loginButton: {
  width: "100%",
  height: 48,
  backgroundColor: "#1c78f2",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 8,
  marginTop: 12,
  shadowColor: "#1c78f2",
  shadowOpacity: 0.15,
  shadowRadius: 4,
  // elevation: 2,
},
  // buttonText: {
  //   color: "#fff",
  //   fontSize: 18,
  //   fontWeight: "bold",
  // },
  buttonText: {
  color: "#fff",
  fontSize: 17,
  fontWeight: "600",
  letterSpacing: 0.2,
},
  // createAccountContainer: {
  //   marginTop: 20,
  //   alignItems: "center",
  // },
  createAccountContainer: {
  marginTop: 18,
  alignItems: "center",
},
  // noAccountText: {
  //   fontSize: 14,
  //   color: "#666",
  // },
  noAccountText: {
  fontSize: 14,
  color: "#888",
},
  // createAccountText: {
  //   fontSize: 16,
  //   fontWeight: "bold",
  //   color: "#1c78f2",
  //   marginTop: 5,
  // },
 createAccountText: {
  fontSize: 15,
  fontWeight: "bold",
  color: "#1c78f2",
  marginTop: 2,
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
