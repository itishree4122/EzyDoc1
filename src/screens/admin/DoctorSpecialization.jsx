import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import MCIcon from "react-native-vector-icons/MaterialCommunityIcons";
import { BASE_URL } from "../auth/Api";
import { fetchWithAuth } from "../auth/fetchWithAuth";
import Header from "../../components/Header";
const DoctorSpecialization = () => {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSpec, setCurrentSpec] = useState(null);
  const [specInput, setSpecInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");


  useEffect(() => {
    fetchSpecializations();
  }, []);

  const fetchSpecializations = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${BASE_URL}/doctor/doctor-specialist/`);
      if (!response.ok) throw new Error("Failed to fetch specializations");
      const data = await response.json();
      setSpecializations(data);
    } catch (error) {
      Alert.alert("Error", "Unable to fetch specializations");
    } finally {
      setLoading(false);
    }
  };
const filteredSpecializations = specializations.filter((item) =>
  item.name.toLowerCase().includes(searchQuery.toLowerCase())
);

  const handleAdd = () => {
    setEditMode(false);
    setSpecInput("");
    setModalVisible(true);
  };

  const handleEdit = (item) => {
    setEditMode(true);
    setCurrentSpec(item);
    setSpecInput(item.name);
    setModalVisible(true);
  };

  const handleDelete = async (item) => {
    Alert.alert(
      "Delete Specialization",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);
              const response = await fetchWithAuth(
                `${BASE_URL}/doctor/doctor-specialist/${item.id}/`,
                { method: "DELETE" }
              );
              if (!response.ok) throw new Error("Delete failed");
              setSpecializations((prev) => prev.filter((s) => s.id !== item.id));
              Alert.alert("Deleted", `"${item.name}" has been deleted.`);
            } catch (error) {
              Alert.alert("Error", "Failed to delete specialization");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!specInput.trim()) {
      Alert.alert("Validation", "Specialization name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      if (editMode && currentSpec) {
        // PATCH
        const response = await fetchWithAuth(
          `${BASE_URL}/doctor/doctor-specialist/${currentSpec.id}/`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: capitalize(specInput.trim()) }),
          }
        );
        if (!response.ok) throw new Error("Update failed");
        setSpecializations((prev) =>
          prev.map((s) =>
            s.id === currentSpec.id ? { ...s, name: specInput.trim() } : s
          )
        );
        Alert.alert("Updated", "Specialization updated successfully.");
      } else {
        // ADD
        const response = await fetchWithAuth(
          `${BASE_URL}/doctor/doctor-specialist/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: capitalize(specInput.trim()) }),
          }
        );
        if (!response.ok) throw new Error("Add failed");
        const data = await response.json();
        setSpecializations((prev) => [...prev, data]);
        Alert.alert("Added", "Specialization added successfully.");
      }
      setModalVisible(false);
      setSpecInput("");
      setCurrentSpec(null);
    } catch (error) {
      Alert.alert("Error", editMode ? "Failed to update" : "Failed to add");
    } finally {
      setSaving(false);
    }
  };
  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

 const renderPill = ({ item }) => (
    <View style={styles.pillContainer}>
      <View style={styles.pill}>
        <View style={styles.pillLeft}>
          <MCIcon name="stethoscope" size={22} color="#1c78f2" style={{ marginRight: 12 }} />
          <Text style={styles.pillText}>{item.name}</Text>
        </View>
        <View style={styles.pillActions}>
          <TouchableOpacity
            style={styles.pillAction}
            onPress={() => handleEdit(item)}
            activeOpacity={0.7}
          >
            <Icon name="edit" size={22} color="#1c78f2" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pillAction}
            onPress={() => handleDelete(item)}
            activeOpacity={0.7}
          >
            <Icon name="delete" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Header title="Doctor Specializations" />
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAdd}
        activeOpacity={0.8}
      >
        <Icon name="add-circle" size={28} color="#1c78f2" />
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
      <View style={styles.listContainer}>
        <TextInput
  style={styles.searchInput}
  placeholder="Search specializations..."
  placeholderTextColor="#888"
  value={searchQuery}
  onChangeText={setSearchQuery}
/>

        {loading ? (
          <ActivityIndicator size="large" color="#1c78f2" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            // data={specializations}
            data={filteredSpecializations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPill}
            contentContainerStyle={styles.pillList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No specializations found.</Text>
            }
          />
        )}
      </View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editMode ? "Edit Specialization" : "Add Specialization"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter specialization name"
              placeholderTextColor="#888"
              value={specInput}
              onChangeText={setSpecInput}
              autoCapitalize="words"
              editable={!saving}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#1c78f2" }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>
                    {editMode ? "Update" : "Add"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1c78f2",
    letterSpacing: 0.5,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e7ff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: 120,
    marginTop: 12,
    marginLeft: 16,
    
  },
  addButtonText: {
    color: "#1c78f2",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 6,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  pillList: {
    paddingBottom: 40,
  },
  pillContainer: {
    marginVertical: 8,
    marginHorizontal: 0,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 16,
    shadowColor: "#1c78f2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    // elevation: 3,
    marginHorizontal: 4,
    justifyContent: "space-between",
  },
  pillLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pillText: {
    fontSize: 17,
    color: "#22223b",
    fontWeight: "600",
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  pillActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    gap: 10,
  },
  pillAction: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    fontSize: 16,
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1c78f2",
    marginBottom: 18,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#22223b",
    backgroundColor: "#f9fafb",
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginLeft: 10,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  searchInput: {
  borderWidth: 1,
  borderColor: "#e5e7eb",
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingVertical: 10,
  fontSize: 16,
  color: "#22223b",
  backgroundColor: "#f9fafb",
  marginBottom: 12,
},

});

export default DoctorSpecialization;