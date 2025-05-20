import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function DoctorTable() {
  const [doctors, setDoctors] = useState([
    {
      id: '1',
      name: 'Dr. Ayesha Khan',
      specialist: 'Cardiologist',
      address: 'HeartCare Clinic, Main Street, NY',
      experience: '12 years',
      commision: 5,
    },
    {
      id: '2',
      name: 'Dr. Rohan Mehta',
      specialist: 'Orthopedic Surgeon',
      address: 'Bone & Joint Center, LA',
      experience: '9 years',
      commision: 5,
    },
    {
      id: '3',
      name: 'Dr. Nidhi Verma',
      specialist: 'Dermatologist',
      address: 'SkinGlow Clinic, Houston',
      experience: '7 years',
      commision: 5,
    },
    {
      id: '4',
      name: 'Dr. Imran Siddiqui',
      specialist: 'Neurologist',
      address: 'NeuroLife Center, Chicago',
      experience: '15 years',
      commision: 5,
    },
    {
      id: '5',
      name: 'Dr. Swati Patel',
      specialist: 'Pediatrician',
      address: 'KidsCare Hospital, San Diego',
      experience: '10 years',
      commision: 5,
    },
  ]);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Extract unique specialists
  const specialists = ['All', ...Array.from(new Set(doctors.map((d) => d.specialist)))];

  const handleEdit = (id) => {
    const doctor = doctors.find((doc) => doc.id === id);
    setSelectedDoctor(doctor);
    setFormData({ ...doctor }); // clone data to form
  };

  const handleRemove = (id) => {
    const filteredDoctors = doctors.filter((doc) => doc.id !== id);
    setDoctors(filteredDoctors);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const updatedDoctors = doctors.map((doc) =>
      doc.id === formData.id ? formData : doc
    );
    setDoctors(updatedDoctors);
    setSelectedDoctor(null); // Hide form after saving
  };

  const filteredDoctors =
    selectedFilter === 'All'
      ? doctors
      : doctors.filter((doc) => doc.specialist === selectedFilter);

  const renderHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.cell, styles.headerText, styles.name]}>Name</Text>
      <Text style={[styles.cell, styles.headerText, styles.specialist]}>Specialist</Text>
      <Text style={[styles.cell, styles.headerText, styles.address]}>Clinic Address</Text>
      <Text style={[styles.cell, styles.headerText, styles.experience]}>Experience</Text>
      <Text style={[styles.cell, styles.headerText, styles.commision]}>Commision</Text>
      <Text style={[styles.cell, styles.headerText, styles.action]}>Action</Text>
      
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={[styles.row, styles.dataRow]}>
      <Text style={[styles.cell, styles.name]}>{item.name}</Text>
      <Text style={[styles.cell, styles.specialist]}>{item.specialist}</Text>
      <Text style={[styles.cell, styles.address]}>{item.address}</Text>
      <Text style={[styles.cell, styles.experience]}>{item.experience}</Text>
      <Text style={[styles.cell, styles.commision]}>{item.commision}</Text>
      <View style={[styles.cell, styles.action, styles.actionCell]}>
        <TouchableOpacity onPress={() => handleEdit(item.id)}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleRemove(item.id)}>
          <Text style={[styles.actionText, { color: 'red' }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar} />

      {/* Filter Dropdown */}
      <View style={styles.filterContainer}>
  
  <View style={styles.pickerWrapper}>
    <Picker
      selectedValue={selectedFilter}
      style={styles.picker}
      onValueChange={(itemValue) => setSelectedFilter(itemValue)}
      mode="dropdown"
    >
      {specialists.map((spec) => (
        <Picker.Item key={spec} label={spec} value={spec} />
      ))}
    </Picker>
  </View>
</View>


      {/* Editable Form Appears Below */}
      {selectedDoctor && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Edit Doctor Info</Text>

          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleChange('name', text)}
            placeholder="Name"
          />
          <TextInput
            style={styles.input}
            value={formData.specialist}
            onChangeText={(text) => handleChange('specialist', text)}
            placeholder="Specialist"
          />
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => handleChange('address', text)}
            placeholder="Address"
          />
          <TextInput
            style={styles.input}
            value={formData.experience}
            onChangeText={(text) => handleChange('experience', text)}
            placeholder="Experience"
          />

        <TextInput
            style={styles.input}
            value={formData.commision}
            onChangeText={(text) => handleChange('commision', text)}
            placeholder="Commision"
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tableContainer}>
        <ScrollView horizontal>
          <View style={styles.container}>
            {renderHeader()}
            <FlatList
              data={filteredDoctors}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  toolbar: {
    height: 60,
    backgroundColor: '#6495ed',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    padding: 8,
    backgroundColor: 'transparent',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  
  pickerWrapper: {
   
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  
  picker: {
    height: 49,
    
    minWidth: 200, // Increase width or use flex
    
  },
  
  
  tableContainer: {
    margin: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 2,
  },
  container: {
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  headerRow: {
    backgroundColor: '#6495ed',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 15,
  },
  dataRow: {
    backgroundColor: '#fff',
  },
  cell: {
    paddingHorizontal: 8,
  },
  name: {
    width: 180,
  },
  specialist: {
    width: 180,
  },
  address: {
    width: 250,
  },
  experience: {
    width: 120,
  },
  commision: {
    width: 140,
  },
  action: {
    width: 140,
  },
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionText: {
    color: 'blue',
    marginRight: 10,
  },

  // Form Styles
  formContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#6495ed',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
