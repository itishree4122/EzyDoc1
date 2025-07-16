import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { BASE_URL } from "../auth/Api";
import { fetchWithAuth } from "../auth/fetchWithAuth";
import { getToken } from "../auth/tokenHelper";
import Header from "../../components/Header";

// Updated color scheme
const PRIMARY = "#4361ee";
const BG = "#f8f9fa";
const CARD_BG = "#ffffff";
const BORDER = "#e9ecef";
const TEXT = "#212529";
const SUBTEXT = "#6c757d";
const SUCCESS = "#2a9d8f";
const DANGER = "#e63946";
const ACCENT = "#f1f8fe";
const HIGHLIGHT = "#e6f2ff";
const WARNING = "#f4a261";

const AdminCostingScreen = () => {
  // Configs
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Entities
  const [entityType, setEntityType] = useState("doctor");
  const [entities, setEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
     const [viewDetails, setViewDetails] = useState(null);

  const [form, setForm] = useState({
    id: null,
    entity: null,
    entity_type: "doctor",
    costing_type: "per_patient",
    per_patient_amount: "",
    fixed_amount: "",
    period: "monthly",
    effective_from: "",
    notes: "",
  });
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsStart, setAnalyticsStart] = useState("");
  const [analyticsEnd, setAnalyticsEnd] = useState("");
  const [analyticsDatePicker, setAnalyticsDatePicker] = useState({ show: false, field: null });

  // Fetch all data
  const fetchData = async () => {
    await Promise.all([
      fetchConfigs(),
      fetchEntities(),
      fetchAllAnalytics(),
    ]);
  };

  // Fetch configs
  const fetchConfigs = async () => {
    try {
      const token = await getToken();
      const res = await fetchWithAuth(`${BASE_URL}/admin-analytics/costing-configs/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load configurations");
      setConfigs([]);
    }finally {
    setLoading(false);
  }
  };
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};
  // Fetch entities (doctors/labs)
  const fetchEntities = async (type = entityType) => {
    try {
      const token = await getToken();
      let url =
        type === "doctor"
          ? `${BASE_URL}/users/admin/list-users/?role=doctor`
          : `${BASE_URL}/users/admin/list-users/?role=lab`;
      const res = await fetchWithAuth(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntities(
          data.map((e) => ({
            label: e.first_name
              ? `${e.first_name} ${e.last_name || ""}`.trim()
              : e.lab_profile || e.email,
            value: e.user_id,
            entity: e,
          }))
        );
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load entities");
      setEntities([]);
    }
  };

  // Fetch all analytics by default
  const fetchAllAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const token = await getToken();
      const url = `${BASE_URL}/admin-analytics/costing-analytics/`;
      const res = await fetchWithAuth(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load analytics");
      setAnalytics([]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchEntities(entityType);
    setSelectedEntity(null);
  }, [entityType]);

  // Add/Edit Config
  const openAddModal = () => {
    setForm({
      id: null,
      entity: null,
      entity_type: 'doctor',
      costing_type: "per_patient",
      per_patient_amount: "",
      fixed_amount: "",
      period: "monthly",
      effective_from: "",
      notes: "",
    });
    setEditMode(false);
    setModalVisible(true);
  };

  const openEditModal = async (config) => {
      await fetchEntities(config.entity_type);
    setForm({
      id: config.id,
      entity: config.entity,
      entity_type: config.entity_type,
      costing_type: config.costing_type,
      per_patient_amount: config.per_patient_amount || "",
      fixed_amount: config.fixed_amount || "",
      period: config.period,
      effective_from: config.effective_from,
      notes: config.notes || "",
    });
    setEditMode(true);
    setModalVisible(true);
  };

  // Save config (add or edit)
  const handleSaveConfig = async () => {
    if (!form.entity) {
      Alert.alert("Required Field", "Please select an entity");
      return;
    }
    if (!form.effective_from) {
      Alert.alert("Required Field", "Please select effective from date");
      return;
    }
    if (
      form.costing_type === "per_patient" &&
      (!form.per_patient_amount || isNaN(Number(form.per_patient_amount)))
    ) {
      Alert.alert("Validation", "Please enter a valid per patient amount");
      return;
    }
    if (
      form.costing_type === "fixed" &&
      (!form.fixed_amount || isNaN(Number(form.fixed_amount)))
    ) {
      Alert.alert("Validation", "Please enter a valid fixed amount");
      return;
    }

    try {
      const token = await getToken();
      if (editMode) {
        // End the previous config
        await fetchWithAuth(
          `${BASE_URL}/admin-analytics/costing-configs/${form.id}/`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              effective_to: new Date().toISOString().slice(0, 10),
            }),
          }
        );
        
      }
      // Create new config
      const res = await fetchWithAuth(
        `${BASE_URL}/admin-analytics/costing-configs/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entity: form.entity,
            entity_type: form.entity_type,
            costing_type: form.costing_type,
            per_patient_amount:
              form.costing_type === "per_patient"
                ? form.per_patient_amount
                : null,
            fixed_amount:
              form.costing_type === "fixed" ? form.fixed_amount : null,
            period: form.costing_type === "fixed" ? form.period : null,
            effective_from: form.effective_from,
            notes: form.notes,
          }),
        }
      );
      console.log("Config save response:", res);
      console.log("Config save body:", JSON.stringify({
            entity: form.entity,
            entity_type: form.entity_type,
            costing_type: form.costing_type,
            per_patient_amount:
              form.costing_type === "per_patient"
                ? form.per_patient_amount
                : null,
            fixed_amount:
              form.costing_type === "fixed" ? form.fixed_amount : null,
            period: form.costing_type === "fixed" ? form.period : null,
            effective_from: form.effective_from,
            notes: form.notes,
          }))
    //   if (!res.ok) throw new Error("Failed to save configuration");
    //   setModalVisible(false);
    //   fetchConfigs();
    //   Alert.alert("Success", editMode ? "Configuration updated successfully" : "Configuration added successfully");
    // } 
    // catch (e) {
    //   Alert.alert("Error", e.message || "Failed to save configuration");
    // }
     if (!res.ok) {
  let errorMsg = "Failed to save configuration";
  try {
    const data = await res.json();
    // Django REST Framework usually returns {field: [errors]} or {detail: "..."}
    if (typeof data === "object") {
      if (data.detail) {
        errorMsg = data.detail;
      } else if (data.non_field_errors) {
        // Show only the message(s) for non_field_errors
        errorMsg = Array.isArray(data.non_field_errors)
          ? data.non_field_errors.join("\n")
          : data.non_field_errors;
      } else {
        // Collect all field errors except non_field_errors
        errorMsg = Object.entries(data)
          .filter(([field]) => field !== "non_field_errors")
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join("\n");
      }
    }
  } catch {
    // If not JSON, try text
    try {
      errorMsg = await res.text();
    } catch {
      // fallback to default
    }
  }
  Alert.alert("Error", errorMsg);
  return;
}
    setModalVisible(false);
    fetchConfigs();
    Alert.alert("Success", editMode ? "Configuration updated successfully" : "Configuration added successfully");
  } catch (e) {
    Alert.alert("Error", e.message || "Failed to save configuration");
  }
  };

  // Delete config
  const handleDeleteConfig = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this configuration?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getToken();
              await fetchWithAuth(
                `${BASE_URL}/admin-analytics/costing-configs/${id}/`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              fetchConfigs();
              Alert.alert("Success", "Configuration deleted successfully");
            } catch (e) {
              Alert.alert("Error", e.message || "Failed to delete configuration");
            }
          },
        },
      ]
    );
  };

  // Analytics fetch (filtered)
  const handleFetchAnalytics = async () => {
    // If no filters, show all
    if (!analyticsStart && !analyticsEnd && !selectedEntity && !entityType) {
      fetchAllAnalytics();
      return;
    }
    if ((analyticsStart && !analyticsEnd) || (!analyticsStart && analyticsEnd)) {
      Alert.alert("Validation", "Please select both start and end dates");
      return;
    }
    setAnalyticsLoading(true);
    try {
      const token = await getToken();
      let url = `${BASE_URL}/admin-analytics/costing-analytics/?`;
      if (analyticsStart && analyticsEnd) {
        url += `start_date=${analyticsStart}&end_date=${analyticsEnd}&`;
      }
      if (entityType) url += `entity_type=${entityType}&`;
      if (selectedEntity) url += `entity_id=${selectedEntity}&`;
      const res = await fetchWithAuth(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
            console.log("Analytics URL:", url);

      if (res.ok) {
        const data = await res.json();
        console.log("Filtered analytics data:", data);
        setAnalytics(data);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load filtered analytics");
      setAnalytics([]);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Date pickers
  const showDatePicker = (field) => setDatePickerVisible(field);
  const hideDatePicker = () => setDatePickerVisible(false);

  const handleDatePicked = (date) => {
    setForm((f) => ({
      ...f,
      effective_from: date.toISOString().slice(0, 10),
    }));
    hideDatePicker();
  };

  const handleAnalyticsDatePicked = (date) => {
    if (analyticsDatePicker.field === "start") {
      setAnalyticsStart(date.toISOString().slice(0, 10));
    } else {
      setAnalyticsEnd(date.toISOString().slice(0, 10));
    }
    setAnalyticsDatePicker({ show: false, field: null });
  };

  // Clear filters
  const clearFilters = () => {
    setAnalyticsStart("");
    setAnalyticsEnd("");
    setSelectedEntity(null);
    fetchAllAnalytics();
  };

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  // Render config row
 const renderConfig = ({ item }) => {
  const isEnded = !!item.effective_to;

  const CardContent = (
    <View style={{ flex: 1 }}>
      <View style={styles.configHeader}>
        <Icon
          name={item.entity_type === "doctor" ? "account-tie" : "flask"}
          size={20}
          color={PRIMARY}
          style={styles.entityIcon}
        />
        <View>
          <Text style={styles.configTitle}>{item.entity_name}</Text>
          <Text style={styles.configType}>
            {item.entity_type.charAt(0).toUpperCase() + item.entity_type.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.configDetails}>
        <View style={styles.configRow}>
          <Icon
            name={item.costing_type === "per_patient" ? "account-multiple" : "cash"}
            size={18}
            color={SUCCESS}
          />
          <Text style={styles.configDetail}>
            {item.costing_type === "per_patient"
              ? ` Per Patient: ₹${item.per_patient_amount}`
              : ` Fixed: ₹${item.fixed_amount}`}
            {item.costing_type === "fixed" ? ` (${capitalize(item.period)})` : ""}
          </Text>
        </View>

        <View style={styles.configRow}>
          <Icon name="calendar-range" size={16} color={WARNING} />
          <Text style={styles.configDates}>
            {formatDate(item.effective_from)} <Icon name="arrow-right" size={12} color={SUBTEXT} /> {formatDate(item.effective_to) || "Present"}
          </Text>
        </View>

        {item.notes ? (
          <View style={styles.configRow}>
            <Icon name="note-text" size={16} color={SUBTEXT} />
            <Text style={styles.configNotes}>{item.notes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  // For ended configs, show details and Delete button
  if (isEnded) {
    return (
      <TouchableOpacity
        style={styles.configCard}
        onPress={() => setViewDetails(item)}
        activeOpacity={0.8}
      >
        {CardContent}
        <View style={styles.configActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDeleteConfig(item.id)}
          >
            <Icon name="delete" size={18} color={DANGER} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // For active configs, allow edit/delete
  return (
    <TouchableOpacity
      style={styles.configCard}
      onPress={() => openEditModal(item)}
    >
      {CardContent}
      <View style={styles.configActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => openEditModal(item)}
        >
          {/* <Icon name="pencil" size={18} color={PRIMARY} /> */}
            <Icon name="calendar-remove" size={18} color={PRIMARY} />

        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDeleteConfig(item.id)}
        >
          <Icon name="delete" size={18} color={DANGER} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
  // Render analytics row
  const renderAnalytics = ({ item }) => (
    <View style={styles.analyticsCard}>
      <View style={styles.analyticsHeader}>
        <Icon 
          name={item.entity_type === "doctor" ? "account-tie" : "flask"} 
          size={22} 
          color={PRIMARY} 
          style={styles.entityIcon}
        />
        <View>
          <Text style={styles.analyticsTitle}>{item.entity_name}</Text>
          <Text style={styles.analyticsType}>
            {item.entity_type.charAt(0).toUpperCase() + item.entity_type.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.analyticsDetails}>
        <View style={styles.analyticsRow}>
          <Icon 
            name={item.costing_type === "per_patient" ? "account-multiple" : "cash"} 
            size={18} 
            color={SUCCESS} 
          />
          <Text style={styles.analyticsDetail}>
            {item.costing_type === "per_patient"
              ? ` Per Patient: ₹${item.per_patient_amount}`
              : ` Fixed: ₹${item.fixed_amount}`}
            {item.costing_type === "fixed" ? ` (${capitalize(item.period)})` : ""}
          </Text>
        </View>
        
        <View style={styles.analyticsRow}>
          <Icon name="calendar-range" size={16} color={WARNING} />
          <Text style={styles.analyticsDates}>
            {formatDate(item.effective_from)} <Icon name="arrow-right" size={12} color={SUBTEXT} /> {formatDate(item.effective_to) || "Present"}
          </Text>
        </View>
        
        <View style={styles.analyticsStats}>
          <View style={styles.statItem}>
            <Icon name="calendar-check" size={16} color={PRIMARY} />
            <Text style={styles.statText}>
              Appointments:
            </Text>
            <Text style={styles.statText}>
              {/* Appointments: <Text style={styles.statValue}>{item.total_appointments}</Text> */}
              <Text style={styles.statValue}>{item.total_appointments || 0}</Text>
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Icon name="currency-inr" size={18} color={SUCCESS} />
            <Text style={styles.statText}>
              Income:
            </Text>
            <Text style={styles.statText}>
              {/* Income: <Text style={[styles.statValue, { color: SUCCESS }]}>₹{item.admin_income}</Text> */}
              <Text style={[styles.statValue, { color: SUCCESS }]}>₹{item.admin_income}</Text>
            </Text>
          </View>
        </View>
        
        {item.notes ? (
          <View style={styles.analyticsRow}>
            <Icon name="note-text" size={16} color={SUBTEXT} />
            <Text style={styles.analyticsNotes}>{item.notes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  // Split configs into active and ended
  const activeConfigs = configs.filter((c) => !c.effective_to);
  const endedConfigs = configs.filter((c) => c.effective_to);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY]}
            tintColor={PRIMARY}
          />
        }
      >
        <Header title="Costing & Analytics" />
        
        {/* Analytics Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderContainer}>
            <Icon name="chart-bar" size={24} color={PRIMARY} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Income Analytics</Text>
          </View>
          
          <View style={styles.filterContainer}>
            <Text style={styles.filterTitle}>Filter Analytics</Text>
            
            <View style={styles.filterRow}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Entity Type</Text>
                <View style={styles.pickerContainer}>
                  <RNPickerSelect
                    value={entityType}
                    onValueChange={(v) => setEntityType(v)}
                    items={[
                      { label: "Doctor", value: "doctor" },
                      { label: "Lab", value: "lab" },
                    ]}
                    style={pickerSelectStyles}
                    useNativeAndroidPickerStyle={false}
                    Icon={() => <Icon name="chevron-down" size={20} color={SUBTEXT} />}
                  />
                </View>
              </View>
              
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Entity</Text>
                <View style={styles.pickerContainer}>
                  <RNPickerSelect
                    value={selectedEntity}
                    onValueChange={(v) => setSelectedEntity(v)}
                    items={entities}
                    style={pickerSelectStyles}
                    placeholder={{ label: "All Entities", value: null }}
                    useNativeAndroidPickerStyle={false}
                    Icon={() => <Icon name="chevron-down" size={20} color={SUBTEXT} />}
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.filterRow}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setAnalyticsDatePicker({ show: true, field: "start" })}
                >
                  <Icon name="calendar" size={18} color={SUBTEXT} style={styles.dateIcon} />
                  <Text style={styles.dateText}>
                    {formatDate(analyticsStart) || "Select start date"}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setAnalyticsDatePicker({ show: true, field: "end" })}
                >
                  <Icon name="calendar" size={18} color={SUBTEXT} style={styles.dateIcon} />
                  <Text style={styles.dateText}>
                    {formatDate(analyticsEnd) || "Select end date"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.filterButton, styles.secondaryButton]}
                onPress={clearFilters}
              >
                <Icon name="close" size={18} color={DANGER} />
                <Text style={[styles.filterButtonText, { color: DANGER }]}>Clear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterButton, styles.primaryButton]}
                onPress={handleFetchAnalytics}
              >
                <Icon name="magnify" size={18} color="#fff" />
                <Text style={[styles.filterButtonText, { color: "#fff" }]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {analyticsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={styles.loadingText}>Loading analytics...</Text>
            </View>
          ) : (
            <FlatList
              data={analytics}
              keyExtractor={(_, i) => i.toString()}
              renderItem={renderAnalytics}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="database-remove" size={40} color={SUBTEXT} />
                  <Text style={styles.emptyText}>No analytics data found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                </View>
              }
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
        
        {/* Configs List */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderContainer}>
            <Icon name="cog" size={24} color={PRIMARY} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Costing Configurations</Text>
            <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add New</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subsectionTitle}>Active Configurations</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={styles.loadingText}>Loading configurations...</Text>
            </View>
          ) : (
            <FlatList
              data={activeConfigs}
              keyExtractor={(item) => item.id?.toString()}
              renderItem={renderConfig}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="alert-circle" size={40} color={SUBTEXT} />
                  <Text style={styles.emptyText}>No active configurations</Text>
                  <Text style={styles.emptySubtext}>Add a new configuration to get started</Text>
                </View>
              }
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
          
          <Text style={styles.subsectionTitle}>Historical Configurations</Text>
          <FlatList
            data={endedConfigs}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={renderConfig}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="history" size={40} color={SUBTEXT} />
                <Text style={styles.emptyText}>No historical configurations</Text>
              </View>
            }
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          />
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      
<Modal
  visible={modalVisible}
  animationType="slide"
  transparent
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editMode ? "End Configuration" : "Add New Configuration"}
          </Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setModalVisible(false)}
          >
            <Icon name="close" size={24} color={SUBTEXT} />
          </TouchableOpacity>
        </View>

        {editMode ? (
          // READ-ONLY DETAILS + END BUTTON
          <View style={styles.detailsSection}>
            <Text style={styles.detailsLabel}>Entity Type</Text>
            <Text style={styles.detailsValue}>
              {form.entity_type === "doctor" ? "Doctor" : "Lab"}
            </Text>
            <Text style={styles.detailsLabel}>Entity</Text>
            <Text style={styles.detailsValue}>
              {entities.find(e => e.value === form.entity)?.label || ""}
            </Text>
            <Text style={styles.detailsLabel}>Costing Type</Text>
            <Text style={styles.detailsValue}>
              {form.costing_type === "per_patient" ? "Per Patient" : "Fixed"}
            </Text>
            {form.costing_type === "per_patient" ? (
              <>
                <Text style={styles.detailsLabel}>Per Patient Amount (₹)</Text>
                <Text style={styles.detailsValue}>{form.per_patient_amount}</Text>
              </>
            ) : (
              <>
                <Text style={styles.detailsLabel}>Fixed Amount (₹)</Text>
                <Text style={styles.detailsValue}>{form.fixed_amount}</Text>
                <Text style={styles.detailsLabel}>Billing Period</Text>
                <Text style={styles.detailsValue}>{form.period}</Text>
              </>
            )}
            <Text style={styles.detailsLabel}>Effective From</Text>
            <Text style={styles.detailsValue}>{formatDate(form.effective_from)}</Text>
            {form.notes ? (
              <>
                <Text style={styles.detailsLabel}>Notes</Text>
                <Text style={styles.detailsValue}>{form.notes}</Text>
              </>
            ) : null}
            <View style={styles.modalButtons}>
              {/* <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity> */}
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={async () => {
                  try {
                    const token = await getToken();
                    await fetchWithAuth(
                      `${BASE_URL}/admin-analytics/costing-configs/${form.id}/`,
                      {
                        method: "PATCH",
                        headers: {
                          Authorization: `Bearer ${token}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          effective_to: new Date().toISOString().slice(0, 10),
                        }),
                      }
                    );
                    setModalVisible(false);
                    fetchConfigs();
                    Alert.alert("Success", "Configuration ended successfully");
                  } catch (e) {
                    Alert.alert("Error", e.message || "Failed to end configuration");
                  }
                }}
              >
                <Text style={styles.submitButtonText}>End Configuration</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // ADD FORM (as before)
          <>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Entity Type</Text>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  value={form.entity_type}
                  onValueChange={(v) => {
                    setForm((f) => ({
                      ...f,
                      entity_type: v,
                      entity: null, // reset entity when type changes
                    }));
                    fetchEntities(v);
                  }}
                  items={[
                    { label: "Doctor", value: "doctor" },
                    { label: "Lab", value: "lab" },
                  ]}
                  style={pickerSelectStyles}
                  useNativeAndroidPickerStyle={false}
                  Icon={() => <Icon name="chevron-down" size={20} color={SUBTEXT} />}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Entity</Text>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  value={form.entity}
                  onValueChange={(v) => setForm((f) => ({ ...f, entity: v }))}
                  items={entities}
                  style={pickerSelectStyles}
                  placeholder={{ label: "Select an entity...", value: null }}
                  useNativeAndroidPickerStyle={false}
                  Icon={() => <Icon name="chevron-down" size={20} color={SUBTEXT} />}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Costing Type</Text>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  value={form.costing_type}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      costing_type: v,
                      per_patient_amount: "",
                      fixed_amount: "",
                      period: v === "fixed" ? "monthly" : "",
                    }))
                  }
                  items={[
                    { label: "Per Patient", value: "per_patient" },
                    { label: "Fixed Amount", value: "fixed" },
                  ]}
                  style={pickerSelectStyles}
                  useNativeAndroidPickerStyle={false}
                  Icon={() => <Icon name="chevron-down" size={20} color={SUBTEXT} />}
                />
              </View>
            </View>
            {form.costing_type === "per_patient" ? (
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Per Patient Amount (₹)</Text>
                <View style={styles.inputContainer}>
                  <Icon name="currency-inr" size={20} color={SUBTEXT} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Enter amount"
                    value={form.per_patient_amount}
                    onChangeText={(t) =>
                      setForm((f) => ({ ...f, per_patient_amount: t }))
                    }
                  />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Fixed Amount (₹)</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="currency-inr" size={20} color={SUBTEXT} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="Enter amount"
                      value={form.fixed_amount}
                      onChangeText={(t) =>
                        setForm((f) => ({ ...f, fixed_amount: t }))
                      }
                    />
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Billing Period</Text>
                  <View style={styles.pickerContainer}>
                    <RNPickerSelect
                      value={form.period}
                      onValueChange={(v) => setForm((f) => ({ ...f, period: v }))}
                      items={[
                        { label: "Monthly", value: "monthly" },
                        { label: "Yearly", value: "yearly" },
                        { label: "Weekly", value: "weekly" },
                      ]}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => <Icon name="chevron-down" size={20} color={SUBTEXT} />}
                    />
                  </View>
                </View>
              </>
            )}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Effective From Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => showDatePicker("effective_from")}
              >
                <Icon name="calendar" size={18} color={SUBTEXT} style={styles.dateIcon} />
                <Text style={styles.dateText}>
                  {formatDate(form.effective_from) || "Select a date"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <View style={styles.inputContainer}>
                <Icon name="note-text" size={20} color={SUBTEXT} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form.notes}
                  onChangeText={(t) => setForm((f) => ({ ...f, notes: t }))}
                  placeholder="Additional notes..."
                  multiline
                />
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSaveConfig}
              >
                <Text style={styles.submitButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  </View>
</Modal>

      <Modal
  visible={!!viewDetails}
  animationType="slide"
  transparent
  onRequestClose={() => setViewDetails(null)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <ScrollView>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Configuration Details</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setViewDetails(null)}
          >
            <Icon name="close" size={24} color={SUBTEXT} />
          </TouchableOpacity>
        </View>
        {viewDetails && (
          <View style={styles.detailsSection}>
            <Text style={styles.detailsLabel}>Entity Type</Text>
    <Text style={styles.detailsValue}>
      {viewDetails.entity_type === "doctor" ? "Doctor" : "Lab"}
    </Text>
            <Text style={styles.detailsLabel}>Entity</Text>
            <Text style={styles.detailsValue}>{viewDetails.entity_name}</Text>
            <Text style={styles.detailsLabel}>Costing Type</Text>
            <Text style={styles.detailsValue}>
              {viewDetails.costing_type === "per_patient"
                ? "Per Patient"
                : "Fixed"}
            </Text>
            {viewDetails.costing_type === "per_patient" ? (
              <>
                <Text style={styles.detailsLabel}>Per Patient Amount (₹)</Text>
                <Text style={styles.detailsValue}>{viewDetails.per_patient_amount}</Text>
              </>
            ) : (
              <>
                <Text style={styles.detailsLabel}>Fixed Amount (₹)</Text>
                <Text style={styles.detailsValue}>{viewDetails.fixed_amount}</Text>
                <Text style={styles.detailsLabel}>Billing Period</Text>
                <Text style={styles.detailsValue}>{capitalize(viewDetails.period)}</Text>
              </>
            )}
            <Text style={styles.detailsLabel}>Effective From</Text>
            <Text style={styles.detailsValue}>{formatDate(viewDetails.effective_from)}</Text>
            <Text style={styles.detailsLabel}>Effective To</Text>
            <Text style={styles.detailsValue}>{formatDate(viewDetails.effective_to)}</Text>
            {viewDetails.notes ? (
              <>
                <Text style={styles.detailsLabel}>Notes</Text>
                <Text style={styles.detailsValue}>{viewDetails.notes}</Text>
              </>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  </View>
</Modal>

      {/* Date Pickers */}
      <DateTimePickerModal
        isVisible={!!datePickerVisible}
        mode="date"
        onConfirm={handleDatePicked}
        onCancel={hideDatePicker}
      />
      <DateTimePickerModal
        isVisible={analyticsDatePicker.show}
        mode="date"
        onConfirm={handleAnalyticsDatePicked}
        onCancel={() => setAnalyticsDatePicker({ show: false, field: null })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  sectionContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: TEXT,
    flex: 1,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY,
    marginTop: 8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  filterContainer: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: TEXT,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  filterGroup: {
    flex: 1,
    marginRight: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: SUBTEXT,
    marginBottom: 6,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: CARD_BG,
    paddingHorizontal: 10,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: CARD_BG,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: PRIMARY,
  },
  secondaryButton: {
    backgroundColor: ACCENT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 6,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  configCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderLeftColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    // elevation: 5,
  },
  configHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  entityIcon: {
    marginRight: 10,
  },
  configTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: TEXT,
  },
  configType: {
    fontSize: 13,
    color: SUBTEXT,
    marginTop: 2,
  },
  configDetails: {
    marginLeft: 30, // Align with icon
  },
  configRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  configDetail: {
    fontSize: 14,
    color: TEXT,
    marginLeft: 8,
  },
  configDates: {
    fontSize: 13,
    color: WARNING,
    marginLeft: 8,
    fontWeight: "500",
  },
  configNotes: {
    fontSize: 13,
    color: SUBTEXT,
    marginLeft: 8,
    fontStyle: "italic",
    flex: 1,
  },
  configActions: {
    flexDirection: "row",
    marginLeft: 12,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: ACCENT,
    marginLeft: 6,
  },
  analyticsCard: {
    backgroundColor: HIGHLIGHT,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    // elevation: 1,
  },
  analyticsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  analyticsTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: TEXT,
  },
  analyticsType: {
    fontSize: 13,
    color: SUBTEXT,
    marginTop: 2,
  },
  analyticsDetails: {
    marginLeft: 30, // Align with icon
  },
  analyticsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  analyticsDetail: {
    fontSize: 14,
    color: TEXT,
    marginLeft: 8,
  },
  analyticsDates: {
    fontSize: 13,
    color: WARNING,
    marginLeft: 8,
    fontWeight: "500",
  },
  analyticsStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 6,
  },
  statItem: {
    // flexDirection: "row",
    alignItems: "center",
    backgroundColor: ACCENT,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  statText: {
    fontSize: 13,
    color: TEXT,
    marginLeft: 6,
    padding: 4,
  },
  statValue: {
    fontWeight: "bold",
  },
  analyticsNotes: {
    fontSize: 13,
    color: SUBTEXT,
    marginLeft: 8,
    fontStyle: "italic",
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: TEXT,
    fontWeight: "500",
    marginTop: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: SUBTEXT,
    marginTop: 4,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  loadingText: {
    fontSize: 14,
    color: SUBTEXT,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  // modalContent: {
  //   width: "100%",
  //   maxWidth: 500,
  //   backgroundColor: CARD_BG,
  //   borderRadius: 16,
  //   maxHeight: "80%",
  // },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: TEXT,
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
  width: "100%",
  maxWidth: 500,
  backgroundColor: "#f8fafc", // subtle blue-gray background
  borderRadius: 20,
  maxHeight: "80%",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 12,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "#e0e7ef",
},

detailsSection: {
  padding: 20,
  backgroundColor: "#fff",
  borderRadius: 16,
  margin: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  // elevation: 2,
},
detailsLabel: {
  fontSize: 14,
  fontWeight: "700",
  color: "#4361ee",
  marginTop: 12,
  marginBottom: 2,
  letterSpacing: 0.2,
},
detailsValue: {
  fontSize: 16,
  color: "#212529",
  backgroundColor: "#f1f8fe",
  borderRadius: 8,
  paddingVertical: 8,
  paddingHorizontal: 12,
  marginBottom: 4,
},
  formGroup: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: CARD_BG,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
    paddingVertical: 12,
    paddingRight: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: ACCENT,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: PRIMARY,
  },
  cancelButtonText: {
    color: TEXT,
    fontWeight: "600",
    fontSize: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: TEXT,
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  inputAndroid: {
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: TEXT,
    paddingRight: 30, // to ensure the text is never behind the icon
  },
  placeholder: {
    color: SUBTEXT,
  },
  iconContainer: {
    top: 10,
    right: 12,
  },
};

export default AdminCostingScreen;