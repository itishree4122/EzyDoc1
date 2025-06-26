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
  Picker,
  FlatList,
  ActivityIndicator,
  LayoutAnimation,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import DropDownPicker from 'react-native-dropdown-picker';

// import { useRoute } from "@react-navigation/native";
const AmbulanceRegister = ({ route }) => {
  const navigation = useNavigation();
  const { ambulanceId } = route.params;

  const [service, setService] = useState('');
  const [ambulanceNumber, setAmbulanceNumber] = useState('');
  const [places, setPlaces] = useState(['']);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [city, setCity] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [cityValue, setCityValue] = useState(null);
  const [cityItems, setCityItems] = useState([
    { label: 'Bhubaneswar', value: 'Bhubaneswar' },
    { label: 'Bhadrak', value: 'Bhadrak' },
    { label: 'Cuttuck', value: 'Cuttuck' },
    { label: 'Puri', value: 'Puri' },
    { label: 'Rourkela', value: 'Rourkela' },
    { label: 'Angul', value: 'Angul' },
  ]);
  const [loading, setLoading] = useState(false);

 const handleRegister = async () => {
  if (
    !service.trim() ||
    !vehicleNumber.trim() ||
    !ambulanceNumber.trim() ||
    !whatsappNumber.trim() ||
    !city.trim() ||
    !places.some((place) => place.trim() !== '')
  ) {
    console.log('Validation failed: Required fields missing');
    Alert.alert('Validation Error', 'All fields are required including at least one place.');
    return;
  }

  setLoading(true);

  const token = await getToken();
  if (!token) {
    console.log('Error: Token not found');
    setLoading(false);
    Alert.alert('Error', 'Access token not found');
    return;
  }

  const payload = {
    ambulance_id: ambulanceId,
    service_name: service,
    vehicle_number: vehicleNumber,
    phone_number: ambulanceNumber,
    whatsapp_number: whatsappNumber,
    location: city,
    service_area: places.join(', '),
    active: true,
  };

  console.log('Payload being sent:', payload);

  try {
    const response = await fetch(`${BASE_URL}/ambulance/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Response from backend:', data);

    if (!response.ok) {
      setLoading(false);

      let errorMessage = 'Failed to register ambulance';

      // Extract first field error if available
      if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        if (Array.isArray(data[firstKey])) {
          errorMessage = data[firstKey][0];
        }
      }

      console.log('Registration failed:', errorMessage);
      Alert.alert('Error', errorMessage);
      return;
    }

    setLoading(false);
    console.log('Registration successful');
    Alert.alert('Success', 'Ambulance registered successfully', [
      {
        text: 'OK',
        onPress: () => {
          console.log('OK pressed - navigating back');
          navigation.goBack();
        },
      },
    ]);
  } catch (error) {
    setLoading(false);
    console.error('Network or server error:', error);
    Alert.alert('Error', 'Something went wrong. Please try again.');
  }
};



  const handleChangeText = (text, index) => {
    const updated = [...places];
    updated[index] = text;
    setPlaces(updated);
  };

  const handleRemoveField = (index) => {
    const updated = places.filter((_, i) => i !== index);
    setPlaces(updated);
  };

  const handleAddField = () => {
    if (places.length < 5) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setPlaces([...places, '']);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.backIconContainer} onPress={() => navigation.goBack()}>
          <Image
            source={require('../assets/UserProfile/back-arrow.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.toolbarText}>Complete Registration</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        {/* Main Form with FlatList */}
        <FlatList
          contentContainerStyle={styles.scrollContainer}
          ListHeaderComponent={
            <>
              <View style={styles.infoContainer}>
                <View style={styles.textContainer}>
                  <Text style={styles.loginHeading}>Verify Your Information</Text>
                  <Text style={styles.loginSubheading}>
                    All fields are mandatory. Ensure that your ambulance number and service
                    information is up-to-date.
                  </Text>
                </View>
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.label}>Id</Text>
                <TextInput style={styles.input} value={ambulanceId} editable={false} />

                <Text style={styles.label}>Ambulance Service *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Service Name"
                  placeholderTextColor={'#888'}
                  value={service}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^a-zA-Z]/g, ''); // allow only letters
                    setService(cleaned);
                  }}
                />

                <Text style={styles.label}>Vehicle Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Vehicle Number"
                  placeholderTextColor={'#888'}
                  value={vehicleNumber}
                   onChangeText={(text) => {
                  const cleaned = text.replace(/[^a-zA-Z0-9\-\/\_\\:]/g, '');
                  setVehicleNumber(cleaned);
                }}
                />

                <Text style={styles.label}>Phone Number *</Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.prefix}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter Phone Number"
                    placeholderTextColor={'#888'}
                    value={ambulanceNumber}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, '');
                      if (cleaned.length <= 10) setAmbulanceNumber(cleaned);
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>

                <Text style={styles.label}>WhatsApp Number *</Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.prefix}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter WhatsApp Number"
                    placeholderTextColor={'#888'}
                    value={whatsappNumber}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, '');
                      if (cleaned.length <= 10) setWhatsappNumber(cleaned);
                    }}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>

                <Text style={styles.label}>City *</Text>
                <DropDownPicker
                  open={cityOpen}
                  value={cityValue}
                  items={cityItems}
                  setOpen={setCityOpen}
                  setValue={(callback) => {
                    const val = callback(cityValue);
                    setCityValue(val);
                    setCity(val);
                  }}
                  setItems={setCityItems}
                  placeholder="Select City"
                  placeholderStyle={{ color: '#888' }}
                  style={styles.dropdown}
                  dropDownContainerStyle={{
                    backgroundColor: '#fff',
                    borderColor: '#ccc',
                    maxHeight: 150, // Ensure it's here
                  }}
                  listMode="SCROLLVIEW" // 👈 ensure this is set
                  scrollViewProps={{
                    nestedScrollEnabled: true,
                    showsVerticalScrollIndicator: false // 👈 important for Android nested scroll
                  }}
                />


                <View style={styles.labelRow}>
                  <Text style={styles.label}>Add Place(s) *</Text>
                  {places.length < 5 && (
                    <TouchableOpacity onPress={handleAddField}>
                      <Image
                        source={require('../assets/ambulance/plus.png')}
                        style={styles.plusIcon}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {places.map((place, index) => (
                  <View key={index} style={styles.placeRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={`Enter Place ${index + 1}`}
                      placeholderTextColor={'#888'}
                      value={place}
                      onChangeText={(text) => handleChangeText(text, index)}
                    />
                    {places.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveField(index)}>
                        <View style={styles.removeIconContainer}>
                          <Image
                            source={require('../assets/ambulance/cross.png')}
                            style={styles.removeIcon}
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </>
          }
        />

        {/* Footer Submit Button */}
        <View style={styles.footerButtonContainer}>
          <TouchableOpacity
            style={[styles.loginButton, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingTop: 25,
  },
  backIconContainer: {
    paddingRight: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  toolbarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  scrollContainer: {
    padding: 16,
  },
  infoContainer: {
    marginBottom: 20,
    backgroundColor: '#e8f0fe',
    padding: 16,
    borderRadius: 12,
  },
  textContainer: {
    marginBottom: 12,
  },
  loginHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 4,
  },
  loginSubheading: {
    fontSize: 14,
    color: '#5f6368',
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 80,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  plusIcon: {
    width: 24,
    height: 24,
    tintColor: '#1a73e8',
  },
  input: {
    backgroundColor: '#f1f3f4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 16,
    height: 45,
    color: '#000', // Ensure text is visible
    marginBottom: 12,
  },
  footerButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  loginButton: {
    backgroundColor: '#1a73e8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // to remove field
  placeRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
},
removeIconContainer: {
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: '#fde2e0', // red background
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 10,
},

removeIcon: {
  width: 14,
  height: 14,
  tintColor: '#f44336', // white cross
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
  backgroundColor: '#f1f3f4'
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
dropdown: {
  borderColor: '#ccc',
  borderRadius: 8,
  marginBottom: 15,
  backgroundColor: '#f1f3f4',
  color: '#000', // Ensure text is visible
},

dropdownContainer: {
  borderColor: '#ccc',
},



});

export default AmbulanceRegister;
