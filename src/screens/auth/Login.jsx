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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';



const screenHeight = Dimensions.get("window").height;

const LoginScreen = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);


const handleLogin = async () => {
  setLoading(true); // Start loading

  const credentials = {
    mobile_number: mobileNumber,
    password: password,
  };

  try {
    const response = await fetch('https://ezydoc.pythonanywhere.com/users/login/', {
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
      const doctorId = user.user_id;
      const labId = user.user_id;
      const patientId = user.user_id;
      const ambulanceId = user.user_id;

      // Save user IDs
      await AsyncStorage.setItem('doctorId', doctorId);
      await AsyncStorage.setItem('labId', labId);
      await AsyncStorage.setItem('patientId', patientId);
      await AsyncStorage.setItem('ambulanceId', ambulanceId);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));

      // Save tokens
      const accessToken = data.Token.access;
      const refreshToken = data.Token.refresh;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);

      // User details
      const userDetails = {
        patientId: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.mobile_number,
      };

      // Navigate based on role
      if (user.is_admin) {
        console.log('Navigating to AdminDashboard');
        navigation.navigate('AdminDashboard');
      } else if (userRole === 'patient') {
        console.log('Navigating to HomePage');
        navigation.navigate('HomePage', userDetails);
      } else if (userRole === 'doctor') {
        console.log('Navigating to DoctorDashboard');
        navigation.navigate('DoctorDashboard');
      } else if (userRole === 'ambulance') {
        console.log('Navigating to AmbulanceDashboard');
        navigation.navigate('AmbulanceDashboard');
      } else if (userRole === 'lab') {
        console.log('Navigating to LabTestDashboard');
        navigation.navigate('LabTestDashboard');
      } else {
        console.log('Unknown Role:', userRole);
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

      if (!errorMessage) {
        errorMessage = 'Login failed. Please try again.';
      }

      Alert.alert('Error', errorMessage.trim());
    }
  } catch (error) {
    console.error('Login error:', error);
    Alert.alert('Error', 'Network error. Please try again later.');
  } finally {
    setLoading(false); // Stop loading
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

          <TextInput
            style={styles.input}
            placeholder="Enter Mobile Number"
            keyboardType="numeric"
            maxLength={10}
            value={mobileNumber}
            onChangeText={setMobileNumber}
          />

         <View style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}>
      <TextInput
        style={{ flex: 1 }}
        placeholder="Enter Password"
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
            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

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
            <View style={styles.orContainer}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            {/* Social Login Options */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Image
                  source={require("../assets/auth/google.png")} // 🔁 Use actual path
                  style={styles.socialIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Image
                  source={require("../assets/auth/social.png")} // 🔁 Use actual path
                  style={styles.socialIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Image
                  source={require("../assets/auth/facebook.png")} // 🔁 Use actual path
                  style={styles.socialIcon}
                />
              </TouchableOpacity>
            </View>
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
    backgroundColor: "#6495ED",
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
  },
  forgotPasswordContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 15,
  },
  forgotPassword: {
    color: "#6495ED",
    fontSize: 14,
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
    color: "#6495ED",
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
});

export default LoginScreen;
