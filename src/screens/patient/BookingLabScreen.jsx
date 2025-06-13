import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import calendarIcon from '../assets/doctor/calendar1.png';
import closeIcon from '../assets/UserProfile/close.png';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import { useNavigation } from "@react-navigation/native";


const BookingLabScreen = ({ route }) => {
  const { labName, services, labProfile } = route.params;

  const [selectedDate, setSelectedDate] = useState(moment());
  const [dates, setDates] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const [testType, setTestType] = useState('');
  const [scheduledTime, setScheduledTime] = useState(moment());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    generateDates(selectedDate);
  }, []);

  const generateDates = (baseDate = moment()) => {
    const startOfMonth = baseDate.clone().startOf('month');
    const endOfMonth = baseDate.clone().endOf('month');
    const dateArray = [];

    for (let m = startOfMonth; m.isSameOrBefore(endOfMonth); m.add(1, 'day')) {
      dateArray.push({
        date: m.clone(),
        day: m.format('ddd'),
        dateNum: m.format('DD'),
      });
    }
    setDates(dateArray);
  };

  const onSelectDate = (date) => {
    setSelectedDate(date);
    generateDates(date);
    setScheduledTime(date.clone().hour(10).minute(0));
  };

  const renderDateBox = ({ item }) => {
    const isPastDate = item.date.isBefore(moment(), 'day');
    const isSelected = selectedDate.isSame(item.date, 'day');

    return (
      <TouchableOpacity
        disabled={isPastDate}
        style={[
          styles.dateBox,
          isSelected && styles.selectedDateBox,
          isPastDate && styles.disabledDateBox,
        ]}
        onPress={() => onSelectDate(item.date)}
      >
        <Text
          style={[
            styles.dateNumber,
            isSelected && styles.selectedDateText,
            isPastDate && styles.disabledDateText,
          ]}
        >
          {item.dateNum}
        </Text>
        <Text
          style={[
            styles.dateDay,
            isSelected && styles.selectedDateText,
            isPastDate && styles.disabledDateText,
          ]}
        >
          {item.day}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleBookingSubmit = async () => {
    if (!testType.trim()) {
      Alert.alert('Validation', 'Please enter a test type');
      return;
    }

    setLoading(true);

    try {
      const token = await getToken();

      if (!token) {
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      const scheduledDateISO = scheduledTime.toISOString();

      const requestBody = {
        lab_profile: labProfile?.id,
        test_type: testType,
        scheduled_date: scheduledDateISO,
      };

      const response = await fetch(`${BASE_URL}/labs/lab-tests/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const textResponse = await response.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.warn('Non-JSON response:', textResponse);
      }

      if (response.ok) {
        Alert.alert('Success', 'Lab test booked successfully!');
        setTestType('');
      } else {
        const errorMsg = (data && data.detail) || 'Failed to book lab test';
        Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../assets/UserProfile/back-arrow.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.toolbarTitle}>Appointment Schedule</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.labCard}>
            <Text style={styles.labName}>{labName}</Text>
            <Text style={styles.labServices}>Services: {services.join(', ')}</Text>
            {labProfile?.id ? (
              <View style={styles.profileContainer}>
                <Text style={styles.labServices}>Lab name: {labProfile?.name}</Text>
                <Text style={styles.labServices}>Address: {labProfile?.address}</Text>
                <Text style={styles.labServices}>Phone: {labProfile?.phone}</Text>
                <Text style={styles.labServices}><Text style={styles.boldLabel}>Home Sample Collection:</Text> {labProfile?.home_sample_collection ? 'Yes' : 'No'}</Text>
                <Text style={styles.labServices}>Id: {labProfile?.id}</Text>
              </View>
            ) : (
              <Text style={styles.labServices}>No profile data available</Text>
            )}
          </View>

          <View style={styles.headerRow}>
            <Text style={styles.monthText}>{selectedDate.format('MMMM YYYY')}</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)}>
              <Image source={calendarIcon} style={styles.calendarImage} />
            </TouchableOpacity>
          </View>

          <View style={styles.datesContainer}>
            <FlatList
              data={dates}
              horizontal
              keyExtractor={(item) => item.date.format('YYYY-MM-DD')}
              renderItem={renderDateBox}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateList}
            />
          </View>

          {showPicker && (
            <DateTimePicker
              value={selectedDate.toDate()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowPicker(false);
                if (date) {
                  const selected = moment(date);
                  setSelectedDate(selected);
                  generateDates(selected);
                }
              }}
            />
          )}

          {/* Inline Booking Form */}
          <View style={styles.formContainer}>
            <Text style={styles.modalTitle}>Book Lab Test</Text>

            <Text style={styles.label}>Lab Profile ID:</Text>
            <Text style={styles.readonlyField}>{labProfile?.id}</Text>

            <Text style={styles.label}>Test Type:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter test type"
              value={testType}
              onChangeText={setTestType}
            />

            <Text style={styles.label}>Scheduled Date:</Text>
            <Text style={styles.readonlyField}>{selectedDate.format('YYYY-MM-DD')}</Text>

            <Text style={styles.label}>Scheduled Time:</Text>
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.timePickerText}>{scheduledTime.format('HH:mm')}</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={scheduledTime.toDate()}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, time) => {
                  setShowTimePicker(false);
                  if (time) {
                    setScheduledTime(moment(time));
                  }
                }}
              />
            )}

            {loading ? (
              <ActivityIndicator size="large" color="#007BFF" style={{ marginVertical: 16 }} />
            ) : (
              <TouchableOpacity style={styles.submitButton} onPress={handleBookingSubmit}>
                <Text style={styles.submitButtonText}>Submit Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: '#f1f2f3', // subtle off-white background
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff', // vibrant blue
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    paddingTop: 40
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#000',
    marginRight: 16,
  },
  toolbarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  labCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginVertical: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  labName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  labServices: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  profileContainer: {
    margin: 4,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  calendarImage: {
    width: 26,
    height: 26,
    tintColor: '#1c78f2',
  },
  datesContainer: {
    height: 90,
    marginBottom: 12,
  },
  dateList: {
    paddingHorizontal: 8,
  },
  dateBox: {
    width: 65,
    height: 80,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1c78f2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  selectedDateBox: {
    backgroundColor: '#1c78f2',
  },
  disabledDateBox: {
    backgroundColor: '#d1d5db',
    borderWidth: 1,
    borderColor: '#9ca3af',
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  dateDay: {
    fontSize: 13,
    color: '#6b7280',
  },
  selectedDateText: {
    color: '#fff',
  },
  disabledDateText: {
    color: '#9ca3af',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f3f4f6',
    color: '#111827',
  },
  readonlyField: {
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  timePickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  timePickerText: {
    fontSize: 14,
    color: '#111827',
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#1c78f2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BookingLabScreen;
