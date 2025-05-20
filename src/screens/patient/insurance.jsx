import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { BASE_URL } from "../auth/Api";
import { getToken } from "../auth/tokenHelper";

const Insurance = () => {
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [insuranceList, setInsuranceList] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!insuranceNumber || !insuranceProvider) {
      Alert.alert("Validation Error", "Please fill all fields.");
      return;
    }

    const token = await getToken();
    if (!token) {
      Alert.alert("Error", "Access token not found");
      return;
    }

    const payload = {
      policy_number: insuranceNumber,
      provider: insuranceProvider,
    };

    try {
      const response = await fetch(`${BASE_URL}/patients/insurances/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert("Success", "Insurance policy saved successfully!");
        setInsuranceNumber("");
        setInsuranceProvider("");
        fetchInsuranceList(); // refresh the list
        setShowForm(false);  // switch to saved policies view
      } else {
        const errorText = await response.text();
        console.error("Save failed response:", errorText);
        Alert.alert("Error", `Failed to save insurance policy:\n${errorText}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "An error occurred while saving insurance.");
    }
  };

  const fetchInsuranceList = async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) {
      Alert.alert("Error", "Access token not found");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/patients/insurances/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInsuranceList(data);
      } else {
        Alert.alert("Error", "Failed to fetch insurance data.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Error", "An error occurred while fetching insurance data.");
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!showForm) {
      fetchInsuranceList();
    }
  }, [showForm]);

  const renderInsuranceItem = ({ item }) => (
    <View style={styles.insuranceItem}>
      <Text style={styles.itemText}>
        <Text style={styles.policyLabel}>Policy #:</Text> {item.provider}
      </Text>
      <Text style={styles.itemText}>
        <Text style={styles.policyLabel}>Provider:</Text> {item.policy_number}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Image
          source={require("../assets/UserProfile/insurance1.png")}
          style={styles.leftImage}
        />
        <Text style={styles.title}>Insurance Policy</Text>
      </View>

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, showForm && styles.activeToggle]}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.toggleText}>Add Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !showForm && styles.activeToggle]}
          onPress={() => setShowForm(false)}
        >
          <Text style={styles.toggleText}>Saved Policies</Text>
        </TouchableOpacity>
      </View>

      {/* Card Content */}
      <View style={styles.card}>
        {showForm ? (
          <>
            <Text style={styles.cardTitle}>Fill Out the Information</Text>
            <Text style={styles.cardMessage}>
              Please fill out the form with your insurance details to ensure
              smooth processing of your medical coverage and claims.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Insurance Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter insurance number"
                value={insuranceNumber}
                onChangeText={setInsuranceNumber}
              />

              <Text style={styles.label}>Insurance Provider</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter insurance provider"
                value={insuranceProvider}
                onChangeText={setInsuranceProvider}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.cardTitle}>Saved Insurance Policies</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#6495ED" style={{ marginTop: 20 }} />
            ) : insuranceList.length === 0 ? (
              <Text style={styles.cardMessage}>No saved policies found.</Text>
            ) : (
              <FlatList
                data={insuranceList}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderInsuranceItem}
                contentContainerStyle={{ paddingBottom: 100 }}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6495ED",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 10,
  },
  leftImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 25,
    fontWeight: "bold",
  },
  toggleContainer: {
    flexDirection: "row",
    marginTop: 20,
    width: "90%",
    justifyContent: "space-around",
  },
  toggleButton: {
    flex: 1,
    backgroundColor: "#eee",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  activeToggle: {
    backgroundColor: "#fff",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  card: {
    flexGrow: 1,
    width: "100%",
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 20,
    elevation: 5,
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  cardMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  saveButton: {
    width: "100%",
    backgroundColor: "#6495ED",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  insuranceItem: {
    backgroundColor: "#f0f8ff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemText: {
    color: "#333",
    fontSize: 14,
  },
  policyLabel: {
    fontWeight: "bold",
  },
});

export default Insurance;
