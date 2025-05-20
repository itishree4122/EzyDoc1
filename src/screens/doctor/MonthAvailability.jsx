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
        setAvailabilityData(data);
      } else {
        console.error('Failed to fetch availability');
      }
    } catch (error) {
      console.error('Error:', error);
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
    const payload = {
      date: selectedDate,
      shift: shift.toLowerCase(), // make it lowercase if the backend expects it
      start_time: startTime,
      end_time: endTime,
    };
  
    try {
      const token = await getToken();
      if (!token) {
        console.error('No access token found.');
        return;
      }
  
      const response = await fetch(`${BASE_URL}/doctor/availability/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Shift saved:', data);
        Alert.alert('Success', 'Shift has been saved successfully!');
        setModalVisible(false); // Close modal on success
        fetchAvailability();
      } else {
        const errorText = await response.text();
        console.error('Failed to save shift:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error saving shift:', error);
    }
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
  

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Image
            source={require('../assets/homepage/left-arrow.png')}
            style={styles.backIcon}
          />
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
            <Text style={styles.modalTitle}>Shift Details</Text>

            <Text style={styles.label}>Select Shift</Text>
            <Picker
              selectedValue={shift}
              onValueChange={(itemValue) => setShift(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Morning" value="Morning" />
              <Picker.Item label="Afternoon" value="Afternoon" />
              <Picker.Item label="Evening" value="Evening" />
              <Picker.Item label="Night" value="Night" />
            </Picker>

            <TextInput
              style={styles.inputField}
              value={selectedDate}
              editable={false}
              placeholder="Selected Date"
            />

            

            <TextInput
              style={styles.inputField}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="Start Time"
              keyboardType="numeric"
            />

            <TextInput
              style={styles.inputField}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="End Time"
              keyboardType="numeric"
            />

            <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
            <Text style={styles.modalTitle}>Shift Details</Text>

            <Text style={styles.label}>Select Shift</Text>
            <Picker
              selectedValue={shift}
              onValueChange={(itemValue) => setShift(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Morning" value="Morning" />
              <Picker.Item label="Afternoon" value="Afternoon" />
              <Picker.Item label="Evening" value="Evening" />
              <Picker.Item label="Night" value="Night" />
            </Picker>

            <TextInput
              style={styles.inputField}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="Enter Date"
            />

            

            <TextInput
              style={styles.inputField}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="Start Time"
              keyboardType="numeric"
            />

            <TextInput
              style={styles.inputField}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="End Time"
              keyboardType="numeric"
            />

            <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => handleUpdate(availabilityId, selectedDate, startTime, endTime, shift)} 
            style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Update</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible1(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
    backgroundColor: '#6495ed',
    elevation: 4,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  backButton: {
    marginBottom: 8,
    width: 24,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
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
    backgroundColor: '#6495ed',
    borderColor: '#6495ed',
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
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8, // Adds space between label and picker
    color: '#333', // You can customize this color
    style: 'bold',
    textAlign: 'left', // Align text to the left
  },
  picker: {
    width: '100%',
    height: 50,
    marginBottom: 12,
    // borderWidth: 1,
    // borderColor: '#ccc',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#6495ed',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
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
    color: '#6495ed',
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
  
  
});

export default MonthAvailability;
