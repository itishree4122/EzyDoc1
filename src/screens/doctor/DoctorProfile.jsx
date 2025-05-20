import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from 'react-native-linear-gradient';

const DoctorProfile = () => {
  const navigation = useNavigation();

  const [firstName, setFirstName] = useState("");
  const [specialist, setSpecialist] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [experience, setExperience] = useState("");

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient colors={["#6495ed", "#6495ed"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image
            source={require("../assets/UserProfile/back-arrow.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Profile</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={require("../assets/UserProfile/profile-circle-icon.png")}
            style={styles.profileImage}
          />
          <Text style={styles.nameText}>{firstName || "Your Name"}</Text>
          <Text style={styles.specialistText}>{specialist || "Specialist"}</Text>
        </View>

        {/* Form Inputs */}
        <View style={styles.formCard}>
          <FloatingInput label="First Name" value={firstName} onChangeText={setFirstName} />
          <FloatingInput label="Specialist" value={specialist} onChangeText={setSpecialist} />
          <FloatingInput label="Experience (in years)" value={experience} onChangeText={setExperience} keyboardType="numeric" />
          <FloatingInput label="License Number" value={licenseNumber} onChangeText={setLicenseNumber} />
          <FloatingInput label="Clinic Name" value={clinicName} onChangeText={setClinicName} />
          <FloatingInput label="Clinic Address" value={clinicAddress} onChangeText={setClinicAddress} />

          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Floating Label Input Component
const FloatingInput = ({ label, value, onChangeText, multiline = false, keyboardType = "default" }) => (
  <View style={styles.inputWrapper}>
    <Text style={[styles.floatingLabel, value ? styles.floatingLabelActive : null]}>
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      style={[styles.inputField, multiline && { height: 80 }]}
      multiline={multiline}
      keyboardType={keyboardType}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
  header: {
    height: 120,
    paddingTop: Platform.OS === "android" ? 40 : 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: "#ffffff33",
    borderRadius: 20,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
  },
  scrollContainer: {
    padding: 20,
    alignItems: "center",
  },
  profileCard: {
    backgroundColor: "#fff",
    alignItems: "center",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginBottom: 20,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  specialistText: {
    fontSize: 16,
    color: "#666",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  inputWrapper: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    position: "relative",
  },
  floatingLabel: {
    position: "absolute",
    left: 0,
    top: 16,
    fontSize: 16,
    color: "#999",
    zIndex: 1,
  },
  floatingLabelActive: {
    top: -10,
    fontSize: 12,
    color: "#6495ED",
  },
  inputField: {
    height: 40,
    fontSize: 16,
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#6495ED",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default DoctorProfile;
