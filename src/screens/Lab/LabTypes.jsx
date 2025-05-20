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
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Picker } from '@react-native-picker/picker';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useRoute } from "@react-navigation/native";

const LabTypes = () => {
  const navigation = useNavigation();
  // const route = useRoute();
 
  const [lab, setLab] = useState("");
  const [id, setId] = useState('');
  const [labTests, setLabTests] = useState(['']); // Start with one field
 
  const addLabTestField = () => {
    setLabTests([...labTests, '']);
  };

  const handleTextChange = (text, index) => {
    const updatedLabTests = [...labTests];
    updatedLabTests[index] = text;
    setLabTests(updatedLabTests);
  };

  useEffect(() => {
  const fetchLabId = async () => {
    try {
      const storedId = await AsyncStorage.getItem('labTypeId');
      if (storedId) {
        setId(storedId); // Automatically populate the field
        console.log('Auto-loaded Lab ID:', storedId);
      }
    } catch (error) {
      console.error('Error loading Lab ID:', error);
    }
  };

  fetchLabId();
}, []);


 // Function to submit lab profile (included here)
  const submitLabProfile = async () => {
    const token = await getToken();

    if (!token) {
      Alert.alert('Error', 'Access token not found');
      return;
    }

    if (!id) {
      Alert.alert('Error', 'Lab Profile ID not found');
      return;
    }

    if (!lab.trim()) {
      Alert.alert('Error', 'Please enter Lab Type');
      return;
    }

    const filteredTests = labTests.filter(test => test.trim() !== '');
    if (filteredTests.length === 0) {
      Alert.alert('Error', 'Please add at least one Lab Test');
      return;
    }

    const payload = {
      name: lab,
      tests: filteredTests,
      lab_profile: id,
    };

    try {
      const response = await fetch(`${BASE_URL}/labs/lab-types/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Lab profile submitted successfully');
        console.log('Lab profile response:', data);
        setLab('');
        setLabTests(['']);
      } else {
        console.log('Submission error response:', data);
        Alert.alert('Error', data?.message || 'Failed to submit lab profile');
      }
    } catch (error) {
      console.error('Submission exception:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.backIconContainer}>
        <Image
          source={require("../assets/UserProfile/back-arrow.png")}
          style={styles.backIcon}
        />
        </View>
        
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
      All fields are mandatory. Ensure that your Registration number and service information is up-to-date.
    </Text>
  </View>
  
</View>


          {/* Form */}
          <View style={styles.formContainer}>


            <Text style={styles.label}>Id</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Id"
              value={id}
              editable={false}
            />
            
            {/* doctor name */}
          <Text style={styles.label}>Lab Type</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Lab Type"
              value={lab}
              onChangeText={setLab}
            />
           

           <View style={styles.labelRow}>
        <Text style={styles.label}>Lab Tests</Text>
        <TouchableOpacity onPress={addLabTestField}>
          <Image source={require('../assets/ambulance/plus.png')} style={styles.plusIcon} />
        </TouchableOpacity>
      </View>

      {/* Render each input field */}
      {labTests.map((test, index) => (
        <TextInput
          key={index}
          style={styles.input}
          placeholder={`Enter Lab Test ${index + 1}`}
          value={test}
          onChangeText={(text) => handleTextChange(text, index)}
        />
      ))}
            
          </View>
        </ScrollView>

        {/* Submit Button fixed at bottom */}
  <View style={styles.footerButtonContainer}>
    <TouchableOpacity style={styles.loginButton} onPress={submitLabProfile} >
      <Text style={styles.buttonText}>Submit</Text>
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

  // text heading
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -70,
  },
  textContainer: {
    flex: 1,
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 15,
    paddingRight: 10,
  },
  loginHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  loginSubheading: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  infoImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    right: 15,
    
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  plusIcon: {
    width: 20,
    height: 20,
    tintColor: '#007BFF',
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 7,
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
    marginBottom: 20,
    marginTop: 5,
    justifyContent: "center",
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  plusIcon: {
    width: 24,
    height: 24,
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
});

export default LabTypes;
