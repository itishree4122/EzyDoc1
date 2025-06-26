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
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import moment from 'moment';

const MonthAvailability = ({ navigation }) => {
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIndex);
  const [daysMatrix, setDaysMatrix] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleEdit, setModalVisibleEdit] = useState(false);
  const [shift, setShift] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('start'); // 'date', 'start', 'end'
  const [tempTime, setTempTime] = useState(new Date());
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [shiftList, setShiftList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // --- Calendar Matrix ---
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

  useEffect(() => {
    setDaysMatrix(getDaysInMonth(selectedMonthIndex, currentYear));
  }, [selectedMonthIndex]);

  // --- Fetch Availabilities ---
 const fetchAvailability = async () => {
  setLoading(true);
  try {
    const token = await getToken();
    const response = await fetch(`${BASE_URL}/doctor/availability/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();

      // Define desired shift order
      const shiftOrder = {
        Morning: 1,
        Afternoon: 2,
        Evening: 3,
      };

      // Sort by date, then shift
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        if (dateA - dateB !== 0) {
          return dateA - dateB;
        }

        return shiftOrder[a.shift] - shiftOrder[b.shift];
      });

      setAvailabilityData(sortedData);
    } else {
      setAvailabilityData([]);
    }
  } catch (err) {
    setAvailabilityData([]);
  }
  setLoading(false);
};


  useEffect(() => {
    fetchAvailability();
  }, []);

  // --- Filtered by Month ---
  const filteredAppointments = availabilityData.filter(item => {
    const date = new Date(item.date);
    return (
      date.getMonth() === selectedMonthIndex &&
      date.getFullYear() === currentYear
    );
  });

  // --- Time Picker ---
  const openPicker = (mode) => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const handleTimeChange = (event, selected) => {
  if (event.type === 'dismissed') {
    setShowPicker(false);
    return;
  }
  setShowPicker(false);
  const value = selected || tempTime;
  if (pickerMode === 'date') {
    // Format date as YYYY-MM-DD
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const dd = String(value.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  } else {
    let formatted = moment(value).format("hh:mm A");
    if (pickerMode === 'start') setStartTime(formatted);
    else setEndTime(formatted);
  }
};

  // --- Add to Bulk Shifts ---
  const handleAddToBulk = () => {
    if (!selectedDate || !shift || !startTime || !endTime) {
      Alert.alert('Validation', 'Please select date, shift, and time.');
      return;
    }
    setShiftList(prev => [
      ...prev,
      {
        date: selectedDate,
        shift,
        start_time: startTime,
        end_time: endTime,
        tempId: Date.now() + Math.random(),
      }
    ]);
    setSelectedDate('');
    setShift('');
    setStartTime('');
    setEndTime('');
  };

  // --- Remove from Bulk Shifts ---
  const handleRemoveFromBulk = (tempId) => {
    setShiftList(prev => prev.filter(item => item.tempId !== tempId));
  };

  // --- Save Bulk Shifts ---
  const handleSaveBulk = async () => {
    if (shiftList.length === 0) {
      Alert.alert('Validation', 'Please add at least one shift.');
      return;
    }
    try {
      const token = await getToken();
      const payload = shiftList.map(({ tempId, ...rest }) => ({
        ...rest,
        start_time: moment(rest.start_time, "hh:mm A").format("HH:mm:ss"),
        end_time: moment(rest.end_time, "hh:mm A").format("HH:mm:ss"),
      }));
      const response = await fetch(`${BASE_URL}/doctor/availability/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        Alert.alert('Success', 'Shifts saved!');
        setModalVisible(false);
        setShiftList([]);
        fetchAvailability();
      } else {
        const data = await response.json();
        let errorMsg = 'Failed to save shifts.';
        if (Array.isArray(data)) {
          errorMsg = data
            .map(obj => Object.values(obj).map(arr => arr.join(', ')).join(', '))
            .join('\n');
        } else if (typeof data === 'object' && data !== null) {
          errorMsg = Object.values(data).map(arr => Array.isArray(arr) ? arr.join(', ') : arr).join(', ');
        }
        Alert.alert('Error', errorMsg);
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  // --- Edit/Update Single Shift ---
  const handleSaveEdit = async () => {
    if (!selectedDate || !shift || !startTime || !endTime) {
      Alert.alert('Validation', 'Please select date, shift, and time.');
      return;
    }
    try {
      const token = await getToken();
      const payload = {
        date: selectedDate,
        shift,
        start_time: moment(startTime, "hh:mm A").format("HH:mm:ss"),
        end_time: moment(endTime, "hh:mm A").format("HH:mm:ss"),
      };
      const url = `${BASE_URL}/doctor/availability/${editingId}/`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        Alert.alert('Success', 'Shift updated!');
        setModalVisibleEdit(false);
        setEditingId(null);
        fetchAvailability();
      } else {
        const data = await response.json();
        let errorMsg = 'Failed to update shift.';
        if (Array.isArray(data)) {
          errorMsg = data
            .map(obj => Object.values(obj).map(arr => arr.join(', ')).join(', '))
            .join('\n');
        } else if (typeof data === 'object' && data !== null) {
          errorMsg = Object.values(data).map(arr => Array.isArray(arr) ? arr.join(', ') : arr).join(', ');
        }
        Alert.alert('Error', errorMsg);
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  // --- Delete Shift ---
  const handleDelete = async (id) => {
    Alert.alert(
      "Delete Shift",
      "Are you sure you want to delete this shift?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              const response = await fetch(`${BASE_URL}/doctor/availability/${id}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (response.ok) {
                fetchAvailability();
              } else {
                Alert.alert("Error", "Failed to delete shift.");
              }
            } catch {
              Alert.alert("Error", "Something went wrong.");
            }
          }
        }
      ]
    );
  };

  // --- Auto Delete ---
  const autoDeletePastShifts = async () => {
  try {
    const token = await getToken();
    const response = await fetch(`${BASE_URL}/doctor/availability/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.warn("Failed to fetch availability for auto-deletion.");
      return;
    }

    const data = await response.json();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Only compare dates, ignore time

    const pastShifts = data.filter(item => new Date(item.date) < today);

    for (const shift of pastShifts) {
      await fetch(`${BASE_URL}/doctor/availability/${shift.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    if (pastShifts.length > 0) {
      fetchAvailability(); // Refresh current list
    }
  } catch (error) {
    console.error("Error auto-deleting past shifts:", error);
  }
};

useEffect(() => {
  fetchAvailability();
  autoDeletePastShifts();
}, []);


  // --- Calendar UI ---
  const renderCalendar = () => (
    <View style={styles.calendarContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScroll}>
        {monthNames.map((month, idx) => {
          const isEnabled = idx >= currentMonthIndex;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => isEnabled && setSelectedMonthIndex(idx)}
              style={[
                styles.monthButton,
                selectedMonthIndex === idx && styles.selectedMonthButton,
                !isEnabled && styles.disabledButton,
              ]}
              disabled={!isEnabled}
            >
              <Text style={[
                styles.monthText,
                selectedMonthIndex === idx && styles.selectedMonthText,
                !isEnabled && styles.disabledText,
              ]}>{month}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.daysRow}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
          <View key={i} style={styles.dayBox}><Text style={styles.dayText}>{d}</Text></View>
        ))}
      </View>
      {daysMatrix.map((week, rowIdx) => (
        <View key={rowIdx} style={styles.weekRow}>
          {week.map((day, colIdx) => {
            if (day === null) return <View key={colIdx} style={styles.dateBox} />;
            const now = new Date();
            const thisDate = new Date(currentYear, selectedMonthIndex, day);
            const disabled = thisDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return (
              <TouchableOpacity
                key={colIdx}
                style={[
                  styles.dateBox,
                  disabled && styles.disabledDateBox,
                  selectedDate === `${currentYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` && styles.selectedDateBox,
                ]}
                disabled={disabled}
                onPress={() => {
                  if (!disabled) {
                    const formattedMonth = String(selectedMonthIndex + 1).padStart(2, '0');
                    const formattedDay = String(day).padStart(2, '0');
                    setSelectedDate(`${currentYear}-${formattedMonth}-${formattedDay}`);
                    setModalVisible(true);
                    setEditingId(null);
                    setShift('');
                    setStartTime('');
                    setEndTime('');
                  }
                }}
              >
                <Text style={[styles.dateText, disabled && styles.disabledDateText]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  // --- Main Render ---
  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        
          <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/left-arrow.png')} style={styles.backIcon} />
         
        </TouchableOpacity>
        <Text style={styles.headerText}>Doctor Availability</Text>
      </View>

      {/* Calendar */}
      {renderCalendar()}

      {/* Appointments List */}
      <View style={styles.availabilitiesContainer}>
        <Text style={styles.sectionTitle}>
          {monthNames[selectedMonthIndex]} Shifts
        </Text>
        {loading ? (
          <Text style={{ color: "#6495ED", textAlign: "center" }}>Loading...</Text>
        ) : filteredAppointments.length === 0 ? (
          <Text style={styles.noAvailabilities}>No Shifts</Text>
        ) : (
          <FlatList
            data={filteredAppointments}
            keyExtractor={item => item.id?.toString() + item.date + item.start_time}
            renderItem={({ item }) => (
              <View style={styles.availabilityCard}>
                {/* Edit & Delete Icons */}
                <TouchableOpacity
                  style={styles.editIconContainer}
                  onPress={() => {
                    setSelectedDate(item.date);
                    setShift(item.shift.charAt(0).toUpperCase() + item.shift.slice(1));
                    setStartTime(moment(item.start_time, "HH:mm:ss").format("hh:mm A"));
                    setEndTime(moment(item.end_time, "HH:mm:ss").format("hh:mm A"));
                    setEditingId(item.id);
                    setModalVisibleEdit(true);
                  }}
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
                <Text style={styles.availabilityText}>Date: {item.date}</Text>
                <Text style={styles.availabilityText}>Shift: {item.shift}</Text>
                <Text style={styles.availabilityText}>Time: {moment(item.start_time, "HH:mm:ss").format("hh:mm A")} - {moment(item.end_time, "HH:mm:ss").format("hh:mm A")}</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Modal for Adding Shifts */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalVisible(false);
          setShift('');
          setStartTime('');
          setEndTime('');
          setSelectedDate('');
          setShiftList([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setShift('');
                setStartTime('');
                setEndTime('');
                setSelectedDate('');
                setShiftList([]);
              }}
              style={styles.closeIconWrapper}
            >
              <Image
                source={require('../assets/UserProfile/close.png')}
                style={styles.closeIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Shifts</Text>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              onPress={() => openPicker('date')}
              style={{ marginBottom: 12 }}
            >
              <View pointerEvents="none">
                <TextInput
                  style={styles.inputField}
                  value={selectedDate}
                  editable={false}
                  placeholder="Select Date"
                  placeholderTextColor="#aaa"
                />
              </View>
            </TouchableOpacity>
            <Text style={styles.label}>Shift</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={shift}
                onValueChange={(itemValue) => setShift(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select a shift" value="" color="#888" />
                <Picker.Item label="Morning" value="morning" />
                <Picker.Item label="Afternoon" value="afternoon" />
                <Picker.Item label="Evening" value="evening" />
              </Picker>
            </View>
            <Text style={styles.label}>Start Time</Text>
            <TouchableOpacity onPress={() => openPicker('start')}>
              <TextInput
                style={styles.inputField}
                value={startTime}
                placeholder="Select Start Time"
                placeholderTextColor={"#aaa"}
                editable={false}
              />
            </TouchableOpacity>
            <Text style={styles.label}>End Time</Text>
            <TouchableOpacity onPress={() => openPicker('end')}>
              <TextInput
                style={styles.inputField}
                value={endTime}
                placeholder="Select End Time"
                placeholderTextColor={"#aaa"}
                editable={false}
              />
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={tempTime}
                mode={pickerMode === 'date' ? 'date' : 'time'}
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                minimumDate={new Date()} // disables all past dates
              />
            )}
            {/* Bulk Add UI */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.addButton, { flex: 1, marginRight: 8 }]}
                onPress={handleAddToBulk}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { flex: 1 }]}
                onPress={handleSaveBulk}
              >
                <Text style={styles.saveButtonText}>Save All</Text>
              </TouchableOpacity>
            </View>
            {shiftList.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text style={styles.label}>Added Shifts:</Text>
                <FlatList
                  data={shiftList}
                  keyExtractor={item => item.tempId.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.bulkScheduleItem}>
                      <Text style={styles.bulkScheduleText}>
                        {item.date} | {item.shift} | {item.start_time} - {item.end_time}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveFromBulk(item.tempId)}
                        style={styles.bulkRemoveBtn}
                      >
                        <Image
                          source={require('../assets/doctor/bin.png')}
                          style={styles.bulkRemoveIcon}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal for Editing Shift */}
      <Modal
        visible={modalVisibleEdit}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalVisibleEdit(false);
          setEditingId(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => {
                setModalVisibleEdit(false);
                setEditingId(null);
              }}
              style={styles.closeIconWrapper}
            >
              <Image
                source={require('../assets/UserProfile/close.png')}
                style={styles.closeIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Shift</Text>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              onPress={() => openPicker('date')}
              style={{ marginBottom: 12 }}
            >
              <View pointerEvents="none">
                <TextInput
                  style={styles.inputField}
                  value={selectedDate}
                  editable={false}
                  placeholder="Select Date"
                  placeholderTextColor="#aaa"
                />
              </View>
            </TouchableOpacity>
            <Text style={styles.label}>Shift</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={shift}
                onValueChange={(itemValue) => setShift(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select a shift" value="" color="#888" />
                <Picker.Item label="Morning" value="morning" />
                <Picker.Item label="Afternoon" value="afternoon" />
                <Picker.Item label="Evening" value="evening" />
              </Picker>
            </View>
            <Text style={styles.label}>Start Time</Text>
            <TouchableOpacity onPress={() => openPicker('start')}>
              <TextInput
                style={styles.inputField}
                value={startTime}
                placeholder="Select Start Time"
                placeholderTextColor={"#aaa"}
                editable={false}
              />
            </TouchableOpacity>
            <Text style={styles.label}>End Time</Text>
            <TouchableOpacity onPress={() => openPicker('end')}>
              <TextInput
                style={styles.inputField}
                value={endTime}
                placeholder="Select End Time"
                placeholderTextColor={"#aaa"}
                editable={false}
              />
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={tempTime}
                mode={pickerMode === 'date' ? 'date' : 'time'}
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                minimumDate={new Date()} // disables all past dates
              />
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                <Text style={styles.saveButtonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setModalVisibleEdit(false);
                setEditingId(null);
              }}>
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
  container: { flex: 1, backgroundColor: '#fff' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 12,
    backgroundColor: '#1c78f2',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
   backIcon: {
    width: 22,
    height: 22,
    tintColor: 'white',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 55,
    color: '#222',
  },
  backButton: { marginRight: 12, padding: 4 },
  headerText: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
  calendarContainer: { paddingHorizontal: 10, paddingTop: 10 },
  monthScroll: { paddingVertical: 6, paddingHorizontal: 10, marginBottom: 4 },
  monthButton: {
    paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fff',
    borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#ccc', height: 50,
  },
  selectedMonthButton: { backgroundColor: '#1c78f2', borderColor: '#1c78f2' },
  monthText: { color: '#000', fontWeight: '500', fontSize: 14 },
  selectedMonthText: { color: '#fff' },
  disabledButton: { backgroundColor: '#eee', borderColor: '#ddd' },
  disabledText: { color: '#888' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dayBox: { flex: 1, alignItems: 'center' },
  dayText: { fontSize: 14, fontWeight: '600', color: '#333' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dateBox: {
    flex: 1, aspectRatio: 1, backgroundColor: '#f0f0f0', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 2,
  },
  selectedDateBox: { borderWidth: 2, borderColor: '#1c78f2' },
  disabledDateBox: { backgroundColor: '#ddd' },
  dateText: { fontSize: 14, fontWeight: '500', color: '#000' },
  disabledDateText: { color: '#888' },
  availabilitiesContainer: { flex: 1, margin: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  noAvailabilities: { fontSize: 16, color: 'gray', textAlign: 'center', marginTop: 20 },
  availabilityCard: {
    backgroundColor: '#e6f0ff', padding: 14, borderRadius: 10, marginBottom: 12,
    shadowColor: "#6495ED", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    position: 'relative',
  },
  availabilityText: { fontSize: 15, color: '#222', marginBottom: 2 },
  editIconContainer: {
    position: 'absolute',
    top: 8,
    right: 48,
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
  editIcon: {
    width: 16,
    height: 16,
    tintColor: '#333',
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff', borderRadius: 12, padding: 24, width: "85%", maxWidth: 400,
    alignItems: "stretch", elevation: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 18, color: "#222", textAlign: "center" },
  label: { fontSize: 15, color: "#333", marginBottom: 6, fontWeight: "bold" },
  inputField: {
    width: "100%", height: 44, borderWidth: 1, borderColor: "#ccc", borderRadius: 8,
    paddingHorizontal: 12, backgroundColor: "#f9f9f9", marginBottom: 12, fontSize: 16, color: "#222"
  },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  saveButton: {
    backgroundColor: "#1c78f2", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8,
    alignItems: "center", marginRight: 8, borderColor: '#000',
    borderWidth: 1,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelButton: {
    backgroundColor: "#eee", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: { color: "#1c78f2", fontSize: 16, fontWeight: "bold" },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    borderColor: '#000',
    borderWidth: 1,
  },
  addButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  bulkScheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  bulkScheduleText: { flex: 1, fontSize: 15, color: '#333' },
  bulkRemoveBtn: {
    marginLeft: 8,
    backgroundColor: '#FF4444',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkRemoveIcon: {
    width: 16,
    height: 16,
    tintColor: '#fff',
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
});

export default MonthAvailability;