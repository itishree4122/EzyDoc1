import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const VisitClinic = () => {
  const [searchText, setSearchText] = useState("");
  const navigation = useNavigation();

  // Categorized doctor specialties
  const categories = [
    {
      title: "General & Primary Care",
      specialists: [
        { name: "General Physician", image: require("../assets/visitclinic/generalphysician.png") },
        { name: "Family Doctor", image: require("../assets/visitclinic/familydoctor.png") },
      ],
    },
    {
      title: "Organ Specialists",
      specialists: [
        { name: "Cardiologist", image: require("../assets/visitclinic/cardio.png") },
        { name: "Gastroenterologist", image: require("../assets/visitclinic/gastro.png") },
        { name: "Nephrologist", image: require("../assets/visitclinic/kidney.png") },
        { name: "Endocrinologist", image: require("../assets/visitclinic/endocrine.png") },
      ],
    },
    {
      title: "Bone, Muscle, and Joint Specialists",
      specialists: [
        { name: "Orthopedic", image: require("../assets/visitclinic/orthopedic.png") },
        { name: "Rheumatologist", image: require("../assets/visitclinic/rheumatologists.png") },
      ],
    },
    {
      title: "Brain & Nervous System Specialists",
      specialists: [
        { name: "Neurologist", image: require("../assets/visitclinic/neurologist.png") },
        { name: "Neurosurgeon", image: require("../assets/visitclinic/neurosurgeon.png") },
      ],
    },
    {
      title: "Skin, Eye, and Ear Specialists",
      specialists: [
        { name: "Dermatologist", image: require("../assets/visitclinic/dermatology.png") },
        { name: "Ophthalmologist", image: require("../assets/visitclinic/eye-clinic.png") },
        { name: "ENT Specialist", image: require("../assets/visitclinic/throat.png") },
      ],
    },
    {
      title: "Women's & Men's Health",
      specialists: [
        { name: "Gynecologist", image: require("../assets/visitclinic/gynecologist.png") },
        { name: "Urologist", image: require("../assets/visitclinic/urologist.png") },
      ],
    },
    {
      title: "Child & Adolescent Health",
      specialists: [
        { name: "Pediatrician", image: require("../assets/visitclinic/pediatrics.png") },
        { name: "Neonatologist", image: require("../assets/visitclinic/peditrician.png") },
      ],
    },
    {
      title: "Cancer & Blood Disorders",
      specialists: [
        { name: "Oncologist", image: require("../assets/visitclinic/oncologist.png") },
        { name: "Hematologist", image: require("../assets/visitclinic/hematology.png") },
      ],
    },
    {
      title: "Mental Health Specialists",
      specialists: [
        { name: "Psychiatrist", image: require("../assets/visitclinic/psychiatrist.png") },
        { name: "Psychologist", image: require("../assets/visitclinic/psychologist.png") },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Top CardView with Back Button, Text & Search Bar */}
        <View style={styles.topCardView}>
          {/* Back Button */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backContainer} onPress={() => navigation.goBack()}>
              <Image source={require("../assets/left-arrow.png")} style={styles.backIcon} />
            </TouchableOpacity>
          </View>

          {/* Message Text */}
          <Text style={styles.messageText}>
            Find the best doctor and book your appointment now.
          </Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Find your doctor"
              placeholderTextColor="#333"
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity style={styles.searchButton}>
              <Image source={require("../assets/search.png")} style={styles.searchIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Doctor Specialties - Categorized Sections */}
        {categories.map((category, index) => (
          <View key={index} style={styles.categoryCard}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <View style={styles.specialistGrid}>
              {category.specialists.map((specialist, i) => (
                <TouchableOpacity key={i} style={styles.specialistContainer}
                onPress={() => navigation.navigate("DoctorListScreen", { specialty: specialist.name })}
                >
                  <View style={styles.specialistCircle}>
                    <Image source={specialist.image} style={styles.specialistImage} />
                  </View>
                  <Text style={styles.specialistText}>{specialist.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContent: { flexGrow: 1, paddingBottom: 80 },
  topCardView: {
    backgroundColor: "#6495ED",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  backContainer: { flexDirection: "row", alignItems: "center" },
  backIcon: { width: 30, height: 30, tintColor: "#fff" },
  messageText: { color: "#fff", fontSize: 14, textAlign: "center", marginBottom: 10 },
  searchContainer: { flexDirection: "row", backgroundColor: "#E3F2FD", borderRadius: 8, padding: 8, alignItems: "center" },
  searchInput: { flex: 1, fontSize: 16, color: "#333" },
  searchButton: { padding: 8 },
  searchIcon: { width: 20, height: 20, tintColor: "#333", resizeMode: "contain" },

  // Category Section
  categoryCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 15,
    borderRadius: 10,
    elevation: 3,
  },
  categoryTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  specialistGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  specialistContainer: { width: "30%", alignItems: "center", marginBottom: 15 },
  specialistCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#E3F2FD", justifyContent: "center", alignItems: "center" },
  specialistImage: { width: 30, height: 30, resizeMode: "contain", tintColor: "#0047AB" },
  specialistText: { marginTop: 5, fontSize: 12, fontWeight: "bold", textAlign: "center" },
});

export default VisitClinic;
