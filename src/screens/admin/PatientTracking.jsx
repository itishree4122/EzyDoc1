import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';

// Sample patient data
const patients = [
  {
    id: '1',
    name: 'John Doe',
    age: 32,
    appointments: 5,
    status: 'Active',
  },
  {
    id: '2',
    name: 'Emily Smith',
    age: 27,
    appointments: 3,
    status: 'Deactivated',
  },
  {
    id: '3',
    name: 'Michael Chen',
    age: 40,
    appointments: 7,
    status: 'Active',
  },
  {
    id: '4',
    name: 'Anjali Patel',
    age: 30,
    appointments: 2,
    status: 'Active',
  },
];

const PatientManagementScreen = () => {
  const renderHeader = () => (
    <View style={[styles.row, styles.header]}>
      <Text style={[styles.cell, styles.headerText, { width: 160 }]}>Patient</Text>
      <Text style={[styles.cell, styles.headerText, { width: 80 }]}>Age</Text>
      <Text style={[styles.cell, styles.headerText, { width: 140 }]}>Appointments</Text>
      <Text style={[styles.cell, styles.headerText, { width: 120 }]}>Status</Text>
      <Text style={[styles.cell, styles.headerText, { width: 140 }]}>Action</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, { width: 160 }]}>{item.name}</Text>
      <Text style={[styles.cell, { width: 80 }]}>{item.age}</Text>
      <Text style={[styles.cell, { width: 140 }]}>{item.appointments}</Text>
      <Text
        style={[
          styles.cell,
          { width: 120, color: item.status === 'Active' ? 'green' : 'gray' },
        ]}
      >
        {item.status}
      </Text>
      <View style={[styles.cell, { width: 140 }]}>
        {item.status === 'Active' ? (
          <TouchableOpacity style={styles.deactivateBtn}>
            <Text style={styles.btnText}>Deactivate</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: 'gray' }}>N/A</Text>
        )}
      </View>
    </View>
  );

  return (

    <>
    <View style={styles.toolbar} />
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView horizontal>
        <View>
          {renderHeader()}
          <FlatList
            data={patients}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.tableSection}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
    
  );
};

export default PatientManagementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 10,
    backgroundColor: '#F4F6F8',
  },
  toolbar: {
    height: 60,
    backgroundColor: '#6495ed',
  },
  
  tableSection: {
    backgroundColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
    
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#4A90E2',
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cell: {
    paddingHorizontal: 4,
    fontSize: 14,
    justifyContent: 'center',
  },
  deactivateBtn: {
    backgroundColor: '#E53935',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  btnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
