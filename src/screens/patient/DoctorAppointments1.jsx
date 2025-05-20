import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Button,
  Alert,
  Modal
} from 'react-native';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';

const DoctorAppointments1 = ({ doctorId, onClose, registrationNumber, onUpdate   }) => {
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showModal, setShowModal] = useState(false);


  useEffect(() => {
    const fetchAvailability = async () => {
      const token = await getToken();
      if (!token) return;

      try {
        const response = await fetch(`${BASE_URL}/doctor/availability/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        const filteredData = data.filter(item =>
          item.doctor === doctorId || item.doctor?.id === doctorId
        );

        setAvailabilityData(filteredData);
      } catch (error) {
        console.error('Error fetching availability:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [doctorId]);

  const getDates = () => {
    const today = new Date().toISOString().split('T')[0];
    const dates = [
      ...new Set(
        availabilityData
          .map(item => item.date)
          .filter(date => date >= today)
      ),
    ];
    dates.sort((a, b) => new Date(a) - new Date(b));
    return dates;
  };

  const getShiftsForDate = (date) => {
    return availabilityData.filter(item => item.date === date);
  };

  const generateSlots = (startTime, endTime) => {
    const slotDuration = 15; // minutes
    const slotsArray = [];
    let start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);

    while (start < end) {
      slotsArray.push(start.toTimeString().slice(0, 5));
      start = new Date(start.getTime() + slotDuration * 60000);
    }

    return slotsArray;
  };

  const handleShiftSelect = (shiftObj) => {
    setSelectedShift(shiftObj);
    const newSlots = generateSlots(shiftObj.start_time, shiftObj.end_time);
    setSlots(newSlots);
  };

  const handleSubmit = async () => {
  const token = await getToken();
  if (!token) return;

  const url = `${BASE_URL}/patients/appointments/${registrationNumber}/`;
  const body = {
    date_of_visit: selectedDate,
    visit_time: selectedSlot,
    shift: selectedShift?.shift,
  };

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log('Reschedule Success:', responseData);

      // ✅ Show success alert and proceed after confirmation
      Alert.alert(
        'Success',
        'Appointment rescheduled successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onUpdate) onUpdate(); // ✅ Refresh data in DoctorAppointments
              setShowModal(false);   // ✅ Close modal
              onClose();             // ✅ Notify parent
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      const errorText = await response.text();
      console.error('Failed to reschedule:', errorText);
      Alert.alert('Error', 'Failed to reschedule appointment.');
    }
  } catch (error) {
    console.error('Network error:', error);
    Alert.alert('Error', 'Something went wrong.');
  }
};



  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Appointment</Text>

      <View style={styles.groupContainer}>
        {/* --- SELECT DATE --- */}
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
          {getDates().map(date => (
            <TouchableOpacity
              key={date}
              onPress={() => {
                setSelectedDate(date);
                setSelectedShift(null);
                setSlots([]);
              }}
              style={[
                styles.dateItem,
                selectedDate === date && styles.selectedItem
              ]}
            >
              <Text style={selectedDate === date ? styles.selectedText : null}>{date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* --- SELECT SHIFT --- */}
        {selectedDate && (
          <>
            <Text style={styles.sectionTitle}>Select Shift</Text>
            <View style={styles.shiftRow}>
              {getShiftsForDate(selectedDate).map((shift, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleShiftSelect(shift)}
                  style={[
                    styles.shiftItem,
                    selectedShift?.id === shift.id && styles.selectedItem
                  ]}
                >
                  <Text style={selectedShift?.id === shift.id ? styles.selectedText : null}>
                    {shift.shift}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* --- SELECT SLOT --- */}
        {selectedShift && slots.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Select Slot</Text>
            <View style={styles.slotRow}>
              {slots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedSlot(slot)}
                    style={[
                      styles.slotItem,
                      selectedSlot === slot && styles.selectedItem
                    ]}
                  >
                    <Text style={selectedSlot === slot ? styles.selectedText : null}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}

            </View>
          </>
        )}
      </View>

      {selectedSlot && (
        <Button
          title="Reschedule"
           onPress={() => setShowModal(true)}
           
        />
      )}


      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Reschedule Confirmation</Text>
            <Text style={styles.modalLabel}>Date:</Text>
            <Text style={styles.modalValue}>{selectedDate}</Text>

            <Text style={styles.modalLabel}>Shift:</Text>
            <Text style={styles.modalValue}>{selectedShift?.shift}</Text>

            <Text style={styles.modalLabel}>Slot:</Text>
            <Text style={styles.modalValue}>{selectedSlot}</Text>

            <Button
              title="Submit"
              onPress={handleSubmit}
            />
            <View style={{ marginTop: 10 }}>
              <Button title="Cancel" color="gray" onPress={() => setShowModal(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <Button title="Close" onPress={onClose} color="gray" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  groupContainer: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 15
  },
  dateItem: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 10
  },
  shiftRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15
  },
  shiftItem: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10
  },
  selectedItem: {
    backgroundColor: '#007bff',
    borderColor: '#007bff'
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  slotItem: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    margin: 5
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalLabel: { fontWeight: 'bold', marginTop: 10 },
  modalValue: { marginBottom: 10 },
});

export default DoctorAppointments1;
