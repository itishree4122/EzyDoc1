import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  route,
} from "react-native";
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from "@react-navigation/native";
import { BASE_URL } from "../auth/Api";
import { getToken } from "../auth/tokenHelper";
import { Modal, TextInput, FlatList } from "react-native";
import { locations } from "../../constants/locations";
import { useFocusEffect } from "@react-navigation/native"; // for auto-refresh after add
import { fetchWithAuth } from "../auth/fetchWithAuth";

const LabProfile = ({ route }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [labProfile, setLabProfile] = useState(null);
const [labTypes, setLabTypes] = useState([]);
const [labTypesModal, setLabTypesModal] = useState(false);
const [selectedLabTypes, setSelectedLabTypes] = useState([]);
const [patchLoading, setPatchLoading] = useState(false);
const [editField, setEditField] = useState(null); // 'name', 'phone', 'address', 'location'
const [editValue, setEditValue] = useState("");
const [editLoading, setEditLoading] = useState(false);
  const labId = route?.params?.labId;

  // useEffect(() => {
  //   fetchLabProfile();
  // }, []);
const openEditModal = (field, currentValue) => {
  setEditField(field);
  setEditValue(currentValue || "");
};
const patchField = async () => {
  setEditLoading(true);
  try {
    const token = await getToken();
    // const res = await fetch(`${BASE_URL}/labs/lab-profiles/${labProfile.id}/`, {
    const res = await fetchWithAuth(`${BASE_URL}/labs/lab-profiles/${labProfile.id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ [editField]: editValue }),
    });
    if (res.ok) {
      setEditField(null);
      fetchLabProfile();
    } else {
      Alert.alert("Error", "Failed to update field.");
    }
  } catch {
    Alert.alert("Error", "Failed to update field.");
  }
  setEditLoading(false);
};
  const fetchLabTypes = async () => {
  try {
    const token = await getToken();
    // const res = await fetch(`${BASE_URL}/labs/lab-types/`, {
    const res = await fetchWithAuth(`${BASE_URL}/labs/lab-types/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setLabTypes(data);
    }
  } catch {}
};

useEffect(() => {
  fetchLabProfile();
  fetchLabTypes();
}, []);
  const fetchLabProfile = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      // const res = await fetch(`${BASE_URL}/labs/lab-profiles/`, {
      const res = await fetchWithAuth(`${BASE_URL}/labs/lab-profiles/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch lab profile");
      const data = await res.json();
      console.log("Lab profile data:", data);
      console.log("Lab ID from route:", labId);
      console.log("Lab profile user", data[0]?.user);
// Find the lab profile matching the labId
      if(route?.params?.fromAdmin) {
          const profile = data.find(lab => lab.user === labId);
          setLabProfile(profile || null);}else{
      setLabProfile(data[0] || null);

          }

    } catch (err) {
      Alert.alert("Error", "Unable to fetch lab profile.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1c78f2" />
        <Text style={{ color: "#1c78f2", marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  if (!labProfile) {
    return (
      <View style={styles.centered}>
         {/* Back Button */}
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ position: 'absolute', top: 40, left: 20, padding: 6, zIndex: 10 }}
              >
                <Icon name="arrow-left" size={28} color="#1c78f2" />
              </TouchableOpacity>
        {/* <Image
          source={require("../assets/labtests/microscope-cover.png")}
          style={styles.emptyImage}
        /> */}
        <View style={styles.labIconContainer}>
                <MaterialCommunityIcons name="flask-outline" size={64} color="#1c78f2" />
              </View>
        <Text style={styles.emptyText}>No Lab Profile Found</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate("LabRegister", { labId, fromAdmin:route?.params?.fromAdmin })}
        >
          <Text style={styles.createBtnText}>Create Lab Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }
const openLabTypesModal = () => {
  setSelectedLabTypes(labProfile.lab_types_details.map(t => t.id));
  setLabTypesModal(true);
};
const toggleLabType = (id) => {
  setSelectedLabTypes(prev =>
    prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
  );
};
const patchLabTypes = async () => {
  setPatchLoading(true);
  try {
    const token = await getToken();
    // const res = await fetch(`${BASE_URL}/labs/lab-profiles/${labProfile.id}/`, {
    const res = await fetchWithAuth(`${BASE_URL}/labs/lab-profiles/${labProfile.id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lab_types: selectedLabTypes }),
    });
    if (res.ok) {
      setLabTypesModal(false);
      fetchLabProfile();
    } else {
      Alert.alert("Error", "Failed to update lab types.");
    }
  } catch {
    Alert.alert("Error", "Failed to update lab types.");
  }
  setPatchLoading(false);
};
  return (
    <>
    <View style={styles.header}>
                      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-left" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Text style={styles.headerTitle}>Lab Profile</Text>
                    </View>
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, marginLeft: 10 }}>
  {/* <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
    <Icon name="arrow-left" size={28} color="#1c78f2" />
  </TouchableOpacity>
  <Text style={{ fontSize: 20, fontWeight: "bold", color: "#222", marginLeft: 8 }}>
    Lab Profile
  </Text> */}
