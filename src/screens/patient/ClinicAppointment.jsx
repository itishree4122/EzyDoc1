import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../../components/Header';
const ClinicAppointment = ({ navigation }) => {
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      style={{ backgroundColor: '#ffffff' }}
    >
      <Header title="Your Appointments"/>

      <View style={styles.container}>
        {/* Header */}
        {/* <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('../assets/left-arrow.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Your Appointments</Text>
        </View> */}
        {/* Subtitle */}
        {/* <Text style={styles.subtitle}>
          Manage all your scheduled consultations and lab tests in one place.
        </Text> */}

        {/* Appointment Cards */}
        <View style={styles.cardContainer}>
          <AppointmentCard
            title="Doctor Appointments"
            subtitle="View your scheduled doctor visits"
            icon={require('../assets/doctor/stethoscope.png')}
            onPress={() => navigation.navigate('DoctorAppointments')}
          />

          <AppointmentCard
            title="Lab Appointments"
            subtitle="Check your upcoming lab test appointments"
            icon={require('../assets/doctor/microscope.png')}
            onPress={() => navigation.navigate('LabAppointments')}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const AppointmentCard = ({ title, subtitle, icon, onPress }) => (
  <TouchableOpacity style={styles.cardWrapper} onPress={onPress}>
    <LinearGradient
      colors={['#1c78f2', '#1c78f2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.iconCircle}>
        <Image source={icon} style={styles.icon} />
      </View>
      <View style={{ marginTop: 10 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

export default ClinicAppointment;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 60,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#333',
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1c1c1e',
    fontFamily: 'Switzer-Semibold',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 30,
    lineHeight: 24,
    fontFamily: 'Switzer-Regular',
  },
  cardContainer: {
    gap: 25,
  },
  cardWrapper: {
    borderRadius: 16,
    shadowColor: '#1c78f2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  icon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Switzer-Medium',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#e0e0e0',
    marginTop: 4,
    fontFamily: 'Switzer-Light',
  },
});
