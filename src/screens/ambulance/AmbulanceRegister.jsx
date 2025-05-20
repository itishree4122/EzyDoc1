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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
// import { useRoute } from "@react-navigation/native";

const AmbulanceRegister = () => {
  const navigation = useNavigation();
  // const route = useRoute();
 
  const [service, setService] = useState("");
  const [ambulanceNumber, setAmbulanceNumber] = useState("");
  const [places, setPlaces] = useState(['']);
  const [isEditable, setIsEditable] = useState(false); // default: non-editable


  const handleRegister = () => {
    if (!service || !ambulanceNumber || !place) {
      Alert.alert("Error", "Please all fields.");
      return;
    }

    Alert.alert("Success", "Registration successful!");
  };

  // add places 
  const handleAddField = () => {
    if (places.length < 5) {
      setPlaces([...places, '']);
    }
  };

  const handleChangeText = (text, index) => {
    const updated = [...places];
    updated[index] = text;
    setPlaces(updated);
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
          {/* Title */}
          {/* <View style={styles.titleContainer}>
            <Text style={styles.instructionTitle}>Doctor Registration</Text>
            <Text style={styles.instructionSubtitle}>
              Please fill in the details below carefully.
            </Text>
          </View> */}

<View style={styles.infoContainer}>
  <View style={styles.textContainer}>
    <Text style={styles.loginHeading}>Verify Your Information</Text>
    <Text style={styles.loginSubheading}>
      All fields are mandatory. Ensure that your ambulance number and service information is up-to-date.
    </Text>
  </View>
  <Image
    source={require('../assets/ambulance/medical2.png')} // Replace with your image path
    style={styles.infoImage}
  />
</View>


          {/* Form */}
          <View style={styles.formContainer}>
            
            {/* doctor name */}
          <Text style={styles.label}>Ambulance Service</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Your Service Name"
              value={service}
              onChangeText={setService}
            />
           

            <Text style={styles.label}>Ambulance Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Ambulance Number"
              value={ambulanceNumber}
              onChangeText={setAmbulanceNumber}
            />

<View style={styles.labelRow}>
        <Text style={styles.label}>Add Place(s)</Text>
        {places.length < 5 && (
          <TouchableOpacity onPress={handleAddField}>
            <Image
              source={require('../assets/ambulance/plus.png')} // replace with your actual image path
              style={styles.plusIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {places.map((place, index) => (
        <TextInput
          key={index}
          style={styles.input}
          placeholder={`Enter Place ${index + 1}`}
          value={place}
          onChangeText={(text) => handleChangeText(text, index)}
        />
      ))}

           
          </View>
        </ScrollView>

        {/* Submit Button fixed at bottom */}
  <View style={styles.footerButtonContainer}>
    <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
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
    padding: 15,
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
    tintColor: 'red',
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
    marginBottom: 10,
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

export default AmbulanceRegister;
