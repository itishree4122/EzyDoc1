import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const ClinicAppointment = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
        <Image
          source={require('../assets/left-arrow.png')}
          style={styles.backIconImage}
        />
      </TouchableOpacity>

      {/* Heading */}
      <Text style={styles.heading}>
        View all your scheduled doctor consultations and lab test visits in one place.
      </Text>

      {/* Doctor Appointment Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DoctorAppointments')}
      >
        <LinearGradient
          colors={['#a3c1f7', '#1c78f2']}  // lighter blue to Cornflower Blue
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardContent}
        >
          <View style={styles.iconCircle}>
            <Image
              source={require('../assets/doctor/stethoscope.png')}
              style={styles.icon}
            />
          </View>
          <Text style={styles.cardText}>Doctor Appointments</Text>
          <Text style={styles.subText}>View your scheduled doctor visits</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Lab Appointment Card */}
      <TouchableOpacity
        style={styles.card}
        // onPress={() => navigation.navigate('LabAppointments')}
      >
        <LinearGradient
          colors={['#a3c1f7', '#1c78f2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardContent}
        >
          <View style={styles.iconCircle}>
            <Image
              source={require('../assets/doctor/microscope.png')}
              style={styles.icon}
            />
          </View>
          <Text style={styles.cardText}>Lab Appointments</Text>
          <Text style={styles.subText}>Check your upcoming lab test appointments</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default ClinicAppointment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backIcon: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backIconImage: {
    width: 24,
    height: 24,
    tintColor: '#000',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
    marginTop: 20,
    textAlign: 'justify',
    lineHeight: 32,
    fontFamily: 'Switzer-Extralight'
  },
  card: {
    borderRadius: 12,
    marginBottom: 40,
    elevation: 3,
    overflow: 'hidden', // clips gradient corners
  },
  cardContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 12,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  cardText: {
    fontSize: 16,
    color: '#fff',
  },
  subText: {
    fontSize: 13,
    color: '#e6e6e6',
    marginTop: 4,
  },
});
