import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Modal
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from "@react-navigation/native";


export default function AmbulanceDashboard() {
  const [menuVisible, setMenuVisible] = useState(false);
    const navigation = useNavigation();
  
  const summaryItems = [
    { title: "Total Ambulances", value: 15, emoji: "🚑" },
    { title: "Available Staff", value: 28, emoji: "👨‍⚕️" },
    { title: "Today’s Emergency Requests", value: 12, emoji: "📞" },
    { title: "Active Emergencies", value: 3, emoji: "📅" },
    { title: "Ambulances Under Maintenance", value: 2, emoji: "🧯" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Transparent Toolbar */}
      <View style={styles.toolbar}>
      <View style={styles.toolbarContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('AmbulanceProfile')}>
        <Image
          source={require('../assets/UserProfile/profile-circle-icon.png')}
          style={styles.profileImage}
        />
      </TouchableOpacity>
          <Text style={styles.toolbarTitle}>Ambulance Service</Text>
        </View>

        {/* 🔹 Logout Icon */}
                 <TouchableOpacity style={styles.logoutButton} onPress={() => setMenuVisible(true)}>
          <Image source={require("../assets/dashboard/threedots.png")} style={styles.logoutIcon} />
        </TouchableOpacity>
      </View>
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              navigation.navigate("AmbulanceRegister");
            }}>
              <Text style={styles.menuText}>Register</Text>
            </TouchableOpacity>
      
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              handleLogout();
            }}>
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={styles.container}>
        {/* 1. Overview / Summary Panel */}

        {/* Total Ambulances Card */}
        <View style={styles.outerWrapper}>
  <LinearGradient colors={['#00C6FF', '#0072FF']} style={styles.gradientBorder}>
    <BlurView
      style={styles.card1}
      blurType="light"
      blurAmount={15}
      reducedTransparencyFallbackColor="white"
    >
      <View style={styles.contentRow}>
        <View style={styles.iconBadge}>
          <Text style={styles.emoji}>🚑</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Total Ambulances</Text>
          <Text style={styles.subtitle}>Across All Zones</Text>
        </View>

        <View style={styles.valueCircle}>
  <Text style={styles.value}>15</Text>
</View>

      </View>
    </BlurView>
  </LinearGradient>
</View>



<View style={styles.twoColumnContainer}>
  {/* Left Column: Available Staff */}
  <View style={styles.columnCard}>
  <Text style={styles.imagePosition}>👨‍⚕️ </Text>
    <Text style={styles.cardTitle1}>Available</Text>
    <Text style={styles.cardTitle2}>Staff</Text>
    <Text style={styles.cardSubtitle}>On duty across all shifts</Text>
    <Text style={styles.cardValue}>28</Text>
  </View>

  {/* Right Column: Two stacked views */}
  <View style={{ flex: 1, justifyContent: "space-between" }}>
    <View style={[styles.columnCard, { marginBottom: 10 }]}>
      <Text style={styles.cardTitle}>📞 Today’s Emergency Requests</Text>
      <Text style={styles.cardValue}>12</Text>
    </View>
    <View style={styles.columnCard}>
      <Text style={styles.cardTitle}>📅 Active Emergencies</Text>
      <Text style={styles.cardValue}>3</Text>
    </View>
  </View>
</View>

<View style={styles.bannerCard}>
  <Text style={styles.bannerEmoji}>🧯</Text>
  <View>
    <Text style={styles.bannerTitle}>Ambulances Under Maintenance</Text>
    <Text style={styles.bannerSubtitle}>Currently unavailable for dispatch</Text>
  </View>
  <View style={styles.bannerCountCircle}>
    <Text style={styles.bannerCountText}>2</Text>
  </View>
</View>

