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
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import moment from 'moment';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';



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
      // const response = await fetch(`${BASE_URL}/labs/availability/`, {
      const response = await fetchWithAuth(`${BASE_URL}/labs/availability/`, {
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
      // const response = await fetch(`${BASE_URL}/labs/availability/`, {
      const response = await fetchWithAuth(`${BASE_URL}/labs/availability/`, {
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
      // const response = await fetch(url, {
      const response = await fetchWithAuth(url, {
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
              // const response = await fetch(`${BASE_URL}/labs/availability/${id}/`, {
              const response = await fetchWithAuth(`${BASE_URL}/labs/availability/${id}/`, {
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
    // const response = await fetch(`${BASE_URL}/labs/availability/`, {
    const response = await fetchWithAuth(`${BASE_URL}/labs/availability/`, {
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
      // await fetch(`${BASE_URL}/labs/availability/${entry.id}/`, {
      await fetchWithAuth(`${BASE_URL}/labs/availability/${entry.id}/`, {
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
              const hasAvailability = filteredAvailabilities.some(item => {
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
                      setIsBulkMode(true);
                      setEditingId(null);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Availability</Text>
      </View>

      {/* Calendar Section */}
      <View style={styles.calendarSection}>
       {/* // In your month selector ScrollView (replace the existing code): */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthSelector}
        >
          {monthNames.map((month, idx) => {
            // Only show months that are current or future
            if (idx >= currentMonthIndex) {
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedMonthIndex(idx)}
                  style={[
                    styles.monthButton,
                    selectedMonthIndex === idx && styles.selectedMonthButton,
                  ]}
                >
                  <Text style={[
                    styles.monthButtonText,
                    selectedMonthIndex === idx && styles.selectedMonthButtonText,
                  ]}>
                    {month.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            }
            return null; // Don't render past months
          })}
        </ScrollView>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          <View style={styles.weekDaysRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <Text key={i} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          {daysMatrix.map((week, rowIdx) => (
            <View key={rowIdx} style={styles.weekRow}>
              {week.map((day, colIdx) => {
                if (day === null) return <View key={colIdx} style={styles.emptyDay} />;
                
                const now = new Date();
                const thisDate = new Date(currentYear, selectedMonthIndex, day);
                const disabled = thisDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const isToday = day === now.getDate() && selectedMonthIndex === now.getMonth();
                const hasAvailability = filteredAvailabilities.some(item => {
                  const itemDate = new Date(item.date);
                  return itemDate.getDate() === day && 
                         itemDate.getMonth() === selectedMonthIndex;
                });

                return (
                  <TouchableOpacity
                    key={colIdx}
                    style={[
                      styles.dayButton,
                      disabled && styles.disabledDay,
                      isToday && styles.todayDay,
                      hasAvailability && styles.hasAvailabilityDay,
                    ]}
                    disabled={disabled}
                    onPress={() => {
                      if (!disabled) {
                        const formattedDate = `${currentYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        setSelectedDate(formattedDate);
                        setModalVisible(true);
                        setIsBulkMode(true);
                        setEditingId(null);
                      }
                    }}
                  >
                    <Text style={[
                      styles.dayText,
                      disabled && styles.disabledDayText,
                      isToday && styles.todayDayText,
                    ]}>
                      {day}
                    </Text>
                    {hasAvailability && <View style={styles.availabilityIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Availability List */}
      <View style={styles.availabilityListContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {monthNames[selectedMonthIndex]} Availability
          </Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              const today = moment().format('YYYY-MM-DD');
              setSelectedDate(today);
              setModalVisible(true);
              setIsBulkMode(true);
            }}
          >
            <Icon name="plus" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1C78F2" />
            <Text style={styles.loadingText}>Loading availability...</Text>
          </View>
        ) : filteredAvailabilities.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon 
                name="calendar-month" 
                size={50}              
                color="#ccc"    
                
              />

            <Text style={styles.emptyStateText}>No availability scheduled</Text>
            <Text style={styles.emptyStateSubText}>Tap the + button to add time slots</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAvailabilities}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.availabilityItem}>
                <View style={styles.availabilityLeft}>
                  <Text style={styles.availabilityDateDay}>
                    {moment(item.date).format('DD')}
                  </Text>
                  <Text style={styles.availabilityDateMonth}>
                    {moment(item.date).format('MMM').toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.availabilityMiddle}>
                  <View style={styles.timeBadge}>
                    <Icon name="clock-outline" size={14} color="#1C78F2" />
                    <Text style={styles.timeText}>
                      {moment(item.start_time, "HH:mm:ss").format("h:mm A")}
                    </Text>
                  </View>
                  <View style={styles.timeBadge}>
                    <Icon name="clock-outline" size={14} color="#E53E3E" />
                    <Text style={styles.timeText}>
                      {moment(item.end_time, "HH:mm:ss").format("h:mm A")}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.availabilityRight}>
                  <TouchableOpacity 
                    onPress={() => {
                      setSelectedDate(item.date);
                      setStartTime(item.start_time);
                      setEndTime(item.end_time);
                      setEditingId(item.id);
                      setModalVisible(true);
                      setIsBulkMode(false);
                    }}
                    style={styles.actionButton}
                  >
                    <Icon name="pencil" size={18} color="#4A90E2" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => handleDelete(item.id)}
                    style={styles.actionButton}
                  >
                    <Icon name="trash-can-outline" size={18} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Add/Edit Modal */}
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
    <View style={styles.modalContainer}>
      
      {/* Header */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>
          {editingId ? "Edit Time Slot" : "Add Time Slots"}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setModalVisible(false);
            setEditingId(null);
            setBulkSchedules([]);
            setIsBulkMode(false);
          }}
        >
          <Icon name="close" size={24} color="#666666" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.modalContent}>

        {/* Date Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Date</Text>
          <TouchableOpacity
            onPress={() => openPicker('date')}
            style={styles.dateInput}
          >
            <Text style={[styles.inputText, !selectedDate && styles.placeholderText]}>
              {moment(selectedDate).format('DD-MM-YYYY') || 'Select date'}
            </Text>
            <Icon name="calendar" size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Time Inputs */}
        <View style={styles.timeInputGroup}>
          <View style={styles.timeInputContainer}>
            <Text style={styles.inputLabel}>Start Time</Text>
            <TouchableOpacity 
              onPress={() => openPicker('start')}
              style={styles.timeInput}
            >
              <Text style={[styles.inputText, !startTime && styles.placeholderText]}>
                {startTime || 'Select time'}
              </Text>
              <Icon name="clock-outline" size={20} color="#666666" />
            </TouchableOpacity>
          </View>

          <View style={styles.timeInputContainer}>
            <Text style={styles.inputLabel}>End Time</Text>
            <TouchableOpacity 
              onPress={() => openPicker('end')}
              style={styles.timeInput}
            >
              <Text style={[styles.inputText, !endTime && styles.placeholderText]}>
                {endTime || 'Select time'}
              </Text>
              <Icon name="clock-outline" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* DateTime Picker */}
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

       

        {/* Buttons */}
        {isBulkMode ? (
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.addToListButton]}
              onPress={handleAddToBulk}
            >
              <Text style={styles.addToListButtonText}>Add to List</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveBulk}
              disabled={bulkSchedules.length === 0}
            >
              <Text style={styles.saveButtonText}>
                Save All ({bulkSchedules.length})
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        )}

         {/* Bulk List */}
        {isBulkMode && bulkSchedules.length > 0 && (
          <View style={styles.bulkListContainer}>
            <Text style={styles.bulkListTitle}>Time slots to be added:</Text>
            <FlatList
              data={bulkSchedules}
              keyExtractor={item => item.tempId.toString()}
              renderItem={({ item }) => (
                <View style={styles.bulkListItem}>
                  <Text style={styles.bulkListItemText}>
                    {moment(item.date).format('DD-MM-YYYY')} • {item.start_time} - {item.end_time}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveFromBulk(item.tempId)}
                    style={styles.removeBulkItemButton}
                  >
                    <Icon name="close" size={16} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}

      </View>
    </View>
  </View>
</Modal>

    </View>
  );
};

const styles = StyleSheet.create({
 // Container Styles
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1C78F2',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Calendar Section Styles
  calendarSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  monthSelector: {
    paddingBottom: 12,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F0F4F8',
  },
  selectedMonthButton: {
    backgroundColor: '#1C78F2',
  },
  disabledMonthButton: {
    backgroundColor: '#F0F4F8',
    opacity: 0.6,
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
  },
  selectedMonthButtonText: {
    color: '#FFFFFF',
  },
  disabledMonthButtonText: {
    color: '#A0AEC0',
  },
  calendarGrid: {
    marginTop: 12,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDayText: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  emptyDay: {
    width: 32,
    height: 32,
    margin: 2,
  },
  dayButton: {
    width: 43,
    height: 43,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disabledDay: {
    backgroundColor: '#F8FAFC',
    borderColor: '#EDF2F7',
  },
  todayDay: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FED7D7',
  },
  hasAvailabilityDay: {
    borderColor: '#BEE3F8',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3748',
  },
  disabledDayText: {
    color: '#A0AEC0',
  },
  todayDayText: {
    color: '#E53E3E',
  },
  availabilityIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3182CE',
  },
  
  // Availability List Styles
 // Availability List Styles
  availabilityListContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C78F2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#4A5568',
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
    
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  availabilityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  availabilityLeft: {
    width: 60,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    marginRight: 12,
  },
  availabilityDateDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C78F2',
  },
  availabilityDateMonth: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
    marginTop: 2,
  },
  availabilityMiddle: {
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  timeText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 6,
  },
  availabilityRight: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  modalContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  timeInputGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeInputContainer: {
    width: '48%',
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  inputText: {
    fontSize: 16,
    color: '#2D3748',
  },
  placeholderText: {
    color: '#A0AEC0',
  },
  bulkActions: {
    marginTop: 16,
  },
  addToListButton: {
    backgroundColor: '#38A169',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  addToListButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  bulkListContainer: {
    marginBottom: 16,
  },
  bulkListTitle: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
    fontWeight: '500',
  },
  bulkListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  bulkListItemText: {
    fontSize: 14,
    color: '#4A5568',
  },
  removeBulkItemButton: {
    padding: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#EDF2F7',
    marginRight: 12,
  },
  saveButton: {
    backgroundColor: '#1C78F2',
  },
  cancelButtonText: {
    color: '#4A5568',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LabSchedule;