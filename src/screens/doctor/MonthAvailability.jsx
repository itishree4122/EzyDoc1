import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';

const MonthAvailability = ({ navigation }) => {
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIndex);
  const [daysMatrix, setDaysMatrix] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible1, setModalVisible1] = useState(false);
  const [shift, setShift] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [availabilityData, setAvailabilityData] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [availabilityId, setAvailabilityId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [allShifts, setAllShifts] = useState([]); // <- to store multiple entries
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [startMeridiem, setStartMeridiem] = useState('AM');
  const [endMeridiem, setEndMeridiem] = useState('AM');
  const [shiftList, setShiftList] = useState([]);






   const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('start'); // 'start' or 'end'
  const [tempTime, setTempTime] = useState(new Date());




  const showTimePicker = (mode) => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const handleTimeChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    const time = selectedDate || tempTime;
    setShowPicker(false);

    const formatted = time.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (pickerMode === 'start') {
      setStartTime(formatted);
    } else {
      setEndTime(formatted);
    }
  };

  
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const getDaysInMonth = (month, year) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const matrix = Array.from({ length: 6 }, () => Array(7).fill(null));

    let date = 1;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < firstDay) continue;
        if (date > daysInMonth) break;
        matrix[row][col] = date++;
      }
    }
    return matrix;
  };

  const handleMonthPress = (monthIndex) => {
    setSelectedMonthIndex(monthIndex);
  };

  useEffect(() => {
    const matrix = getDaysInMonth(selectedMonthIndex, currentYear);
    setDaysMatrix(matrix);
  }, [selectedMonthIndex]);

 const isBeforeToday = (inputDate) => {
  const now = new Date();
  // Zero out the time part of both dates
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

  return dateOnly < today;
};

