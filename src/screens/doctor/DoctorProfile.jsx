import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from "../auth/Api";
import { getToken } from "../auth/tokenHelper";
import { launchImageLibrary } from 'react-native-image-picker';
import { locations } from "../../constants/locations";
import { fetchWithAuth } from '../auth/fetchWithAuth';

const DoctorProfile = ({ route }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [imageModal, setImageModal] = useState(false);

  // Get doctorId from route or user context
  const doctorId = route?.params?.doctorId;

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      // const res = await fetch(`${BASE_URL}/doctor/get/${doctorId}/`, {
      const res = await fetchWithAuth(`${BASE_URL}/doctor/get/${doctorId}/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
      });
      console.log("Doctor Profile Response:", res);
      if (!res.ok) throw new Error("Failed to fetch doctor profile");
      const data = await res.json();
      setDoctorProfile(Array.isArray(data) ? data[0] : data);
    } catch (err) {
      Alert.alert("Error", "Unable to fetch doctor profile.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (field, currentValue) => {
    setEditField(field);
    setEditValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : "");
  };

  const patchField = async () => {
    setEditLoading(true);
    try {
    const token = await getToken();
    // Prepare the payload: replace doctor_user_id with doctor
    const payload = { 
      ...doctorProfile, 
      [editField]: editField === "experience" ? Number(editValue) : editValue 
    };
    if (payload.doctor_user_id) {
      payload.doctor = payload.doctor_user_id;
      delete payload.doctor_user_id;
    }
    // const res = await fetch(`${BASE_URL}/doctor/get/${doctorId}/`, {
    const res = await fetchWithAuth(`${BASE_URL}/doctor/get/${doctorId}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
      console.log("Patch Field Response:", res);
      if (res.ok) {
        setEditField(null);
        fetchDoctorProfile();
      } else {
        Alert.alert("Error", "Failed to update field.");
      }
    } catch {
      Alert.alert("Error", "Failed to update field.");
    }
    setEditLoading(false);
  };

  // Handle profile image upload
  // const pickImage = async () => {
  //   setImageModal(false);
  //   launchImageLibrary({ mediaType: 'photo', includeBase64: true }, async (response) => {
  //     if (response.didCancel || !response.assets || !response.assets[0].base64) return;
  //     const base64img = response.assets[0].base64;
  //     setEditLoading(true);
  //     try {
  //     const token = await getToken();
  //     // Prepare the payload: replace doctor_user_id with doctor
  //     const payload = { ...doctorProfile, profile_image: base64img };
  //     if (payload.doctor_user_id) {
  //       payload.doctor = payload.doctor_user_id;
  //       delete payload.doctor_user_id;
  //     }
  //     const res = await fetch(`${BASE_URL}/doctor/get/${doctorId}/`, {
  //       method: "PUT",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify(payload),
  //     });
  //     console.log("Update Profile Image Response:", res);
  //       if (res.ok) {
  //         fetchDoctorProfile();
  //       } else {
  //         Alert.alert("Error", "Failed to update profile image.");
  //       }
  //     } catch {
  //       Alert.alert("Error", "Failed to update profile image.");
  //     }
  //     setEditLoading(false);
  //   });
  // };

  const pickImage = async () => {
  setImageModal(false);
  launchImageLibrary({ mediaType: 'photo', includeBase64: true }, async (response) => {
    if (response.didCancel || !response.assets || !response.assets[0]) return;

    const asset = response.assets[0];

    // 1. File size check
    const MAX_IMAGE_SIZE = 500 * 1024; // 500KB
    if (asset.fileSize > MAX_IMAGE_SIZE) {
      Alert.alert("Image Too Large", "Please select an image smaller than 500KB.");
      setEditLoading(false);
      return;
    }

    // 2. File type check
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(asset.type)) {
      Alert.alert("Invalid Image Format", "Please select a JPEG or PNG image.");
      setEditLoading(false);
      return;
    }

    // 3. Base64 check
    if (!asset.base64) {
      Alert.alert("Image Error", "Could not process the selected image. Please try another.");
      setEditLoading(false);
      return;
    }

    const base64img = asset.base64;
    setEditLoading(true);
    try {
      const token = await getToken();
      const payload = { ...doctorProfile, profile_image: base64img };
      if (payload.doctor_user_id) {
        payload.doctor = payload.doctor_user_id;
        delete payload.doctor_user_id;
      }
      // const res = await fetch(`${BASE_URL}/doctor/get/${doctorId}/`, {
      const res = await fetchWithAuth(`${BASE_URL}/doctor/get/${doctorId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchDoctorProfile();
      } else {
        console.error("Update Profile Image Response:", res);
        Alert.alert("Error", "Failed to update profile image.");
      }
    } catch(err) {
      console.error("Error updating profile image:", err);
      Alert.alert("Error", "Failed to update profile image.");
    }
    setEditLoading(false);
  });
};

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1c78f2" />
        <Text style={{ color: "#1c78f2", marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  if (!doctorProfile) {
  return (
    <View style={styles.centered}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ position: 'absolute', top: 40, left: 20, padding: 6, zIndex: 10 }}
      >
        <Icon name="arrow-left" size={28} color="#1c78f2" />
      </TouchableOpacity>
      <MaterialCommunityIcons name="doctor" size={64} color="#1c78f2" />
      <Text style={styles.emptyText}>No Doctor Profile Found</Text>
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate("DoctorRegister", { doctorId, fromAdmin: route?.params?.fromAdmin } )}
      >
        <Text style={styles.createBtnText}>Create Doctor Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

  // Helper for profile image or fallback
  const renderProfileImage = () => {
    if (doctorProfile.profile_image) {
      return (
        <Image
          source={{ uri: `data:image/jpeg;base64,${doctorProfile.profile_image}` }}
          style={styles.profileImage}
        />
      );
    }
    const firstLetter = doctorProfile.doctor_name ? doctorProfile.doctor_name.charAt(0).toUpperCase() : "?";
    return (
      <View style={styles.profileImageFallback}>
        <Text style={styles.profileImageLetter}>{firstLetter}</Text>
      </View>
    );
  };

  return (
    <>
    <View style={styles.toolbar}>
                <TouchableOpacity 
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                >
                  <Icon name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Doctor Profile</Text>
              </View>
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, marginLeft: 10 }}>
        {/* <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
          <Icon name="arrow-left" size={28} color="#1c78f2" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#222", marginLeft: 8 }}>
          Doctor Profile
        </Text> */}
             
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={() => setImageModal(true)}>
            {renderProfileImage()}
            <Text style={styles.editImgText}>Edit</Text>
          </TouchableOpacity>
          <Text style={styles.nameText}>{doctorProfile.doctor_name}</Text>
          <Text style={styles.specialistText}>{doctorProfile.specialist}</Text>
        </View>

        {/* Profile Fields */}
        <View style={styles.sectionCard}>
          <ProfileField
            label="Name"
            value={doctorProfile.doctor_name}
            // onEdit={() => openEditModal("doctor_name", doctorProfile.doctor_name)}
          />
          <ProfileField
            label="Specialist"
            value={doctorProfile.specialist}
            onEdit={() => openEditModal("specialist", doctorProfile.specialist)}
          />
          <ProfileField
            label="Experience"
            value={doctorProfile.experience + " years"}
            onEdit={() => openEditModal("experience", doctorProfile.experience)}
          />
          <ProfileField
            label="License Number"
            value={doctorProfile.license_number}
            onEdit={() => openEditModal("license_number", doctorProfile.license_number)}
          />
          <ProfileField
            label="Clinic Name"
            value={doctorProfile.clinic_name}
            onEdit={() => openEditModal("clinic_name", doctorProfile.clinic_name)}
          />
          <ProfileField
            label="Clinic Address"
            value={doctorProfile.clinic_address}
            onEdit={() => openEditModal("clinic_address", doctorProfile.clinic_address)}
          />
          <ProfileField
  label="City"
  value={doctorProfile.location}
  onEdit={() => openEditModal("location", doctorProfile.location)}
/>
        </View>
      </ScrollView>

      {/* Edit Field Modal */}
      {/* <Modal visible={!!editField} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit {editField && editField.charAt(0).toUpperCase() + editField.slice(1).replace("_", " ")}
            </Text>
            <TextInput
              style={styles.input}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Enter ${editField}`}
              keyboardType={editField === "experience" ? "numeric" : "default"}
            />
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: "#22bb33", marginTop: 10 }]}
              onPress={patchField}
              disabled={editLoading}
            >
              <Text style={styles.createBtnText}>{editLoading ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: "#888", marginTop: 10 }]}
              onPress={() => setEditField(null)}
            >
              <Text style={styles.createBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}

      {/* Image Picker Modal */}
      <Modal visible={imageModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Profile Image</Text>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: "#1c78f2", marginTop: 10 }]}
              onPress={pickImage}
            >
              <Text style={styles.createBtnText}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: "#888", marginTop: 10 }]}
              onPress={() => setImageModal(false)}
            >
              <Text style={styles.createBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={!!editField} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>
        Edit {editField === "location" ? "City" : editField && editField.charAt(0).toUpperCase() + editField.slice(1).replace("_", " ")}
      </Text>
      {editField === "location" ? (
        <View style={{ maxHeight: 250, width: "100%" }}>
          <ScrollView>
            {locations.filter(loc => loc !== "All").map((item) => (
              <TouchableOpacity
                key={item}
                style={{
                  padding: 12,
                  backgroundColor: editValue === item ? "#e6f0ff" : "#fff",
                  borderBottomWidth: 1,
                  borderBottomColor: "#f0f0f0",
                }}
                onPress={() => setEditValue(item)}
              >
                <Text style={{ color: "#222", fontSize: 16 }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <TextInput
          style={styles.input}
          value={editValue}
          onChangeText={setEditValue}
          placeholder={`Enter ${editField}`}
          keyboardType={editField === "experience" ? "numeric" : "default"}
        />
      )}
      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: "#22bb33", marginTop: 10 }]}
        onPress={patchField}
        disabled={editLoading}
      >
        <Text style={styles.createBtnText}>{editLoading ? "Saving..." : "Save"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: "#888", marginTop: 10 }]}
        onPress={() => setEditField(null)}
      >
        <Text style={styles.createBtnText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </>
  );
};

