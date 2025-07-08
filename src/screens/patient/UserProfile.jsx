import React, {useEffect, useState} from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TextInput, Alert, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import DateTimePicker from '@react-native-community/datetimepicker';
import BackButton from "../../components/BackButton";
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import Header from "../../components/Header";
const UserProfile = ({route}) => {
  const [user, setUser] = useState(null);
  const [moreDetails, setMoreDetails] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editableFields, setEditableFields] = useState({});
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  const [formValues, setFormValues] = useState({
    date_of_birth: '',
    age: '',
    gender: '',
    address: '',
    created_at: '',
  });

  const navigation = useNavigation();
const isProfileIncomplete = (profile) => {
  return (
    !profile ||
    !profile.date_of_birth ||
    !profile.gender ||
    !profile.address
  );
};

  // useEffect(() => {
  //   const fetchUser = async () => {
  //     try {
  //       const jsonValue = await AsyncStorage.getItem('userData');
  //       if (jsonValue != null) {
  //         setUser(JSON.parse(jsonValue));
  //       }
  //     } catch (e) {
  //       console.log("Error reading user data", e);
  //     }
  //   };
  //   fetchUser();
  // }, []);
useEffect(() => {
  const fetchUser = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('userData');
      if (jsonValue != null) {
        setUser(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.log("Error reading user data", e);
    }
  };

  const fetchProfileStatus = async () => {
    try {
      const token = await getToken();
      const response = await fetchWithAuth(`${BASE_URL}/patients/profiles/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch profile details');
      const data = await response.json();
      const profile = data[0];
      setProfileIncomplete(isProfileIncomplete(profile));
    } catch (error) {
      setProfileIncomplete(true);
    }
  };

  fetchUser();
  fetchProfileStatus();
}, []);
  const fetchMoreDetails = async () => {
    try {
      const token = await getToken();
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
      const profile = data[0];
      if (!profile || isProfileIncomplete(profile)) {
  setProfileIncomplete(true);
  navigation.navigate("Profile", {
    patientId: user?.user_id,
    firstName: user?.first_name,
    lastName: user?.last_name,
    email: user?.email,
    phone: user?.mobile_number,
  });
  return;
    }

    setMoreDetails(profile);
    setShowDetails(true);
    setFormValues({
      date_of_birth: profile.date_of_birth || '',
      gender: profile.gender || '',
      address: profile.address || '',
    });
    setModalVisible(true);
      // if (Array.isArray(data) && data.length > 0) {
      //   const details = data[0];
      //   setMoreDetails(details);
      //   setShowDetails(true);
      //   setFormValues({
      //     date_of_birth: details.date_of_birth || '',
      //     gender: details.gender || '',
      //     address: details.address || '',
      //   });
      //   setModalVisible(true);
      // } else {
      //   Alert.alert('No data found');
      // }
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'Could not fetch more details');
    }
  };

  const fetchPatientId = async () => {
    try {
      const userId = await AsyncStorage.getItem('patientId');
      if (userId) {
        return userId;
      }
      throw new Error('User ID not found');
    } catch (error) {
      console.log('Failed to fetch user ID:', error);
      return null;
    }
  };

  const updateProfile = async () => {
    try {
      const token = await getToken();
      const patientId = await fetchPatientId();

      if (!patientId) {
        Alert.alert('Error', 'Patient ID not found');
        return;
      }

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      Alert.alert('Success', 'Profile updated successfully');
      setMoreDetails(data);
      setModalVisible(false);
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', error.message || 'Could not update profile');
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

  return (
   

    <View style={styles.container}>
                <Header title="" />

      {/* Header with gradient background */}
      {/* <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>My Profile</Text>
      </View> */}

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {/* <Icon name="account-circle" size={80} color="#4a8fe7" /> */}
          <View style={styles.avatarCircle}>
    <Text style={styles.avatarInitial}>
      {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
    </Text>
  </View>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
          <View style={styles.contactPills}>
            <View style={styles.pill}>
              <IonIcon name="call" size={16} color="#4a8fe7" />
              <Text style={styles.pillText}>{user?.mobile_number}</Text>
            </View>
            <View style={styles.pill}>
              <IonIcon name="mail" size={16} color="#4a8fe7" />
              <Text style={styles.pillText}>{user?.email}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.detailsButton} 
            onPress={fetchMoreDetails}
          >
            {/* <Text style={styles.detailsButtonText}>Edit Profile</Text> */}
             <Text style={styles.detailsButtonText}>
    {profileIncomplete ? "Complete Your Profile" : "Edit Profile"}
  </Text>
            <Icon name="chevron-right" size={20} color="#4a8fe7" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Info Cards */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate("Prescription")}
            >
              <View style={[styles.actionIcon, {backgroundColor: '#e3f2fd'}]}>
                <Icon name="pill" size={24} color="#4a8fe7" />
              </View>
              <Text style={styles.actionText}>Prescriptions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate("LabReport")}
            >
              <View style={[styles.actionIcon, {backgroundColor: '#e8f5e9'}]}>
                <Icon name="test-tube" size={24} color="#43a047" />
              </View>
              <Text style={styles.actionText}>Lab Reports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate("Insurance")}
            >
              <View style={[styles.actionIcon, {backgroundColor: '#fff8e1'}]}>
                <Icon name="shield-check" size={24} color="#ffa000" />
              </View>
              <Text style={styles.actionText}>Insurance</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.settingsList}>
            {/* <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => navigation.navigate("Profile", {
                firstName: user?.first_name,
                lastName: user?.last_name,
                email: user?.email,
                phone: user?.mobile_number,
                patientId: user?.user_id,
              })}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, {backgroundColor: '#e3f2fd'}]}>
                  <Icon name="account-edit" size={20} color="#4a8fe7" />
                </View>
                <Text style={styles.settingText}>Edit Profile</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#bdbdbd" />
            </TouchableOpacity> */}
            
            {/* <TouchableOpacity 
              style={styles.settingItem} 
              onPress={() => navigation.navigate("ChangePassword")}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, {backgroundColor: '#f1e8ff'}]}>
                  <Icon name="lock" size={20} color="#7e57c2" />
                </View>
                <Text style={styles.settingText}>Change Password</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#bdbdbd" />
            </TouchableOpacity> */}
            
            <TouchableOpacity 
              style={styles.settingItem} 
              onPress={handleLogout}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, {backgroundColor: '#ffebee'}]}>
                  <Icon name="logout" size={20} color="#e53935" />
                </View>
                <Text style={[styles.settingText, {color: '#e53935'}]}>Log Out</Text>
              </View>
              {/* <Icon name="chevron-right" size={24} color="#bdbdbd" /> */}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      

      {/* Profile Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {Object.entries(formValues).map(([key, value]) => (
                <View key={key} style={styles.formField}>
                  <Text style={styles.fieldLabel}>
                    {key.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  
                  {key === 'date_of_birth' ? (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.inputContainer,
                          editableFields[key] && styles.inputActive
                        ]}
                        onPress={() => editableFields[key] && setShowDatePicker(true)}
                      >
                        <Text style={styles.inputText}>
                          {formValues.date_of_birth
                            ? moment(formValues.date_of_birth).format('DD-MM-YYYY')
                            : 'Select Date'}
                        </Text>
                        {editableFields[key] && (
                          <Icon name="calendar" size={20} color="#4a8fe7" />
                        )}
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
                    <View style={[
                      styles.inputContainer,
                      editableFields[key] && styles.inputActive
                    ]}>
                      <TextInput
                        value={value}
                        editable={!!editableFields[key]}
                        onChangeText={(text) => setFormValues({ ...formValues, [key]: text })}
                        style={styles.inputField}
                      />
                      {!editableFields[key] && (
                        <TouchableOpacity 
                          onPress={() => setEditableFields({ ...editableFields, [key]: true })}
                          style={styles.editButton}
                        >
                          <Icon name="pencil" size={18} color="#4a8fe7" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={updateProfile}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
   
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  // header: {
  //   backgroundColor: '#4a8fe7',
  //   paddingTop: 50,
  //   paddingBottom: 20,
  //   paddingHorizontal: 20,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   borderBottomLeftRadius: 20,
  //   borderBottomRightRadius: 20,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 10,
  //   elevation: 5,
  // },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginTop: -10,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 6,
    // elevation: 3,
    shadowColor: '#2563eb',
  shadowOpacity: 0.10,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 4 },
  elevation: 12,
  // zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatarCircle: {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: '#E3F2FD',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: '#4a8fe7',
},
avatarInitial: {
  fontSize: 38,
  color: '#4a8fe7',
  fontWeight: 'bold',
},
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  contactPills: {
    marginBottom: 15,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 14,
    color: '#4a8fe7',
    marginLeft: 5,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  detailsButtonText: {
    color: '#4a8fe7',
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 2,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  settingsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#4a8fe7',
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  navButton: {
    alignItems: 'center',
  },
  navText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  inputActive: {
    borderWidth: 1,
    borderColor: '#4a8fe7',
    backgroundColor: '#fff',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  editButton: {
    padding: 5,
  },
  saveButton: {
    backgroundColor: '#4a8fe7',
    borderRadius: 10,
    padding: 15,
    margin: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserProfile;