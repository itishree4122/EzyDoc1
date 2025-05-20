import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from "@react-navigation/native";


const AdminDashboard = () => {
    const navigation = useNavigation();
  
  return (
    <View style={{ flex: 1 }}>
    {/* Toolbar at the top */}
    <View style={styles.toolbar}>
      <View style={styles.profileSection}>
        <Image
          source={require('../assets/UserProfile/profile-circle-icon.png')}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>Admin Dashboard</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton}>
        <Image
          source={require('../assets/dashboard/logout.png')}
          style={styles.logoutIcon}
        />
      </TouchableOpacity>
    </View>
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* Doctor Management Banner */}
      <LinearGradient
  colors={['#ffffff', '#6495ED']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={styles.bannerGradient}
>
  <TouchableOpacity style={styles.bannerTouchable} >
    <View style={styles.bannerContent}>
    <View style={styles.textContainer}>
        <Text style={styles.bannerText}>Doctor Management</Text>
        <Text style={styles.subText}>Manage doctor profiles, schedules & appointments</Text>

        {/* See More Button */}
  <TouchableOpacity style={styles.seeMoreButton}>
    <Text style={styles.seeMoreText}>See More</Text>
  </TouchableOpacity>
      </View>

      <View style={styles.imageRow}>
        <Image
          source={require('../assets/admin/checklist.png')}
          style={styles.icon1} // custom height for image1
        />
        <Image
          source={require('../assets/admin/doctor.png')}
          style={styles.icon2} // custom height for image2
        />
      </View>
    </View>
  </TouchableOpacity>
</LinearGradient>
{/* Doctor Management Section */}
{/* Horizontal Sections Below Banner */}
<View style={styles.sectionContainer}>
<View style={{ marginHorizontal: 10, marginTop: 10 }}>
  <Text style={styles.sectionHeading}>Quick Access</Text>
</View>
  <View style={styles.sectionRow}>
    {/* Registered Doctor */}
    <TouchableOpacity style={styles.sectionItem} onPress={() => navigation.navigate("DoctorManagement")}>
      <View style={styles.iconCircle}>
        <Image
          source={require('../assets/admin/doctor1.png')}
          style={styles.sectionIcon}
        />
      </View>
      <Text style={styles.sectionText}>Registered Doctor</Text>
    </TouchableOpacity>

    {/* Appointment Tracking */}
    <TouchableOpacity style={styles.sectionItem} onPress={() => navigation.navigate("AppointmentTracking")}>
      <View style={styles.iconCircle}>
        <Image
          source={require('../assets/admin/tracking.png')}
          style={styles.sectionIcon}
        />
      </View>
      <Text style={styles.sectionText}>Appointment Tracking</Text>
    </TouchableOpacity>

    {/* Payment Section */}
    <TouchableOpacity style={styles.sectionItem} onPress={() => navigation.navigate("PaymentTrackingScreen")}>
      <View style={styles.iconCircle}>
        <Image
          source={require('../assets/admin/credit-card.png')}
          style={styles.sectionIcon}
        />
      </View>
      <Text style={styles.sectionText}>Payment</Text>
    </TouchableOpacity>
  </View>
</View>

Informational Banner Below Quick Access
<LinearGradient
  colors={['#ffffff', '#add8e6']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={styles.infoBanner}
>
  <View style={styles.infoBannerContent}>
    {/* Left Image */}
    <Image
      source={require('../assets/admin/emergency-services.png')}
      style={styles.infoBannerImage}
    />

    {/* Right Text */}
    <View style={styles.infoBannerTextContainer}>
      <Text style={styles.infoBannerTitle}>Ambulance Service Management</Text>
      <Text style={styles.infoBannerSubtitle}>View and manage all registered ambulance services. </Text>
    </View>
  </View>
</LinearGradient>

{/* Ambulance Section Below Banner */}
<View style={styles.ambulanceContainer}>
  {/* Left Column - Single Large Box */}
  <View style={styles.leftColumn}>
    <View style={styles.largeBox}>
      <Text style={styles.boxTitle}>Registered Services</Text>
      <Text style={styles.boxSubtitle}>Ambulance registration overview</Text>
      <Image
        source={require('../assets/admin/ambulance-lights.png')}
        style={styles.boxImage}
      />
    </View>
  </View>

  {/* Right Column - Two Small Boxes */}
  <View style={styles.rightColumn}>
    <View style={styles.smallBox}>
      <Text style={styles.boxTitle}>Services Provided</Text>
      <Text style={styles.boxSubtitle}>Total trips this month</Text>
      <Image
        source={require('../assets/admin/call.png')}
        style={styles.boxImage}
      />
    </View>
    <View style={styles.smallBox}>
      <Text style={styles.boxTitle}>Payment</Text>
      <Text style={styles.boxSubtitle}>Payment tracking</Text>
      <Image
        source={require('../assets/admin/card-payment.png')}
        style={styles.boxImage}
      />
    </View>
  </View>
</View>

{/* Lab Test Banner Layout */}
<LinearGradient
  colors={['#4facfe', '#00f2fe']}
  style={styles.labTestBanner}
>
  {/* Top Left Image and Text in a Row */}
  <View style={styles.topRow}>
    <Image
      source={require('../assets/admin/blood-donation.png')}
      style={styles.topLeftImage}
    />
    <View style={styles.labBannerTextContainer}>
      <Text style={styles.bannerTitle}>Lab Test Management</Text>
      <Text style={styles.bannerSubtitle}>Get real-time updates and tracking</Text>
    </View>
  </View>

  {/* Bottom Right Image */}
  <Image
    source={require('../assets/admin/lab-technician.png')}
    style={styles.bottomRightImage}
  />
</LinearGradient>


{/* Lab Management Section */}
{/* Horizontal Sections Below Banner */}
<View style={styles.sectionContainer}>
<View style={{ marginHorizontal: 10, marginTop: 10 }}>
  <Text style={styles.sectionHeading}>Quick Access</Text>
</View>
  <View style={styles.sectionRow}>
    {/* Registered Doctor */}
    <TouchableOpacity style={styles.sectionItem} onPress={()=>navigation.navigate("RegisteredLabsScreen")}>
      <View style={styles.iconCircle}>
        <Image
          source={require('../assets/admin/clinic.png')}
          style={styles.sectionIcon}
        />
      </View>
      <Text style={styles.sectionText}>Registered Labs</Text>
    </TouchableOpacity>

    {/* Appointment Tracking */}
    <TouchableOpacity style={styles.sectionItem} onPress={()=>navigation.navigate("LabAppointmentTracking")}>
      <View style={styles.iconCircle}>
        <Image
          source={require('../assets/admin/urine-test.png')}
          style={styles.sectionIcon}
        />
      </View>
      <Text style={styles.sectionText}>Lab Appointments</Text>
    </TouchableOpacity>

    {/* Payment Section */}
    <TouchableOpacity style={styles.sectionItem}onPress={() => navigation.navigate("LabPaymentTracking")}>
      <View style={styles.iconCircle}>
        <Image
          source={require('../assets/admin/credit-card.png')}
          style={styles.sectionIcon}
        />
      </View>
      <Text style={styles.sectionText}>Payment</Text>
    </TouchableOpacity>
  </View>
</View>






  
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f4f6fa',
  },


  // doctor management
  bannerGradient: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 16,
    
  },
  
  bannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  
  subText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  
  
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 16,
    paddingBottom: 16,
    marginLeft: -50,
    
  },
  
  icon1: {
    width: 50,
    height: 50, // taller image
    resizeMode: 'contain',
    top: 30,
    right: -50,
    zIndex: 1,
    transform: [{ rotate: '-10deg' }],
  },
  
  icon2: {
    width: 120,
    height: 120, // shorter image
    resizeMode: 'contain',
    paddingRight: 10,
  },
  seeMoreButton: {
    marginTop: 8,
    paddingVertical: 1,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  
  seeMoreText: {
    color: '#000',
    fontWeight: '600',
  },

  // doctor management
  sectionContainer: {
    borderWidth: 2,
    borderColor: '#ccc', // Cornflower blue or your theme color
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    marginHorizontal: 3,
    // backgroundColor: '#fff', // Optional for contrast
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },

  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  
  
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  sectionItem: {
    alignItems: 'center',
    width: 90,
  },
  
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  sectionIcon: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
    tintColor: "#0047AB"
  },
  
  sectionText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#333',
  },
  
  
