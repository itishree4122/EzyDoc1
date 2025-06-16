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
  Dimensions,
  Image,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';
import { BASE_URL } from '../auth/Api';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';


const screenHeight = Dimensions.get("window").height;

const LoginScreen = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  // forgot password
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = request, 2 = verify, 3 = reset
    


const handleLogin = async () => {
  setLoading(true); // Start loading

  // Trim inputs
  const trimmedMobile = mobileNumber.trim();
  const trimmedPassword = password.trim();

  // Check if both fields are empty
  if (!trimmedMobile && !trimmedPassword) {
    setLoading(false);
    Alert.alert('Error', 'Fill up all fields');
    return;
  }

  // Check individual missing fields
  if (!trimmedMobile) {
    setLoading(false);
    Alert.alert('Error', 'Mobile number may not be blank');
    return;
  }

  if (!trimmedPassword) {
    setLoading(false);
    Alert.alert('Error', 'Password may not be blank');
    return;
  }

  const credentials = {
    mobile_number: trimmedMobile,
    password: trimmedPassword,
  };

  try {
    const response = await fetch(`${BASE_URL}/users/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Login Success:', data);
      Alert.alert('Success', data.msg);

      const user = data.user;
      const userRole = user.role.toLowerCase();

      // Save user ID and tokens
      const userId = user.user_id;
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      await AsyncStorage.setItem('accessToken', data.Token.access);
      await AsyncStorage.setItem('refreshToken', data.Token.refresh);

      // Also store role-based IDs (optional if needed)
      await AsyncStorage.setItem('doctorId', userId);
      await AsyncStorage.setItem('labId', userId);
      await AsyncStorage.setItem('patientId', userId);
      await AsyncStorage.setItem('ambulanceId', userId);

      // Navigate based on role
      const userDetails = {
        patientId: userId,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.mobile_number,
      };

      if (user.is_admin) {
        navigation.navigate('AdminDashboard');
      } else if (userRole === 'patient') {
        navigation.navigate('HomePage', userDetails);
      } else if (userRole === 'doctor') {
        navigation.navigate('DoctorDashboard');
      } else if (userRole === 'ambulance') {
        navigation.navigate('AmbulanceDashboard');
      } else if (userRole === 'lab') {
        navigation.navigate('LabTestDashboard');
      } else {
        Alert.alert('Error', 'Unknown role');
      }
    } else {
      console.log('Login Failed Response:', data);

      let errorMessage = '';
      if (data.mobile_number) {
        errorMessage += `• Mobile Number: ${data.mobile_number.join(', ')}\n`;
      }
      if (data.password) {
        errorMessage += `• Password: ${data.password.join(', ')}\n`;
      }
      if (data.non_field_errors) {
        errorMessage += `• ${data.non_field_errors.join(', ')}\n`;
      }
      if (data.detail) {
        errorMessage += `• ${data.detail}\n`;
      }

      Alert.alert('Error', errorMessage.trim() || 'Login failed. Please try again.');
    }
  } catch (error) {
    console.error('Login error:', error);
    Alert.alert('Error', 'Network error. Please try again later.');
  } finally {
    setLoading(false); // Stop loading
  }
};


// google sign in
// const handleGoogleSignIn = async () => {
//   try {
//     await GoogleSignin.hasPlayServices();
//     const { idToken } = await GoogleSignin.signIn();

//     const googleCredential = auth.GoogleAuthProvider.credential(idToken);
//     const firebaseUser = await auth().signInWithCredential(googleCredential);

//     // Get mobileNumber from your form or state
//     const userMobile = mobileNumber;

//     const response = await axios.post(`${BASE_URL}/users/google-signin/`, {
//       id_token: idToken,
//       mobile_number: userMobile,
      
//     });

//     const { user, Token } = response.data;

//     Alert.alert('Sign-In Successful', `Welcome ${user.first_name} ${user.last_name}`);
//     await AsyncStorage.setItem('accessToken', Token.access);
//     await AsyncStorage.setItem('refreshToken', Token.refresh);
//     await AsyncStorage.setItem('userData', JSON.stringify(user));

//     // Navigate based on role like in your email/password login
//     const userRole = user.role.toLowerCase();
//     if (user.is_admin) {
//       navigation.navigate('AdminDashboard');
//     } else if (userRole === 'patient') {
//       navigation.navigate('HomePage');
//     } else if (userRole === 'doctor') {
//       navigation.navigate('DoctorDashboard');
//     } else if (userRole === 'lab') {
//       navigation.navigate('LabTestDashboard');
//     } else if (userRole === 'ambulance') {
//       navigation.navigate('AmbulanceDashboard');
//     } else {
//       Alert.alert('Error', 'Unknown role');
//     }
//   } catch (error) {
//     console.error('Google Sign-In Error:', error);
//     Alert.alert('Sign-In Failed', error.message || 'Something went wrong');
//   }
// };


 
  //   useEffect(() => {
  //    GoogleSignin.configure({
  //      webClientId: '287276868185-uct3kvg59bd6ad4ged4p76lbmgd29m3s.apps.googleusercontent.com',
  //      // webClientId: '287276868185-jindirgfpur91ps1nb9doqgqao26qltu.apps.googleusercontent.com', 
  //    });
  //  }, []);

// const handleGoogleSignIn = async () => {
//   try {
//     await GoogleSignin.hasPlayServices();
//     const userInfo = await GoogleSignin.signIn();
//     const idToken = userInfo.idToken;

//     // Send idToken and mobile number to your backend
//     const response = await fetch(`${BASE_URL}/users/google-signin/`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         id_token: idToken,
//         mobile_number: mobileNumber,
//       }),
//     });

//     const data = await response.json();
//     console.log('Google Sign-In Response:', data);
//     if (response.ok) {
//       const { user, Token } = data;
//       Alert.alert('Sign-In Successful', `Welcome ${user.first_name} ${user.last_name}`);
//       await AsyncStorage.setItem('accessToken', Token.access);
//       await AsyncStorage.setItem('refreshToken', Token.refresh);
//       await AsyncStorage.setItem('userData', JSON.stringify(user));

//       // Navigate based on role
//       const userRole = user.role.toLowerCase();
//       if (user.is_admin) {
//         navigation.navigate('AdminDashboard');
//       } else if (userRole === 'patient') {
//         navigation.navigate('HomePage');
//       } else if (userRole === 'doctor') {
//         navigation.navigate('DoctorDashboard');
//       } else if (userRole === 'lab') {
//         navigation.navigate('LabTestDashboard');
//       } else if (userRole === 'ambulance') {
//         navigation.navigate('AmbulanceDashboard');
//       } else {
//         Alert.alert('Error', 'Unknown role');
//       }
//     } else {
//       Alert.alert('Sign-In Failed', data.message || 'Something went wrong');
//     }
//   } catch (error) {
//     console.error('Google Sign-In Error:', error);
//     Alert.alert('Sign-In Failed', error.message || 'Something went wrong');
//   }
// };

// forgot password section
const isEmail = (value) => /\S+@\S+\.\S+/.test(value);
const handleSendOtp = async () => {
    if (!contact) {
      Alert.alert('Error', 'Please enter your email or phone number');
      return;
    }

    setLoading(true);
    try {
      const payload = isEmail(contact)
      ? { email: contact }
      : { mobile_number: contact };
      const response = await fetch(`${BASE_URL}/users/password-reset/request-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message);
        setStep(2);
      } else {
        Alert.alert('Error', data.message || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !contact) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const payload = isEmail(contact)
      ? { email: contact, otp }
      : { mobile_number: contact, otp };
      
      const response = await fetch(`${BASE_URL}/users/password-reset/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message);
        setStep(3);
      } else {
        Alert.alert('Error', data.message || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!contact || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const payload = isEmail(contact)
      ? { email: contact, new_password: newPassword }
      : { mobile_number: contact, new_password: newPassword };

      const response = await fetch(`${BASE_URL}/users/password-reset/confirm-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message);
        setStep(1);
        setContact('');
        setOtp('');
        setNewPassword('');
         // Close modal
      setShowForgotPasswordModal(false);
      } else {
        Alert.alert('Error', data.message || 'Password reset failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Login</Text>
      </View>

      {/* Top Half */}
      <View style={styles.topHalf} />

      {/* Bottom Half */}
      <View style={styles.bottomHalf} />

      {/* Login Form Overlapping Both */}
      <View style={styles.centeredContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.loginHeading}>Welcome Back!</Text>
          <Text style={styles.loginSubheading}>Login to continue</Text>

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

         <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', color: '#000' }]}>
      <TextInput
        style={{ flex: 1 }}
        placeholder="Enter Password"
        placeholderTextColor="#888"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 8 }}>
        <Image
          source={
            showPassword
              ? require('../assets/auth/hide.png')  // path to your hide icon
              : require('../assets/auth/visible.png')  // path to your visible icon
          }
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>

          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity 
            onPress={() => {
                setShowForgotPasswordModal(true);
                setStep(1);  // reset to step 1
                setContact('');
                setOtp('');
                setNewPassword('');
              }}
            >
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* forgot password section */}
      <Modal
  visible={showForgotPasswordModal}
  transparent
  animationType="slide"
  onRequestClose={() => setShowForgotPasswordModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.forgotModalContainer}>
      
      {/* Close Icon */}
      <TouchableOpacity
        onPress={() => setShowForgotPasswordModal(false)}
        style={styles.closeIconWrapper}
      >
        <Image
          source={require('../assets/UserProfile/close.png')} // update path if needed
          style={styles.closeIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Title and Subtitle */}
      <Text style={styles.forgotTitle}>🔐 Forgot Password</Text>
      <Text style={styles.forgotSubtitle}>We'll help you recover your account in 3 quick steps.</Text>

      {/* Step 1: Enter contact */}
      {(step === 1 || step === 2 || step === 3) && (
        <TextInput
          style={styles.input}
          placeholder="Enter Email or Phone"
          keyboardType="email-address"
          autoCapitalize="none"
          value={contact}
          onChangeText={setContact}
          placeholderTextColor="#999"
        />
      )}

      {/* Step 1: Send OTP */}
      {step === 1 && (
        <TouchableOpacity style={styles.forgetButton} onPress={handleSendOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.forgetButtonText}>Send OTP</Text>}
        </TouchableOpacity>
      )}

      {/* Step 2: Enter OTP */}
      {step === 2 && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            keyboardType="numeric"
            value={otp}
            onChangeText={setOtp}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.forgetButton} onPress={handleVerifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.forgetButtonText}>Verify OTP</Text>}
          </TouchableOpacity>
        </>
      )}

      {/* Step 3: New Password */}
      {step === 3 && (
        <>
           <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', color: '#000' }]}>
      <TextInput
        style={{ flex: 1 }}
        placeholder="Enter New Password"
        placeholderTextColor="#888"
        secureTextEntry={!showPassword}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 8 }}>
        <Image
          source={
            showPassword
              ? require('../assets/auth/hide.png')  // path to your hide icon
              : require('../assets/auth/visible.png')  // path to your visible icon
          }
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
          <TouchableOpacity style={styles.forgetButton} onPress={handleResetPassword} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.forgetButtonText}>Submit</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  </View>
