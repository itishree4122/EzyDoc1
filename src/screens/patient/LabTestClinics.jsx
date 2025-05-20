import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, ScrollView, TextInput } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

// Dummy Clinic Data
const clinics = [
  {
    id: 1,
    name: "City Lab",
    address: "MG Road, Plot 12, Tower A, 560001, Bangalore",
    fees: 400,
    rating: 4.5,
    openToday: true,
    openTomorrow: false,
  },
  {
    id: 2,
    name: "Health Diagnostic",
    address: "Connaught Place, Block B, 110001, New Delhi",
    fees: 600,
    rating: 4.2,
    openToday: false,
    openTomorrow: true,
  },
  {
    id: 3,
    name: "Care Lab",
    address: "Brigade Road, 3rd Floor, Shop 14, 560002, Bangalore",
    fees: 550,
    rating: 4.7,
    openToday: true,
    openTomorrow: true,
  },
  {
    id: 4,
    name: "MediScan",
    address: "Salt Lake, Sector 5, Tech Park, 700091, Kolkata",
    fees: 700,
    rating: 4.8,
    openToday: false,
    openTomorrow: false,
  },
];

const LabTestClinics = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { testName } = route.params;
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filterOptions = ["All", "Open Today", "Open Tomorrow", "Below ₹500"];

  const filteredClinics = clinics.filter((clinic) => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Open Today") return clinic.openToday;
    if (selectedFilter === "Open Tomorrow") return clinic.openTomorrow;
    if (selectedFilter === "Below ₹500") return clinic.fees < 500;
    return false;
  });

  return (
    <>
      {/* 🔹 Toolbar with Back Button & Header */}
      <View style={styles.toolbar}>
       <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <View style={styles.backIconContainer}>
                <Image
                  source={require("../assets/UserProfile/back-arrow.png")} // Replace with your back arrow image
                  style={styles.backIcon}
                />
              </View>
            </TouchableOpacity>
        
      </View>

       {/* Search Bar */}
       <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search hospital, ambulance type, etc..."
          placeholderTextColor="#888"
          style={styles.searchInput}
        />
        <Image
          source={require("../assets/search.png")}
          style={styles.searchIcon}
        />
      </View>


      {/* 🔹 Filter Section */}
      {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {filterOptions.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filterButton, selectedFilter === item && styles.selectedFilter]}
              onPress={() => setSelectedFilter(item)}
            >
              <Text style={[styles.filterText, selectedFilter === item && styles.selectedFilterText]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView> */}

      <View style={styles.container}>
        <FlatList
         ListHeaderComponent={(
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
                    {filterOptions.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[styles.filterButton, selectedFilter === item && styles.selectedFilter]}
                        onPress={() => setSelectedFilter(item)}
                      >
                        <Text style={[styles.filterText, selectedFilter === item && styles.selectedFilterText]}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
          data={filteredClinics}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.clinicCard}>
              <Text style={styles.clinicName}>{item.name}</Text>
              <Text style={styles.infoText}>{item.address}</Text>
              <Text style={styles.infoText}>Fees: ₹{item.fees}</Text>
              <Text style={styles.rating}>⭐ {item.rating}/5</Text>

              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => navigation.navigate("BookingLabScreen", { testName, clinic: item })}
              >
                <Text style={styles.bookButtonText}>Book a Lab Test</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", },
  toolbar: {
    backgroundColor: "#6495ED",
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 10, // Adds spacing between icon and title
  },
  backIconContainer: {
    width: 30,
    height: 30,
    backgroundColor: "#AFCBFF", // White background
    borderRadius: 20, // Makes it circular
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
    
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
    
    
  },
  
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: "#fff",
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: "#999",
  },
 
  filterContainer: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 10 },
  filterButton: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 15, backgroundColor: "#ddd", marginRight: 10 },
  selectedFilter: { backgroundColor: "#6495ED" },
  filterText: { fontSize: 14, fontWeight: "bold" },
  selectedFilterText: { color: "#fff" },
  clinicCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    margin: 10,
    elevation: 3,
  },
  clinicName: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  infoText: { fontSize: 14, marginBottom: 3, color: "#333" },
  rating: { fontSize: 14, fontWeight: "bold", color: "#000", marginBottom: 5 },
  bookButton: {
    backgroundColor: "#6495ED",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  bookButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default LabTestClinics;
