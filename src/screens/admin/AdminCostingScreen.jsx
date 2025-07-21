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
  Platform,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { useNavigation } from '@react-navigation/native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { BASE_URL } from "../auth/Api";
import { fetchWithAuth } from "../auth/fetchWithAuth";
import { getToken } from "../auth/tokenHelper";
import Header from "../../components/Header";
import { Linking } from "react-native";
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import XLSX from 'xlsx';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Feather from 'react-native-vector-icons/Feather';


// For segmented control
import { useWindowDimensions } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

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
  const navigation = useNavigation();

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewDetails, setViewDetails] = useState(null);
  const [filterModal, setFilterModal] = useState(false);

  const [downloadFormatModal, setDownloadFormatModal] = useState(false);
const [downloadFormat, setDownloadFormat] = useState(null);
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
  const [analyticsSummary, setAnalyticsSummary] = useState(null);

  // Tabs
  const layout = useWindowDimensions();
  const [tabIndex, setTabIndex] = useState(0);
  const [routes] = useState([
    { key: "analytics", title: "Analytics" },
    { key: "active", title: "Active Configs" },
    { key: "historical", title: "Config History" },
  ]);

  // Fetch all data
  const fetchData = async () => {
    await Promise.all([
      fetchConfigs(),
      fetchEntities(),
      fetchAllAnalytics(),
    ]);
  };

