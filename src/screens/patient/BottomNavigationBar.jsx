import React from "react";
import { View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

const BottomNavigationBar = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.bottomBar}>
      {/* Home Button (Left) */}
      <TouchableOpacity style={styles.iconButton}>
        <Image source={require("../../../src/screens/assets/home.png")} style={styles.icon} />
      </TouchableOpacity>

      {/* Profile Button (Middle) */}
      <TouchableOpacity onPress={() => navigation.navigate("UserProfile")} 
      style={styles.iconButton}>
        <Image source={require("../../../src/screens/assets/profile-picture.png")} style={styles.icon} />
      </TouchableOpacity>

      {/* Arrow Button (Right) */}
      <TouchableOpacity style={styles.iconButton}>
        <Image source={require("../../../src/screens/assets/pastinfo.png")} style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0047AB",
    paddingVertical: 12,
    paddingHorizontal: 20,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  iconButton: {
    padding: 5,
  },
  icon: {
    width: 70,
    height: 20,
    resizeMode: "contain",
  },
  profileButton: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -25 }], // Center profile image
    bottom: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 50,
    elevation: 5, // Adds shadow effect
  },
  profileIcon: {
    width: 50, // Larger profile image
    height: 50,
    resizeMode: "contain",
  },
});

export default BottomNavigationBar;