</Modal>



          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
  {loading ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={styles.buttonText}>Login</Text>
  )}
</TouchableOpacity>


          {/* Create Account Section */}
          <View style={styles.createAccountContainer}>
            <Text style={styles.noAccountText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.createAccountText} onPress={() => navigation.navigate("RegisterScreen")}>Create Account</Text>
            </TouchableOpacity>

            {/* OR Divider */}
            {/* <View style={styles.orContainer}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View> */}

           {/* <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.gmailButton} onPress={handleGoogleSignIn}>
              <Image
                source={require("../assets/auth/google.png")} // Make sure this path is correct
                style={styles.gmailIcon}
                resizeMode="contain"
              />
              <Text style={styles.gmailText}>Sign in with Gmail</Text>
            </TouchableOpacity>
          </View> */}

          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
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
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
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
    marginTop: -80,
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
    marginBottom: 20,
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
  forgotPasswordContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 15,
  },
  forgotPassword: {
    color: "#1c78f2",
    fontSize: 14,
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
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    width: "100%",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  orText: {
    marginHorizontal: 10,
    color: "#666",
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  socialButton: {
    backgroundColor: "#f1f1f1",
    borderRadius: 50,
    padding: 10,
    marginHorizontal: 10,
  },
  socialIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  // Modal Styles
 modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
},

forgotModalContainer: {
  width: '90%',
  padding: 25,
  backgroundColor: '#fff',
  borderRadius: 16,
  position: 'relative',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 10,
},

forgotTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#222',
  marginBottom: 8,
  textAlign: 'center',
},

forgotSubtitle: {
  fontSize: 14,
  color: '#666',
  marginBottom: 20,
  textAlign: 'center',
},



forgetButton: {
  width: '100%',
  height: 50,
  backgroundColor: '#1c78f2',
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 5,
  marginBottom: 10,
},

forgetButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},

closeIconWrapper: {
  position: 'absolute',
  top: 15,
  right: 15,
  padding: 5,
  zIndex: 10,
},

closeIcon: {
  width: 20,
  height: 20,
 
},
// sign in with gmail
socialContainer: {
  
  alignItems: 'center',
},

gmailButton: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderWidth: 1,
  borderColor: '#ccc',
  borderLeftWidth: 4,
  borderLeftColor: '#EA4335', // Google's red
  borderRadius: 10,
  backgroundColor: '#fff',
  width: '90%',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 3,
},

gmailIcon: {
  width: 24,
  height: 24,
  marginRight: 12,
},

gmailText: {
  fontSize: 16,
  color: '#333',
  fontWeight: '600',
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
});

export default LoginScreen;
