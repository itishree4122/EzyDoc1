import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Image, Alert } from 'react-native';

const FILTER_TIMES = ['All', 'Morning', 'Afternoon', 'Evening', 'Night'];
const FILTER_TESTS = ['All', 'Blood Test', 'Urine Test', 'Sugar Test'];

const samplePatients = [
  {
    id: 1,
    name: 'John Doe',
    time: '09:30 AM',
    testType: 'Blood Test',
    date: '2025-04-25',
    bloodGroup: 'A+',
    age: 30,
    gender: 'Male',
    address: '123 Main St',
    number: '9876543210',
  },
  {
    id: 2,
    name: 'John Doe',
    time: '09:30 AM',
    testType: 'Blood Test',
    date: '2025-04-25',
    bloodGroup: 'A+',
    age: 30,
    gender: 'Male',
    address: '123 Main St',
    number: '9876543210',
  },
  {
    id: 3,
    name: 'John Doe',
    time: '09:30 AM',
    testType: 'Blood Test',
    date: '2025-04-25',
    bloodGroup: 'A+',
    age: 30,
    gender: 'Male',
    address: '123 Main St',
    number: '9876543210',
  },
  {
    id: 4,
    name: 'John Doe',
    time: '09:30 AM',
    testType: 'Blood Test',
    date: '2025-04-25',
    bloodGroup: 'A+',
    age: 30,
    gender: 'Male',
    address: '123 Main St',
    number: '9876543210',
  },
  {
    id: 5,
    name: 'John Doe',
    time: '09:30 AM',
    testType: 'Blood Test',
    date: '2025-04-25',
    bloodGroup: 'A+',
    age: 30,
    gender: 'Male',
    address: '123 Main St',
    number: '9876543210',
  },
  {
    id: 6,
    name: 'John Doe',
    time: '09:30 AM',
    testType: 'Blood Test',
    date: '2025-04-25',
    bloodGroup: 'A+',
    age: 30,
    gender: 'Male',
    address: '123 Main St',
    number: '9876543210',
  },
  {
    id: 7,
    name: 'John Doe',
    time: '09:30 AM',
    testType: 'Blood Test',
    date: '2025-04-25',
    bloodGroup: 'A+',
    age: 30,
    gender: 'Male',
    address: '123 Main St',
    number: '9876543210',
  },
  {
    id: 8,
    name: 'John Doe',
    time: '09:30 AM',
    testType: 'Blood Test',
    date: '2025-04-25',
    bloodGroup: 'A+',
    age: 30,
    gender: 'Male',
    address: '123 Main St',
    number: '9876543210',
  },
  {
    id: 9,
    name: 'John Doe',
    time: '09:30 AM',
    testType: 'Blood Test',
    date: '2025-04-25',
    bloodGroup: 'A+',
    age: 30,
    gender: 'Male',
    address: '123 Main St',
    number: '9876543210',
  },
  {
    id: 10,
    name: 'John Doe',
    time: '09:30 AM',
    testType: 'Blood Test',
    date: '2025-04-25',
    bloodGroup: 'A+',
    age: 30,
    gender: 'Male',
    address: '123 Main St',
    number: '9876543210',
  },
  {
    id: 11,
    name: 'John Doe',
    time: '09:30 AM',
    testType: 'Blood Test',
    date: '2025-04-25',
    bloodGroup: 'A+',
    age: 30,
    gender: 'Male',
    address: '123 Main St',
    number: '9876543210',
  },
  {
    id: 12,
    name: 'John Doe',
    time: '09:30 AM',
    testType: 'Blood Test',
    date: '2025-04-25',
    bloodGroup: 'A+',
    age: 30,
    gender: 'Male',
    address: '123 Main St',
    number: '9876543210',
  },
  
];

const TodaysLabTest = ({ navigation }) => {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('All');
  const [selectedTestFilter, setSelectedTestFilter] = useState('All');

  const handleDone = (id) => {
    Alert.alert('Confirmation', 'Are you sure you want to mark this test as Done?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: () => console.log('Test done for patient ID:', id) },
    ]);
  };

  const handleCancel = (id) => {
    Alert.alert('Confirmation', 'Are you sure you want to Cancel this test?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: () => console.log('Test cancelled for patient ID:', id) },
    ]);
  };

  const filterPatients = () => {
    return samplePatients.filter((patient) => {
      const hour = parseInt(patient.time.split(':')[0], 10);
      const isAM = patient.time.includes('AM');

      let isTimeMatch = true;
      if (selectedTimeFilter === 'Morning') isTimeMatch = isAM && hour >= 8 && hour <= 11;
      if (selectedTimeFilter === 'Afternoon') isTimeMatch = !isAM && hour >= 12 && hour <= 2;
      if (selectedTimeFilter === 'Evening') isTimeMatch = !isAM && hour >= 5 && hour < 8;
      if (selectedTimeFilter === 'Night') isTimeMatch = !isAM && hour >= 8 && hour <= 9;

      const isTestMatch = selectedTestFilter === 'All' || patient.testType === selectedTestFilter;
      return isTimeMatch && isTestMatch;
    });
  };

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/left-arrow.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.toolbarTitle}>Lab Test for Today</Text>
      </View>

      {/* Time Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {FILTER_TIMES.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, selectedTimeFilter === filter && styles.selectedFilter]}
            onPress={() => setSelectedTimeFilter(filter)}
          >
            <Text style={styles.filterText}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Test Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {FILTER_TESTS.map((test) => (
          <TouchableOpacity
            key={test}
            style={[styles.filterButton, selectedTestFilter === test && styles.selectedFilter]}
            onPress={() => setSelectedTestFilter(test)}
          >
            <Text style={styles.filterText}>{test}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

     {/* Patient List */}
    <View style={{ flex: 1 }}>
      <FlatList
        data={filterPatients()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.patientCard}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientIndex}>{index + 1}.</Text>
              <View>
                <Text style={styles.patientText}>Name: {item.name}</Text>
                <Text style={styles.patientText}>Date: {item.date}</Text>
                <Text style={styles.patientText}>Time: {item.time}</Text>
                <Text style={styles.patientText}>Test: {item.testType}</Text>
                <Text style={styles.patientText}>Blood Group: {item.bloodGroup}</Text>
                <Text style={styles.patientText}>Age: {item.age}</Text>
                <Text style={styles.patientText}>Gender: {item.gender}</Text>
                <Text style={styles.patientText}>Address: {item.address}</Text>
                <Text style={styles.patientText}>Number: {item.number}</Text>
              </View>
            </View>
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.doneButton} onPress={() => handleDone(item.id)}>
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(item.id)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6495ed',
    padding: 15,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
  toolbarTitle: {
    color: 'white',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingTop: 10,
    maxHeight: 55,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  filterButton: {
    marginRight: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: "#0047ab",
    borderRadius: 20,
    height: 34, // Set a fixed height for consistency
  },
  selectedFilter: {
    backgroundColor: '#6495ed',
    
  },
  filterText: {
    color: '#0047ab',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#bdc3c7',
    marginVertical: 10,
    marginLeft: 12,
    marginRight: 12,
  },
  patientCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    borderWidth: 0.6,
    borderColor: "#6495ed",
    justifyContent: 'space-between',
    elevation: 2,
  },
  patientInfo: {
    flexDirection: 'row',
  },
  patientIndex: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  patientText: {
    fontSize: 13,
    marginBottom: 2,
  },
  buttonGroup: {
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  doneButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  cancelButton: {
    backgroundColor: '#c0392b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
  },
});

export default TodaysLabTest;