</View>
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Lab Profile Card */}
      <View style={styles.profileCard}>
  {/* <Image
    source={require("../assets/labtests/microscope-cover.png")}
    style={styles.profileImage}
  /> */}
  <View style={styles.labIconContainer}>
  <MaterialCommunityIcons name="flask-outline" size={64} color="#1c78f2" />
</View>
  <View style={styles.profileFieldRow}>
    <Text style={styles.profileLabel}>Name:</Text>
    <Text style={styles.profileValue}>{labProfile.name}</Text>
    <TouchableOpacity onPress={() => openEditModal("name", labProfile.name)}>
      <Text style={styles.editBtnText}>Edit</Text>
    </TouchableOpacity>
  </View>
  <View style={styles.profileFieldRow}>
    <Text style={styles.profileLabel}>Address:</Text>
    <Text style={styles.profileValue}>{labProfile.address}</Text>
    <TouchableOpacity onPress={() => openEditModal("address", labProfile.address)}>
      <Text style={styles.editBtnText}>Edit</Text>
    </TouchableOpacity>
  </View>
  <View style={styles.profileFieldRow}>
    <Text style={styles.profileLabel}>Phone:</Text>
    <Text style={styles.profileValue}>{labProfile.phone}</Text>
    <TouchableOpacity onPress={() => openEditModal("phone", labProfile.phone)}>
      <Text style={styles.editBtnText}>Edit</Text>
    </TouchableOpacity>
  </View>
  <View style={styles.profileFieldRow}>
    <Text style={styles.profileLabel}>City:</Text>
    <Text style={styles.profileValue}>{labProfile.location || "Not set"}</Text>
    <TouchableOpacity onPress={() => openEditModal("location", labProfile.location)}>
      <Text style={styles.editBtnText}>Edit</Text>
    </TouchableOpacity>
  </View>
  <View style={styles.profileFieldRow}>
  <Text style={styles.profileLabel}>Home Sample:</Text>
  <Text style={styles.profileValue}>
    {labProfile.home_sample_collection ? "Available" : "Not Available"}
  </Text>
  <TouchableOpacity onPress={() => openEditModal("home_sample_collection", labProfile.home_sample_collection)}>
    <Text style={styles.editBtnText}>Edit</Text>
  </TouchableOpacity>
</View>
  {/* {labProfile.home_sample_collection && (
    <Text style={styles.labHomeSample}>Home Sample Collection Available</Text>
  )} */}
