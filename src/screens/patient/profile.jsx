import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import { ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import moment from 'moment';
import Header from '../../components/Header';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from "@react-native-async-storage/async-storage";
const Profile = ({ route }) => {
  const { firstName, lastName, email, phone, patientId } = route.params;
  const navigation = useNavigation();
  const scrollViewRef = useRef();
  const addressInputRef = useRef();

  const [dob, setDob] = useState('');
  const [gender, setGender] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);

  const genderOptions = [
    { label: 'Male', value: 'M', icon: 'male' },
    { label: 'Female', value: 'F', icon: 'female' },
    { label: 'Other', value: 'O', icon: 'transgender' }
  ];

  const handleSubmit = async () => {
    setLoading(true);

    if (!dob || !address || !gender) {
      Alert.alert(
        'Required Information',
        'Please fill out all required fields: Date of Birth, Address, and Gender.'
      );
      setLoading(false);
      return;
    }

    const profileData = {
      date_of_birth: dob,
      address,
      gender,
    };

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetchWithAuth(`${BASE_URL}/patients/profiles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const responseText = await response.text();

      if (!response.ok) {
        const lowerText = responseText.toLowerCase();
        if (response.status === 409 || lowerText.includes('already') || lowerText.includes('exist')) {
          Alert.alert('Info', 'Profile has already been submitted.');
          navigation.replace('HomePage');
          return;
        }
        throw new Error(responseText || 'Failed to create profile');
      }

      Alert.alert('Success', 'Profile completed successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.replace('HomePage'),
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'An error occurred while creating the profile');
    } finally {
      setLoading(false);
    }
  };
const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              await fetch(`${BASE_URL}/users/firebase-token/remove/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.log("Logout failed:", error);
              Alert.alert("Error", "Something went wrong while logging out.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  const renderInfoPill = (iconName, text) => (
    <View style={styles.pill}>
      <Icon name={iconName} size={16} color="#4a8fe7" />
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );

  const handleAddressFocus = () => {
    // Scroll to the address input when focused
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  return (
    <View style={styles.container}>
      {/* <TouchableOpacity
  style={styles.logoutButton}
  onPress={handleLogout}
>
  <Icon name="logout" size={20} color="#e53935" />
  <Text style={styles.logoutButtonText}>Log Out</Text>
</TouchableOpacity> */}
      {/* <Header title="Complete Your Profile" /> */}
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* User Info Section */}
          {/* <View style={styles.userInfoCard}>
            <View style={styles.avatar}>
              <Icon name="account-circle" size={60} color="#4a8fe7" />
              
            </View>
            
            <Text style={styles.userName}>{firstName} {lastName}</Text>
            
            <View style={styles.pillsContainer}>
              {renderInfoPill('mail', email)}
              {renderInfoPill('phone', phone)}
            </View>
          </View> */}
          <View style={[styles.userInfoCard, { position: 'relative', alignItems: 'center', justifyContent: 'center' }]}>
  {/* Logout button at top right */}
  <TouchableOpacity
    style={styles.logoutIconButtonAbsolute}
    onPress={handleLogout}
  >
    <Icon name="logout" size={22} color="#e53935" />
  </TouchableOpacity>

  {/* Centered avatar and details */}
  <View style={styles.avatar}>
    <Icon name="account-circle" size={60} color="#4a8fe7" />
  </View>
  <Text style={styles.userName}>{firstName} {lastName}</Text>
  <View style={styles.pillsContainer}>
    {renderInfoPill('mail', email)}
    {renderInfoPill('phone', phone)}
  </View>
</View>
          {/* Completion Prompt */}
          <View style={styles.completionPrompt}>
            <View style={styles.completionIcon}>
              <IonIcon name="information-circle" size={24} color="#4a8fe7" />
            </View>
            <Text style={styles.completionText}>
              Please complete your profile to access all features
            </Text>
          </View>

          {/* Editable Fields Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Information</Text>
            
            {/* Date of Birth Field */}
            <TouchableOpacity 
              style={styles.fieldContainer}
              onPress={() => {
                Keyboard.dismiss();
                setShowDobPicker(true);
              }}
            >
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <View style={styles.inputField}>
                <Text style={[styles.inputText, !dob && { color: '#888' }]}>
                  {dob ? moment(dob, 'YYYY-MM-DD').format('DD MMM YYYY') : 'Select your birth date'}
                </Text>
                <Icon name="calendar-today" size={20} color="#4a8fe7" />
              </View>
            </TouchableOpacity>

            {/* Address Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Address</Text>
              <View style={styles.inputField}>
                <TextInput
                  ref={addressInputRef}
                  style={styles.inputText}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter your full address"
                  placeholderTextColor="#888"
                  onFocus={handleAddressFocus}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <Icon name="location-on" size={20} color="#4a8fe7" />
              </View>
            </View>

            {/* Gender Selection */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderOptions}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderOption,
                      gender === option.value && styles.genderOptionSelected
                    ]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setGender(option.value);
                    }}
                  >
                    <Icon 
                      name={option.icon} 
                      size={20} 
                      color={gender === option.value ? '#fff' : '#4a8fe7'} 
                    />
                    <Text style={[
                      styles.genderOptionText,
                      gender === option.value && styles.genderOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Complete Profile</Text>
                <Icon name="check-circle" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
          
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDobPicker && (
        <DateTimePicker
          value={dob ? new Date(dob) : new Date(2000, 0, 1)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDobPicker(false);
            if (selectedDate) {
              const yyyy = selectedDate.getFullYear();
              const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
              const dd = String(selectedDate.getDate()).padStart(2, '0');
              setDob(`${yyyy}-${mm}-${dd}`);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  userInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 6,
    // elevation: 3,
  //   shadowColor: '#2563eb',
  // shadowOpacity: 0.10,
  // shadowRadius: 16,
  // shadowOffset: { width: 0, height: 4 },
  // elevation: 12,
  },
  avatar: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  pillsContainer: {
    width: '100%',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    alignSelf: 'center',
  },
  pillText: {
    fontSize: 14,
    color: '#4a8fe7',
    marginLeft: 8,
  },
  completionPrompt: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  completionIcon: {
    marginRight: 10,
  },
  completionText: {
    flex: 1,
    fontSize: 14,
    color: '#4a8fe7',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    // elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 25,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 50, // Ensure consistent height
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100, // Limit height for multiline
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  genderOptionSelected: {
    backgroundColor: '#4a8fe7',
    borderColor: '#4a8fe7',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#4a8fe7',
    marginLeft: 8,
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a8fe7',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#4a8fe7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  logoutButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 14,
  marginTop: 30,
  marginBottom: 10,
  alignSelf: 'center',
  shadowColor: '#e53935',
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  // elevation: 2,
},
logoutButtonText: {
  color: '#e53935',
  fontWeight: 'bold',
  fontSize: 16,
  marginLeft: 8,
},
// logoutIconButton: {
//   marginLeft: 10,
//   backgroundColor: '#fff',
//   borderRadius: 20,
//   padding: 8,
//   shadowColor: '#e53935',
//   shadowOpacity: 0.08,
//   shadowRadius: 8,
//   shadowOffset: { width: 0, height: 2 },
// },
logoutIconButtonAbsolute: {
  position: 'absolute',
  top: 12,
  right: 12,
  backgroundColor: '#fff',
  borderRadius: 100,
  padding: 8,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 2 },
  // zIndex: 10,
  // elevation: 12,
  borderWidth:0.5,
  borderColor: '#e53935',
  borderBottomWidth:2,
},
});

export default Profile;