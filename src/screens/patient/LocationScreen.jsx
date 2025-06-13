import React from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useLocation } from "../../context/LocationContext";
import { locations } from "../../constants/locations"; // Assuming you have a locations.js file with the list
// const locations = [
//   "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur",  
//   "Puri", "Balasore", "Bhadrak", "Angul", "Jeypore",  
//   "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad",  
//   "Kolkata", "Ahmedabad", "Pune", "Jaipur", "Indore"
// ];

// const locations = [
//   "All",
//   // Odisha
//   "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur",
//   "Puri", "Balasore", "Bhadrak", "Angul", "Jeypore", "Jharsuguda", "Baripada", "Dhenkanal", "Kendrapara", "Rayagada", "Koraput",
//   // West Bengal
//   "Kolkata", "Asansol", "Siliguri", "Durgapur", "Howrah",
//   // Maharashtra
//   "Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad",
//   // Delhi NCR
//   "Delhi", "Noida", "Gurgaon", "Ghaziabad", "Faridabad",
//   // Karnataka
//   "Bangalore", "Mysore", "Hubli", "Mangalore",
//   // Tamil Nadu
//   "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli",
//   // Telangana
//   "Hyderabad", "Warangal", "Nizamabad",
//   // Andhra Pradesh
//   "Vijayawada", "Visakhapatnam", "Guntur",
//   // Gujarat
//   "Ahmedabad", "Surat", "Vadodara", "Rajkot",
//   // Rajasthan
//   "Jaipur", "Jodhpur", "Udaipur", "Kota",
//   // Madhya Pradesh
//   "Indore", "Bhopal", "Jabalpur", "Gwalior",
//   // Uttar Pradesh
//   "Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj",
//   // Kerala
//   "Kochi", "Thiruvananthapuram", "Kozhikode",
//   // Punjab
//   "Ludhiana", "Amritsar", "Jalandhar",
//   // Haryana
//   "Faridabad", "Gurgaon", "Panipat",
//   // Bihar
//   "Patna", "Gaya", "Bhagalpur",
//   // Chhattisgarh
//   "Raipur", "Bhilai", "Bilaspur",
//   // Assam
//   "Guwahati", "Dibrugarh", "Silchar",
//   // Jharkhand
//   "Ranchi", "Jamshedpur", "Dhanbad"
// ];

const LocationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // const setSelectedLocation = route.params?.setSelectedLocation || (() => {});
  const { setSelectedLocation } = useLocation();

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
        setSelectedLocation(item);
        navigation.goBack();
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