const generatePDFReport = async () => {
  try {
    if (!analyticsSummary || !analytics || analytics.length === 0) {
      Alert.alert("Error", "No data available to generate report");
      return;
    }

    const { summary, details } = { summary: analyticsSummary, details: analytics };
    
    const htmlContent = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        h2 { color: #555; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .summary-table { background-color: #f9f9f9; }
        .breakdown-table { margin-top: 20px; }
        .total-row { font-weight: bold; background-color: #e8f4f8; }
        .page-break { page-break-before: always; }
        .currency { text-align: right; }
        .center { text-align: center; }
      </style>
      
      <h1>EzyDoc Income Analytics Report</h1>
      
      <h2>Sheet 1: Costing Report</h2>
      <table>
        <thead>
          <tr>
            <th>Entity Type</th>
            <th>Entity Name</th>
            <th>Entity ID</th>
            <th>Costing Type</th>
            <th>Per Patient Amount</th>
            <th>Fixed Amount</th>
            <th>Period</th>
            <th>Effective From</th>
            <th>Effective To</th>
            
            <th>Total Appointments/Tests</th>
            <th>Admin Income (INR)</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${details.map(config => `
            <tr>
              <td>${capitalize(config.entity_type)}</td>
              <td>${config.entity_name}</td>
              <td>${config.entity_id || 'N/A'}</td>
              <td>${capitalize(config.costing_type.replace('_', ' '))}</td>
              <td class="currency">${config.costing_type === "per_patient" && config.per_patient_amount !== "None" ? `₹${parseFloat(config.per_patient_amount).toFixed(2)}` : '-'}</td>
              <td class="currency">${config.costing_type === "fixed" && config.fixed_amount !== "None" ? `₹${parseFloat(config.fixed_amount).toFixed(2)}` : '-'}</td>
              <td class="center">${config.costing_type === "fixed" && config.period ? capitalize(config.period) : '-'}</td>
              <td class="center">${config.effective_from ? formatDate(config.effective_from) : '-'}</td>
              <td class="center">${config.effective_to ? formatDate(config.effective_to) : '-'}</td>
             
              <td class="center">${config.entity_type === 'doctor' ? (config.total_appointments || 0) : (config.total_lab_tests || 0)}</td>
              <td class="currency">₹${parseFloat(config.admin_income).toFixed(2)}</td>
              <td>${config.notes || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="page-break"></div>
      
      <h2>Sheet 2: Summary</h2>
      
      <h3>Total Income Summary</h3>
      <table class="summary-table">
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
        <tr>
          <td>Total Admin Income</td>
          <td class="currency">₹${parseFloat(summary.total_admin_income).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Total Doctor Income</td>
          <td class="currency">₹${parseFloat(summary.total_doctor_income).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Total Lab Income</td>
          <td class="currency">₹${parseFloat(summary.total_lab_income).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Total Entities</td>
          <td class="center">${summary.total_entities}</td>
        </tr>
        <tr>
          <td>Total Doctors Covered</td>
          <td class="center">${summary.total_doctors}</td>
        </tr>
        <tr>
          <td>Total Labs Covered</td>
          <td class="center">${summary.total_labs}</td>
        </tr>
        <tr>
          <td>Total Appointments</td>
          <td class="center">${summary.total_doctor_appointments}</td>
        </tr>
        <tr>
          <td>Total Lab Tests</td>
          <td class="center">${summary.total_lab_tests}</td>
        </tr>
        <tr>
          <td>Reporting Period</td>
          <td class="center">${getReportingPeriod(details)}</td>
        </tr>
      </table>
      
      <h3>Detailed Income Breakdown</h3>
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>Entity Type</th>
            <th>Entity Name</th>
            <th>Income Source</th>
            <th>Total Events</th>
            <th>Unit Amount</th>
            <th>Total Income</th>
          </tr>
        </thead>
        <tbody>
          ${details.map(config => {
            const incomeSource = config.costing_type === "per_patient" 
              ? "Per Patient" 
              : `Fixed (${capitalize(config.period || 'N/A')})`;
            
            const totalEvents = config.entity_type === 'doctor' 
              ? config.total_appointments || 0 
              : config.total_lab_tests || 0;
            
            const unitAmount = config.costing_type === "per_patient" && config.per_patient_amount !== "None"
              ? parseFloat(config.per_patient_amount) 
              : (config.fixed_amount !== "None" ? parseFloat(config.fixed_amount) : 0);
            
            return `
              <tr>
                <td>${capitalize(config.entity_type)}</td>
                <td>${config.entity_name}</td>
                <td>${incomeSource}</td>
                <td class="center">${totalEvents}</td>
                <td class="currency">₹${unitAmount.toFixed(2)}</td>
                <td class="currency">₹${parseFloat(config.admin_income).toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
          <tr class="total-row">
            <td colspan="5"><strong>Total Income</strong></td>
            <td class="currency"><strong>₹${parseFloat(summary.total_admin_income).toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>
    `;

    // const fileName = `costing_report_${Date.now()}.pdf`;
    const fileName = `costing_report_${getFormattedTimestamp()}.pdf`;

    
    const pdf = await RNHTMLtoPDF.convert({
      html: htmlContent,
      fileName: fileName,
      directory: Platform.OS === 'ios' ? 'Documents' : 'Download',
    });

    // For Android, you might want to save to external storage
    if (Platform.OS === 'android') {
      const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      await RNFS.moveFile(pdf.filePath, downloadPath);
      
      Alert.alert(
        "Success", 
        `PDF downloaded successfully!\nSaved to: Downloads/${fileName}`,
        [
          {
            text: "Open File Manager",
            onPress: () => {
              if (Platform.OS === 'android') {
                Linking.openURL('content://com.android.externalstorage.documents/document/primary%3ADownload');
              }
            }
          },
          {
            text: "OK",
            onPress: () => console.log("PDF download confirmed")
          }
        ]
      );
    } else {
      // For iOS, show success message
      Alert.alert(
        "Success", 
        `PDF downloaded successfully!\nSaved to: Documents/${fileName}`,
        [
          {
            text: "OK",
            onPress: () => console.log("PDF download confirmed")
          }
        ]
      );
    }
  } catch (error) {
    console.error("PDF Generation Error:", error);
    Alert.alert("Error", "Failed to generate PDF report");
  }
};

const generateExcelReport = async () => {
  try {
    if (!analyticsSummary || !analytics || analytics.length === 0) {
      Alert.alert("Error", "No data available to generate report");
      return;
    }

    const { summary, details } = { summary: analyticsSummary, details: analytics };
    
    // Sheet 1: Detailed Costing Report
    const costingData = details.map((config, index) => ({
      "Entity Type": capitalize(config.entity_type),
      "Entity Name": config.entity_name,
      "Entity ID": config.entity_id || 'N/A',
      "Costing Type": capitalize(config.costing_type.replace('_', ' ')),
      "Per Patient Amount": config.costing_type === "per_patient" && config.per_patient_amount !== "None" ? parseFloat(config.per_patient_amount) : "",
      "Fixed Amount": config.costing_type === "fixed" && config.fixed_amount !== "None" ? parseFloat(config.fixed_amount) : "",
      "Period": config.costing_type === "fixed" && config.period ? capitalize(config.period) : "",
      "Effective From": config.effective_from ? formatDate(config.effective_from) : "",
      "Effective To": config.effective_to ? formatDate(config.effective_to) : "",
      // "Income Start Date": config.effective_from ? formatDate(config.effective_from) : "",
      // "Income End Date": config.effective_to ? formatDate(config.effective_to) : "",
      "Total Appointments/Tests": config.entity_type === 'doctor' ? (config.total_appointments || 0) : (config.total_lab_tests || 0),
      "Admin Income (INR)": parseFloat(config.admin_income),
      "Notes": config.notes || "",
    }));

    // Sheet 2: Summary Data
    const summarySheetData = [
      { "Metric": "Total Admin Income", "Value": parseFloat(summary.total_admin_income) },
      { "Metric": "Total Doctor Income", "Value": parseFloat(summary.total_doctor_income) },
      { "Metric": "Total Lab Income", "Value": parseFloat(summary.total_lab_income) },
      { "Metric": "Total Entities", "Value": summary.total_entities },
      { "Metric": "Total Doctors Covered", "Value": summary.total_doctors },
      { "Metric": "Total Labs Covered", "Value": summary.total_labs },
      { "Metric": "Total Appointments", "Value": summary.total_doctor_appointments },
      { "Metric": "Total Lab Tests", "Value": summary.total_lab_tests },
      { "Metric": "Reporting Period", "Value": getReportingPeriod(details) },
    ];

    // Sheet 3: Detailed Breakdown
    const breakdownData = details.map(config => {
      const incomeSource = config.costing_type === "per_patient" 
        ? "Per Patient" 
        : `Fixed (${capitalize(config.period || 'N/A')})`;
      
      const totalEvents = config.entity_type === 'doctor' 
        ? config.total_appointments || 0 
        : config.total_lab_tests || 0;
      
      const unitAmount = config.costing_type === "per_patient" && config.per_patient_amount !== "None"
        ? parseFloat(config.per_patient_amount) 
        : (config.fixed_amount !== "None" ? parseFloat(config.fixed_amount) : 0);
      
      return {
        "Entity Type": capitalize(config.entity_type),
        "Entity Name": config.entity_name,
        "Income Source": incomeSource,
        "Total Events": totalEvents,
        "Unit Amount": unitAmount,
        "Total Income": parseFloat(config.admin_income),
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add sheets
    const ws1 = XLSX.utils.json_to_sheet(costingData);
    const ws2 = XLSX.utils.json_to_sheet(summarySheetData);
    const ws3 = XLSX.utils.json_to_sheet(breakdownData);
    
    XLSX.utils.book_append_sheet(wb, ws1, "Costing Report");
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");
    XLSX.utils.book_append_sheet(wb, ws3, "Income Breakdown");

    // Style the headers (if supported)
    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "CCCCCC" } }
    };

    const wbout = XLSX.write(wb, { type: "binary", bookType: "xlsx" });
    // const fileName = `costing_configs_${Date.now()}.xlsx`;
    const fileName = `costing_report_${getFormattedTimestamp()}.pdf`;

    const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;

    await RNFS.writeFile(path, wbout, 'ascii');

    Alert.alert(
      "Success", 
      `Excel file downloaded successfully!\nSaved to: Downloads/${fileName}`,
      [
        {
          text: "Open File Manager",
          onPress: () => {
            // Optional: Open file manager (Android only)
            if (Platform.OS === 'android') {
              Linking.openURL('content://com.android.externalstorage.documents/document/primary%3ADownload');
            }
          }
        },
        {
          text: "OK",
          onPress: () => console.log("Excel download confirmed")
        }
      ]
    );
  } catch (error) {
    console.error("Excel Download Error:", error);
    Alert.alert("Error", "Failed to generate Excel file");
  }
};

const getFormattedTimestamp = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // convert 0 to 12
  const hh = String(hours).padStart(2, '0');

  return `${dd}-${mm}-${yyyy}_${hh}-${minutes}-${seconds}-${ampm}`;
};


const getReportingPeriod = (details) => {
  const dates = details
    .filter(d => d.effective_from)
    .map(d => new Date(d.effective_from))
    .concat(details.filter(d => d.effective_to).map(d => new Date(d.effective_to)));
  
  if (dates.length === 0) return 'N/A';
  
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  return `${formatDate(minDate.toISOString().split('T')[0])} → ${formatDate(maxDate.toISOString().split('T')[0])}`;
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
    } finally {
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
        setAnalyticsSummary(data?.results?.summary || null);
      setAnalytics(data?.results?.details || []);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load analytics");
      setAnalytics([]);
      setAnalyticsSummary(null);

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
      if (!res.ok) {
        let errorMsg = "Failed to save configuration";
        try {
          const data = await res.json();
          if (typeof data === "object") {
            if (data.detail) {
              errorMsg = data.detail;
            } else if (data.non_field_errors) {
              errorMsg = Array.isArray(data.non_field_errors)
                ? data.non_field_errors.join("\n")
                : data.non_field_errors;
            } else {
              errorMsg = Object.entries(data)
                .filter(([field]) => field !== "non_field_errors")
                .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
                .join("\n");
            }
          }
        } catch {
          try {
            errorMsg = await res.text();
          } catch {}
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
      if (res.ok) {
        const data = await res.json();
        setAnalyticsSummary(data?.results?.summary || null);
      setAnalytics(data?.results?.details || []);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load filtered analytics");
      setAnalytics([]);
      setAnalyticsSummary(null);
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
              {capitalize(item.entity_type)}
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
  // const renderAnalytics = ({ item }) => (
  //   <View style={styles.analyticsCard}>
  //     <View style={styles.analyticsHeader}>
  //       <Icon
  //         name={item.entity_type === "doctor" ? "account-tie" : "flask"}
  //         size={22}
  //         color={PRIMARY}
  //         style={styles.entityIcon}
  //       />
  //       <View>
  //         <Text style={styles.analyticsTitle}>{item.entity_name}</Text>
  //         <Text style={styles.analyticsType}>
  //           {capitalize(item.entity_type)}
  //         </Text>
  //       </View>
  //     </View>

  //     <View style={styles.analyticsDetails}>
  //       <View style={styles.analyticsRow}>
  //         <Icon
  //           name={item.costing_type === "per_patient" ? "account-multiple" : "cash"}
  //           size={18}
  //           color={SUCCESS}
  //         />
  //         <Text style={styles.analyticsDetail}>
  //           {item.costing_type === "per_patient"
  //             ? ` Per Patient: ₹${item.per_patient_amount}`
  //             : ` Fixed: ₹${item.fixed_amount}`}
  //           {item.costing_type === "fixed" ? ` (${capitalize(item.period)})` : ""}
  //         </Text>
  //       </View>

  //       <View style={styles.analyticsRow}>
  //         <Icon name="calendar-range" size={16} color={WARNING} />
  //         <Text style={styles.analyticsDates}>
  //           {formatDate(item.effective_from)} <Icon name="arrow-right" size={12} color={SUBTEXT} /> {formatDate(item.effective_to) || "Present"}
  //         </Text>
  //       </View>

  //       <View style={styles.analyticsStats}>
  //         <View style={styles.statItem}>
  //           <Icon name="calendar-check" size={16} color={PRIMARY} />
  //           <Text style={styles.statText}>
  //             Appointments:
  //           </Text>
  //           <Text style={styles.statText}>
  //             <Text style={styles.statValue}>{item.total_appointments || 0}</Text>
  //           </Text>
  //         </View>

  //         <View style={styles.statItem}>
  //           <Icon name="currency-inr" size={18} color={SUCCESS} />
  //           <Text style={styles.statText}>
  //             Income:
  //           </Text>
  //           <Text style={styles.statText}>
  //             <Text style={[styles.statValue, { color: SUCCESS }]}>₹{item.admin_income}</Text>
  //           </Text>
  //         </View>
  //       </View>

  //       {item.notes ? (
  //         <View style={styles.analyticsRow}>
  //           <Icon name="note-text" size={16} color={SUBTEXT} />
  //           <Text style={styles.analyticsNotes}>{item.notes}</Text>
  //         </View>
  //       ) : null}
  //     </View>
  //   </View>
  // );

  const renderAnalytics = ({ item }) => {
  // Check if this record is active (no effective_to date)
  const isActive = !item.effective_to;
  
  return (
    <View style={[
      styles.analyticsCard,
      isActive && { borderLeftWidth: 3, borderLeftColor: SUCCESS }
    ]}>
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
            {capitalize(item.entity_type)}
            {isActive && (
              <Text style={{ color: SUCCESS, fontSize: 12 }}>
                {' '}(Active)
              </Text>
            )}
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
            {formatDate(item.effective_from)} 
            <Icon name="arrow-right" size={12} color={SUBTEXT} /> 
            {formatDate(item.effective_to) || "Present"}
          </Text>
        </View>

        <View style={styles.analyticsStats}>
          <View style={styles.statItem}>
            <Icon 
              name={item.entity_type === "doctor" ? "stethoscope" : "flask-outline"} 
              size={16} 
              color={PRIMARY} 
            />
            <Text style={styles.statText}>
              {item.entity_type === "doctor" ? "Appointments:" : "Tests:"}
            </Text>
            <Text style={styles.statText}>
              <Text style={styles.statValue}>
                {item.entity_type === "doctor" 
                  ? item.total_appointments || 0 
                  : item.total_lab_tests || 0}
              </Text>
            </Text>
          </View>

          <View style={styles.statItem}>
            <Icon name="currency-inr" size={18} color={SUCCESS} />
            <Text style={styles.statText}>
              Income:
            </Text>
            <Text style={styles.statText}>
              <Text style={[styles.statValue, { color: SUCCESS }]}>
                ₹{item.admin_income}
              </Text>
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
};


  // Split configs into active and ended
  const activeConfigs = configs.filter((c) => !c.effective_to);
  const endedConfigs = configs.filter((c) => c.effective_to);

  // --- Tab Scenes ---
  const AnalyticsRoute = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeaderContainer}>
        <Icon name="chart-bar" size={24} color={PRIMARY} style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>Income Analytics</Text>
         <TouchableOpacity
  style={styles.downloadBtn}
  onPress={() => setDownloadFormatModal(true)}
>
  <Icon name={Platform.OS === "ios" ? "download" : "file-excel"} size={20} color={PRIMARY} />
  <Text style={styles.downloadBtnText}>Download</Text>
</TouchableOpacity>
      </View>
<TouchableOpacity
  style={[styles.filterButton, styles.primaryButton, { alignSelf: "flex-end", marginBottom: 10 }]}
  onPress={() => setFilterModal(true)}
>
  <Icon name="filter" size={18} color="#fff" />
  <Text style={[styles.filterButtonText, { color: "#fff" }]}>Filter</Text>
</TouchableOpacity>

<Modal
  visible={filterModal}
  transparent
  animationType="slide"
  onRequestClose={() => setFilterModal(false)}
>
  <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }}>
    <View style={[styles.filterContainer, { width: "90%", maxWidth: 400 }]}>
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
          onPress={() => {
            handleFetchAnalytics();
            setFilterModal(false);
          }}
        >
          <Icon name="magnify" size={18} color="#fff" />
          <Text style={[styles.filterButtonText, { color: "#fff" }]}>Apply</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 16 }}>
        <TouchableOpacity onPress={() => setFilterModal(false)}>
          <Text style={{ color: PRIMARY, fontWeight: "bold", fontSize: 16 }}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
      {/* <View style={styles.filterContainer}>
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
      </View> */}

      {/* {analyticsSummary && (
  <View style={styles.summaryCard}>
    <Text style={styles.summaryTitle}>Summary</Text>
    <View style={styles.summaryRow}>
      <View style={styles.summaryItem}>
        <Icon name="currency-inr" size={22} color={PRIMARY} />
        <Text style={styles.summaryLabel}>Admin Income</Text>
        <Text style={styles.summaryValue}>₹{analyticsSummary.total_admin_income}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Icon name="account-tie" size={22} color={SUCCESS} />
        <Text style={styles.summaryLabel}>Doctors</Text>
        <Text style={styles.summaryValue}>{analyticsSummary.total_doctors}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Icon name="flask" size={22} color={WARNING} />
        <Text style={styles.summaryLabel}>Labs</Text>
        <Text style={styles.summaryValue}>{analyticsSummary.total_labs}</Text>
      </View>
    </View>
    <View style={styles.summaryRow}>
      <View style={styles.summaryItem}>
        <Icon name="calendar-check" size={20} color={PRIMARY} />
        <Text style={styles.summaryLabel}>Appointments</Text>
        <Text style={styles.summaryValue}>{analyticsSummary.total_doctor_appointments}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Icon name="test-tube" size={20} color={WARNING} />
        <Text style={styles.summaryLabel}>Lab Tests</Text>
        <Text style={styles.summaryValue}>{analyticsSummary.total_lab_tests}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Icon name="account-group" size={20} color={SUBTEXT} />
        <Text style={styles.summaryLabel}>Entities</Text>
        <Text style={styles.summaryValue}>{analyticsSummary.total_entities}</Text>
      </View>
    </View>
  </View>
)} */}

      {analyticsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : (
        <FlatList
          // data={analytics}
          data={[...analytics].sort((a, b) => {
    if (!a.effective_to && b.effective_to) return -1;
    if (a.effective_to && !b.effective_to) return 1;
    return 0;
  })}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderAnalytics}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="database-remove" size={40} color={SUBTEXT} />
              <Text style={styles.emptyText}>No analytics data found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          }
          // scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 100 }}
           refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[PRIMARY]}
      tintColor={PRIMARY}
    />
  }
        />
      )}
    </View>
  );

  const ActiveConfigsRoute = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeaderContainer}>
        <Icon name="cog" size={24} color={PRIMARY} style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>Active Configurations</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Icon name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>
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
          // scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );

//   <Modal
//   visible={downloadFormatModal}
//   transparent
//   animationType="fade"
//   onRequestClose={() => setDownloadFormatModal(false)}
// >
//   <View style={styles.modalOverlay}>
//     <View style={styles.modalContent}>
//       <View style={styles.modalHeader}>
//         <Text style={styles.modalTitle}>Select Download Format</Text>
//         <TouchableOpacity
//           style={styles.modalCloseButton}
//           onPress={() => setDownloadFormatModal(false)}
//         >
//           <Icon name="close" size={24} color={SUBTEXT} />
//         </TouchableOpacity>
//       </View>
//       <View style={styles.modalButtons}>
//         <TouchableOpacity
//           style={[styles.modalButton, styles.submitButton]}
//           onPress={() => {
//             setDownloadFormat("pdf");
//             setDownloadFormatModal(false);
//             generatePDFReport(endedConfigs);
//           }}
//         >
//           <Text style={styles.submitButtonText}>Download as PDF</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.modalButton, styles.submitButton]}
//           onPress={() => {
//             setDownloadFormat("excel");
//             setDownloadFormatModal(false);
//             generateExcelReport(endedConfigs);
//           }}
//         >
//           <Text style={styles.submitButtonText}>Download as Excel</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   </View>
// </Modal>
  const HistoricalConfigsRoute = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeaderContainer}>
        <Icon name="history" size={24} color={PRIMARY} style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>Previous Configurations</Text>
        {/* <TouchableOpacity
  style={styles.downloadBtn}
  onPress={() => setDownloadFormatModal(true)}
>
  <Icon name={Platform.OS === "ios" ? "download" : "file-excel"} size={20} color={PRIMARY} />
  <Text style={styles.downloadBtnText}>Download</Text>
</TouchableOpacity> */}
      </View>
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
        // scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </View>
  );

  const renderScene = SceneMap({
    analytics: AnalyticsRoute,
    active: ActiveConfigsRoute,
    historical: HistoricalConfigsRoute,
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* <Header title="Costing & Analytics" /> */}
      <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Feather name="chevron-left" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Costing & Analytics</Text>
                {/* <Text style={styles.headerSubtitle}>Manage patient visits</Text> */}
              </View>
              
            </View>
      <Modal
      visible={downloadFormatModal}
      transparent
      animationType="fade"
      onRequestClose={() => setDownloadFormatModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Download Format</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setDownloadFormatModal(false)}
            >
              <Icon name="close" size={24} color={SUBTEXT} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={() => {
                setDownloadFormat("pdf");
                setDownloadFormatModal(false);
                // Check which tab is active and download accordingly
                if (tabIndex === 0) {
                  // Analytics tab - download analytics data
                  generatePDFReport(analytics);
                } else {
                  // Historical tab - download historical configs
                  generatePDFReport(endedConfigs);
                }
              }}
            >
              <Text style={styles.submitButtonText}>Download as PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={() => {
                setDownloadFormat("excel");
                setDownloadFormatModal(false);
                // Check which tab is active and download accordingly
                if (tabIndex === 0) {
                  // Analytics tab - download analytics data
                  generateExcelReport(analytics); // You might want to create a separate function for analytics Excel
                } else {
                  // Historical tab - download historical configs
                  generateExcelReport(endedConfigs);
                }
              }}
            >
              <Text style={styles.submitButtonText}>Download as Excel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        onIndexChange={setTabIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: PRIMARY, height: 3, borderRadius: 2 }}
            style={{ backgroundColor: "#fff" }}
            labelStyle={{ color: PRIMARY, fontWeight: "bold" }}
            activeColor={PRIMARY}
            inactiveColor={SUBTEXT}
            tabStyle={{ minHeight: 48 }}
          />
        )}
      />

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
                      <Text style={styles.detailsValue}>{capitalize(form.period)}</Text>
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
                            entity: null,
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

      {/* Details Modal */}
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
    // flex: 1,
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
    color: "#fff", 
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
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f2ff",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  downloadBtnText: {
    color: PRIMARY,
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
    marginLeft: 30,
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
    marginLeft: 30,
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
    backgroundColor: "#f8fafc",
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
    // flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 8,
  },
  modalButton: {
    // flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    margin:12,
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
  summaryCard: {
  backgroundColor: "#f8fafc",
  borderRadius: 14,
  padding: 18,
  marginBottom: 18,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 4,
},
summaryTitle: {
  fontSize: 17,
  fontWeight: "bold",
  color: PRIMARY,
  marginBottom: 10,
  textAlign: "left",
},
summaryRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 8,
},
summaryItem: {
  flex: 1,
  alignItems: "center",
  padding: 6,
},
summaryLabel: {
  fontSize: 13,
  color: SUBTEXT,
  marginTop: 2,
},
summaryValue: {
  fontSize: 16,
  fontWeight: "bold",
  color: TEXT,
  marginTop: 2,
},
 header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1c78f2',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  backButton: {
    padding: 8,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: TEXT,
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: TEXT,
    paddingRight: 30,
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