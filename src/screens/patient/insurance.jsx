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
import { useNavigation } from "@react-navigation/native";

const Insurance = () => {
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [insuranceList, setInsuranceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();


const handleSave = async () => {
  setLoading(true);

  if (!insuranceNumber || !insuranceProvider) {
    Alert.alert("Validation Error", "Please fill all fields.");
    setLoading(false); // stop loader if validation fails
    return;
  }

  const token = await getToken();
  if (!token) {
    Alert.alert("Error", "Access token not found.");
    setLoading(false); // stop loader if token missing
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
      fetchInsuranceList();
      setShowForm(false);
    } else {
      let errorMessage = "Failed to save insurance policy. Please try again.";

      try {
        const errorData = await response.json();

        const policyError = errorData?.policy_number?.[0]?.toLowerCase();
        const detailError = errorData?.detail?.toLowerCase();

        if (
          policyError?.includes("already exists") ||
          detailError?.includes("already exists")
        ) {
          errorMessage = "This insurance policy already exists.";
        }
      } catch {
        const errorText = await response.text();
        if (errorText.toLowerCase().includes("already exists")) {
          errorMessage = "This insurance policy already exists.";
        }
      }

      Alert.alert("Error", errorMessage);
    }
  } catch (error) {
    Alert.alert("Error", "A network error occurred. Please try again.");
  } finally {
    setLoading(false); // ensure loading is turned off in all cases
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
  <View style={styles.insuranceCard}>
    <View style={styles.cardRow}>
      <Text style={styles.cardLabel}>Policy #:</Text>
      <Text style={styles.cardValue}>{item.policy_number}</Text>
    </View>
    <View style={styles.cardRow}>
      <Text style={styles.cardLabel}>Provider:</Text>
      <Text style={styles.cardValue}>{item.provider}</Text>
    </View>
  </View>
);


  return (
    <View style={styles.container}>
      {/* Header */}
     <View style={styles.headerContainer}>
                   <TouchableOpacity style={styles.backIconContainer} onPress={() => navigation.goBack()}>
                                  <Image
                                    source={require("../assets/UserProfile/back-arrow.png")} // Replace with your back arrow image
                                    style={styles.backIcon}
                                  />
                                </TouchableOpacity>
                   <Text style={styles.title}>Insurance Policy</Text>
                 </View>

     

      {/* Card Content */}
      <View style={styles.card}>
         {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, showForm && styles.activeToggle]}
          onPress={() => setShowForm(true)}
        >
          <Text style={[styles.toggleText, showForm && styles.activeToggleText]}>Add Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !showForm && styles.activeToggle]}
          onPress={() => setShowForm(false)}
        >
          <Text style={[styles.toggleText, !showForm && styles.activeToggleText]}>Saved Policies</Text>
        </TouchableOpacity>
      </View>
        {showForm ? (
          <>
            <Text style={styles.cardTitle}>Fill Out the Information</Text>
            <Text style={styles.cardMessage}>
              Please fill out the form with your insurance details to ensure
              smooth processing of your medical coverage and claims.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Insurance Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter insurance number"
                placeholderTextColor='#888'
                value={insuranceNumber}
                onChangeText={setInsuranceNumber}
              />

              <Text style={styles.label}>Insurance Provider *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter insurance provider"
                 placeholderTextColor='#888'
                value={insuranceProvider}
                onChangeText={setInsuranceProvider}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
              {loading ? (
                                  <ActivityIndicator color="#fff" />
                                ) : (
                                  <Text style={styles.saveButtonText}>save</Text>
                                )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* <Text style={styles.cardTitle}>Saved Insurance Policies</Text> */}
            {loading ? (
              <View style={{ alignItems: 'center', marginTop: 100 }}>
              <ActivityIndicator size="large" color="#1c78f2" />
              <Text style={{ marginTop: 10, fontSize: 14, color: '#1c78f2' }}>
                Loading policies...
              </Text>
            </View>
            ) : insuranceList.length === 0 ? (
              <Text style={styles.cardMessage}>No saved policies found.</Text>
            ) : (
              <FlatList
                data={insuranceList}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderInsuranceItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
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
    backgroundColor: "#1c78f2",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 10,
  },
  backButton: {
    marginRight: 10, // Adds spacing between icon and title
  },
  backIconContainer: {
    width: 30,
    height: 30,
    backgroundColor: "#7EB8F9", // White background
    borderRadius: 20, // Makes it circular
    alignItems: "center",
    justifyContent: "center",
    
  },
  backIcon: {
    width: 18,
    height: 18,
    tintColor: "#fff", // Matches your theme
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 25,
    fontWeight: "bold",
    marginLeft: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    marginTop: 5,
    marginBottom: 10,
    width: "90%",
    justifyContent: "space-around",
  },
  toggleButton: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
    maxWidth: '40%'
  },
  activeToggle: {
    borderBottomWidth: 2,       // Only bottom border
  borderBottomColor: '#1c78f2', // Bottom border color
  borderRadius: 0,
  
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  activeToggleText: {
  color: '#1c78f2', // selected text color
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
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#f1f2f3'
  },
  saveButton: {
    width: "100%",
    backgroundColor: "#1c78f2",
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
  insuranceCard: {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 16,
  marginVertical: 8,
  marginHorizontal: 5,
  shadowColor: '#000',
  shadowRadius: 4,
  elevation: 4, // for Android shadow
  borderLeftWidth: 4,
  borderLeftColor: '#1c78f2', // Accent stripe
},

cardRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 8,
},

cardLabel: {
  fontWeight: '600',
  fontSize: 14,
  color: '#444',
},

cardValue: {
  fontSize: 14,
  color: '#222',
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