</View>
      {/* <View style={styles.profileCard}>
        <Image
          source={require("../assets/labtests/microscope-cover.png")}
          style={styles.profileImage}
        />
        <Text style={styles.labName}>{labProfile.name}</Text>
        <Text style={styles.labAddress}>{labProfile.address}</Text>
        <Text style={styles.labPhone}>Phone: {labProfile.phone}</Text>
        {labProfile.home_sample_collection && (
          <Text style={styles.labHomeSample}>Home Sample Collection Available</Text>
        )}
      </View> */}

      {/* Lab Types Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lab Types</Text>
         <TouchableOpacity
  style={styles.addBtn}
  onPress={openLabTypesModal}
>
  <Text style={styles.addBtnText}>+ Add</Text>
</TouchableOpacity>
        </View>
        {labProfile.lab_types_details && labProfile.lab_types_details.length > 0 ? (
          labProfile.lab_types_details.map((type) => (
            <View key={type.id} style={styles.labTypeRow}>
              <View>
                <Text style={styles.labTypeName}>{type.name}</Text>
                <Text style={styles.labTypeTests}>
                  Tests: {type.tests && type.tests.length > 0 ? type.tests.join(", ") : "None"}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <Text style={styles.noLabTypesText}>No lab types added yet.</Text>
            <TouchableOpacity
              style={styles.addLabTypeBtn}
              onPress={() => navigation.navigate("LabTypes")}
            >
              <Text style={styles.addLabTypeBtnText}>Add Lab Types</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  <Modal visible={labTypesModal} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Select Lab Types</Text>
      <FlatList
        data={labTypes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.multiSelectRow}
            onPress={() => toggleLabType(item.id)}
          >
            <View style={[styles.checkbox, selectedLabTypes.includes(item.id) && styles.checkboxChecked]}>
              {selectedLabTypes.includes(item.id) && <View style={styles.checkboxInner} />}
            </View>
            <Text style={{ marginLeft: 8 }}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      
      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: "#22bb33", marginTop: 20 }]}
        onPress={patchLabTypes}
        disabled={patchLoading}
      >
        <Text style={styles.createBtnText}>{patchLoading ? "Saving..." : "Submit"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: "#888", marginTop: 10 }]}
        onPress={() => setLabTypesModal(false)}
      >
        <Text style={styles.createBtnText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => {
          setLabTypesModal(false);
          navigation.navigate("LabTypes");
        }}
      >
        <Text style={styles.createBtnText}>Create New Lab Type</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
<Modal visible={!!editField} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>
        Edit {editField && editField.charAt(0).toUpperCase() + editField.slice(1).replace("_", " ")}
      </Text>
      {editField === "location" ? (
  <View style={{ maxHeight: 250, width: "100%" }}>
    <FlatList
  data={locations.filter(loc => loc !== "All")}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={{
            padding: 12,
            backgroundColor: editValue === item ? "#e6f0ff" : "#fff",
            borderBottomWidth: 1,
            borderBottomColor: "#f0f0f0",
          }}
          onPress={() => setEditValue(item)}
        >
          <Text style={{ color: "#222", fontSize: 16 }}>{item}</Text>
        </TouchableOpacity>
      )}
      initialNumToRender={15}
    />
  </View>
) : editField === "home_sample_collection" ? (
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 20,
            marginBottom: 20,
          }}
          onPress={() => setEditValue(!editValue)}
        >
          <View
            style={{
              width: 32,
              height: 18,
              borderRadius: 9,
              backgroundColor: editValue ? "#22bb33" : "#ccc",
              justifyContent: "center",
              padding: 2,
              marginRight: 10,
            }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: "#fff",
                alignSelf: editValue ? "flex-end" : "flex-start",
              }}
            />
          </View>
          <Text style={{ fontSize: 16 }}>
            {editValue ? "Available" : "Not Available"}
          </Text>
        </TouchableOpacity>
      ) : (
        <TextInput
          style={styles.input}
          value={editValue}
          onChangeText={setEditValue}
          placeholder={`Enter ${editField}`}
        />
      )}
      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: "#22bb33", marginTop: 10 }]}
        onPress={patchField}
        disabled={editLoading}
      >
        <Text style={styles.createBtnText}>{editLoading ? "Saving..." : "Save"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: "#888", marginTop: 10 }]}
        onPress={() => setEditField(null)}
      >
        <Text style={styles.createBtnText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
</>
  );
  

};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 24,
    backgroundColor: "#F2F2F2",
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1C78F2',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    padding: 24,
  },
  emptyImage: {
    width: 90,
    height: 90,
    marginBottom: 18,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 18,
    color: "#888",
    marginBottom: 18,
    fontWeight: "bold",
  },
  createBtn: {
    backgroundColor: "#1c78f2",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    marginTop: 10,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  profileCard: {
  backgroundColor: "#fff",
  borderRadius: 18,
  padding: 24,
  marginBottom: 28,
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.10,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  // elevation: 6,
},
profileImage: {
  width: 80,
  height: 80,
  borderRadius: 40,
  marginBottom: 18,
  borderWidth: 2,
  borderColor: "#1c78f2",
},
profileFieldRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 12,
  width: "100%",
  justifyContent: "flex-start",
  backgroundColor: "#f7faff",
  borderRadius: 8,
  paddingVertical: 8,
  paddingHorizontal: 12,
},
profileLabel: {
  fontSize: 15,
  color: "#1c78f2",
  fontWeight: "bold",
  width: 70,
},
profileValue: {
  fontSize: 16,
  color: "#222",
  flex: 1,
  fontWeight: "500",
},
  labName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 2,
  },
  labAddress: {
    fontSize: 15,
    color: "#555",
    marginBottom: 2,
  },
  labPhone: {
    fontSize: 14,
    color: "#1c78f2",
    marginBottom: 2,
  },
  editBtnText: {
  color: "#1c78f2",
  fontWeight: "bold",
  marginLeft: 10,
  fontSize: 15,
  paddingVertical: 2,
  paddingHorizontal: 10,
  borderRadius: 6,
  backgroundColor: "#e6f0ff",
},
labHomeSample: {
  fontSize: 13,
  color: "#22bb33",
  marginTop: 10,
  fontWeight: "bold",
  alignSelf: "flex-start",
},
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    // elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  addBtn: {
    backgroundColor: "#e6f0ff",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  addBtnText: {
    color: "#1c78f2",
    fontWeight: "bold",
    fontSize: 15,
  },
  labTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  labTypeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  labTypeTests: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  noLabTypesText: {
    color: "#888",
    fontSize: 14,
    marginBottom: 10,
    fontStyle: "italic",
  },
  addLabTypeBtn: {
    backgroundColor: "#1c78f2",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 6,
  },
  addLabTypeBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.3)",
  justifyContent: "center",
  alignItems: "center",
},
modalContent: {
  backgroundColor: "#fff",
  borderRadius: 12,
  padding: 20,
  width: "85%",
  maxHeight: "80%",
},
modalTitle: {
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 12,
  color: "#222",
},

input: {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  padding: 10,
  marginTop: 10,
  fontSize: 16,
},
multiSelectRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 10,
  paddingHorizontal: 6,
  borderBottomWidth: 1,
  borderBottomColor: "#f0f0f0",
},
checkbox: {
  width: 22,
  height: 22,
  borderRadius: 6,
  borderWidth: 2,
  borderColor: "#1c78f2",
  backgroundColor: "#fff",
  alignItems: "center",
  justifyContent: "center",
},
checkboxChecked: {
  backgroundColor: "#1c78f2",
  borderColor: "#1c78f2",
},
checkboxInner: {
  width: 12,
  height: 12,
  borderRadius: 3,
  backgroundColor: "#fff",
},
labIconContainer: {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: "#e6f0ff",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 18,
  borderWidth: 2,
  borderColor: "#1c78f2",
},
});

export default LabProfile;