const fetchAvailability = async () => {
  try {
    const token = await getToken();
    const response = await fetch(`${BASE_URL}/doctor/availability/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const upcomingAppointments = [];

      for (const item of data) {
        const appointmentDate = new Date(item.date);

        if (isBeforeToday(appointmentDate)) {
          await autoDelete(item.id);
        } else {
          upcomingAppointments.push(item);
        }
      }

      // Sort appointments by date (ascending)
      upcomingAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));

      setAvailabilityData(upcomingAppointments);
    } else {
      console.error('Failed to fetch availability');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const autoDelete = async (id) => {
  try {
    const token = await getToken();
    if (!token) return;

    const response = await fetch(`${BASE_URL}/doctor/availability/${id}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      console.log(`Auto-deleted expired appointment ID ${id}`);
    } else {
      const errorData = await response.json();
      console.error(`Auto-delete failed for ID ${id}:`, errorData);
    }
  } catch (error) {
    console.error('Auto-delete error:', error);
  }
};

  
  useEffect(() => {
    fetchAvailability();
  }, []);
  
  
  const filteredAppointments = availabilityData.filter((item) => {
    const date = new Date(item.date);
    return (
      date.getMonth() === selectedMonthIndex &&
      date.getFullYear() === currentYear
    );
  });
  
  const isPastDate = (day) => {
    const now = new Date();
    const selectedDate = new Date(currentYear, selectedMonthIndex, day);
    return selectedDate < now.setHours(0, 0, 0, 0); // compare without time
  };

  const renderCalendar = () => (
    <View style={styles.calendarContainer}>
      {/* Scrollable Months */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthScroll}
      >
        {monthNames.map((month, index) => {
          const isEnabled = index >= currentMonthIndex;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => isEnabled && handleMonthPress(index)}
              style={[ 
                styles.monthButton, 
                selectedMonthIndex === index && styles.selectedMonthButton, 
                !isEnabled && styles.disabledButton, 
              ]}
              disabled={!isEnabled}
            >
              <Text
                style={[
                  styles.monthText,
                  selectedMonthIndex === index && styles.selectedMonthText,
                  !isEnabled && styles.disabledText,
                ]}
              >
                {month}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Days Header */}
      <View style={styles.daysRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <View key={index} style={styles.dayBox}>
            <Text style={styles.dayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Dates Grid */}
      {daysMatrix.map((week, rowIndex) => (
        <View key={rowIndex} style={styles.weekRow}>
          {week.map((day, colIndex) => {
            if (day === null) {
              return <View key={colIndex} style={styles.dateBox} />;
            }
            const disabled = isPastDate(day);
            return (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.dateBox,
                  disabled && styles.disabledDateBox,
                ]}
                disabled={disabled}
                onPress={() => {
                  if (!disabled) {
                    const formattedMonth = (selectedMonthIndex + 1).toString().padStart(2, '0');
                    const formattedDay = day.toString().padStart(2, '0');
                    setSelectedDate(`${currentYear}-${formattedMonth}-${formattedDay}`);
                    openSaveModal(setSelectedDate);
                  }
                }}
                
              >
                <Text style={[styles.dateText, disabled && styles.disabledDateText]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

const handleSave = async () => {
  if (shifts.length === 0) {
    Alert.alert('Validation Error', 'Please add at least one shift.');
    return;
  }

  try {
    const token = await getToken();
    if (!token) {
      Alert.alert('Authorization Error', 'Access token not found. Please log in again.');
      return;
    }

    const response = await fetch(`${BASE_URL}/doctor/availability/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shifts), // <-- Sending all shifts here
    });

    if (response.ok) {
      const data = await response.json();
      Alert.alert('Success', 'All shifts have been saved!');
      setModalVisible(false);
      setShifts([]); // clear saved shifts
      fetchAvailability();
    } else {
      const errorText = await response.text();
      Alert.alert('Server Error', `Failed to save shift. [${response.status}]`);
      console.error(errorText);
    }
  } catch (err) {
    console.error('Error:', err);
    Alert.alert('Error', 'Something went wrong while saving shifts.');
  }
};


const handleAddAnother = () => {
  if (!shift || !selectedDate || !startTime || !endTime) {
    Alert.alert('Error', 'Please fill all fields before adding');
    return;
  }

  const newShift = {
    shift,
    date: selectedDate,
    startTime: `${startTime} ${startMeridiem}`,
    endTime: `${endTime} ${endMeridiem}`,
  };

  setShiftList([...shiftList, newShift]);

  // Optionally clear the fields
  setShift('');
  setSelectedDate('');
  setStartTime('');
  setEndTime('');
  setStartMeridiem('AM');
  setEndMeridiem('AM');
};

  const handleUpdate = async (availabilityId, selectedDate, startTime, endTime, shift) => {
    if (!availabilityId) {
      console.warn('Availability ID is missing.');
      return;
    }
  
    const endpoint = `${BASE_URL}/doctor/availability/${availabilityId}/`;
  
    const updatedData = {
      date: selectedDate,
      start_time: startTime,
      end_time: endTime,
      shift: shift.toLowerCase(),
    };
  
    try {
      const token = await getToken();
  
      if (!token) {
        console.warn('Access token not found.');
        return;
      }
  
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
  
      if (response.ok) {
        const responseData = await response.json();
        console.log('Update successful:', responseData);
        Alert.alert('Success', 'Availability updated successfully!');
  
        // Close the modal
        setModalVisible1(false);
  
        // ✅ Re-fetch updated availability data
        fetchAvailability();
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        Alert.alert('Failed to update. Please check your inputs.');
      }
    } catch (error) {
      console.error('Error during update:', error);
      Alert.alert('An error occurred. Please try again.');
    }
  };
  

  const handleEdit = (item) => {
    setEditingItem(item);
    setShift(item.shift.charAt(0).toUpperCase() + item.shift.slice(1)); // capitalize for Picker
    setAvailabilityId(item.id);
    setSelectedDate(item.date);
    setStartTime(item.start_time);
    setEndTime(item.end_time);
    setModalVisible1(true);
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this appointment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) {
                console.error('No access token found');
                return;
              }
  
              const response = await fetch(`${BASE_URL}/doctor/availability/${id}/`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
  
              if (response.ok) {
                setAppointments((prev) => prev.filter((item) => item.id !== id));
                console.log(`Deleted appointment ID ${id}`);
                Alert.alert('Deleted', 'Appointment deleted successfully.');
                fetchAvailability();
              } else {
                const errorData = await response.json();
                console.error(`Delete failed for ID ${id}:`, errorData);
                Alert.alert('Error', 'Failed to delete appointment.');
              }
            } catch (error) {
              console.error('Delete request error:', error);
              Alert.alert('Error', 'Something went wrong.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  const openSaveModal = (date) => {
    // setSelectedDate(date);
    setShift('');         // clear previous shift
    setStartTime('');     // clear previous startTime
    setEndTime('');       // clear previous endTime
    setModalVisible(true);
  };
  
  const showDatePicker = () => {
  setDatePickerVisible(true);
};
const handleDateChange = (event, date) => {
  setDatePickerVisible(false);
  if (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    setSelectedDate(formattedDate);
  }
};



  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                          <View style={styles.backIconContainer}>
                            <Image
                              source={require("../assets/UserProfile/back-arrow.png")} // Replace with your back arrow image
                              style={styles.backIcon}
                            />
                          </View>
                        </TouchableOpacity>
        <Text style={styles.headerText}>Select Date and Time</Text>
      </View>

      {/* Calendar Container */}
      {renderCalendar()}

   

 <View style={{ flex: 1, margin: 16 }}>
  <Text style={styles.sectionTitle}>
    {monthNames[selectedMonthIndex]} Appointments
  </Text>

  <ScrollView
    style={{ flex: 1 }}
    contentContainerStyle={{ paddingBottom: 100 }}
    showsVerticalScrollIndicator={false}
  >
    {filteredAppointments.length === 0 ? (
      <Text style={styles.noAppointments}>No Appointments</Text>
    ) : (
      filteredAppointments.map((item) => (
        <View key={item.id} style={styles.appointmentCard}>
          <TouchableOpacity
            style={styles.editIconContainer}
            onPress={() => handleEdit(item)}
          >
            <Image
              source={require('../assets/doctor/edit-text.png')}
              style={styles.editIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteIconContainer}
            onPress={() => handleDelete(item.id)}
          >
            <Image
              source={require('../assets/doctor/bin.png')}
              style={styles.editIcon}
            />
          </TouchableOpacity>

          {/* Hide id safely without display: 'none' */}
          <Text style={{ height: 0, overflow: 'hidden' }}>id: {item.id}</Text>

          <Text style={styles.appointmentText}>Date: {item.date}</Text>
          <Text style={styles.appointmentText}>Shift: {item.shift}</Text>
          <Text style={styles.appointmentText}>
            Time: {item.start_time} - {item.end_time}
          </Text>
        </View>
      ))
    )}
  </ScrollView>
</View>


      {/* Modal for Shift Details */}
      {/* save appointmet */}
      
   <Modal
  visible={modalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalBackground}>
    <View style={styles.modalContainer}>
      <TouchableOpacity
    onPress={() => setModalVisible(false)}
    style={styles.closeIconWrapper}
  >
    <Image
      source={require('../assets/UserProfile/close.png')} // Adjust path as needed
      style={styles.closeIcon}
      resizeMode="contain"
    />
  </TouchableOpacity>
      <Text style={styles.modalTitle}>Shift Details</Text>

      {/* 1. Shift */}
      <Text style={styles.label}>Select Shift</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={shift}
          onValueChange={(itemValue) => setShift(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select a shift" value="" color="#888" />
          <Picker.Item label="Morning" value="Morning" />
          <Picker.Item label="Afternoon" value="Afternoon" />
          <Picker.Item label="Evening" value="Evening" />
        </Picker>
      </View>

      {/* 2. Date */}
      <Text style={styles.label}>Selected Date</Text>
      <TouchableOpacity onPress={showDatePicker}>
        <TextInput
          style={styles.inputField}
          value={selectedDate}
          editable={false}
          placeholder="Select Date"
          placeholderTextColor={'#888'}
          pointerEvents="none"  // ensures it's touchable only via TouchableOpacity
        />
      </TouchableOpacity>

      {datePickerVisible && (
  <DateTimePicker
    value={new Date()}
    mode="date"
    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
    onChange={handleDateChange}
  />
)}


      {/* 3. Start and End Time */}
      <Text style={styles.label}>Start and End Time</Text>
      <View style={styles.timeRow}>
  {/* Start Time */}
  <TouchableOpacity onPress={() => showTimePicker('start')} style={styles.timeInputWrapper}>
    <TextInput
      style={styles.inputField1}
      value={startTime}
      placeholder="Start Time"
      placeholderTextColor={'#888'}
      editable={false}
    />
  </TouchableOpacity>
  <TouchableOpacity
    style={styles.meridiemButton}
    onPress={() => setStartMeridiem(startMeridiem === 'AM' ? 'PM' : 'AM')}
  >
    <Text style={styles.meridiemText}>{startMeridiem}</Text>
  </TouchableOpacity>

  {/* End Time */}
  <TouchableOpacity onPress={() => showTimePicker('end')} style={styles.timeInputWrapper}>
    <TextInput
      style={styles.inputField1}
      value={endTime}
      placeholder="End Time"
      placeholderTextColor={'#888'}
      editable={false}
    />
  </TouchableOpacity>
  <TouchableOpacity
    style={styles.meridiemButton}
    onPress={() => setEndMeridiem(endMeridiem === 'AM' ? 'PM' : 'AM')}
  >
    <Text style={styles.meridiemText}>{endMeridiem}</Text>
  </TouchableOpacity>
</View>

      {/* Time Picker */}
      {showPicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {shiftList.length > 0 && (
  <View style={{ marginTop: 16 }}>
    <Text style={styles.label}>Added Shifts:</Text>
    {shiftList.map((item, index) => (
      <View key={index} style={styles.shiftItem}>
        <Text style={styles.shiftText}>
          • {item.shift} | {item.date} | {item.startTime} - {item.endTime}
        </Text>
      </View>
    ))}
  </View>
)}


      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleAddAnother} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>



      {/* update appointment */}
      <Modal
  visible={modalVisible1}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setModalVisible1(false)}
>
  <View style={styles.modalBackground}>
    <View style={styles.modalContainer}>
      <TouchableOpacity
    onPress={() => setModalVisible1(false)}
    style={styles.closeIconWrapper}
  >
    <Image
      source={require('../assets/UserProfile/close.png')} // Adjust path as needed
      style={styles.closeIcon}
      resizeMode="contain"
    />
  </TouchableOpacity>
      <Text style={styles.modalTitle}>Shift Details</Text>

      {/* 1. Shift */}
      <Text style={styles.label}>Select Shift</Text>
     <View style={styles.pickerContainer}>
  <Picker
    selectedValue={shift}
    onValueChange={(itemValue) => setShift(itemValue)}
    style={styles.picker}
  >
    <Picker.Item label="Select a shift" value="" color="#888" />  {/* Hint item */}
    <Picker.Item label="Morning" value="Morning" />
    <Picker.Item label="Afternoon" value="Afternoon" />
    <Picker.Item label="Evening" value="Evening" />
    
  </Picker>
</View>

      {/* 2. Date */}
      <Text style={styles.label}>Selected Date</Text>
      <TouchableOpacity onPress={showDatePicker}>
        <TextInput
          style={styles.inputField}
          value={selectedDate}
          editable={false}
          placeholder="Select Date"
          placeholderTextColor={'#888'}
          pointerEvents="none"  // ensures it's touchable only via TouchableOpacity
        />
      </TouchableOpacity>

      {datePickerVisible && (
  <DateTimePicker
    value={new Date()}
    mode="date"
    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
    onChange={handleDateChange}
  />
)}

      {/* 3. Start and End Time */}
      <Text style={styles.label}>Start and End Time</Text>
            <View style={styles.timeRow}>
  {/* Start Time */}
  <TouchableOpacity onPress={() => showTimePicker('start')} style={styles.timeInputWrapper}>
    <TextInput
      style={styles.inputField1}
      value={startTime}
      placeholder="Start Time"
      placeholderTextColor={'#888'}
      editable={false}
    />
  </TouchableOpacity>
  <TouchableOpacity
    style={styles.meridiemButton}
    onPress={() => setStartMeridiem(startMeridiem === 'AM' ? 'PM' : 'AM')}
  >
    <Text style={styles.meridiemText}>{startMeridiem}</Text>
  </TouchableOpacity>

  {/* End Time */}
  <TouchableOpacity onPress={() => showTimePicker('end')} style={styles.timeInputWrapper}>
    <TextInput
      style={styles.inputField1}
      value={endTime}
      placeholder="End Time"
      placeholderTextColor={'#888'}
      editable={false}
    />
  </TouchableOpacity>
  <TouchableOpacity
    style={styles.meridiemButton}
    onPress={() => setEndMeridiem(endMeridiem === 'AM' ? 'PM' : 'AM')}
  >
    <Text style={styles.meridiemText}>{endMeridiem}</Text>
  </TouchableOpacity>
</View>

      {showPicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => handleUpdate(availabilityId, selectedDate, startTime, endTime, shift)} 
            style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Update</Text>
            </TouchableOpacity>

     
      </View>
    </View>
  </View>
</Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#1c78f2',
    elevation: 4,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
 backButton: {
    marginRight: 10, // Adds spacing between icon and title
  },
  backIconContainer: {
    width: 30,
    height: 30,
    backgroundColor: "#AFCBFF", // White background
    borderRadius: 20, // Makes it circular
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 20,
    
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",  
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  monthScroll: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  monthButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    height: 50,
  },
  selectedMonthButton: {
    backgroundColor: '#1c78f2',
    borderColor: '#1c78f2',
  },
  monthText: {
    color: '#000',
    fontWeight: '500',
    fontSize: 14,
  },
  selectedMonthText: {
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#eee',
    borderColor: '#ddd',
  },
  disabledText: {
    color: '#888',
  },
  calendarContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayBox: {
    flex: 1,
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dateBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  disabledDateBox: {
    backgroundColor: '#ddd',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  disabledDateText: {
    color: '#888',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  inputField: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingLeft: 10,
    color: '#000',
  },
  inputField1: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
    marginBottom: 10,
   maxWidth: 400, 
       color: '#000',

   
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8, // Adds space between label and picker
    color: '#333', // You can customize this color
    style: 'bold',
    textAlign: 'left', // Align text to the left
  },
  pickerContainer: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 5,
  height: 45,
  marginBottom: 15,
  paddingTop: -50,
  overflow: 'hidden', // Ensures the picker doesn't overflow the border
},

  picker: {
    width: '100%',
    marginBottom: 12,
    paddingTop: -10,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#1c78f2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  addButton: {
  backgroundColor: '#f0ad4e',
  padding: 10,
  borderRadius: 8,
  marginRight: 10,
},

addButtonText: {
  color: 'white',
  fontWeight: 'bold',
},

  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    marginStart: 10,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#1c78f2',
    fontSize: 16,
  },
  // appointments
  appointmentsContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  
  noAppointments: {
    fontSize: 16,
    color: 'gray',
  },
  
  appointmentCard: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  
  appointmentText: {
    fontSize: 14,
    color: '#333',
  },
  // edit
  appointmentCard: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    position: 'relative',
  },
  
  editIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ddd',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteIconContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#ddd',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  
  editIcon: {
    width: 16,
    height: 16,
    tintColor: '#333',
  },
  
  modalContainer: {
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 20,
  margin: 20,
  width: 350,
},

label: {
  fontWeight: 'bold',
  marginBottom: 5,
},

picker: {
  borderWidth: 1,
  borderColor: '#ccc',
  marginBottom: 15,
},

timeRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 15,
},

timeInputWrapper: {
  flex: 1,
  marginHorizontal: 5,
},
closeIconWrapper: {
  position: 'absolute',
  top: 10,
  right: 10,
  zIndex: 10,
  padding: 5,
},

closeIcon: {
  width: 20,
  height: 20,
  
},
meridiemButton: {
  marginLeft: 8,
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 5,
  backgroundColor: '#eee',
  justifyContent: 'center',
  alignItems: 'center',
  height: 40,
},
meridiemText: {
  fontSize: 12,
  color: '#333',
  fontWeight: '500',
},
shiftItem: {
  paddingVertical: 6,
},
shiftText: {
  fontSize: 14,
  color: '#333',
},

  
});

export default MonthAvailability;
