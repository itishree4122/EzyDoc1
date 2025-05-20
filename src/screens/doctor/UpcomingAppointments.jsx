import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from "@react-navigation/native";

const UpcomingAppointments = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState('All');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRescheduleDatePicker, setShowRescheduleDatePicker] = useState(false);
  const [showRescheduleTimePicker, setShowRescheduleTimePicker] = useState(false); // Separate state for reschedule time picker
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [monthDates, setMonthDates] = useState(generateDates(new Date()));
  const [selectedPatients, setSelectedPatients] = useState([]);
  const navigation = useNavigation();

  const [appointments, setAppointments] = useState([
    {
      name: 'John Doe',
      time: '09:00 AM',
      slot: 'Morning',
      date: '2025-04-29',
      phoneNumber: '123-456-7890',
      address: '123 Maple Street, Springfield',
      bloodGroup: 'O+',
      age: 32,
      gender: 'Male',
      insuranceNumber: 'INS123456',
    },
    {
      name: 'Jane Smith',
      time: '03:00 PM',
      slot: 'Afternoon',
      date: '2025-04-29',
      phoneNumber: '987-654-3210',
      address: '456 Oak Avenue, Rivertown',
      bloodGroup: 'A-',
      age: 28,
      gender: 'Female',
      insuranceNumber: 'INS654321',
    },
    {
      name: 'Alice Johnson',
      time: '07:00 PM',
      slot: 'Evening',
      date: '2025-04-29',
      phoneNumber: '555-678-1234',
      address: '789 Pine Road, Hilltop',
      bloodGroup: 'B+',
      age: 41,
      gender: 'Female',
      insuranceNumber: 'INS789123',
    },
  ]);

  function generateDates(baseDate) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  const onDateChange = (event, selected) => {
    setShowDatePicker(false);
    if (selected) {
      const formattedDate = new Date(selected);
      setSelectedDate(formattedDate);
      setCurrentDate(formattedDate);
      setMonthDates(generateDates(formattedDate));
    }
  };

  const onRescheduleDateChange = (event, selected) => {
    setShowRescheduleDatePicker(false);
    if (selected) {
      const formattedDate = new Date(selected);
      setCurrentDate(formattedDate);
      setShowRescheduleTimePicker(true); // Proceed to time picker
    }
  };
  
  const onRescheduleTimeChange = (event, selected) => {
    setShowRescheduleTimePicker(false);
    if (selected) {
      const newTime = new Date(selected);
  
      // Use currentDate and selected newTime directly
      const formattedDate = currentDate.toDateString();
      const formattedTime = newTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
  
      Alert.alert(
        'Confirm Reschedule',
        `Are you sure you want to reschedule to ${formattedDate} at ${formattedTime}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              setCurrentTime(newTime); // Set after confirmation
              handleRescheduleConfirmation(); // Call the update
            },
          },
        ]
      );
    }
  };
  
  

  const togglePatientSelection = (name) => {
    setSelectedPatients((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name]
    );
  };

  const filteredAppointments = appointments.filter(
    (item) =>
      item.date === selectedDate.toISOString().split('T')[0] &&
      (item.slot === selectedSlot || selectedSlot === 'All')
  );

  const handleReschedule = () => {
    if (selectedPatients.length > 0) {
      setShowRescheduleDatePicker(true);
      // setShowRescheduleTimePicker(true); // Show both date and time picker for reschedule
    }
  };

  const handleRescheduleConfirmation = () => {
    const updatedAppointments = appointments.map((appointment) => {
      if (selectedPatients.includes(appointment.name)) {
        // Reschedule the selected appointment
        return {
          ...appointment,
          date: currentDate.toISOString().split('T')[0], // Update the date
          time: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Update the time
        };
      }
      return appointment;
    });
  
    // Filter out the rescheduled appointments from the original date
    const filteredAppointmentsAfterReschedule = updatedAppointments.filter((appointment) => 
      !selectedPatients.includes(appointment.name) || appointment.date === currentDate.toISOString().split('T')[0]
    );
  
    // Update state with the modified appointments
    setAppointments(filteredAppointmentsAfterReschedule);
  
    // Show success message
    Alert.alert('Reschedule Successful', 'The selected appointments have been rescheduled successfully!', [
      { text: 'OK' },
    ]);
  
    // Clear the selected patients after rescheduling
    setSelectedPatients([]);
  };
  
  

  return (
    <>
    <View style={styles.toolbar}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image source={require("../assets/left-arrow.png")} style={styles.backIcon} />
            </TouchableOpacity>
            <Text style={styles.header}>Upcoming Visits</Text>
          </View>

          <View style={styles.container}>
      {/* Date Row */}
      <View style={styles.dateRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {monthDates.map((dateObj, index) => {
            const dateStr = dateObj.toISOString().split('T')[0];
            const display = dateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
            });

            return (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedDate(dateObj)}
                disabled={dateObj < new Date()}
                style={[styles.dateContainer, selectedDate === dateObj && styles.selectedDateContainer]}
              >
                <Text style={[styles.dateText, selectedDate === dateObj && styles.selectedDate]}>
                  {display}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity onPress={() => {setShowDatePicker(true); setShowRescheduleTimePicker(false);}}>
          <Image
            source={require('../assets/homepage/calendar.png')}
            style={{ width: 24, height: 24, marginLeft: 8 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Border Under Dates */}
      <View style={styles.horizontalLine} />

      {/* Time Slot Row */}
      <View style={styles.slotRow}>
        {['Morning', 'Afternoon', 'Evening', 'Night'].map((slot) => (
          <TouchableOpacity key={slot} onPress={() => setSelectedSlot(slot)} style={styles.slotWrapper}>
            <Text style={[styles.slotText, selectedSlot === slot && styles.selectedSlot]}>
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
  data={filteredAppointments}
  keyExtractor={(item, index) => index.toString()}
  renderItem={({ item }) => {
    const isSelected = selectedPatients.includes(item.name);
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => togglePatientSelection(item.name)}
      >
        <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.detail}>Phone: {item.phoneNumber}</Text>
              <Text style={styles.detail}>Address: {item.address}</Text>
              <Text style={styles.detail}>Blood Group: {item.bloodGroup}</Text>
              <Text style={styles.detail}>Age: {item.age}</Text>
              <Text style={styles.detail}>Gender: {item.gender}</Text>
              <Text style={styles.detail}>Insurance #: {item.insuranceNumber}</Text>
              <Text style={styles.dateTime}>
                Appointment: {item.date} at {item.time} ({item.slot})
              </Text>
        
      </TouchableOpacity>
    );
  }}
  ListEmptyComponent={<Text style={styles.empty}>No Appointments</Text>}
/>

      {/* Reschedule Button */}
      {selectedPatients.length > 0 && (
        <TouchableOpacity style={styles.rescheduleButton} onPress={handleReschedule}>
          <Text style={styles.rescheduleText}>Reschedule</Text>
        </TouchableOpacity>
      )}

      {/* Calendar Picker for selecting the date */}
      {showDatePicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date(2030, 12, 31)}
          minimumDate={new Date()}
        />
      )}

      {/* Reschedule Date Picker */}
      {showRescheduleDatePicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onRescheduleDateChange}
          maximumDate={new Date(2030, 12, 31)}
          minimumDate={new Date()}
        />
      )}

      {/* Reschedule Time Picker */}
      {showRescheduleTimePicker && (
        <DateTimePicker
          value={currentTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onRescheduleTimeChange}
        />
      )}

      {/* Confirmation Button for Reschedule */}
      {/* {selectedPatients.length > 0 && currentDate && currentTime && (
        <TouchableOpacity style={styles.rescheduleConfirmationButton} onPress={handleRescheduleConfirmation}>
          <Text style={styles.rescheduleText}>Confirm Reschedule</Text>
        </TouchableOpacity>
      )} */}
    </View>
    </>
    
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6495ed",
    padding: 15,
  },
  backIcon: { width: 25, height: 25, tintColor: "#fff" },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginLeft: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  horizontalLine: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
  },
  dateContainer: {
    borderWidth: 1,
    borderColor: '#0047ab',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  selectedDateContainer: {
    borderColor: '#0047ab',
    backgroundColor: '#6495ed',
  },
  dateText: {
    fontSize: 14,
    color: '#0047ab',
    textAlign: 'center',
  },
  selectedDate: {
    color: '#fff',
    fontWeight: 'bold',
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  slotWrapper: {
    margin: 4,
  },
  slotText: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0047ab',
    color: '#0047ab',
    textAlign: 'center',
    fontSize: 14,
  },
  selectedSlot: {
    backgroundColor: '#6495ed',
    color: 'white',
    borderColor: '#0047ab',
    
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 0.6,
    borderColor: '#6495ed',
    marginHorizontal: 5,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#007bff',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  detail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  dateTime: {
    fontSize: 14,
    color: '#888',
    marginTop: 6,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  },
  rescheduleButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  rescheduleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rescheduleConfirmationButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
});

export default UpcomingAppointments; 