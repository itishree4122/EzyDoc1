import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from '../auth/Api'; // adjust the path as needed
import { getToken } from '../auth/tokenHelper'; // adjust the path as needed

const Profile = ({route}) => {
  const { firstName, lastName, email, phone, patientId } = route.params;
  const navigation = useNavigation();

  
  const [dob, setDob] = useState("");  // New state for age
  const [gender, setGender] = useState("");  // New state for gender
  const [address, setAddress] = useState("");

 const handleSubmit = async () => {
  const profileData = {
    date_of_birth: dob,
    address,
    gender
  };

  try {
    const token = await getToken();

    if (!token) {
      Alert.alert('Error', 'Access token not found');
      return;
    }

    const response = await fetch(`${BASE_URL}/patients/profiles/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    // Log the raw response
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    // Check if the response is OK (status code 2xx)
    if (!response.ok) {
      console.error('API Error:', responseText);
      Alert.alert('Error', 'Failed to create profile');
      return;
    }

    // If response is JSON, parse it
    try {
      const data = JSON.parse(responseText);
      Alert.alert('Success', `Profile created for user ID: ${data.user_id}`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      Alert.alert('Error', 'Unexpected response format from server');
    }

  } catch (error) {
    console.error('Error:', error);
    Alert.alert('Error', 'An error occurred while creating the profile');
  }
};


  return (
    <View style={styles.container}>
      {/* User Profile Heading */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.backIconContainer}>
            <Image
              source={require("../assets/UserProfile/back-arrow.png")} // Replace with your back arrow image
              style={styles.backIcon}
            />
          </View>
        </TouchableOpacity>

        <Text style={styles.title}>Edit Your Profile</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}>
        {/* Profile Image inside the Card */}
        <View style={styles.imageContainer}>
          <Image source={require("../assets/UserProfile/profile-circle-icon.png")} style={styles.profileImage} />
        </View>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          {/* First Name Input */}
          <Text style={styles.label}>First Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={firstName}
              // onChangeText={setFirstName}
              placeholder="Enter First Name"
            />
            <Image source={require("../assets/UserProfile/person.png")} style={styles.inputIcon} />
          </View>

          {/* Last Name Input */}
          <Text style={styles.label}>Last Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={lastName}
              // onChangeText={setLastName}
              placeholder="Enter Last Name"
            />
            <Image source={require("../assets/UserProfile/person.png")} style={styles.inputIcon} />
          </View>

          {/* Email Input */}
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={email}
              // onChangeText={setEmail}
              placeholder="Enter Email"
              keyboardType="email-address"
            />
            <Image source={require("../assets/UserProfile/email.png")} style={styles.inputIcon} />
          </View>

          {/* Phone Number Input */}
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={phone}
              // onChangeText={setPhone}
              placeholder="Enter Phone Number"
              keyboardType="phone-pad"
            />
            <Image source={require("../assets/UserProfile/phone.png")} style={styles.inputIcon} />
          </View>

          {/* Date of Birth Input */}
          <Text style={styles.label}>Date of Birth</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={dob}
              onChangeText={setDob}
              placeholder="YYYY-MM-DD"
              
            />
            <Image source={require("../assets/UserProfile/icons8-age-48.png")} style={styles.inputIcon} />
          </View>

          {/* Address Input */}
          <Text style={styles.label}>Address</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter Address"
            />
            <Image source={require("../assets/UserProfile/icons8-gender-48.png")} style={styles.inputIcon} />
          </View>
          {/* Gender Input */}
          <Text style={styles.label}>Gender</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={gender}
              onChangeText={setGender}
              placeholder="Enter Gender"
            />
            <Image source={require("../assets/UserProfile/icons8-gender-48.png")} style={styles.inputIcon} />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6495ED",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10, // Adds spacing between icon and title
  },
  backIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#AFCBFF", // White background
    borderRadius: 20, // Makes it circular
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff", // Matches your theme
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  card: {
    flexGrow: 1,
    width: "100%",
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
  cardContent: {
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
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1, // Takes the full width except for the icon
    height: 50,
    paddingHorizontal: 10,
    backgroundColor: "transparent",
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
