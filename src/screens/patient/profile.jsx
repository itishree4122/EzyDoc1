import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, FlatList, Alert, KeyboardAvoidingView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from '../auth/Api'; // adjust the path as needed
import { getToken } from '../auth/tokenHelper'; // adjust the path as needed
import DropDownPicker from 'react-native-dropdown-picker';
import { ActivityIndicator } from 'react-native';


const Profile = ({ route }) => {
  const { firstName, lastName, email, phone, patientId } = route.params;
  const navigation = useNavigation();

  const [dob, setDob] = useState('');
  const [genderOpen, setGenderOpen] = useState(false);
  const [gender, setGender] = useState(null);
  const [genderItems, setGenderItems] = useState([
    { label: 'Male', value: 'M' },
    { label: 'Female', value: 'F' },
  ]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);

  // Validate required fields
  if (!dob || !address || !gender) {
    Alert.alert(
      'Validation Error',
      'Please fill out all required fields: Date of Birth, Address, and Gender.'
    );
    setLoading(false);
    return;
  }

  // Validate date format: yyyy-mm-dd
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dob)) {
    Alert.alert(
      'Validation Error',
      'Date of Birth must be in the format yyyy-mm-dd.'
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
      Alert.alert('Error', 'Access token not found');
      setLoading(false);
      return;
    }

    const response = await fetch(`${BASE_URL}/patients/profiles/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const responseText = await response.text();
    console.log('API Status:', response.status);
    console.log('Raw response:', responseText);

    if (!response.ok) {
      const lowerText = responseText.toLowerCase();

      if (
        response.status === 409 ||
        lowerText.includes('already') ||
        lowerText.includes('exist') ||
        lowerText.includes('profile')
      ) {
        Alert.alert('Info', 'Profile has already been submitted.', [
          { text: 'OK', onPress: () => setLoading(false) }
        ]);
      } else {
        console.error('API Error:', responseText);
        Alert.alert('Error', 'Failed to create profile', [
          { text: 'OK', onPress: () => setLoading(false) }
        ]);
      }
      return;
    }

    try {
      const data = JSON.parse(responseText);
      Alert.alert('Success', `Profile created for user ID: ${data.user_id}`, [
        {
          text: 'OK',
          onPress: () => {
            setLoading(false);
            navigation.goBack();
          },
        },
      ]);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      Alert.alert('Error', 'Unexpected response format from server', [
        { text: 'OK', onPress: () => setLoading(false) }
      ]);
    }
  } catch (error) {
    console.error('Error:', error);
    Alert.alert('Error', 'An error occurred while creating the profile', [
      { text: 'OK', onPress: () => setLoading(false) }
    ]);
  }
};



  const profileFields = [
    { label: 'First Name', value: firstName, icon: require('../assets/UserProfile/person.png'), editable: false },
    { label: 'Last Name', value: lastName, icon: require('../assets/UserProfile/person.png'), editable: false },
    { label: 'Email Address', value: email, icon: require('../assets/UserProfile/email.png'), editable: false },
    { label: 'Phone Number', value: phone, icon: require('../assets/UserProfile/phone.png'), editable: false },
    {
      label: 'Date of Birth *',
      value: dob,
      icon: require('../assets/UserProfile/icons8-age-48.png'),
      editable: true,
      onChangeText: setDob,
      placeholder: 'YYYY-MM-DD',
    },
    {
      label: 'Address *',
      value: address,
      icon: require('../assets/UserProfile/icons8-gender-48.png'),
      editable: true,
      onChangeText: setAddress,
      placeholder: 'Enter Address',
    },
  ];

  const renderItem = ({ item }) => (
    <>
      <Text style={styles.label}>{item.label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={item.value}
          editable={item.editable}
          onChangeText={item.onChangeText}
          placeholder={item.placeholder || ''}
          keyboardType={item.label.includes('Phone') ? 'phone-pad' : 'default'}
        />
        <Image source={item.icon} style={styles.inputIcon} />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
            <View style={styles.headerContainer}>
              <TouchableOpacity style={styles.backIconContainer} onPress={() => navigation.goBack()}>
                             <Image
                               source={require("../assets/UserProfile/back-arrow.png")} // Replace with your back arrow image
                               style={styles.backIcon}
                             />
                           </TouchableOpacity>
              <Text style={styles.title}>Complete Your Profile</Text>
            </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <FlatList
          contentContainerStyle={styles.cardContent}
          style={styles.card}
          showsVerticalScrollIndicator={false}
          data={profileFields}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}

           // 👉 Add this
  ListHeaderComponent={
    <View style={styles.infoSection}>
      <Text style={styles.infoHeading}>Fill Out Required Info</Text>
      <Text style={styles.infoSubtext}>
        Fill in your details accurately to complete your profile.
        Please provide your birth date, address, and gender.
      </Text>
    </View>
  }
          
          ListFooterComponent={
            <>
              <Text style={styles.label}>Gender *</Text>
              <View style={{ zIndex: 1000, marginBottom: 20 }}>
                <DropDownPicker
                  open={genderOpen}
                  value={gender}
                  items={genderItems}
                  setOpen={setGenderOpen}
                  setValue={setGender}
                  setItems={setGenderItems}
                  placeholder="Select Gender"
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>save</Text>
                  )}
              </TouchableOpacity>
            </>
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6495ed",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 10,
  },
  backButton: {
    marginRight: 10, // Adds spacing between icon and title
  },
  backIconContainer: {
    width: 30,
    height: 30,
    backgroundColor: "#AFCBFF", // White background
    borderRadius: 20, // Makes it circular
    alignItems: "center",
    justifyContent: "center",
    
  },
  backIcon: {
    width: 18,
    height: 18,
    tintColor: "#fff", // Matches your theme
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 25,
    fontWeight: "bold",
    marginLeft: 10,
  },
  card: {
    flexGrow: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    
  },
  infoSection: {
  marginBottom: 20,
},

infoHeading: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 4,
},

infoSubtext: {
  fontSize: 14,
  color: '#666',
},

  cardContent: {
    marginHorizontal: 15,
    paddingBottom: 20, // Ensure there's some space below the content when scrolling
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0F0F0",
  },
  inputContainer: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1, // Takes the full width except for the icon
    height: 50,
    paddingHorizontal: 10,
    backgroundColor: "transparent",
  },
  dropdown: {
  borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 8,
  paddingHorizontal: 10,
  height: 50,
},

dropdownContainer: {
  borderColor: '#ccc',
  borderRadius: 5,
},

  inputIcon: {
    width: 20,
    height: 20,
    tintColor: "#888",
  },
  saveButton: {
    backgroundColor: "#6495ED",
    paddingVertical: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Profile;
