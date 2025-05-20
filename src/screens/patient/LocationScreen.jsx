import React from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

const locations = [
  "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur",  
  "Puri", "Balasore", "Bhadrak", "Angul", "Jeypore",  
  "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad",  
  "Kolkata", "Ahmedabad", "Pune", "Jaipur", "Indore"
];

const LocationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const setSelectedLocation = route.params?.setSelectedLocation || (() => {});

  return (
    <View style={styles.container}>
      
      <FlatList
  showsVerticalScrollIndicator={false}
  data={locations}
  keyExtractor={(item) => item}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => {
        setSelectedLocation(item); // ✅ Ensure item is a valid string
        navigation.goBack(); // ✅ Navigate back
      }}
    >
      {/* Ensure Text is inside <Text> component */}
      <Text style={styles.locationText}>{item}</Text>
    </TouchableOpacity>
  )}
/>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    alignSelf: "center",
  },
  locationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    alignItems: "flex-start",
    paddingLeft: 10,
  },
  locationText: {
    fontSize: 16,
  },
 
  
});

export default LocationScreen;
