import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import moment from 'moment';

const reportData = [
  {
    id: '1',
    period: '2025-04-10',
    type: 'Daily',
    appointments: 12,
    revenue: '$1,200',
    doctorActivity: 'Dr. Smith (6), Dr. Lee (6)',
  },
  {
    id: '2',
    period: '2025-04-11',
    type: 'Daily',
    appointments: 15,
    revenue: '$1,400',
    doctorActivity: 'Dr. Smith (7), Dr. Lee (8)',
  },
  {
    id: '3',
    period: '2025-04-12',
    type: 'Daily',
    appointments: 10,
    revenue: '$1,050',
    doctorActivity: 'Dr. Smith (5), Dr. Lee (5)',
  },
];

const ReportsScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const showDatePicker = () => {
    DateTimePickerAndroid.open({
      value: selectedDate,
      mode: 'date',
      is24Hour: true,
      onChange: (event, date) => {
        if (date) {
          setSelectedDate(date);
        }
      },
    });
  };

  const filteredData = reportData.filter(
    (item) => item.period === moment(selectedDate).format('YYYY-MM-DD')
  );

  const renderHeader = () => (
    <View style={[styles.row, styles.header]}>
      <Text style={[styles.cell, styles.headerText, { width: 120 }]}>Period</Text>
      <Text style={[styles.cell, styles.headerText, { width: 100 }]}>Type</Text>
      <Text style={[styles.cell, styles.headerText, { width: 130 }]}>Appointments</Text>
      <Text style={[styles.cell, styles.headerText, { width: 100 }]}>Revenue</Text>
      <Text style={[styles.cell, styles.headerText, { width: 200 }]}>Doctor Activity</Text>
    </View>
  );

  const renderRow = (item) => (
    <View key={item.id} style={styles.row}>
      <Text style={[styles.cell, { width: 120 }]}>{item.period}</Text>
      <Text style={[styles.cell, { width: 100 }]}>{item.type}</Text>
      <Text style={[styles.cell, { width: 130 }]}>{item.appointments}</Text>
      <Text style={[styles.cell, { width: 100 }]}>{item.revenue}</Text>
      <Text style={[styles.cell, { width: 200 }]}>{item.doctorActivity}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Reports & Analytics</Text>

      <View style={styles.datePickerContainer}>
        <Text style={styles.dateLabel}>Selected Date:</Text>
        <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
          <Text style={styles.dateText}>{moment(selectedDate).format('YYYY-MM-DD')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.exportContainer}>
        <TouchableOpacity style={styles.exportBtn}>
          <Text style={styles.btnText}>Export CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#00796B' }]}>
          <Text style={styles.btnText}>Export PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal>
        <View style={styles.table}>
          {renderHeader()}
          {filteredData.length > 0 ? (
            filteredData.map(renderRow)
          ) : (
            <Text style={{ padding: 12, color: 'gray' }}>No data for selected date</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReportsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#333',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  dateLabel: {
    fontSize: 16,
    color: '#444',
  },
  dateButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dateText: {
    fontSize: 14,
    color: '#000',
  },
  exportContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  exportBtn: {
    backgroundColor: '#1976D2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  table: {
    backgroundColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  header: {
    backgroundColor: '#1565C0',
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cell: {
    paddingHorizontal: 6,
    fontSize: 14,
    justifyContent: 'center',
  },
});
