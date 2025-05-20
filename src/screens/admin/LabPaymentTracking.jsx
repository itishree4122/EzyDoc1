import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

// Mock data with per-patient rate calculation and date added
const paymentData = [
  { id: '1', clinicName: 'ABC Clininc', patients: 10, rate: 500, date: '2025-04-10' },
  { id: '2', clinicName: 'ABC Clininc', patients: 5, rate: 500, date: '2025-04-11' },
  { id: '3', clinicName: 'ABC Clininc', patients: 8, rate: 500, date: '2025-04-10' },
  { id: '4', clinicName: 'ABC Clininc', patients: 12, rate: 500, date: '2025-04-09' },
  { id: '5', clinicName: 'ABC Clininc', patients: 6, rate: 500, date: '2025-04-10' },
  { id: '6', clinicName: 'ABC Clininc', patients: 7, rate: 500, date: '2025-04-11' },
  { id: '7', clinicName: 'ABC Clininc', patients: 4, rate: 500, date: '2025-04-10' },
];

const LabPaymentTracking = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const formattedDate = moment(selectedDate).format('YYYY-MM-DD');

  const filteredData = paymentData.filter((item) => item.date === formattedDate);

  const showDatePicker = () => setShowPicker(true);

  const onChange = (event, date) => {
    setShowPicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const renderHeader = () => (
    <View style={[styles.row, styles.header]}>
      <Text style={[styles.cell, styles.headerText]}>Clinic Name</Text>
      <Text style={[styles.cell, styles.headerText]}>Patients</Text>
      <Text style={[styles.cell, styles.headerText]}>Payable (₹)</Text>
      <Text style={[styles.cell, styles.headerText]}>Date</Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const payableAmount = item.patients * 5;
    return (
      <View style={styles.row}>
        <Text style={styles.cell}>{item.clinicName}</Text>
        <Text style={styles.cell}>{item.patients}</Text>
        <Text style={styles.cell}>₹{payableAmount}</Text>
        <Text style={styles.cell}>{item.date}</Text>
      </View>
    );
  };

  const calculateTotalRevenue = () => {
    return filteredData.reduce((total, doc) => total + doc.patients * doc.rate, 0);
  };

  return (
    <>
      {/* Empty Toolbar */}
      <View style={styles.toolbar} />

      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Calendar Picker */}
        <View style={styles.datePickerRow}>
          <Text style={styles.dateLabel}>Selected Date:</Text>
          <TouchableOpacity onPress={showDatePicker} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>{formattedDate}</Text>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onChange}
          />
        )}

        {/* Table Header */}
        {renderHeader()}

        {/* Table Rows + Total Row */}
        <View style={styles.tableSection}>
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />

          {/* Total Revenue */}
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total Revenue:</Text>
            <Text style={styles.totalAmount}>₹{calculateTotalRevenue()}</Text>
          </View>
        </View>

        {/* Download Buttons Placeholder */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.downloadBtn}>
            <Text style={styles.btnText}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.downloadBtn}>
            <Text style={styles.btnText}>Download Excel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
};

export default LabPaymentTracking;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: '#F9F9F9',
  },
  toolbar: {
    height: 60,
    backgroundColor: '#6495ED',
    justifyContent: 'center',
    marginBottom: 8,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 10,
  },
  dateButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    backgroundColor: '#6495ed',
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cell: {
    flex: 1,
    textAlign: 'left',
    paddingHorizontal: 8,
    fontSize: 14,
  },
  tableSection: {
    backgroundColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalAmount: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#4CAF50',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  downloadBtn: {
    backgroundColor: '#1976D2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  btnText: {
    color: 'white',
    fontWeight: '600',
  },
});
