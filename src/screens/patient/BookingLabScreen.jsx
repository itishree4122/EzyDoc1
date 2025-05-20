import React, {useState,useEffect} from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet,ScrollView, FlatList, Modal, TextInput, Alert, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from "@react-native-community/datetimepicker";
import DropDownPicker from 'react-native-dropdown-picker';


const BookingLabScreen = ({ navigation }) => {
  // Get current month and year dynamically
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dates, setDates] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotTimes, setSlotTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selecteddTime, setSelecteddTime] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [customGender, setCustomGender] = useState('');


  useEffect(() => {
    generateDates(currentDate);
  }, [currentDate]);

  const generateDates = (baseDate) => {
    const tempDates = [];
    const today = new Date();
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
  
    // Check if the selected month and year is current month and year
    const isCurrentMonthYear = today.getMonth() === month && today.getFullYear() === year;
  
    // If same month and year, start from today; otherwise from 1
    const startDay = isCurrentMonthYear ? today.getDate() : 1;
  
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate(); // Last date of month
  
    for (let i = startDay; i <= lastDayOfMonth; i++) {
      const dateObj = new Date(year, month, i);
      const dayName = dateObj.toLocaleString('default', { weekday: 'short' }); // "Mon", "Tue"
      tempDates.push({ day: dayName, date: i });
    }
  
    setDates(tempDates);
  };
  

  const handleCalendarPress = () => {
    setShowCalendar(true);
  };

  const onDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
      setShowCalendar(false);
    } else {
      setShowCalendar(false);
    }
  };
  const month = currentDate.toLocaleString('default', { month: 'long' }); // Get full month name
  const year = currentDate.getFullYear(); // Get current year

 // time slots
 const handleSlotSelection = (slot) => {
  setSelectedSlot(slot);
  setSelectedTime(null); // clear selected time when changing slot
  setSlotTimes(generateTimeSlots(slot));
};

const handleTimeSelection = (time) => {
  setSelectedTime(time);
};

const generateTimeSlots = (slot) => {
  let startHour, startMinute, endHour, endMinute;
  
  switch (slot) {
    case 'Morning':
      startHour = 8; startMinute = 0;
      endHour = 11; endMinute = 30;
      break;
    case 'Afternoon':
      startHour = 12; startMinute = 0;
      endHour = 14; endMinute = 0;
      break;
    case 'Evening':
      startHour = 17; startMinute = 0;
      endHour = 19; endMinute = 30;
      break;
    case 'Night':
      startHour = 20; startMinute = 0;
      endHour = 21; endMinute = 0;
      break;
    default:
      return [];
  }

  const slots = [];
  let currentHour = startHour;
  let currentMinute = startMinute;

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute <= endMinute)
  ) {
    const formattedTime = formatTime(currentHour, currentMinute);
    slots.push(formattedTime);

    // Move to next 15-minute interval
    currentMinute += 15;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
};