// Profile field row with edit button
const ProfileField = ({ label, value, onEdit }) => (
  <View style={styles.profileFieldRow}>
    <Text style={styles.profileLabel}>{label}:</Text>
    <Text style={styles.profileValue}>{value}</Text>
    {/* <TouchableOpacity onPress={onEdit}>
      <Text style={styles.editBtnText}>Edit</Text>
    </TouchableOpacity> */}
    {onEdit && (
      <TouchableOpacity onPress={onEdit}>
        <Text style={styles.editBtnText}>Edit</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: '#1c78f2',
  },
  backButton: { marginRight: 12, padding: 4 },
  headerText: {  
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollContainer: {
    padding: 24,
    backgroundColor: "#F2F2F2",
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    color: "#888",
    marginBottom: 18,
    fontWeight: "bold",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    marginBottom: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#1c78f2",
  },
  profileImageFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    backgroundColor: "#e6f0ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1c78f2",
  },
  profileImageLetter: {
    fontSize: 36,
    color: "#1c78f2",
    fontWeight: "bold",
  },
  editImgText: {
    color: "#1c78f2",
    fontWeight: "bold",
    fontSize: 13,
    alignSelf: "center",
    marginTop: 2,
    marginBottom: 6,
    backgroundColor: "#e6f0ff",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  specialistText: {
    fontSize: 16,
    color: "#666",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  profileFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
    justifyContent: "flex-start",
    backgroundColor: "#f7faff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  profileLabel: {
    fontSize: 15,
    color: "#1c78f2",
    fontWeight: "bold",
    width: 90,
  },
  profileValue: {
    fontSize: 16,
    color: "#222",
    flex: 1,
    fontWeight: "500",
  },
  editBtnText: {
    color: "#1c78f2",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 15,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#e6f0ff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#222",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    fontSize: 16,
  },
  createBtn: {
    backgroundColor: "#1c78f2",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    marginTop: 10,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});

export default DoctorProfile;