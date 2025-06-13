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
  ActivityIndicator,
  FlatList,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locations } from "../../constants/locations";
const LabRegister = () => {
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [homeSampleCollection, setHomeSampleCollection] = useState(false);
  const [labTypes, setLabTypes] = useState([]); // fetched from API
  const [selectedLabTypes, setSelectedLabTypes] = useState([]); // array of selected IDs
  const [loadingLabTypes, setLoadingLabTypes] = useState(true);
const [city, setCity] = useState("");
const [showCityDropdown, setShowCityDropdown] = useState(false);
const [cityModalVisible, setCityModalVisible] = useState(false);
  const endpoint = '/labs/lab-profiles/';

  // Fetch lab types from API
  useEffect(() => {
    const fetchLabTypes = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${BASE_URL}/labs/lab-types/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setLabTypes(data);
        } else {
          Alert.alert('Error', 'Failed to fetch lab types');
        }
      } catch (error) {
        Alert.alert('Error', 'Could not fetch lab types');
      } finally {
        setLoadingLabTypes(false);
      }
    };
    fetchLabTypes();
  }, []);

  // Toggle selection for lab types
  const toggleLabType = (id) => {
    setSelectedLabTypes((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const registerLab = async () => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Error', 'Access token not found');
      return;
    }
if (!city) {
  Alert.alert('Error', 'Please select a city.');
  return;
}
    if (selectedLabTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one lab type.');
      return;
    }

    const labData = {
      name,
      address: clinicAddress,
      phone: registrationNumber,
      home_sample_collection: homeSampleCollection,
      lab_types: selectedLabTypes,
      location: city,
    };

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(labData),
      });

      const data = await response.json();

      if (response.ok) {
  await AsyncStorage.setItem('labTypeId', data.id);
  Alert.alert('Success', 'Lab registered successfully!', [
    {
      text: 'OK',
      onPress: () => navigation.replace('LabTestDashboard'),
    },
  ]);
} else {
  Alert.alert('Error', JSON.stringify(data));
}
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.toolbar}>
        {/* <View style={styles.backIconContainer}>
          <Image
            source={require("../assets/UserProfile/back-arrow.png")}
            style={styles.backIcon}
          />
        </View> */}
        <TouchableOpacity style={styles.backIconContainer} onPress={() => navigation.goBack()}>
                  <Image
                    source={require("../assets/UserProfile/back-arrow.png")}
                    style={styles.backIcon}
                  />
                </TouchableOpacity>
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
                {/* All fields are mandatory. Ensure that your Registration number and service information is up-to-date. */}
                All fields are mandatory.
              </Text>
            </View>
          </View>
          <View style={styles.formContainer}>
            <Text style={styles.label}>Clinic Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Clinic Name"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Registration Number"
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
            />

            <Text style={styles.label}>Clinic Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Clinic Address"
              value={clinicAddress}
              onChangeText={setClinicAddress}
            />
<Text style={styles.label}>City</Text>
<TouchableOpacity
  style={[styles.input, { flexDirection: "row", alignItems: "center" }]}
  onPress={() => setCityModalVisible(true)}
  activeOpacity={0.8}
>
  <Text style={{ color: city ? "#222" : "#aaa", flex: 1 }}>
    {city || "Select City"}
  </Text>
  <Text style={{ color: "#6495ED", fontWeight: "bold" }}>▼</Text>
</TouchableOpacity>
{showCityDropdown && (
  <View style={[styles.dropdownContainer, { height: 250 }]}>
    <FlatList
  data={locations.filter(loc => loc !== "All")}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.dropdownItem,
            city === item && { backgroundColor: "#e6f0ff" },
          ]}
          onPress={() => {
            setCity(item);
            setShowCityDropdown(false);
          }}
        >
          <Text style={{ color: "#222", fontSize: 16 }}>{item}</Text>
        </TouchableOpacity>
      )}
      keyboardShouldPersistTaps="handled"
    />
  </View>
)}
            <Text style={styles.label}>Home Sample Collection</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  homeSampleCollection && styles.checkboxChecked,
                ]}
                onPress={() => setHomeSampleCollection((prev) => !prev)}
              >
                {homeSampleCollection && <View style={styles.checkboxInner} />}
              </TouchableOpacity>
              <Text style={{ marginLeft: 8 }}>Yes</Text>
            </View>

            <Text style={styles.label}>Lab Types</Text>
            {loadingLabTypes ? (
              <ActivityIndicator size="small" color="#6495ED" />
            ) : (
              labTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.multiSelectRow}
                  onPress={() => toggleLabType(type.id)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selectedLabTypes.includes(type.id) && styles.checkboxChecked,
                    ]}
                  >
                    {selectedLabTypes.includes(type.id) && <View style={styles.checkboxInner} />}
                  </View>
                  <Text style={{ marginLeft: 8 }}>{type.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
        <View style={styles.footerButtonContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={registerLab}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Modal
  visible={cityModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setCityModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.cityModalContent}>
      <Text style={styles.modalTitle}>Select City</Text>
      <FlatList
  data={locations.filter(loc => loc !== "All")}
        keyExtractor={(item) => item}
        style={{ maxHeight: 350 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.dropdownItem,
              city === item && { backgroundColor: "#e6f0ff" },
            ]}
            onPress={() => {
              setCity(item);
              setCityModalVisible(false);
            }}
          >
            <Text style={{ color: "#222", fontSize: 16 }}>{item}</Text>
          </TouchableOpacity>
        )}
        keyboardShouldPersistTaps="handled"
      />
      <TouchableOpacity
        style={[styles.loginButton, { marginTop: 16, backgroundColor: "#888" }]}
        onPress={() => setCityModalVisible(false)}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.3)",
  justifyContent: "center",
  alignItems: "center",
},
cityModalContent: {
  backgroundColor: "#fff",
  borderRadius: 12,
  padding: 20,
  width: "85%",
  maxHeight: "80%",
  alignItems: "stretch",
},
modalTitle: {
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 12,
  color: "#222",
},
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
  dropdownContainer: {
  width: "100%",
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  marginBottom: 10,
  marginTop: -10,
  zIndex: 10,
  position: "absolute",
  top: 50, // adjust if needed
  left: 0,
  maxHeight: 250, 
},
dropdownItem: {
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: "#f0f0f0",
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
    checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#6495ED",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#6495ED",
    borderColor: "#6495ED",
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: "#fff",
    borderRadius: 3,
  },
  multiSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 2,
  },

});

export default LabRegister;
