import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
    ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';

const LabTypes = () => {
  const navigation = useNavigation();
  const [lab, setLab] = useState("");
  const [labTests, setLabTests] = useState([""]);
  const [loading, setLoading] = useState(false);

  // Add a new empty test field
  const addLabTestField = () => {
    setLabTests([...labTests, ""]);
  };

  // Remove a test field by index
  const removeLabTestField = (index) => {
    if (labTests.length === 1) return; // Always keep at least one
    setLabTests(labTests.filter((_, i) => i !== index));
  };

  // Update test value
  const handleTextChange = (text, index) => {
    const updatedLabTests = [...labTests];
    updatedLabTests[index] = text;
    setLabTests(updatedLabTests);
  };

  // Submit handler
  const submitLabProfile = async () => {
    const token = await getToken();

    if (!token) {
      Alert.alert('Error', 'Access token not found');
      return;
    }

    if (!lab.trim()) {
      Alert.alert('Error', 'Please enter Lab Type');
      return;
    }

    const filteredTests = labTests.map(t => t.trim()).filter(t => t !== "");
    if (filteredTests.length === 0) {
      Alert.alert('Error', 'Please add at least one Lab Test');
      return;
    }

    const payload = {
      name: lab,
      tests: filteredTests,
    };

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/labs/lab-types/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      Alert.alert('Error', 'Something went wrong');
      console.error('Submission exception:', error);
    } finally{
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.backIconContainer} onPress={() => navigation.goBack()}>
          <Image
            source={require("../assets/UserProfile/back-arrow.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.toolbarText}>Add Lab Type</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoContainer}>
            <Text style={styles.heading}>Create a Lab Type</Text>
            <Text style={styles.subheading}>
              Enter the lab type and add all relevant tests. You can add or remove tests as needed.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Lab Type Name</Text>
            <TextInput
  style={styles.input}
  placeholder="e.g. Pathology Services"
  placeholderTextColor="#A0A4AE"
  value={lab}
  onChangeText={setLab}
  maxLength={50}
/>

            <View style={styles.labelRow}>
              <Text style={styles.label}>Lab Tests</Text>
              <TouchableOpacity style={styles.addBtn} onPress={addLabTestField}>
                <Image source={require('../assets/ambulance/plus.png')} style={styles.plusIcon} />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {labTests.map((test, index) => (
              <View key={index} style={styles.testRow}>
               <TextInput
  style={styles.inputTest}
  placeholder={`Test ${index + 1}`}
  placeholderTextColor="#A0A4AE"
  value={test}
  onChangeText={(text) => handleTextChange(text, index)}
  maxLength={40}
/>
                {labTests.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeLabTestField(index)}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Submit Button fixed at bottom */}
        <View style={styles.footerButtonContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={submitLabProfile} disabled={loading}>
{loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
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
    backgroundColor: "#f8faff",
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 24 : 24,
    paddingHorizontal: 15,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 0,
  },
  backIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: "#6495ED",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  backIcon: {
    width: 16,
    height: 16,
    tintColor: "#fff",
  },
  toolbarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  infoContainer: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 10,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 20,
    width: "92%",
    alignSelf: "center",
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 20,
    // Subtle shadow for both platforms
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 0,
      },
    }),
  },
  label: {
    fontSize: 15,
    color: "#333",
    marginBottom: 7,
    fontWeight: "bold",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 8,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f0ff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  addBtnText: {
    color: "#6495ED",
    fontWeight: "bold",
    marginLeft: 4,
    fontSize: 15,
  },
  plusIcon: {
    width: 18,
    height: 18,
    tintColor: "#6495ED",
  },
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    height: 46,
    borderWidth: 1,
    borderColor: "#d0d7e2",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#f9fafd",
    fontSize: 16,
    marginBottom: 10,
  },
  inputTest: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#d0d7e2",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "#f9fafd",
    fontSize: 15,
  },
  removeBtn: {
    marginLeft: 8,
    backgroundColor: "#ffeaea",
    borderRadius: 8,
    padding: 6,
  },
  removeBtnText: {
    color: "#e74c3c",
    fontWeight: "bold",
    fontSize: 16,
  },
  footerButtonContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: -1 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  loginButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#6495ED",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#6495ED",
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 0,
      },
    }),
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LabTypes;