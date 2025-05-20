import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const LabTests = () => {
  const [searchText, setSearchText] = useState("");
  const navigation = useNavigation();

  const labTests = [
    { name: "Blood Test", image: require("../assets/labtests/blood-test.png") },
    { name: "X-Ray", image: require("../assets/labtests/x-ray.png") },
    { name: "MRI Scan", image: require("../assets/labtests/mri-scanner.png") },
    { name: "CT Scan", image: require("../assets/labtests/medical.png") },
    { name: "ECG", image: require("../assets/labtests/ecg.png") },
    { name: "Urine Test", image: require("../assets/labtests/dark-urine.png") },
    { name: "Liver Test", image: require("../assets/labtests/liver-function-test.png") },
    { name: "Kidney Test", image: require("../assets/labtests/kidneys.png") },
    { name: "Cholesterol Test", image: require("../assets/labtests/cholesterol-test.png") },
    { name: "Diabetese Test", image: require("../assets/labtests/diabetes.png") },
  ];

  const renderTestCard = ({ item, index }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() =>
        navigation.navigate("LabTestClinics", { testName: item.name })
      }
    >
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.testImage} />
        </View>
      </View>
      <Text style={styles.testName}>{item.name}</Text>
    </TouchableOpacity>
  );
  
  return (
    <>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.backIconContainer}>
            <Image
              source={require("../assets/UserProfile/back-arrow.png")}
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

      {/* Grid of Test Cards */}
      <FlatList
        data={labTests}
        renderItem={renderTestCard}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
      />
    </>
  );
};

const styles = StyleSheet.create({
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
    marginRight: 10,
  },
  backIconContainer: {
    width: 30,
    height: 30,
    backgroundColor: "#AFCBFF",
    borderRadius: 20,
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
    color: "#000",
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: "#999",
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  gridItem: {
    flex: 1,
    margin: 8,
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    width: "100%",
  },
  
  imageContainer: {
    backgroundColor: "#6495ED",
    padding: 12,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  
  testImage: {
    width: 50,
    height: 50,
    resizeMode: "contain",
    tintColor: 'white'
  },
  
  testName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#0047AB",
    textAlign: "center",
  },
});

export default LabTests;
