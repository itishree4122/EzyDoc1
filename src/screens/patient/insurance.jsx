import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView
} from "react-native";
import { BASE_URL } from "../auth/Api";
import { getToken } from "../auth/tokenHelper";
import { useNavigation } from "@react-navigation/native";
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Header from "../../components/Header";
import Icon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';

const Insurance = () => {
  const [insuranceNumber, setInsuranceNumber] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [insuranceList, setInsuranceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPolicyId, setCurrentPolicyId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  const resetForm = () => {
    setInsuranceNumber("");
    setInsuranceProvider("");
    setEditMode(false);
    setCurrentPolicyId(null);
  };

  const handleSave = async () => {
    setLoading(true);

    if (!insuranceNumber || !insuranceProvider) {
      Alert.alert("Validation Error", "Please fill all fields.");
      setLoading(false);
      return;
    }

    const token = await getToken();
    if (!token) {
      Alert.alert("Error", "Authentication required.");
      setLoading(false);
      return;
    }

    const payload = {
      policy_number: insuranceNumber,
      provider: insuranceProvider,
    };

    try {
      let response;
      if (editMode) {
        response = await fetchWithAuth(`${BASE_URL}/patients/insurances/${currentPolicyId}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetchWithAuth(`${BASE_URL}/patients/insurances/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        Alert.alert("Success", `Insurance policy ${editMode ? 'updated' : 'saved'} successfully!`);
        resetForm();
        fetchInsuranceList();
        setShowForm(false);
      } else {
        let errorMessage = `Failed to ${editMode ? 'update' : 'save'} insurance policy.`;
        const errorData = await response.json();
        
        if (errorData?.policy_number?.includes("already exists") || 
            errorData?.detail?.includes("already exists")) {
          errorMessage = "This insurance policy already exists.";
        }
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      Alert.alert("Error", "A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setModalVisible(false);
    setLoading(true);
    const token = await getToken();
    
    try {
      const response = await fetchWithAuth(`${BASE_URL}/patients/insurances/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert("Success", "Insurance policy deleted successfully!");
        fetchInsuranceList();
      } else {
        throw new Error("Failed to delete policy");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to delete insurance policy.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInsuranceList = async () => {
    setLoading(true);
    const token = await getToken();
    
    try {
      const response = await fetchWithAuth(`${BASE_URL}/patients/insurances/`, {
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
      Alert.alert("Error", "An error occurred while fetching insurance data.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (policy) => {
    setInsuranceNumber(policy.policy_number);
    setInsuranceProvider(policy.provider);
    setCurrentPolicyId(policy.id);
    setEditMode(true);
    setShowForm(true);
  };

  useEffect(() => {
    if (!showForm) {
      fetchInsuranceList();
    }
  }, [showForm]);

  const renderInsuranceItem = ({ item }) => (
    <View style={styles.insuranceCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Icon name="verified-user" size={20} color="#4a8fe7" />
          <Text style={styles.providerText}>{item.provider}</Text>
        </View>
        
        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Policy Number:</Text>
          <Text style={styles.policyValue}>{item.policy_number}</Text>
        </View>
        
        <Text style={styles.dateText}>
          Added: {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEdit(item)}
        >
          <Icon name="edit" size={18} color="#4a8fe7" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => {
            setCurrentPolicyId(item.id);
            setModalVisible(true);
          }}
        >
          <Icon name="delete" size={18} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Insurance Policies" />
      
      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, showForm && styles.activeToggle]}
          onPress={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Text style={[styles.toggleText, showForm && styles.activeToggleText]}>
            {editMode ? 'Edit Policy' : 'Add Policy'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !showForm && styles.activeToggle]}
          onPress={() => setShowForm(false)}
        >
          <Text style={[styles.toggleText, !showForm && styles.activeToggleText]}>
            My Policies
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.card}>
        {showForm ? (
          <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={styles.sectionTitle}>
              {editMode ? 'Update Insurance Policy' : 'Add New Insurance Policy'}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Insurance Provider</Text>
              <View style={styles.inputWrapper}>
                <Icon name="business" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. LIC, UnitedHealth, etc."
                  placeholderTextColor="#888"
                  value={insuranceProvider}
                  onChangeText={setInsuranceProvider}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Policy Number</Text>
              <View style={styles.inputWrapper}>
                <Icon name="credit-card" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your policy number"
                  placeholderTextColor="#888"
                  value={insuranceNumber}
                  onChangeText={setInsuranceNumber}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.saveButtonText}>
                    {editMode ? 'Update Policy' : 'Save Policy'}
                  </Text>
                  <Icon name="check-circle" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
            
            {editMode && (
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4a8fe7" />
                <Text style={styles.loadingText}>Loading your policies...</Text>
              </View>
            ) : insuranceList.length === 0 ? (
              <View style={styles.emptyState}>
                <IonIcon name="folder-open" size={50} color="#ccc" />
                <Text style={styles.emptyStateText}>No insurance policies found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add your first insurance policy to get started
                </Text>
              </View>
            ) : (
              <FlatList
                data={insuranceList}
                keyExtractor={(item) => item.id}
                renderItem={renderInsuranceItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delete Policy</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this insurance policy? This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalDeleteButton}
                onPress={() => handleDelete(currentPolicyId)}
              >
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
    marginBottom: 5,
  },
  toggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  activeToggle: {
    backgroundColor: "#e6f0ff",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeToggleText: {
    color: "#4a8fe7",
    fontWeight: "600",
  },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    marginTop: 10,
  },
  formContainer: {
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 25,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 8,
    marginLeft: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#333",
    fontSize: 15,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4a8fe7",
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    shadowColor: "#4a8fe7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 10,
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    marginTop: 15,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "500",
  },
  insuranceCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    // elevation: 10,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    borderLeftColor: "#4a8fe7",
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  providerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  policyRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  policyLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 5,
  },
  policyValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  dateText: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: "row",
    marginLeft: 10,
  },
  editButton: {
    padding: 8,
    marginRight: 5,
  },
  deleteButton: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#4a8fe7",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 15,
    fontWeight: "500",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    width: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  modalText: {
    fontSize: 15,
    color: "#555",
    marginBottom: 25,
    textAlign: "center",
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#333",
    fontWeight: "500",
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  modalDeleteText: {
    color: "#fff",
    fontWeight: "500",
  },
});

export default Insurance;