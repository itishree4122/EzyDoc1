import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import IonIcon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const LabTypes = () => {
  const navigation = useNavigation();
  const [lab, setLab] = useState("");
  const [labTests, setLabTests] = useState([""]);
  const [loading, setLoading] = useState(false);

  const addLabTestField = () => {
    setLabTests([...labTests, ""]);
  };

  const removeLabTestField = (index) => {
    if (labTests.length === 1) return;
    setLabTests(labTests.filter((_, i) => i !== index));
  };

  const handleTextChange = (text, index) => {
    const updatedLabTests = [...labTests];
    updatedLabTests[index] = text;
    setLabTests(updatedLabTests);
  };

  const submitLabProfile = async () => {
    if (!lab.trim()) {
      Alert.alert('Validation Error', 'Please enter Lab Type');
      return;
    }

    const filteredTests = labTests.map(t => t.trim()).filter(t => t !== "");
    if (filteredTests.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one Lab Test');
      return;
    }

    const payload = {
      name: lab,
      tests: filteredTests,
    };

    try {
      setLoading(true);
      const response = await fetchWithAuth(`${BASE_URL}/labs/lab-types/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Lab type submitted successfully');
        setLab('');
        setLabTests(['']);
      } else {
        Alert.alert('Error', data?.message || 'Failed to submit lab type');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <IonIcon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Lab Type</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Introduction */}
          <View style={styles.introContainer}>
            <Text style={styles.introTitle}>Create a Lab Type</Text>
            <Text style={styles.introSubtitle}>
              Enter the lab type and add all relevant tests. You can add or remove tests as needed.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lab Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lab Type Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Pathology Services"
                placeholderTextColor="#999"
                value={lab}
                onChangeText={setLab}
                maxLength={50}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputGroup, { marginBottom: 10 }]}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Lab Tests *</Text>
                <TouchableOpacity 
                  style={styles.addButton} 
                  onPress={addLabTestField}
                  activeOpacity={0.7}
                >
                  <Feather name="plus" size={18} color="#1c78f2" />
                  <Text style={styles.addButtonText}>Add Test</Text>
                </TouchableOpacity>
              </View>
            </View>

            {labTests.map((test, index) => (
              <View key={index} style={styles.testRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={`Test ${index + 1}`}
                  placeholderTextColor="#999"
                  value={test}
                  onChangeText={(text) => handleTextChange(text, index)}
                  maxLength={40}
                />
                {labTests.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeLabTestField(index)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons 
                      name="close-circle" 
                      size={24} 
                      color="#f87171" 
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Fixed Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={submitLabProfile}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Lab Type</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  introContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#333',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e6f0ff',
    borderRadius: 6,
  },
  addButtonText: {
    color: '#1c78f2',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  removeButton: {
    marginLeft: 10,
    padding: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
  submitButton: {
    backgroundColor: '#1c78f2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LabTypes;