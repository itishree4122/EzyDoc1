import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const ambulanceServices = [
  {
    name: "LifeSaver Ambulance",
    area: "Downtown",
    rating: "4.8",
    phone: "9876543210",
  },
  {
    name: "QuickAid Ambulance",
    area: "Uptown",
    rating: "4.6",
    phone: "9123456789",
  },
  {
    name: "MediFast Ambulance",
    area: "West Side",
    rating: "4.7",
    phone: "9988776655",
  },
  {
    name: "Rapid Response EMS",
    area: "South Avenue",
    rating: "4.5",
    phone: "8877665544",
  },
  {
    name: "24x7 Care Ambulance",
    area: "East Circle",
    rating: "4.9",
    phone: "7766554433",
  },
  {
    name: "CityMed Ambulance",
    area: "North Hill",
    rating: "4.4",
    phone: "8899001122",
  },
  {
    name: "SafeTrip Ambulance",
    area: "Lakeview",
    rating: "4.6",
    phone: "9001122334",
  },
  {
    name: "Emergency Express",
    area: "Bay Area",
    rating: "4.7",
    phone: "8112233445",
  },
  {
    name: "HealRide Services",
    area: "Old Town",
    rating: "4.3",
    phone: "7008899661",
  },
  {
    name: "FastTrack Ambulance",
    area: "Greenfield",
    rating: "4.8",
    phone: "9223344556",
  },
];

const AmbulanceBooking = () => {
  const navigation = useNavigation();
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleCallPress = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <View style={styles.container}>
      {/* Toolbar */}
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

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {ambulanceServices.map((service, index) => (
          <View key={index}>
            <View style={styles.ambulanceCard}>
              <View style={styles.ambulanceInfo}>
                <Text style={styles.ambulanceName}>{service.name}</Text>
                <Text style={styles.ambulanceArea}>Area: {service.area}</Text>
                <Text style={styles.ambulanceRating}>
                  Rating: ⭐ {service.rating}
                </Text>
              </View>
              <View style={styles.contactIcons}>
                <TouchableOpacity onPress={() => setSelectedIndex(index)}>
                  <Image
                    source={require("../assets/ambulance/call.png")}
                    style={styles.contactIcon}
                  />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Image
                    source={require("../assets/ambulance/wp.png")}
                    style={styles.contactIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Call section */}
            {selectedIndex === index && (
              <View style={styles.callSection}>
                <TouchableOpacity
                  onPress={() => setSelectedIndex(null)}
                  style={styles.closeButton}
                >
                  <Image
                    source={require("../assets/ambulance/cross.png")}
                    style={styles.closeIcon}
                  />
                </TouchableOpacity>
                <Text style={styles.callText}>
                  Call: {service.phone}
                </Text>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCallPress(service.phone)}
                >
                  <Text style={styles.callButtonText}>Call Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f7",
  },
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
    color: "#333",
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: "#999",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  ambulanceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ambulanceInfo: {
    flex: 1,
  },
  ambulanceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  ambulanceArea: {
    fontSize: 14,
    color: "#555",
  },
  ambulanceRating: {
    fontSize: 14,
    color: "#777",
  },
  contactIcons: {
    flexDirection: "row",
    gap: 12,
  },
  contactIcon: {
    width: 24,
    height: 24,
    tintColor: "#6495ED",
  },
  callSection: {
    backgroundColor: "#e6f0ff",
    marginHorizontal: 5,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    position: "relative",
  },
  callText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: "#333",
  },
  callButton: {
    backgroundColor: "#6495ED",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  callButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 5,
  },
  closeIcon: {
    width: 18,
    height: 18,
    tintColor: "#333", // Optional styling
  },
});

export default AmbulanceBooking;
