import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const mockAppointments = [
    {
      id: '1',
      clinicName: 'ABC Clinic',
      date: '2025-04-10',
      status: 'Completed',
      patientCount: 10,
    },
    {
      id: '2',
      clinicName: 'ABC Clinic',
      date: '2025-04-10',
      status: 'Pending',
      patientCount: 5,
    },
    {
      id: '3',
      clinicName: 'ABC Clinic',
      date: '2025-04-09',
      status: 'Cancelled',
      patientCount: 0,
    },
    {
      id: '4',
      clinicName: 'ABC Clinic',
      date: '2025-04-10',
      status: 'InProgress',
      patientCount: 8,
    },
    {
      id: '5',
      clinicName: 'ABC Clinic',
      date: '2025-04-11',
      status: 'Pending',
      patientCount: 7,
    },
    {
      id: '6',
      clinicName: 'ABC Clinic',
      date: '2025-04-11',
      status: 'InProgress',
      patientCount: 9,
    },
    {
      id: '7',
      clinicName: 'ABC Clinic',
      date: '2025-04-11',
      status: 'Completed',
      patientCount: 6,
    },
    {
      id: '8',
      clinicName: 'ABC Clinic',
      date: '2025-04-12',
      status: 'Cancelled',
      patientCount: 0,
    },
    {
      id: '9',
      clinicName: 'ABC Clinic',
      date: '2025-04-10',
      status: 'Completed',
      patientCount: 11,
    },
    {
      id: '10',
      clinicName: 'ABC Clinic',
      date: '2025-04-11',
      status: 'InProgress',
      patientCount: 4,
    },
    {
      id: '11',
      clinicName: 'ABC Clinic',
      date: '2025-04-09',
      status: 'Pending',
      patientCount: 3,
    },
    {
      id: '12',
      clinicName: 'ABC Clinic',
      date: '2025-04-10',
      status: 'Completed',
      patientCount: 12,
    },
    {
      id: '13',
      clinicName: 'ABC Clinic',
      date: '2025-04-10',
      status: 'Cancelled',
      patientCount: 0,
    },
    {
      id: '14',
      clinicName: 'ABC Clinic',
      date: '2025-04-11',
      status: 'Completed',
      patientCount: 6,
    },
    {
      id: '15',
      clinicName: 'ABC Clinic',
      date: '2025-04-12',
      status: 'Pending',
      patientCount: 2,
    },
    {
      id: '16',
      clinicName: 'ABC Clinic',
      date: '2025-04-12',
      status: 'InProgress',
      patientCount: 5,
    },
  ];
  

export default function LabAppointmentTracking() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const filteredData = mockAppointments.filter((appt) => {
    const dateMatch =
      selectedDate.toISOString().split('T')[0] === appt.date;
    const statusMatch =
      statusFilter === 'All' || appt.status.toLowerCase() === statusFilter.toLowerCase();
    return dateMatch && statusMatch;
  });

  const onChangeDate = (event, selected) => {
    setShowPicker(false);
    if (selected) {
      setSelectedDate(selected);
    }
  };

  const renderHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.cell, styles.headerText, styles.doctor]}>Doctor</Text>
      <Text style={[styles.cell, styles.headerText, styles.date]}>Date</Text>
      <Text style={[styles.cell, styles.headerText, styles.count]}>Patients</Text>
      <Text style={[styles.cell, styles.headerText, styles.status]}>Status</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.doctor]}>{item.clinicName}</Text>
      <Text style={[styles.cell, styles.date]}>{item.date}</Text>
      <Text style={[styles.cell, styles.count]}>{item.patientCount}</Text>
      <Text style={[styles.cell, styles.status]}>{item.status}</Text>
    </View>
  );

  return (
    <>
    <View style={styles.toolbar} />
    <View style={styles.container}>
        
        {/* Filters */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={styles.datePickerButton}
          >
            <Text style={styles.datePickerText}>
              {selectedDate.toISOString().split('T')[0]}
            </Text>
          </TouchableOpacity>
  
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={statusFilter}
              style={styles.picker}
              onValueChange={(itemValue) => setStatusFilter(itemValue)}
              mode="dropdown"
            >
              <Picker.Item label="All" value="All" />
              <Picker.Item label="Pending" value="Pending" />
              <Picker.Item label="Confirmed" value="InProgress" />
              <Picker.Item label="Completed" value="Completed" />
              <Picker.Item label="Cancelled" value="Cancelled" />
            </Picker>
          </View>
        </View>
  
        {/* Date Picker */}
        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}
  
        {/* Table */}
        <ScrollView horizontal>
          <View>
            {renderHeader()}
            <FlatList
              data={filteredData}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
            />
          </View>
        </ScrollView>
      </View>
    </>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6fa',
    padding: 16,
  },
  toolbar: {
    height: 60,
    backgroundColor: '#6495ed',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    gap: 10,
  },
  datePickerButton: {
    backgroundColor: '#6495ed',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  datePickerText: {
    fontSize: 16,
    color: '#fff',
  },
  pickerWrapper: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    width: 180,
    height: 49,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerRow: {
    backgroundColor: '#6495ed',
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cell: {
    paddingHorizontal: 10,
  },
  doctor: {
    width: 200,
  },
  date: {
    width: 140,
  },
  count: {
    width: 100,
  },
  status: {
    width: 130,
  },
});
