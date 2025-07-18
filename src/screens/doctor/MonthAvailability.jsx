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
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
    // const response = await fetch(`${BASE_URL}/doctor/availability/`, {
    const response = await fetchWithAuth(`${BASE_URL}/doctor/availability/`, {
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
      // const response = await fetch(`${BASE_URL}/doctor/availability/`, {
      const response = await fetchWithAuth(`${BASE_URL}/doctor/availability/`, {
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
      // const response = await fetch(url, {
      const response = await fetchWithAuth(url, {
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
              // const response = await fetch(`${BASE_URL}/doctor/availability/${id}/`, {
              const response = await fetchWithAuth(`${BASE_URL}/doctor/availability/${id}/`, {
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
    // const response = await fetch(`${BASE_URL}/doctor/availability/`, {
    const response = await fetchWithAuth(`${BASE_URL}/doctor/availability/`, {
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
      // await fetch(`${BASE_URL}/doctor/availability/${shift.id}/`, {
      await fetchWithAuth(`${BASE_URL}/doctor/availability/${shift.id}/`, {
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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.monthScroll}
      >
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
              ]}>
                {month.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      <View style={styles.calendarWrapper}>
        <View style={styles.daysRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <View key={i} style={styles.dayBox}>
              <Text style={styles.dayText}>{d}</Text>
            </View>
          ))}
        </View>
        
        {daysMatrix.map((week, rowIdx) => (
          <View key={rowIdx} style={styles.weekRow}>
            {week.map((day, colIdx) => {
              if (day === null) return <View key={colIdx} style={styles.emptyDateBox} />;
              
              const now = new Date();
              const thisDate = new Date(currentYear, selectedMonthIndex, day);
              const disabled = thisDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const isToday = day === now.getDate() && selectedMonthIndex === now.getMonth() && currentYear === now.getFullYear();
              const hasAvailability = filteredAppointments.some(item => {
                const itemDate = new Date(item.date);
                return itemDate.getDate() === day && 
                       itemDate.getMonth() === selectedMonthIndex && 
                       itemDate.getFullYear() === currentYear;
              });
              
              return (
                <TouchableOpacity
                  key={colIdx}
                  style={[
                    styles.dateBox,
                    disabled && styles.disabledDateBox,
                    isToday && styles.todayDateBox,
                    hasAvailability && styles.hasAvailabilityBox,
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
                  <Text style={[
                    styles.dateText, 
                    disabled && styles.disabledDateText,
                    isToday && styles.todayDateText,
                    hasAvailability && styles.hasAvailabilityText,
                  ]}>
                    {day}
                  </Text>
                  {hasAvailability && <View style={styles.availabilityDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );

  // --- Main Render ---
  return (
     <View style={styles.container}>
      {/* Toolbar (remains the same) */}
      <View style={styles.toolbar}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Doctor Availability</Text>
      </View>

      {/* Enhanced Calendar */}
      <View style={styles.contentContainer}>
        {renderCalendar()}

        {/* Appointments List with enhanced UI */}
        <View style={styles.availabilitiesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {monthNames[selectedMonthIndex]} Shifts
            </Text>
            <TouchableOpacity 
              style={styles.addButtonFloating}
              onPress={() => {
                const today = new Date();
                const formattedMonth = String(today.getMonth() + 1).padStart(2, '0');
                const formattedDay = String(today.getDate()).padStart(2, '0');
                setSelectedDate(`${today.getFullYear()}-${formattedMonth}-${formattedDay}`);
                setModalVisible(true);
              }}
            >
              <Icon name="plus" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading shifts...</Text>
            </View>
          ) : filteredAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="calendar-remove" size={48} color="#ccc" />
              <Text style={styles.noAvailabilities}>No shifts scheduled</Text>
              <Text style={styles.noAvailabilitiesSub}>Add shifts by tapping the + button</Text>
            </View>
          ) : (
            <FlatList
              data={filteredAppointments}
              keyExtractor={item => item.id?.toString() + item.date + item.start_time}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.availabilityCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardDate}>
                      {moment(item.date).format('ddd, MMM D')}
                    </Text>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedDate(item.date);
                          setShift(item.shift.charAt(0).toUpperCase() + item.shift.slice(1));
                          setStartTime(moment(item.start_time, "HH:mm:ss").format("hh:mm A"));
                          setEndTime(moment(item.end_time, "HH:mm:ss").format("hh:mm A"));
                          setEditingId(item.id);
                          setModalVisibleEdit(true);
                        }}
                      >
                        <Icon name="pencil" size={20} color="#6495ED" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                      >
                        <Icon name="trash-can-outline" size={20} color="#FF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.cardBody}>
                    <View style={styles.shiftBadge}>
                      <Text style={styles.shiftText}>{item.shift}</Text>
                    </View>
                    
                    <View style={styles.timeContainer}>
                      <Icon name="clock-outline" size={16} color="#555" />
                      <Text style={styles.timeText}>
                        {moment(item.start_time, "HH:mm:ss").format("hh:mm A")} - {moment(item.end_time, "HH:mm:ss").format("hh:mm A")}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>

      {/* Modal for Adding Shifts (with enhanced UI) */}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Shifts</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setShift('');
                  setStartTime('');
                  setEndTime('');
                  setSelectedDate('');
                  setShiftList([]);
                }}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                onPress={() => openPicker('date')}
                style={styles.inputTouchable}
              >
                <Text style={[styles.inputField, !selectedDate && styles.placeholderText]}>
                  {selectedDate || 'Select Date'}
                </Text>
                <Icon name="calendar" size={20} color="#666" style={styles.inputIcon} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Shift</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={shift}
                  onValueChange={(itemValue) => setShift(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#666"
                >
                  <Picker.Item label="Select a shift" value="" />
                  <Picker.Item label="Morning" value="morning" />
                  <Picker.Item label="Afternoon" value="afternoon" />
                  <Picker.Item label="Evening" value="evening" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.timeInputGroup}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Start Time</Text>
                <TouchableOpacity 
                  onPress={() => openPicker('start')}
                  style={styles.inputTouchable}
                >
                  <Text style={[styles.inputField, !startTime && styles.placeholderText]}>
                    {startTime || 'Select Time'}
                  </Text>
                  <Icon name="clock-outline" size={20} color="#666" style={styles.inputIcon} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>End Time</Text>
                <TouchableOpacity 
                  onPress={() => openPicker('end')}
                  style={styles.inputTouchable}
                >
                  <Text style={[styles.inputField, !endTime && styles.placeholderText]}>
                    {endTime || 'Select Time'}
                  </Text>
                  <Icon name="clock-outline" size={20} color="#666" style={styles.inputIcon} />
                </TouchableOpacity>
              </View>
            </View>
            
            {showPicker && (
              <DateTimePicker
                value={tempTime}
                mode={pickerMode === 'date' ? 'date' : 'time'}
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                minimumDate={new Date()}
              />
            )}
            
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.actionButton, styles.addButton]}
                onPress={handleAddToBulk}
              >
                <Text style={styles.actionButtonText}>Add to List</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveBulk}
                disabled={shiftList.length === 0}
              >
                <Text style={styles.actionButtonText}>Save All ({shiftList.length})</Text>
              </TouchableOpacity>
            </View>
            
            {shiftList.length > 0 && (
              <View style={styles.shiftListContainer}>
                <Text style={styles.shiftListTitle}>Shifts to be added:</Text>
                <FlatList
                  data={shiftList}
                  keyExtractor={item => item.tempId.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.shiftListItem}>
                      <View style={styles.shiftListItemContent}>
                        <Text style={styles.shiftListItemDate}>{item.date}</Text>
                        <Text style={styles.shiftListItemDetails}>
                          {item.shift} • {item.start_time} - {item.end_time}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveFromBulk(item.tempId)}
                        style={styles.shiftListItemAction}
                      >
                        <Icon name="close" size={20} color="#FF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal for Editing Shift (with enhanced UI) */}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Shift</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisibleEdit(false);
                  setEditingId(null);
                }}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                onPress={() => openPicker('date')}
                style={styles.inputTouchable}
              >
                <Text style={styles.inputField}>
                  {selectedDate}
                </Text>
                <Icon name="calendar" size={20} color="#666" style={styles.inputIcon} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Shift</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={shift}
                  onValueChange={(itemValue) => setShift(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#666"
                >
                  <Picker.Item label="Morning" value="morning" />
                  <Picker.Item label="Afternoon" value="afternoon" />
                  <Picker.Item label="Evening" value="evening" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.timeInputGroup}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Start Time</Text>
                <TouchableOpacity 
                  onPress={() => openPicker('start')}
                  style={styles.inputTouchable}
                >
                  <Text style={styles.inputField}>
                    {startTime}
                  </Text>
                  <Icon name="clock-outline" size={20} color="#666" style={styles.inputIcon} />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>End Time</Text>
                <TouchableOpacity 
                  onPress={() => openPicker('end')}
                  style={styles.inputTouchable}
                >
                  <Text style={styles.inputField}>
                    {endTime}
                  </Text>
                  <Icon name="clock-outline" size={20} color="#666" style={styles.inputIcon} />
                </TouchableOpacity>
              </View>
            </View>
            
            {showPicker && (
              <DateTimePicker
                value={tempTime}
                mode={pickerMode === 'date' ? 'date' : 'time'}
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                minimumDate={new Date()}
              />
            )}
            
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisibleEdit(false);
                  setEditingId(null);
                }}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.actionButtonText}>Update Shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: '#1c78f2',
  },
  backButton: { marginRight: 12, padding: 4 },
  headerText: {  
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // New enhanced styles
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  calendarWrapper: {
    marginTop: 12,
  },
  monthScroll: {
    paddingBottom: 8,
  },
  monthButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
  },
  selectedMonthButton: {
    backgroundColor: '#1c78f2',
  },
  monthText: {
    color: '#555',
    fontWeight: '500',
    fontSize: 14,
  },
  selectedMonthText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
  disabledText: {
    color: '#aaa',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  emptyDateBox: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 2,
  },
  dateBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
  },
  selectedDateBox: {
    borderColor: '#1c78f2',
    borderWidth: 2,
    backgroundColor: '#e6f0ff',
  },
  disabledDateBox: {
    backgroundColor: '#f9f9f9',
    borderColor: '#f0f0f0',
  },
  todayDateBox: {
    backgroundColor: '#ffece6',
    borderColor: '#ffc7b3',
  },
  hasAvailabilityBox: {
    borderColor: '#a0d1ff',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  disabledDateText: {
    color: '#ccc',
  },
  todayDateText: {
    color: '#ff5c35',
    fontWeight: 'bold',
  },
  hasAvailabilityText: {
    color: '#1c78f2',
  },
  availabilityDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1c78f2',
  },
  availabilitiesContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButtonFloating: {
    backgroundColor: '#1c78f2',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6495ED',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noAvailabilities: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  noAvailabilitiesSub: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  availabilityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shiftBadge: {
    backgroundColor: '#e6f0ff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  shiftText: {
    color: '#1c78f2',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    color: '#555',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  inputTouchable: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputField: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  inputIcon: {
    marginLeft: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  timeInputGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#1c78f2',
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  shiftListContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  shiftListTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
  },
  shiftListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  shiftListItemContent: {
    flex: 1,
  },
  shiftListItemDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  shiftListItemDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  shiftListItemAction: {
    padding: 6,
  },
});

export default MonthAvailability;