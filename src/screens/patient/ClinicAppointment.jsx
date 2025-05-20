// screens/HomeScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ClinicAppointment = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DoctorAppointments')}
      >
        <Text style={styles.text}>Doctor Appointments</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('LabAppointments')}
      >
        <Text style={styles.text}>Lab Appointments</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ClinicAppointment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#4a90e2',
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
  },
  text: {
    color: '#fff',
    fontSize: 18,
  },
});
