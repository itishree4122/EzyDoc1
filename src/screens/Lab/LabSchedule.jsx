import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Platform,
  FlatList,
  Image,

} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import moment from 'moment';
const LabSchedule = ({ navigation }) => {
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIndex);
  const [daysMatrix, setDaysMatrix] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('start'); // 'date', 'start', 'end'
  const [tempTime, setTempTime] = useState(new Date());
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [bulkSchedules, setBulkSchedules] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

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
  const fetchAvailabilities = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/labs/availability/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAvailabilities(data);
      } else {
        setAvailabilities([]);
      }
    } catch (err) {
      setAvailabilities([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  // --- Filtered by Month ---
  const filteredAvailabilities = availabilities.filter(item => {
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
      let formatted = value.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      if (pickerMode === 'start') setStartTime(formatted);
      else setEndTime(formatted);
    }
  };

  // --- Add to Bulk Schedules ---
  const handleAddToBulk = () => {
    if (!selectedDate || !startTime || !endTime) {
      Alert.alert('Validation', 'Please select date and time.');
      return;
    }
    setBulkSchedules(prev => [
      ...prev,
      {
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        available: true,
        tempId: Date.now() + Math.random(), // for unique key
      }
    ]);
    setSelectedDate('');
    setStartTime('');
    setEndTime('');
  };

  // --- Remove from Bulk Schedules ---
  const handleRemoveFromBulk = (tempId) => {
    setBulkSchedules(prev => prev.filter(item => item.tempId !== tempId));
  };

  // --- Save Bulk Schedules ---
  const handleSaveBulk = async () => {
    if (bulkSchedules.length === 0) {
      Alert.alert('Validation', 'Please add at least one schedule.');
      return;
    }
    try {
      const token = await getToken();
      const payload = bulkSchedules.map(({ tempId, ...rest }) => rest);
      const response = await fetch(`${BASE_URL}/labs/availability/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        Alert.alert('Success', 'Schedules saved!');
        setModalVisible(false);
        setBulkSchedules([]);
        setIsBulkMode(false);
        fetchAvailabilities();
      } else {
        // Alert.alert('Error', 'Failed to save schedules.');
        const data = await response.json();
  let errorMsg = 'Failed to save availability.';
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

  // --- Edit/Update Single Schedule ---
  const handleSave = async () => {
    if (!selectedDate || !startTime || !endTime) {
      Alert.alert('Validation', 'Please select date and time.');
      return;
    }
    try {
      const token = await getToken();
      const payload = {
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        available: true,
      };
      let url = `${BASE_URL}/labs/availability/`;
      let method = 'POST';
      let body = JSON.stringify([payload]);
      if (editingId) {
        url = `${BASE_URL}/labs/availability/${editingId}/`;
        method = 'PATCH';
        body = JSON.stringify(payload);
      }
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body,
      });
      if (response.ok) {
        Alert.alert('Success', editingId ? 'Availability updated!' : 'Availability saved!');
        setModalVisible(false);
        setStartTime('');
        setEndTime('');
        setSelectedDate('');
        setEditingId(null);
        fetchAvailabilities();
      } else {
        // Alert.alert('Error', 'Failed to save availability.');
        const data = await response.json();
let errorMsg = 'Failed to save availability.';
if (Array.isArray(data)) {
  // Collect all error messages from the array of objects
  errorMsg = data
    .map(obj => Object.values(obj).map(arr => arr.join(', ')).join(', '))
    .join('\n');
} else if (typeof data === 'object' && data !== null) {
  // Single object error
  errorMsg = Object.values(data).map(arr => Array.isArray(arr) ? arr.join(', ') : arr).join(', ');
}
Alert.alert('Error', errorMsg);
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  // --- Delete Schedule ---
  const handleDelete = async (id) => {
    Alert.alert(
      "Delete Availability",
      "Are you sure you want to delete this availability?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              const response = await fetch(`${BASE_URL}/labs/availability/${id}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (response.ok) {
                fetchAvailabilities();
              } else {
                Alert.alert("Error", "Failed to delete availability.");
              }
            } catch {
              Alert.alert("Error", "Something went wrong.");
            }
          }
        }
      ]
    );
  };


  //--- autodelete ---
  const autoDeletePastAvailabilities = async () => {
  try {
    const token = await getToken();
    const response = await fetch(`${BASE_URL}/labs/availability/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.warn("Failed to fetch lab availabilities.");
      return;
    }

    const data = await response.json();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to compare only dates

    const pastEntries = data.filter(item => new Date(item.date) < today);

    for (const entry of pastEntries) {
      await fetch(`${BASE_URL}/labs/availability/${entry.id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    if (pastEntries.length > 0) {
      fetchAvailabilities(); // Refresh the list
    }
  } catch (error) {
    console.error("Auto-delete error:", error);
  }
};
useEffect(() => {
  fetchAvailabilities();
  autoDeletePastAvailabilities();
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
                    setIsBulkMode(true);
                    setEditingId(null);
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
        <Text style={styles.headerText}>Lab Availability</Text>
      </View>

      {/* Calendar */}
      {renderCalendar()}

      {/* Availabilities List */}
      <View style={styles.availabilitiesContainer}>
        <Text style={styles.sectionTitle}>
          {monthNames[selectedMonthIndex]} Availabilities
        </Text>
        {loading ? (
          <Text style={{ color: "#1c78f2", textAlign: "center" }}>Loading...</Text>
        ) : filteredAvailabilities.length === 0 ? (
          <Text style={styles.noAvailabilities}>No Availabilities</Text>
        ) : (
          <FlatList
            data={filteredAvailabilities}
            keyExtractor={item => item.id?.toString() + item.date + item.start_time}
            renderItem={({ item }) => (
              <View style={styles.availabilityCard}>
                {/* Edit & Delete Icons */}
                <TouchableOpacity
                  style={styles.editIconContainer}
                  onPress={() => {
                    setSelectedDate(item.date);
                    setStartTime(item.start_time);
                    setEndTime(item.end_time);
                    setEditingId(item.id);
                    setModalVisible(true);
                    setIsBulkMode(false);
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
                {/* <Text style={styles.availabilityText}>Time: {item.start_time} - {item.end_time}</Text> */}
                <Text style={styles.availabilityText}>Time: {moment(item.start_time, "HH:mm:ss").format("hh:mm A")} - {moment(item.end_time, "HH:mm:ss").format("hh:mm A")}</Text>
                <Text style={styles.availabilityText}>Available: {item.available ? "Yes" : "No"}</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Modal for Adding/Editing Availability */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setModalVisible(false);
          setEditingId(null);
          setBulkSchedules([]);
          setIsBulkMode(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setEditingId(null);
                setBulkSchedules([]);
                setIsBulkMode(false);
              }}
              style={styles.closeIconWrapper}
            >
              <Image
                source={require('../assets/UserProfile/close.png')}
                style={styles.closeIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingId ? "Edit Availability" : "Add Schedules"}
            </Text>
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
            {isBulkMode && (
              <>
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
                {bulkSchedules.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.label}>Added Schedules:</Text>
                    <FlatList
                      data={bulkSchedules}
                      keyExtractor={item => item.tempId.toString()}
                      renderItem={({ item }) => (
                        <View style={styles.bulkScheduleItem}>
                          <Text style={styles.bulkScheduleText}>
                            {item.date} | {item.start_time} - {item.end_time}
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
              </>
            )}

            {/* Edit/Single Add UI */}
            {!isBulkMode && (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  setModalVisible(false);
                  setEditingId(null);
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
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
    shadowColor: "#1c78f2", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
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
    alignItems: "center", marginRight: 8,  borderColor:'#000',
    borderWidth: 1,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelButton: {
    backgroundColor: "#eee", paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: { color: "#1c78f2", fontSize: 16, fontWeight: "bold" },
  addButton: {
    // backgroundColor: "#f0ad4e",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
     borderColor:'#000',
    borderWidth: 1,
  },
  addButtonText: { 
    // color: "#fff", 
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

export default LabSchedule;