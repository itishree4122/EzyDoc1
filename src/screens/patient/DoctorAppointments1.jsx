import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import moment from 'moment';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const DoctorAppointments1 = ({ doctorId, onClose, registrationNumber, onUpdate }) => {
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const today = moment().format('YYYY-MM-DD');
  const now = moment();

  useEffect(() => {
    const fetchAvailability = async () => {
      const token = await getToken();
      if (!token) return;

      try {
        const response = await fetchWithAuth(`${BASE_URL}/doctor/availability/`, {
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
      visit_time: moment(selectedSlot, 'HH:mm').format('HH:mm:ss'),
      shift: selectedShift?.shift,
    };
    
    try {
      const response = await fetchWithAuth(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const responseData = await response.json();
        Alert.alert(
          'Success',
          'Appointment rescheduled successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onUpdate) onUpdate();
                onClose();
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        const errorText = await response.text();
        Alert.alert('Error', 'Failed to reschedule appointment.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

 return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.modalTitle}>Reschedule Appointment</Text>
          
          {/* Date Selection */}
          <Text style={styles.label}>Select Date</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesContainer}
          >
            {getDates().map(date => (
              <TouchableOpacity
                key={date}
                onPress={() => {
                  setSelectedDate(date);
                  setSelectedShift(null);
                  setSlots([]);
                }}
                style={[
                  styles.dateButton,
                  selectedDate === date && styles.selectedDateButton
                ]}
              >
                <Text style={[
                  styles.dateButtonText,
                  selectedDate === date && styles.selectedDateButtonText
                ]}>
                  {moment(date).format('DD-MM-YYYY')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Shift Selection */}
          {selectedDate && (
            <>
              <Text style={styles.label}>Select Shift</Text>
              <View style={styles.shiftContainer}>
                {getShiftsForDate(selectedDate).map((shift, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleShiftSelect(shift)}
                    style={[
                      styles.shiftButton,
                      selectedShift?.id === shift.id && styles.selectedShiftButton
                    ]}
                  >
                    <Text style={[
                      styles.shiftButtonText,
                      selectedShift?.id === shift.id && styles.selectedShiftButtonText
                    ]}>
                      {shift.shift}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Time Slot Selection */}
          {selectedShift && slots.length > 0 && (
            <>
              <Text style={styles.label}>Select Time Slot</Text>
              <View style={styles.timeSlotsGrid}>
                {slots.map((slot, index) => {
                  const slotMoment = moment(slot, 'HH:mm');
                  const isPast = selectedDate === today && slotMoment.isBefore(now, 'minute');

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => !isPast && setSelectedSlot(slot)}
                      style={[
                        styles.timeSlot,
                        selectedSlot === slot && styles.selectedTimeSlot,
                        isPast && styles.pastTimeSlot
                      ]}
                      disabled={isPast}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedSlot === slot && styles.selectedTimeSlotText,
                        isPast && styles.pastTimeSlotText
                      ]}>
                        {moment(slot, 'HH:mm').format('h:mm A')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Selected Appointment Summary */}
          {/* {selectedSlot && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>
                {moment(selectedDate).format('DD-MM-YYYY')} • {selectedShift?.shift} • {moment(selectedSlot, 'HH:mm').format('h:mm A')}
              </Text>
            </View>
          )} */}
        </ScrollView>

        {/* Fixed Action Buttons at Bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.confirmButton,
              !selectedSlot && styles.disabledButton
            ]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!selectedSlot}
          >
            <Text style={styles.confirmButtonText}>Reschedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80, // Space for fixed buttons
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c78f2',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
  fontWeight: '500',
  marginBottom: 8,
  color: '#333',
  },
  datesContainer: {
    paddingBottom: 5,
  },
  dateButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedDateButton: {
    backgroundColor: '#d0e8ff',
  borderColor: '#1c78f2',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  selectedDateButtonText: {
    color: '#333',
  },
  shiftContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginBottom: 5,
  },
  shiftButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    margin: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedShiftButton: {
    backgroundColor: '#d0e8ff',
  borderColor: '#1c78f2',
  },
  shiftButtonText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },
  selectedShiftButtonText: {
    color: '#333',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginBottom: 15,
  },
  timeSlot: {
    width: '30%',
    margin: 5,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#d0e8ff',
  borderColor: '#1c78f2',
  },
  pastTimeSlot: {
    backgroundColor: '#f9f9f9',
    borderColor: '#eee',
  },
  timeSlotText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#333',
  },
  pastTimeSlotText: {
    color: '#ccc',
  },
  summaryContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  summaryText: {
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4263eb',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DoctorAppointments1;