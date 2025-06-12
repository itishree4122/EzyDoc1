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

  const [modalVisible, setModalVisible] = useState(false);
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
    setModalVisible(true);
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
  console.log('[Booking] Starting booking submission...');
  
  if (!testType.trim()) {
    console.log('[Validation] Test type is empty');
    Alert.alert('Validation', 'Please enter a test type');
    return;
  }

  setLoading(true);
  console.log('[Loading] Set loading to true');

  try {
    console.log('[Auth] Getting user token...');
    const token = await getToken();
    
    if (!token) {
      console.error('[Auth] No token found - user not authenticated');
      Alert.alert('Error', 'User not authenticated');
      setLoading(false);
      return;
    }
    console.log('[Auth] Token retrieved successfully');

    const scheduledDateISO = scheduledTime.toISOString();
    console.log('[Date] Scheduled time ISO:', scheduledDateISO);

    const requestBody = {
      lab_profile: labProfile?.id,
      test_type: testType,
      scheduled_date: scheduledDateISO,
    };
    console.log('[Request] Request body:', requestBody);

    console.log('[API] Sending request to:', `${BASE_URL}/labs/lab-tests/`);
    const response = await fetch(`${BASE_URL}/labs/lab-tests/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[API] Response status:', response.status);
    const textResponse = await response.text();
    console.log('[API] Raw response:', textResponse);

    let data;
    try {
      data = JSON.parse(textResponse);
      console.log('[API] Parsed response data:', data);
    } catch (e) {
      console.error('[API] Failed to parse JSON response:', e);
      console.warn('[API] Non-JSON response:', textResponse);
    }

    if (response.ok) {
      console.log('[Success] Booking successful!');
      Alert.alert('Success', 'Lab test booked successfully!');
      setModalVisible(false);
      setTestType('');
    } else {
      const errorMsg = (data && data.detail) || 'Failed to book lab test';
      console.error('[API Error]', errorMsg);
      Alert.alert('Error', errorMsg);
    }
  } catch (error) {
    console.error('[Exception] Unexpected error:', error);
    console.error('[Exception] Error details:', {
      message: error.message,
      stack: error.stack,
    });
    Alert.alert('Error', 'An unexpected error occurred');
  } finally {
    console.log('[Loading] Set loading to false');
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
            <View style={styles.profileContainer}>
              <Text style={styles.labServices}>Lab name: {labProfile?.name}</Text>
              <Text style={styles.labServices}>Address: {labProfile?.address}</Text>
              <Text style={styles.labServices}>Phone: {labProfile?.phone}</Text>
              <Text style={styles.labServices}>Id: {labProfile?.id}</Text>
            </View>
            
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
        </ScrollView>

        {/* Booking Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeIconContainer}
                onPress={() => setModalVisible(false)}
              >
                <Image source={closeIcon} style={styles.closeIcon} />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Book Lab Test</Text>

              <Text style={styles.label}>Lab Profile:</Text>
              {/* <Text style={styles.readonlyField}>Name: {labProfile?.name}</Text>
              <Text style={styles.readonlyField}>Address: {labProfile?.address}</Text>
              <Text style={styles.readonlyField}>Phone: {labProfile?.phone}</Text> */}
              <Text style={styles.readonlyField}>Id: {labProfile?.id}</Text>

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
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 50,
    flexGrow: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 0,
    zIndex: 1,
    width: '100%',
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
    marginRight: 24,
  },
  labCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1c78f2',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 16,
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
   profileContainer: {
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  labName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  labServices: {
    fontSize: 14,
    color: '#000',
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  calendarImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  datesContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
  },
  dateList: {
    paddingBottom: 8,
  },
  dateBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    borderRadius: 6,
    minWidth: 50,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedDateBox: {
    backgroundColor: '#d0e8ff',
    borderColor: '#007bff',
  },
  disabledDateBox: {
    backgroundColor: '#ccc',
  },
  dateNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  dateDay: {
    fontSize: 10,
    color: '#555',
  },
  selectedDateText: {
    color: '#007bff',
  },
  disabledDateText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    position: 'relative',
  },
  closeIconContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
  },
  readonlyField: {
    backgroundColor: '#eaeaea',
    padding: 8,
    borderRadius: 5,
    color: '#333',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
    marginTop: 4,
  },
  timePickerButton: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    marginTop: 4,
    alignItems: 'center',
  },
  timePickerText: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default BookingLabScreen;
