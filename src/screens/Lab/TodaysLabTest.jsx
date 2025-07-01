import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import moment from 'moment';
import { fetchWithAuth } from '../auth/fetchWithAuth';
const SECTIONS = [
  { key: 'today', label: "Today's Appointments" },
  { key: 'upcoming', label: 'Upcoming Appointments' },
  { key: 'completed', label: 'Completed Appointments' },
  { key: 'cancelled', label: 'Cancelled Appointments' },
  { key: 'other', label: 'Other Appointments' },
];

const STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const genderMap = { M: 'Male', F: 'Female', O: 'Other' };

const TodaysLabTest = ({ navigation }) => {
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState('today');
  const [refreshing, setRefreshing] = useState(false);
  const [reportModal, setReportModal] = useState({ visible: false, reports: [] });

  const fetchLabTests = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      // const response = await fetch(`${BASE_URL}/labs/lab-tests/`, {
      const response = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('Lab Tests:', data);
      if (response.ok) {
        setLabTests(data);
      } else {
        Alert.alert('Error', 'Failed to fetch lab tests');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not fetch lab tests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLabTests();
  }, [fetchLabTests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLabTests();
  };

  // Section filtering logic
  const todayStr = moment().format('YYYY-MM-DD');
  const now = moment();

  const getSectionData = () => {
    switch (selectedSection) {
      case 'today':
        return labTests.filter(
          (t) =>
            t.status === 'SCHEDULED' &&
            moment(t.scheduled_date).format('YYYY-MM-DD') === todayStr
        );
      case 'upcoming':
        return labTests.filter(
          (t) =>
            t.status === 'SCHEDULED' &&
            moment(t.scheduled_date).isAfter(now, 'day')
        );
      case 'completed':
        return labTests.filter((t) => t.status === 'COMPLETED');
      case 'cancelled':
        return labTests.filter((t) => t.status === 'CANCELLED');
      case 'other':
      return labTests.filter(
        (t) =>
          t.status === 'SCHEDULED' &&
          moment(t.scheduled_date).isBefore(now, 'day')
      );
      default:
        return [];
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = await getToken();
      setLoading(true);
      // const response = await fetch(`${BASE_URL}/labs/lab-tests/${id}/`, {
      const response = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        fetchLabTests();
      } else {
        Alert.alert('Error', 'Failed to update status');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not update status');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = (id) => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to mark this test as Done?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => handleStatusChange(id, 'COMPLETED'),
        },
      ]
    );
  };

  const handleCancel = (id) => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to Cancel this test?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => handleStatusChange(id, 'CANCELLED'),
        },
      ]
    );
  };

  const openReportModal = (reports) => {
    setReportModal({ visible: true, reports });
  };

  const closeReportModal = () => {
    setReportModal({ visible: false, reports: [] });
  };

  const handleDownload = (fileUrl) => {
    Linking.openURL(fileUrl);
  };

  const renderReportModal = () => (
    <Modal
      visible={reportModal.visible}
      transparent
      animationType="slide"
      onRequestClose={closeReportModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Reports</Text>
          <ScrollView style={{ maxHeight: 350 }}>
            {reportModal.reports.map((report, idx) => (
              <View key={report.id} style={styles.reportItem}>
                <Text style={styles.reportDesc}>{idx + 1}. {report.description}</Text>
                {report.file && (
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleDownload(report.file)}
                  >
                    {/* <Image
                      source={
                        report.file.endsWith('.pdf')
                          ? require('../assets/pdf-icon.png')
                          : require('../assets/file-icon.png')
                      }
                      style={styles.reportFileIcon}
                    /> */}
                    <Text style={styles.downloadBtnText}>
                      {Platform.OS === 'ios' ? 'Open' : 'Download'}
                    </Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.reportDate}>
                  {moment(report.published_at).format('YYYY-MM-DD hh:mm A')}
                </Text>
                <View style={styles.reportDivider} />
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={closeReportModal}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderPatientCard = ({ item, index }) => {
    const patient = item.patient || {};
    return (
      <View style={styles.patientCard}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientIndex}>{index + 1}.</Text>
          <View>
            <Text style={styles.patientText}>Name: {item.patient_name || '-'}</Text>
            <Text style={styles.patientText}>
              Date: {moment(item.scheduled_date).format('YYYY-MM-DD')}
            </Text>
            <Text style={styles.patientText}>
              Time: {moment(item.scheduled_date).format('hh:mm A')}
            </Text>
            <Text style={styles.patientText}>Test: {item.test_type}</Text>
            <Text style={styles.patientText}>Blood Group: {patient.blood_group || '-'}</Text>
            <Text style={styles.patientText}>Age: {patient.age || '-'}</Text>
            <Text style={styles.patientText}>
              Gender: {genderMap[patient.gender] || '-'}
            </Text>
            <Text style={styles.patientText}>Address: {patient.address || '-'}</Text>
            <Text style={styles.patientText}>
              Registration No: {item.registration_number}
            </Text>
            <Text style={styles.patientText}>
              Status: {STATUS_LABELS[item.status] || item.status}
            </Text>
            {item.reports && item.reports.length > 0 && (
              <TouchableOpacity
                style={styles.reportBtn}
                onPress={() => openReportModal(item.reports)}
              >
                <Text style={styles.reportBtnText}>View Reports ({item.reports.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {selectedSection === 'today' && (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => handleDone(item.id)}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(item.id)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/left-arrow.png')} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.toolbarTitle}>Lab Test Appointments</Text>
      </View>

      {/* Section Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sectionTabs}
      >
        {SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.key}
            style={[
              styles.sectionTab,
              selectedSection === section.key && styles.selectedSectionTab,
            ]}
            onPress={() => setSelectedSection(section.key)}
          >
            <Text
              style={[
                styles.sectionTabText,
                selectedSection === section.key && styles.selectedSectionTabText,
              ]}
            >
              {section.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Divider */}
      {/* <View style={styles.divider} /> */}

      {/* Loader */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1c78f2" />
        </View>
      ) : (
        <FlatList
          data={getSectionData()}
          keyExtractor={(item) => item.id}
          renderItem={renderPatientCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: '#888' }}>No appointments found.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 30, alignItems: 'stretch' }}
        />
      )}

      {/* Report Modal */}
      {renderReportModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8faff' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c78f2',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  backIcon: {
    width: 22,
    height: 22,
    tintColor: 'white',
  },
  toolbarTitle: {
    color: 'white',
    fontSize: 20,
    marginLeft: 8,
  },
  sectionTabs: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 10,
    backgroundColor: '#f8faff',
  },
  sectionTab: {
    marginRight: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#f8faff',
    borderWidth: 1,
    borderColor: "#1c78f2",
    borderRadius: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom:8
  },
  selectedSectionTab: {
    backgroundColor: '#1c78f2',
  },
  sectionTabText: {
    color: '#1c78f2',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedSectionTabText: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#e3e6ee',
    marginVertical: 8,
    marginLeft: 12,
    marginRight: 12,
  },
  patientCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 7,
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: "#e3e6ee",
    justifyContent: 'space-between',
    elevation: 0,
    shadowOpacity: 0,
  },
  patientInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  patientIndex: {
    fontWeight: 'bold',
    marginRight: 8,
    color: '#1c78f2',
    fontSize: 15,
  },
  patientText: {
    fontSize: 13,
    marginBottom: 1,
    color: '#222',
    letterSpacing: 0.1,
  },
  buttonGroup: {
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  doneButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 7,
    marginBottom: 5,
    minWidth: 64,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#c0392b',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 7,
    minWidth: 64,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  reportBtn: {
    marginTop: 7,
    backgroundColor: '#f2f7ff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 7,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportBtnText: {
    color: '#0047ab',
    fontSize: 13,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 0,
    shadowOpacity: 0,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c78f2',
    marginBottom: 10,
  },
  reportItem: {
    marginBottom: 10,
    alignItems: 'flex-start',
    width: '100%',
  },
  reportDesc: {
    fontSize: 14,
    color: '#222',
    marginBottom: 3,
    fontWeight: '500',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7ff',
    borderRadius: 7,
    paddingVertical: 4,
    paddingHorizontal: 9,
    marginBottom: 1,
  },
  downloadBtnText: {
    color: '#0047ab',
    fontWeight: '500',
    marginLeft: 5,
    fontSize: 13,
  },
  reportFileIcon: {
    width: 20,
    height: 20,
    tintColor: '#1c78f2',
  },
  reportDate: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
    marginBottom: 1,
  },
  reportDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    width: '100%',
    marginTop: 4,
  },
  closeBtn: {
    marginTop: 8,
    backgroundColor: '#1c78f2',
    borderRadius: 7,
    paddingVertical: 7,
    paddingHorizontal: 28,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
export default TodaysLabTest;