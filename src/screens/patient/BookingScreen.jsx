import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, FlatList, Image, Platform, Modal, TextInput, Button, KeyboardAvoidingView, Alert } from 'react-native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from "@react-navigation/native";



const SHIFTS = [ 'morning', 'afternoon', 'evening', 'night'];

const BookingScreen = ({ route }) => {
  const { doctor_user_id, doctor_name, specialist, clinic_name, clinic_address, experience,patientId, bio } = route.params;
    const navigation = useNavigation();
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedShift, setSelectedShift] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDatePicker, setSelectedDatePicker] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [open, setOpen] = useState(false);
  const [genderOptions, setGenderOptions] = useState([
    { label: 'Male', value: 'M' },
    { label: 'Female', value: 'F' },
    
  ]);

  const futureDates = Array.from({ length: 30 }, (_, i) =>
    moment(currentMonth).add(i, 'days')
  );

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
        const filteredData = data.filter(item => item.doctor === doctor_user_id);
        setAvailability(filteredData);
      } catch (error) {
        console.error('Error fetching availability:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [doctor_user_id]);

  const filteredAvailability = availability.filter(item => item.date === selectedDate);

  const renderTimeSlots = (start, end) => {
  const toMoment = (timeStr) => {
    const [hour, minute] = timeStr.split(':').map(Number);
    return moment({ hour, minute });
  };

  const startMoment = toMoment(start);
  const endMoment = toMoment(end);

  const slots = [];
  let current = startMoment.clone();

  while (current < endMoment) {
    slots.push(current.format('HH:mm')); // output stays 12-hour
    current.add(15, 'minutes');
  }

  return (
   <View style={styles.slotContainer}>
  {slots.map((time) => {
    const isSelected = time === selectedSlot;
    return (
      <TouchableOpacity
        key={time}
        onPress={() => setSelectedSlot(time)}
        style={[
          styles.timeSlotBox,
          isSelected && styles.selectedSlotBox
        ]}
      >
        <Text style={[styles.timeSlotText, isSelected && styles.selectedSlotText]}>
          {time}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>

  );
};



  const renderShiftButtons = () => {
    if (filteredAvailability.length === 0) {
      return <Text style={styles.noSlotText}>No shifts available for this date</Text>;
    }

    return (
      <View style={styles.shiftContainer}>
        {SHIFTS.map(shift => (
          <TouchableOpacity
            key={shift}
            onPress={() => setSelectedShift(shift)}
            style={[styles.shiftButton, selectedShift === shift && styles.selectedShift]}
          >
            <Text style={styles.shiftText}>{shift}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSlotsView = () => {
    if (!selectedShift) return null;

    const shiftSlots = filteredAvailability.filter(
  item => item.shift.toLowerCase() === selectedShift.toLowerCase()
);

    if (shiftSlots.length === 0) {
      return <Text style={styles.noSlotText}>No slots available</Text>;
    }

    return (
      <ScrollView style={styles.slotSection}>
        {shiftSlots.map(slot => (
          <View key={slot.id} style={styles.slotCard}>
            <Text>Start: {slot.start_time}</Text>
            <Text>End: {slot.end_time}</Text>
            <Text>Available: {slot.available ? 'Yes' : 'No'}</Text>
            {renderTimeSlots(slot.start_time, slot.end_time)}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderDatePicker = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
      {futureDates.map(dateObj => {
        const date = dateObj.format('YYYY-MM-DD');
        const isSelected = date === selectedDate;
        return (
          <TouchableOpacity
            key={date}
            onPress={() => {
              setSelectedDate(date);
              setSelectedShift(null);
            }}
            style={[styles.dateItem, isSelected && styles.selectedDateItem]}
          >
            <Text>{dateObj.format('DD')}</Text>
            <Text>{dateObj.format('ddd')}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const showDatePicker = () => setDatePickerVisible(true);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || selectedDatePicker;
    setDatePickerVisible(false);
    setSelectedDate(moment(currentDate).format('YYYY-MM-DD'));
  };

  const handleCancel = () => {
    setDatePickerVisible(false);
  };

  const handleCalendarPress = () => {
    setShowCalendar(true);
  };

  const onDateChange = (event, selectedDate) => {
    if (selectedDate) {
      // Update the selected date
      setSelectedDate(moment(selectedDate).format('YYYY-MM-DD'));

      // Also update the current month
      setCurrentMonth(moment(selectedDate));

      // Close the calendar picker
      setShowCalendar(false);
    } else {
      setShowCalendar(false);
    }
  };

  const handleBookingConfirm = () => {
    setModalVisible(true);
  };

  const handleBookingSubmit = async () => {
  // ✅ Field Validation
  if (!name.trim()) {
    Alert.alert('Validation Error', 'Please enter your name.');
    return;
  }
  if (!age.trim()) {
    Alert.alert('Validation Error', 'Please enter your age.');
    return;
  }
  const ageNumber = parseInt(age);
  if (isNaN(ageNumber) || ageNumber <= 0 || ageNumber > 120) {
    Alert.alert('Validation Error', 'Please enter a valid age between 1 and 120.');
    return;
  }
  if (!phone.trim()) {
    Alert.alert('Validation Error', 'Please enter your phone number.');
    return;
  }
  if (phone.length < 10) {
    Alert.alert('Validation Error', 'Phone number must be at least 10 digits.');
    return;
  }
  if (!gender) {
    Alert.alert('Validation Error', 'Please select your gender.');
    return;
  }
  if (gender === 'Other' && !customGender.trim()) {
    Alert.alert('Validation Error', 'Please specify your gender.');
    return;
  }
  if (!selectedDate) {
    Alert.alert('Validation Error', 'Please select a date.');
    return;
  }
  if (!selectedShift) {
    Alert.alert('Validation Error', 'Please select a shift.');
    return;
  }
  if (!selectedSlot) {
    Alert.alert('Validation Error', 'Please select a time slot.');
    return;
  }

  try {
    const token = await getToken();
    if (!token) {
      Alert.alert('Authentication token missing. Please log in again.');
      return;
    }

    const appointmentData = {
      doctor_id: doctor_user_id,
      doctor_name: doctor_name,
      specialist: specialist,
      patient_id: patientId,
      patient_name: name.trim(),
      patient_number: phone.trim(),
      patient_age: ageNumber,
      patient_gender: gender === 'Other' ? customGender.trim() : gender,
      date_of_visit: selectedDate,
      shift: selectedShift.toLowerCase(),
      visit_time: selectedSlot.split(' ')[0],
    };

    const response = await fetch(`${BASE_URL}/doctor/appointment/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });

    if (response.ok) {
      const result = await response.json();
      Alert.alert('Appointment booked successfully!');
      console.log('Response:', result);
    } else {
      const errorData = await response.json();
      console.log('Booking failed:', errorData);
      Alert.alert('This Time Slot is already booked.');
    }
  } catch (error) {
    console.error('Booking error:', error);
    Alert.alert('Something went wrong while booking the appointment.');
  }
};


  return (

    <>

     {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../assets/UserProfile/back-arrow.png')} // 🔥 Replace with your back icon
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.toolbarTitle}>Appointment Schedule</Text>
      </View>
      
      <Text >{patientId}</Text>
    
    <View style={styles.container}>
         

          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.profileCard}>
                <View style={styles.profileRow}>
              {/* Profile Image */}
              <Image
                source={require('../assets/UserProfile/profile-circle-icon.png')}
                style={styles.profileImage}
              />
            
              {/* Name and Specialist */}
              <View style={styles.nameContainer}>
                <Text style={styles.doctorName}>{doctor_name}</Text>
                <Text style={styles.specialist}>{specialist}</Text>
                
              </View>
            </View>
            <View style={styles.clinicRow}>
                  <Image
                    source={require('../assets/visitclinic/icons8-location-24.png')}
                    style={styles.clinicIcon}
                  />
                  <View style={styles.clinicTextContainer}>
                    <Text style={styles.clinicName}>{clinic_name} ||</Text>
                    <Text style={styles.clinicAddress}> {clinic_address}</Text>
                  </View>
                </View>
            </View>
                <View style={styles.divider1} />

                {/* Experience & Rating Card */}
                  <View style={styles.statsRow}>
                  {/* Experience */}
                  <View style={styles.statItem}>
                    <View style={styles.iconCircle}>
                      <Image
                        source={require('../assets/visitclinic/experience.png')}
                        style={styles.statIcon}
                      />
                    </View>
                    <Text style={styles.statValue}>{experience ? `${experience} yrs.` : 'N/A'}</Text>
                    <Text style={styles.statLabel}>Experience</Text>
                  </View>
                
                  {/* Ratings */}
                  <View style={styles.statItem}>
                    <View style={styles.iconCircle}>
                      <Image
                        source={require('../assets/visitclinic/icons8-star-24.png')}
                        style={styles.statIcon}
                      />
                    </View>
                    <Text style={styles.statValue}>4.8 / 5</Text>
                    <Text style={styles.statLabel}>Ratings</Text>
                  </View>
                </View>
                
                
                
                
                    {/* About Doctor */}
                    <Text style={styles.aboutHeading}>About Doctor</Text>
                    <Text style={styles.aboutDescription}>
                      {bio}
                    </Text>


              <View style={styles.headerContainer}>
        <Text style={styles.header}>{currentMonth.format('MMMM YYYY')}</Text>
        <TouchableOpacity onPress={handleCalendarPress}>
          <Image source={require('../assets/homepage/calendar.png')} style={styles.calendarIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.availabilityContainer}>
        {renderDatePicker()}
        {loading ? <ActivityIndicator size="large" /> : renderShiftButtons()}
        {renderSlotsView()}
      </View>

     

      {/* Modal for booking confirmation */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.modalContainer}>
          <View style={styles.modalContent}>

            {/* Cross button at top-right */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setModalVisible(false)}
        >
          <Image
            source={require('../assets/UserProfile/close.png')}
            style={styles.closeIcon}
          />
        </TouchableOpacity>
            
              <Text style={styles.modalHeader}>Confirm Booking</Text>

              <View style={{display:'none'}}>
                {/* Doctor ID */}
                      <Text style={styles.label}>Doctor ID</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter doctor ID"
                        placeholderTextColor='#888'
                        value={doctor_user_id}
                        editable={false}
                      />
              </View>
             
            <View style={{display:'none'}}>
               {/* Doctor Name */}
                      <Text style={styles.label}>Doctor Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter doctor name"
                        placeholderTextColor='#888'
                        value={doctor_name}
                        editable={false}
                      />
            </View>
                     

                       <View style={{display:'none'}}>
               {/* Specialist */}
                      <Text style={styles.label}>Specialist</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter specialist"
                        placeholderTextColor='#888'
                        value={specialist}
                        editable={false}
                      />
            </View>
            
                     

                       <View style={{display:'none'}}>
              
                      {/* Patient ID */}
                      <Text style={styles.label}>Patient ID</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter patient ID"
                        placeholderTextColor='#888'
                        value={patientId}
                        editable={false}
                      />
            </View>
            

                       <View style={{display:'none'}}>
              <TextInput
              style={styles.inputField}
              value={selectedDate}
              editable={false}
            />
            </View>
            
             <View style={{display:'none'}}>
              <TextInput
              style={styles.inputField}
              value={selectedShift}
              editable={false}
            />
            </View>
            
             <View style={{display:'none'}}>
              <TextInput
              style={styles.inputField}
              value={selectedSlot}
              editable={false}
            />
            </View>
            
            {/* Name */}
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter name"
            placeholderTextColor='#888'
            value={name}
            onChangeText={setName}
          />

          {/* Age */}
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter age"
            placeholderTextColor='#888'
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number *</Text>
          <View style={styles.phoneInputContainer}>
                                      <Text style={styles.prefix}>+91</Text>
                                      <TextInput
                                        style={styles.phoneInput}
                                        placeholder="Enter Phone Number"
                                        placeholderTextColor={'#888'}
                                        value={phone}
                                        onChangeText={(text) => {
                                          const cleaned = text.replace(/[^0-9]/g, '');
                                          if (cleaned.length <= 10) setPhone(cleaned);
                                        }}
                                        keyboardType="numeric"
                                        maxLength={10}
                                      />
                                    </View>

           {/* Gender */}
          <Text style={styles.label}>Gender *</Text>
          <View style={{ zIndex: 1000 }}>
            <DropDownPicker
              open={open}
              value={gender}
              items={genderOptions}
              setOpen={setOpen}
              setValue={setGender}
              setItems={setGenderOptions}
              placeholder="Select Gender"
              style={styles.input}
              placeholderStyle={{ color: '#888' }}
              dropDownContainerStyle={{ borderColor: '#ccc' }}
              textStyle={{ fontSize: 14 }}
            />
          </View>

          {/* Custom Gender */}
          {gender === 'Other' && (
            <>
              <Text style={styles.label}>Specify Gender</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your gender"
                value={customGender}
                onChangeText={setCustomGender}
              />
            </>
          )}
           {/* Submit Button */}
              <TouchableOpacity style={styles.submitButton} onPress={handleBookingSubmit}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            
          
            

          </View>
        </View>
          </KeyboardAvoidingView>
        
      </Modal>

      {isDatePickerVisible && (
        <DateTimePicker
          value={selectedDatePicker}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Calendar Picker */}
      {showCalendar && (
        <DateTimePicker
          value={new Date(selectedDate)} // Update to the selected date
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={onDateChange}
          minimumDate={new Date()} 
        />
      )}
          </ScrollView>
       {selectedSlot && (
        <TouchableOpacity style={styles.floatingButton} onPress={handleBookingConfirm}>
          <Text style={styles.floatingButtonText}>Confirm Booking</Text>
        </TouchableOpacity>
      )}
    </View>
    
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginTop: 50, backgroundColor: "#fff" },
  scrollContainer: {paddingBottom: 100},
  toolbar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#fff',
    position: 'absolute',
    marginBottom: 20,
    top: 0,
    zIndex: 1,
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

   profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginRight: 5,
    marginLeft: 5,
    height: 190,
    borderWidth: 1,
    borderColor: '#1c78f2',
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  profileRow: {
    flexDirection: 'row',        // side-by-side layout
    alignItems: 'center',        // vertically center items
    padding: 10,
    alignSelf: 'flex-start',
    marginStart: 50,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 30,
    marginRight: 15,             // space between image and text
    marginLeft: -60,
  },
  nameContainer: {
    flexDirection: 'column',     // name & specialist stacked
    justifyContent: 'center',
    marginStart: 20,
    marginEnd: 70,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  specialist: {
    fontSize: 14,
    color: 'gray',
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  
  clinicIcon: {
    width: 15,
    height: 15,
    marginRight: 8,
    marginTop: 2,
    
  },
  
  clinicTextContainer: {
    flexDirection: 'row',
  },
  
  clinicName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  
  clinicAddress: {
    fontSize: 13,
    color: '#333',
    marginTop: 1,
  },

  divider1: {
    height: 1,
    backgroundColor: '#ccc',
    marginTop: 15,
    marginRight: 5,
    marginLeft: 5,
    marginBottom: 10,
    alignSelf: 'stretch', // Ensures it spans full width of parent
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#cce0f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  
  statIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#0047ab'
  },
  
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0047ab',
  },
  
  statLabel: {
    fontSize: 13,
    color: 'gray',
  },
  aboutHeading: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'flex-start',
    marginLeft: 0, // Same padding as card
  },
  aboutDescription: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'justify',
  },
  label: {
    marginBottom: 10,
  },
input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    height: 45,
    color: "#000",
  },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  subHeader: { fontSize: 16, marginBottom: 8 },
  calendarIcon: { width: 24, height: 24 },
  availabilityContainer: { marginTop: 20 },
  dateList: { flexDirection: 'row', marginBottom: 12 },
  dateItem: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#888',
    marginRight: 8,
    alignItems: 'center',
    height: 60,
    justifyContent: 'center',
  },
  selectedDateItem: {
    backgroundColor: '#d0e8ff',
    borderColor: '#007bff',
  },
  shiftContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  shiftButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  selectedShift: {
    backgroundColor: '#d0e8ff',
    borderColor: '#007bff',
    
  },
  shiftText: {
    color: '#000',
  },
  slotSection: { marginTop: 10 },
  slotCard: {
    backgroundColor: '#f0f8ff',
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
  },
  slotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  timeSlotBox: {
    padding: 6,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  selectedSlotBox: {
     backgroundColor: '#d0e8ff',
    borderColor: '#007bff',
  },
  timeSlotText: {
    color: '#000',
  },
  selectedSlotText: {
    color: '#000',
    fontWeight: 'bold',
  },
  noSlotText: {
    color: '#c00',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    right: 10,
    left: 10,
    backgroundColor: '#1c78f2',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    
  },
  closeIcon: {
    width: 24,
    height: 24,
    
  },
  submitButton: {
    backgroundColor: '#1c78f2',
    // backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    marginTop: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  phoneInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  paddingHorizontal: 10,
  marginBottom: 15,
  colors: '#000',
  backgroundColor: '#fff'
},

prefix: {
  fontSize: 16,
  marginRight: 6,
  color: '#333',
},

phoneInput: {
  flex: 1,
  fontSize: 16,
  paddingVertical: 8,
  height: 45,
  color: '#000', // Ensure text is visible
},
});

export default BookingScreen;