// toolbar
toolbar: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: 'transparent',
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},

profileSection: {
  flexDirection: 'row',
  alignItems: 'center',
},

profileImage: {
  width: 30,
  height: 30,
  borderRadius: 20,
  marginRight: 10,
},

profileName: {
  fontSize: 16,
  color: '#333',
  fontWeight: 'bold',
},

logoutButton: {
  padding: 5,
},

logoutIcon: {
  width: 24,
  height: 24,
  resizeMode: 'contain',
  tintColor: '#000',
},

// ambulance service banner
infoBanner: {
  marginTop: 20,
  marginHorizontal: 3,
  borderRadius: 12,
  padding: 12,
  borderWidth: 1.5,
  borderColor: '#ccc', // You can change this color
},

infoBannerContent: {
  flexDirection: 'row',
  alignItems: 'center',
},

infoBannerImage: {
  width: 120,
  height: 120,
  resizeMode: 'contain',
  marginRight: 12,
},

infoBannerTextContainer: {
  flex: 2,
  marginLeft: 10,
},

infoBannerTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#333',
},

infoBannerSubtitle: {
  fontSize: 13,
  color: '#555',
  marginTop: 4,
},
// ambulance container


ambulanceContainer: {
  flexDirection: 'row',
  marginTop: 20,
  paddingHorizontal: 3,
  justifyContent: 'space-between',
},

leftColumn: {
  flex: 1,
  marginRight: 10,
},

rightColumn: {
  flex: 1,
  justifyContent: 'space-between',
},

largeBox: {
  
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: '#ccc',
  height: 200,
  position: 'relative',
},

smallBox: {
 
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: '#ccc',
  height: 95,
  position: 'relative',
  marginBottom: 10,
},

boxTitle: {
  fontSize: 15,
  color: '#333',
  fontWeight: '700',
  marginBottom: 4,
},

boxSubtitle: {
  fontSize: 13,
  color: '#777',
},

boxImage: {
  position: 'absolute',
  width: 40,
  height: 40,
  bottom: 8,
  right: 8,
  resizeMode: 'contain',
  
},

//labtest banner
labTestBanner: {
  padding: 15,
  marginHorizontal: 3,
  marginTop: 20,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#007acc',
  position: 'relative',
  minHeight: 70,
},

topRow: {
  flexDirection: 'row',
  alignItems: 'center',
},

topLeftImage: {
  width: 50,
  height: 50,
  resizeMode: 'contain',
  marginRight: 10,
  marginBottom: -50,
},

labBannerTextContainer: {
  flex: 1,
  marginBottom: -50,
},

bannerTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#000',
},

bannerSubtitle: {
  fontSize: 13,
  color: '#000',
  marginTop: 2,
},

bottomRightImage: {
  width: 60,
  height: 60,
  resizeMode: 'contain',
  position: 'absolute',
  bottom: -5,
  right: 10,
},



});

export default AdminDashboard;