const formatTime = (hour, minute) => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${ampm}`;
};

// form fields
// Form fields
const [name, setName] = useState('');
const [age, setAge] = useState('');
const [gender, setGender] = useState('');
const [bloodType, setBloodType] = useState('');
const [address, setAddress] = useState('');
const [phone, setPhone] = useState('');
const [open, setOpen] = useState(false);
const [genderOptions, setGenderOptions] = useState([
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
]);

const handleBookAppointment = () => {
  setModalVisible(true);
};

const handleSubmit = () => {
  // Validate fields if needed
  if (!name || !age || !gender || !bloodType || !address || !phone) {
    Alert.alert('Error', 'Please fill all fields');
    return;
  }

  // Determine actual gender value
  const finalGender = gender === 'Other' ? customGender : gender;

  // You can use finalGender here directly if needed

  setModalVisible(false);
  Alert.alert('Success', 'Appointment booked!');

  // Clear fields
  setName('');
  setAge('');
  setGender('');
  setCustomGender('');
  setBloodType('');
  setAddress('');
  setPhone('');
};


// select date
const handleDateSelection = (item) => {
  setSelectedDate(item.date === selectedDate ? null : item.date);  // Save the selected date
  setSelectedSlot(null); // Reset selected slot if needed
  setSelectedTime(null); // Reset selected time if needed
};
  return (
    <View style={styles.container}>
      
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../assets/UserProfile/back-arrow.png')} // 🔥 Replace with your back icon
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.toolbarTitle}>Book Appointment</Text>
      </View>

    
      <View style={{ flex: 1 }}>
  <ScrollView 
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ alignItems: 'center', paddingBottom: 20, marginTop: Platform.OS === 'android' ? 80 : 0, }}>
    {/* Doctor Image */}
   
    <View style={styles.profileCard}>
    <View style={styles.profileRow}>
  {/* Profile Image */}
  <Image
    source={require('../assets/UserProfile/profile-circle-icon.png')}
    style={styles.profileImage}
  />

  {/* Name and Specialist */}
  <View style={styles.nameContainer}>
    <Text style={styles.doctorName}>Dr. John Doe</Text>
    <Text style={styles.specialist}>Cardiologist</Text>
    
  </View>
</View>
<View style={styles.clinicRow}>
      <Image
        source={require('../assets/visitclinic/icons8-location-24.png')}
        style={styles.clinicIcon}
      />
      <View style={styles.clinicTextContainer}>
        <Text style={styles.clinicName}>Heart Care Clinic ||</Text>
        <Text style={styles.clinicAddress}> 123 Main Street, New York, NY</Text>
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
    <Text style={styles.statValue}>10 yrs</Text>
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
      Dr. John Doe is a renowned Cardiologist with over 6 years of experience. He is known for his patient-centric approach and expert knowledge in heart-related treatments.
    </Text>

    

    {/* Month-Year and Calendar */}
    <View style={styles.monthYearContainer}>
      <View style={styles.monthYearLeft}>
        <Text style={styles.monthText}>{month}</Text>
        <Text style={styles.yearText}>{year}</Text>
      </View>
      <TouchableOpacity onPress={handleCalendarPress}>
        <Image
          source={require('../assets/homepage/calendar.png')}
          style={styles.calendarIcon}
        />
      </TouchableOpacity>
    </View>

    

    {/* Date Scroll */}
    <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  style={[styles.dateScroll, { maxHeight: 80 }]}
  contentContainerStyle={{ paddingRight: 25 }}>
  {dates.map((item, index) => (
    <TouchableOpacity
      key={index}
      onPress={() => handleDateSelection(item)}>
      <View style={[styles.dateBox, selectedDate === item.date && styles.selectedBox]}>
        <Text style={[styles.dateNumber, selectedDate === item.date && styles.selectedText]}>
          {item.date}
        </Text>
        <Text style={[styles.dayText, selectedDate === item.date && styles.selectedText]}>
          {item.day}
        </Text>
      </View>
    </TouchableOpacity>
  ))}
</ScrollView>



    {/* Booking Slots */}
    {selectedDate && (
      <>
        <Text style={styles.bookingSlotsHeading}>Booking Slots</Text>
        <View style={styles.slotFiltersContainer}>
          {['Morning', 'Afternoon', 'Evening', 'Night'].map((slot, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.slotFilterBox,
                selectedSlot === slot && styles.selectedSlot
              ]}
              onPress={() => handleSlotSelection(slot)}
            >
              <Text style={styles.slotFilterText}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    )}

    {/* Time Slots (FlatList) */}
    <View style={{ flex: 1 }}>
  <FlatList
    data={slotTimes}
    keyExtractor={(item, index) => index.toString()}
    numColumns={4}
    showsVerticalScrollIndicator={false}
    columnWrapperStyle={{ justifyContent: 'center' }}
    renderItem={({ item }) => (
      <TouchableOpacity
        style={[
          styles.timeSlotBox,
          selectedTime === item && styles.selectedTimeSlot
        ]}
        onPress={() => handleTimeSelection(item)}
      >
        <Text style={styles.timeSlotText}>{item}</Text>
      </TouchableOpacity>
    )}
    contentContainerStyle={{ alignItems: 'center', width: '100%', paddingBottom: 100 }}
    scrollEnabled={false}
  />

  {selectedTime && (
    <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
      <Text style={styles.bookButtonText}>Book Appointment at {selectedTime}</Text>
    </TouchableOpacity>
  )}
</View>

  </ScrollView>

  {/* Patient Detail Modal */}
  <Modal
  visible={modalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setModalVisible(false)}
>
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    style={{ flex: 1 }}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.modalTitle}>Patient Details</Text>

          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter name"
            value={name}
            onChangeText={setName}
          />

          {/* Age */}
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />

          {/* Gender */}
          <Text style={styles.label}>Gender</Text>
          <View style={{ zIndex: 1000 }}>
            <DropDownPicker
              open={open}
              value={gender}
              items={genderOptions}
              setOpen={setOpen}
              setValue={setGender}
              setItems={setGenderOptions}
              placeholder="Select Gender"
              style={styles.inputPicker}
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

          {/* Blood Type */}
          <Text style={styles.label}>Blood Type</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter blood type"
            value={bloodType}
            onChangeText={setBloodType}
          />

          {/* Address */}
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter address"
            value={address}
            onChangeText={setAddress}
          />

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  </KeyboardAvoidingView>
</Modal>




  {/* Calendar Picker */}
  {showCalendar && (
    <DateTimePicker
      value={currentDate}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
      onChange={onDateChange}
    />
  )}
</View>


    </View>
  );
};

export default BookingLabScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
  },
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
    marginRight: 16,
    marginLeft: 16,
    height: 190,
    borderWidth: 1,
    borderColor: '#6495ed',
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    marginLeft: -20,
  },
  nameContainer: {
    flexDirection: 'column',     // name & specialist stacked
    justifyContent: 'center',
    marginStart: 20,
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
    marginRight: 20,
    marginLeft: 20,
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
    marginLeft: 40, // Same padding as card
  },
  aboutDescription: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    paddingHorizontal: 40,
    textAlign: 'justify',
  },
  monthYearContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  monthYearLeft: {
    flexDirection: 'row', // Horizontal layout for month and year
    alignItems: 'center', // Align both month and year vertically in the center
    flex: 1,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  yearText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  calendarIcon: {
    width: 24,
    height: 24,
    tintColor: '#333', // Adjust the color of the icon
  },
  dateScroll: {
    marginTop: 20,
    paddingLeft: 20,
    
  },
  dateBox: {
    width: 60,
    height: 70,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  dayText: {
    fontSize: 14,
    color: '#555',
  },
  selectedBox: {
    borderColor: '#333', // Selected border color
    backgroundColor: '#A7C7FF', // Light background color when selected
  },
  selectedText: {
    color: '#000', // Text color when selected
  },
  
  bookingSlotsHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    
    marginLeft: 20,
    
    color: '#333',
    marginBottom: 20,
  },
  
  slotFiltersContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  slotFilterBox: { padding: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#333', marginStart: 6, },
  selectedSlot: { backgroundColor: '#A7C7FF' }, // Light blue when selected
  slotFilterText: { fontSize: 16, fontWeight: 'bold' },
  timeSlotList: { alignItems: 'center', marginTop: 20, marginRight: 20, marginLeft: 20, marginBottom: 20, },
  timeSlotText: { fontSize: 12, padding: 5 },
  selectedTimeSlot: {
    backgroundColor: '#A7C7FF', // selected time slot color
    borderColor: '#000',
  },
  bookButton: {
    position: 'absolute',
    bottom: 40, // Increase this if still hidden (try 50 or more if needed)
    alignSelf: 'center',
    backgroundColor: '#6495ed',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 6, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 25,
    zIndex: 999, // Ensure it's above all
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  timeSlotBox: {
    width: 80,        // <-- was probably too small (maybe 60 before?)
    height: 40,       // <-- taller height
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
 
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '90%',
    maxHeight: '90%',
    borderRadius: 10,
    padding: 10,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
    height: 50,
  },
  inputPicker: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
    
  },
  label: {
    marginBottom: 10,
  },

  submitButton: {
    backgroundColor: '#6495ed',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
});
