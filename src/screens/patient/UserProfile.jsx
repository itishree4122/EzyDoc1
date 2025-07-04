import React, {useEffect, useState} from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TextInput, Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../auth/Api'; // adjust the path as needed
import { getToken } from '../auth/tokenHelper'; // adjust the path as needed
import { fetchWithAuth } from '../auth/fetchWithAuth';
import DateTimePicker from '@react-native-community/datetimepicker';

import moment from 'moment';
const UserProfile = ({route}) => {
  const [user, setUser] = useState(null);
  const [moreDetails, setMoreDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

const [editableFields, setEditableFields] = useState({}); // To track which fields are editable
const [formValues, setFormValues] = useState({
  date_of_birth: '',
  age: '',
  gender: '',
  address: '',
  created_at: '',
});


  const navigation = useNavigation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userData');
        if (jsonValue != null) {
          setUser(JSON.parse(jsonValue)); // 🔹 Set user object
        }
      } catch (e) {
        console.log("Error reading user data", e);
      }
    };

    fetchUser();
  }, []);

  const fetchMoreDetails = async () => {
  try {
    const token = await getToken();
    // const response = await fetch(`${BASE_URL}/patients/profiles/`, {
    const response = await fetchWithAuth(`${BASE_URL}/patients/profiles/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile details');
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const details = data[0];
      setMoreDetails(details);
      setShowDetails(true);

      // Set form fields for modal (excluding age – it's calculated from DOB)
      setFormValues({
        date_of_birth: details.date_of_birth || '',
        gender: details.gender || '',
        address: details.address || '',
        
      });

      setModalVisible(true);
    } else {
      Alert.alert('No data found');
    }
  } catch (error) {
    console.log('Error:', error);
    Alert.alert('Error', 'Could not fetch more details');
  }
};


// update details
const fetchPatientId = async () => {
  try {
    const userId = await AsyncStorage.getItem('patientId');
    if (userId) {
      return userId;  // Return the stored user ID
    }
    throw new Error('User ID not found');
  } catch (error) {
    console.log('Failed to fetch user ID:', error);
    return null; // Return null or handle accordingly
  }
};

// Usage in updateProfile

const updateProfile = async () => {
  try {
    const token = await getToken();
    const patientId = await fetchPatientId(); // Fetch the patientId

    if (!patientId) {
      Alert.alert('Error', 'Patient ID not found');
      return;
    }

    // const response = await fetch(`${BASE_URL}/patients/profiles/${patientId}/`, {
    const response = await fetchWithAuth(`${BASE_URL}/patients/profiles/${patientId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        date_of_birth: formValues.date_of_birth,
        gender: formValues.gender,
        address: formValues.address,
      }),
    });

    console.log('Response Status:', response.status); // Log the status code
    const data = await response.json(); // Get the JSON data from the response
    console.log('Response Data:', data); // Log the response body

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile'); // Use response data message if available
    }

    Alert.alert('Profile updated successfully');
    setMoreDetails(data); // Update the UI with the new profile data
    setModalVisible(false);
  } catch (error) {
    console.log('Error:', error);
    Alert.alert('Error', error.message || 'Could not update profile');
  }
};

