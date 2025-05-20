import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function VisitClinic({ navigation }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handleReschedule = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setShowSlotModal(true);
    }
  };

  const renderTimeSection = (title, startHour, endHour) => {
    const slots = [];
    let time = startHour;
    while (time <= endHour) {
      const hour = Math.floor(time);
      const minute = (time - hour) * 60;
      const date = new Date();
      date.setHours(hour);
      date.setMinutes(minute);
      const label = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      slots.push(label);
      time += 0.25;
    }

    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.slotSectionTitle}>{title}</Text>
        <View style={styles.slotContainer}>
          {slots.map((slot, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.slot,
                selectedSlot === slot && styles.selectedSlot,
              ]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={selectedSlot === slot && { color: 'white' }}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.toolbar}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Image
                  source={require('../assets/homepage/icons8-left-arrow-24.png')} // 🔥 Replace with your back icon
                  style={styles.backIcon}
                />
              </TouchableOpacity>
              <Text style={styles.toolbarTitle}>Scheduled Appointment</Text>
            </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.infoText}>Dr. John Doe</Text>
          <Text style={styles.infoText}>Sunshine Clinic</Text>
          <Text style={styles.infoText}>123 Main Street, Springfield</Text>
          <Text style={styles.infoText}>April 30, 2025 - 10:30 AM</Text>

          <View style={styles.horizontalLine} />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.action}>
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.verticalLine} />
            <TouchableOpacity style={styles.action} onPress={handleReschedule}>
              <Text style={styles.actionText}>Reschedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.infoText}>Dr. Jane Smith</Text>
          <Text style={styles.infoText}>CityCare Clinic</Text>
          <Text style={styles.infoText}>456 Elm Street, Metropolis</Text>
          <Text style={styles.infoText}>May 3, 2025 - 2:00 PM</Text>

          <View style={styles.horizontalLine} />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.action}>
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.verticalLine} />
            <TouchableOpacity style={styles.action} onPress={handleReschedule}>
              <Text style={styles.actionText}>Reschedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      <Modal
        visible={showSlotModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSlotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              {renderTimeSection('Morning', 8, 11.5)}
              {renderTimeSection('Afternoon', 12, 14)}
              {renderTimeSection('Evening', 17, 19.5)}
              {renderTimeSection('Night', 20, 21)}
            </ScrollView>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  if (selectedSlot) {
                    setShowSlotModal(false);
                    setSelectedSlot(null);
                    Alert.alert('Success', 'Reschedule successful');
                  } else {
                    Alert.alert('Warning', 'Please select a slot');
                  }
                }}
              >
                <Text style={{ color: 'white' }}>OK</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#6c757d' }]}
                onPress={() => {
                  setShowSlotModal(false);
                  setSelectedSlot(null);
                }}
              >
                <Text style={{ color: 'white' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 16,
  },
  toolbar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  toolbarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 24, // To balance the back button width
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#6495ed',
  },
  infoText: {
    fontSize: 16,
    marginVertical: 2,
    color: '#333',
  },
  horizontalLine: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  action: {
    flex: 1,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    color: '#007BFF',
  },
  verticalLine: {
    width: 1,
    height: 24,
    backgroundColor: '#DDD',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  slotSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  slotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    backgroundColor: '#EEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 4,
  },
  selectedSlot: {
    backgroundColor: '#007BFF',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
});
