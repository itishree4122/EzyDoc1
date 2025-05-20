import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

const Appointment = () => {
  const navigation = useNavigation();
  const userName = "John Doe";

  // Sample Booking Details for Doctor's Appointment
  const bookingDetails = {
    doctorName: "Dr. Jane Smith",
    specialty: "Cardiologist",
    clinicName: "Heart Care Clinic",
    location: "Downtown, NY",
    sessionPrice: "$60",
    date: "March 25, 2025",
    time: "10:30 AM",
  };

  // Sample Lab Test Booking Details
  const labTestDetails = {
    assistantName: "Alex Johnson",
    testName: "Blood Test",
    labName: "ABC Diagnostic Center",
    labAddress: "Midtown, NY",
    testPrice: "$40",
    testDate: "March 26, 2025",
    testTime: "09:00 AM",
  };

  return (
    <ScrollView style={styles.container}>
      {/* Toolbar with Back Button and User Name */}
      <View style={styles.toolbar}>
        <View style={styles.backContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image source={require("../assets/left-arrow.png")} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.userName}>{userName}</Text>
        </View>
      </View>

      {/* Doctor Appointment Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Doctor Appointment</Text>
        <Text style={styles.doctorName}>{bookingDetails.doctorName}</Text>
        <Text style={styles.specialty}>{bookingDetails.specialty}</Text>
        <Text style={styles.clinicName}>{bookingDetails.clinicName}</Text>
        <Text style={styles.location}>{bookingDetails.location}</Text>

        {/* Booking Details */}
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingLabel}>Price Paid:</Text>
          <Text style={styles.bookingValue}>{bookingDetails.sessionPrice}</Text>
        </View>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingLabel}>Date:</Text>
          <Text style={styles.bookingValue}>{bookingDetails.date}</Text>
        </View>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingLabel}>Time:</Text>
          <Text style={styles.bookingValue}>{bookingDetails.time}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton}>
            <Text style={styles.buttonText}>Cancel Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rescheduleButton}>
            <Text style={styles.buttonText}>Reschedule</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lab Test Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Lab Test Booking</Text>
        <Text style={styles.labAssistant}>{labTestDetails.assistantName} (Lab Assistant)</Text>
        <Text style={styles.testName}>{labTestDetails.testName}</Text>
        <Text style={styles.clinicName}>{labTestDetails.labName}</Text>
        <Text style={styles.location}>{labTestDetails.labAddress}</Text>

        {/* Booking Details */}
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingLabel}>Price Paid:</Text>
          <Text style={styles.bookingValue}>{labTestDetails.testPrice}</Text>
        </View>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingLabel}>Date:</Text>
          <Text style={styles.bookingValue}>{labTestDetails.testDate}</Text>
        </View>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingLabel}>Time:</Text>
          <Text style={styles.bookingValue}>{labTestDetails.testTime}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton}>
            <Text style={styles.buttonText}>Cancel Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rescheduleButton}>
            <Text style={styles.buttonText}>Reschedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  toolbar: {
    backgroundColor: "#0047ab",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  backContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  userName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Card Styles
  card: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  specialty: {
    fontSize: 16,
    color: "#007BFF",
    fontWeight: "600",
    marginBottom: 10,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  location: {
    fontSize: 14,
    color: "#777",
    marginBottom: 15,
  },
  bookingInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bookingLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444",
  },
  bookingValue: {
    fontSize: 14,
    color: "#666",
  },
  labAssistant: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#008080",
    marginBottom: 5,
  },
  testName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },

  // Buttons
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#FF4D4D",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  rescheduleButton: {
    flex: 1,
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Appointment;