// logout function
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
            console.log("User data cleared. Logged out.");

            // Navigate to login screen (adjust the route name as needed)
            // navigation.replace("Login");
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
           
                 </View>
      <Text style={styles.title}>User Profile</Text>

      {/* Main CardView covering the bottom part of the screen */}
      <View style={styles.card}>
        {/* Profile Card (Overlapping the Main Card) */}
        <View style={styles.profileCard}>
          <Image source={require("../assets/UserProfile/profile-circle-icon.png")} style={styles.profileImage} />
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{user?.first_name} {user?.last_name}</Text>
            <Text style={styles.profileEmail}>{user?.mobile_number}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <TouchableOpacity onPress={fetchMoreDetails}>
          <Text style={styles.addDetails}>View more details</Text>
        </TouchableOpacity>
     
          </View>
        </View>

        <Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <TouchableOpacity style={styles.closeIcon} onPress={() => setModalVisible(false)}>
        <Image source={require("../assets/UserProfile/close.png")} style={styles.closeImage} />
      </TouchableOpacity>

      {Object.entries(formValues).map(([key, value]) => (
        <View key={key} style={styles.fieldContainer}>
          <Text style={styles.label}>{key.replace(/_/g, ' ').toUpperCase()}</Text>
          <View style={styles.inputRow}>

            {key === 'date_of_birth' ? (
  <>
    <TouchableOpacity
      style={[
        styles.inputField,
        editableFields[key] && { borderColor: "#007bff", borderWidth: 1 },
        { justifyContent: 'center' }
      ]}
      onPress={() => editableFields[key] && setShowDatePicker(true)}
    >
      <Text>
        {formValues.date_of_birth
          ? moment(formValues.date_of_birth).format('DD-MM-YYYY')
          : 'Select Date'}
      </Text>
    </TouchableOpacity>

    {showDatePicker && (
      <DateTimePicker
        value={
          formValues.date_of_birth
            ? new Date(formValues.date_of_birth)
            : new Date(2000, 0, 1)
        }
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        maximumDate={new Date()}
        onChange={(event, selectedDate) => {
          setShowDatePicker(false);
          if (selectedDate) {
            const yyyy = selectedDate.getFullYear();
            const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const dd = String(selectedDate.getDate()).padStart(2, '0');
            const formatted = `${yyyy}-${mm}-${dd}`;
            setFormValues({ ...formValues, date_of_birth: formatted });
          }
        }}
      />
    )}
  </>
) : (
  <>
    <TextInput
      value={value}
      editable={!!editableFields[key]}
      onChangeText={(text) => setFormValues({ ...formValues, [key]: text })}
      style={[
        styles.inputField,
        editableFields[key] && { borderColor: "#007bff", borderWidth: 1 }
      ]}
    />
  </>
)}

            {/* <TextInput
  value={
    key === 'date_of_birth' && value
      ? moment(value, 'YYYY-MM-DD').format('DD-MM-YYYY')
      : value
  }
  editable={!!editableFields[key]}
  onChangeText={(text) =>
    setFormValues({ ...formValues, [key]: text })
  }
  style={[
    styles.inputField,
    editableFields[key] && { borderColor: "#007bff", borderWidth: 1 },
  ]}
/> */}

            <TouchableOpacity onPress={() =>
              setEditableFields({ ...editableFields, [key]: true })
            }>
              <Image source={require("../assets/doctor/edit-text.png")} style={styles.editIcon} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.updateButton} onPress={updateProfile}>
        <Text style={styles.updateText}>Update</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


 
        {/* Other Settings Heading */}
        <Text style={styles.settingsTitle}>Other Settings</Text>


        {/* Settings Card */}
        <View style={styles.settingsCard}>

           user && (

            <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate("Profile",{
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.mobile_number,
    patientId: user.user_id,
  })}>
            <Image source={require("../assets/UserProfile/edit.png")} style={styles.iconLeft} />
            <Text style={styles.settingsText}>Edit Profile</Text>
            <Image source={require("../assets/UserProfile/rightarrow.png")} style={styles.iconRight} />
          </TouchableOpacity>

          )
        

          <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate("Prescription")}>
          <Image source={require("../assets/UserProfile/prescription.png")} style={styles.iconLeft} />
            <Text style={styles.settingsText}>Prescription</Text>
            <Image source={require("../assets/UserProfile/rightarrow.png")} style={styles.iconRight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate("LabReport")}>
          <Image source={require("../assets/UserProfile/prescription.png")} style={styles.iconLeft} />
            <Text style={styles.settingsText}>Lab Report</Text>
            <Image source={require("../assets/UserProfile/rightarrow.png")} style={styles.iconRight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate("Insurance")}>
          <Image source={require("../assets/UserProfile/insurance.png")} style={styles.iconLeft} />
            <Text style={styles.settingsText}>Insurance Policy</Text>
            <Image source={require("../assets/UserProfile/rightarrow.png")} style={styles.iconRight} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsItem, styles.logout]} onPress={handleLogout}>
          <Image source={require("../assets/UserProfile/logout.png")} style={styles.iconLogout} />
            <Text style={[styles.settingsText, { color: "red" }]}>Log Out</Text>
            <Image source={require("../assets/UserProfile/rightarrow.png")} style={styles.iconRight} />
          </TouchableOpacity>
        </View>


       

        {/* Floating Bottom Navigation Bar */}
              <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navButton}
                onPress={() => navigation.navigate("HomePage")}
                >
                  <Image source={require("../assets/home.png")} style={styles.navIcon} />
                  <Text style={styles.navText}>Home</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.navButton}
                onPress={() => navigation.navigate("UserProfile")}
                >
                  <Image source={require("../assets/profile-picture.png")} style={styles.navIcon} />
                  <Text style={styles.navText}>Profile</Text>
                </TouchableOpacity>
              </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c78f2",
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
    backgroundColor: "#7EB8F9", // White background
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
    textAlign: "center",
    color: "#fff",
    
    
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    width: "90%",
    padding: 15,
    borderRadius: 15,
    alignSelf: "center",
    position: "absolute",
    top: -40,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
  },
  addDetails: {
    fontSize: 14,
    color: "#1c78f2"
  },
  card: {
    flexGrow: 1,
    width: "100%",
    backgroundColor: "#f8f8f8",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 60,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 80, // Space below the profile card
    marginBottom: 10,
  },
  settingsCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderColor: "#ddd",
    borderWidth: 1,
    borderBottomWidth:4,
    padding: 15,
    width: "100%",

    elevation: 0,
  },
  settingsItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    width: 24,
    height: 24,
    marginRight: 15,
    tintColor: 'black',
  },
  iconRight: {
    width: 20,
    height: 20,
    tintColor: "#000",
    position: "absolute",
  right: 15, // Adjust this value as needed
  },
  settingsText: {
    fontSize: 16,
    color: "#333",
  },
  logout: {
    borderBottomWidth: 0, // Remove border from the last item
    marginTop: 10,
  },
  iconLogout: {
    width: 24,
    height: 24,
    marginRight: 15,
    tintColor: 'red',
  },

   // Floating Bottom Navigation
 bottomNav: {
  position: "absolute",
  bottom: 20,
  left: 20,
  right: 20,
  flexDirection: "row",
  justifyContent: "space-around",
  backgroundColor: "#1c78f2",
  borderRadius: 30,
  paddingVertical: 10,
  elevation: 30,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowOffset: { width: 0, height: 0 },
},
navButton: { alignItems: "center" },
navIcon: { width: 24, height: 24, resizeMode: "contain", marginBottom: 3 },
navText: { fontSize: 12, color: "#fff" },
// add details
moreDetailsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
  },
  // modal
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
},
modalContainer: {
  width: "90%",
  backgroundColor: "#fff",
  borderRadius: 10,
  padding: 20,
  position: "relative",
},
closeIcon: {
  position: "absolute",
  top: 10,
  right: 10,
  zIndex: 1,
},
closeImage: {
  width: 20,
  height: 20,
},
fieldContainer: {
  marginBottom: 15,
},
label: {
  fontSize: 14,
  color: "#555",
  marginBottom: 5,
},
inputRow: {
  flexDirection: "row",
  alignItems: "center",
},
inputField: {
  flex: 1,
  padding: 10,
  backgroundColor: "#f2f2f2",
  borderRadius: 5,
  marginRight: 10,
},
editIcon: {
  width: 20,
  height: 20,
  tintColor: "#1c78f2",
},
updateButton: {
  marginTop: 20,
  backgroundColor: "#1c78f2",
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
},
updateText: {
  color: "#fff",
  fontWeight: "bold",
},

});

export default UserProfile;