<View style={styles.borderView}>
  <Text style={styles.sectionHeading}>Quick Access</Text>

  <View style={styles.gridContainer}>
    {[
      { icon: require('../assets/ambulance/folder.png'), label: 'Emergency Log' },
      { icon: require('../assets/ambulance/ambulance5.png'), label: 'Ambulance Fleet' },
      { icon: require('../assets/ambulance/icons8-doctor-48.png'), label: 'Personnel' },
      { icon: require('../assets/ambulance/analytics.png'), label: 'Analytics' },
      { icon: require('../assets/ambulance/maintenance.png'), label: 'Maintenance' },
      { icon: require('../assets/ambulance/report.png'), label: 'Case Reports' },
    ].map((item, index) => (
      <View key={index} style={styles.iconContainer}>
        <Image source={item.icon} style={styles.iconImage} />
        <Text style={styles.iconLabel}>{item.label}</Text>
      </View>
    ))}
  </View>
</View>

<LinearGradient
  colors={['#b2ebf2', '#80deea']}
  style={styles.reportBanner}
>
  {/* ...same content as above... */}
  <View style={styles.reportBanner}>
  <Image
    source={require('../assets/ambulance/icons8-chart-64.png')} // optional custom icon
    style={styles.reportIcon}
  />
  <View style={{ flex: 1 }}>
    <Text style={styles.reportTitle}>📄 Reports & Exports</Text>
    <Text style={styles.reportSubtitle}>Generate and export detailed reports</Text>
  </View>
</View>

</LinearGradient>




-------------------------------------------------------------------

    
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  //toolbar section
  // ------------------------------------------------------------------
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  toolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10, // optional
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15, // circular image
    marginRight: 10,  // spacing between image and text
  },
  toolbarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  logoutButton: {
    position: "absolute",
    top: 10,  
    right: 5,  // 🔹 Moves it closer to the right edge
    zIndex: 20, 
  },
  logoutIcon: {
    width: 28, 
    height: 28,
    tintColor: "black", 
  },
  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 10,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  
  menuItem: {
    paddingVertical: 10,
  },
  
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  notificationIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
    tintColor: 'black',
  },
  container: {
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1D4ED8",
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#111827",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // 
  outerWrapper: {
    marginVertical: 20,
    padding: 2,
    borderRadius: 20,
  },
  
  gradientBorder: {
    borderRadius: 20,
    padding: 2,
  },
  
  card1: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    height: 140, // Increased height to allow more space
  },
  
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Ensures no overlap, spaces out content evenly
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  
  iconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 20,
  },
  
  emoji: {
    fontSize: 24,
  },
  
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 25,
  },
  
  subtitle: {
    fontSize: 13,
    color: '#e0f7fa',
    marginTop: 4,
  },
  
  valueCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  
    
  // 
  twoColumnContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  columnCard: {
    flex: 1,
    
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  cardTitle1: {
    fontSize: 25,
    fontWeight: "600",
    color: "#333",
    paddingTop: 40,
  },
  cardTitle2: {
    fontSize: 25,
    fontWeight: "600",
    color: "#333",
    
  },
  imagePosition: {
    top:15,
    position: "absolute",
    left: 10,
    fontSize: 30,
  },
  // 
  bannerCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    justifyContent: "space-between",
  },
  
  bannerEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  
  bannerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92400e",
    marginLeft: -10,
  },
  
  bannerSubtitle: {
    fontSize: 13,
    color: "#92400e",
    marginTop: 2,
    marginLeft: -10,

  },
  
  bannerCountCircle: {
    backgroundColor: "#fbbf24",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  
  bannerCountText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  // 
  borderView: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginVertical: 16,
  },
  
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  iconContainer: {
    width: '30%',
    alignItems: 'center',
    marginVertical: 10,
  },
  
  iconImage: {
    width: 30,
    height: 30,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  
  iconLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  // 
  reportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    backgroundColor: '#e0f7fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#00bcd4',
  },
  
  reportIcon: {
    width: 50,
    height: 50,
    marginRight: 16,
    resizeMode: 'contain',
  },
  
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00796b',
  },
  
  reportSubtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  
});
