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
  Dimensions,
} from 'react-native';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import moment from 'moment';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import RNFS from "react-native-fs";

const { width } = Dimensions.get('window');
// Extract filename from URL
const getFileNameFromUrl = (url) => {
  if (!url) return 'downloaded_file';
  const fileName = url.split('/').pop().split('?')[0];
  return fileName || 'downloaded_file';
};

// Request storage permissions for Android 10 and below
const requestStoragePermission = async () => {
  if (Platform.OS !== 'android' || Platform.Version >= 30) {
    return true;
  }
  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    ];
    const granted = await PermissionsAndroid.requestMultiple(permissions);
    return (
      granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch {
    return false;
  }
};

// Request notification permission for Android 13+
const requestNotificationPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notification Permission',
          message: 'This app needs permission to show download notifications.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }
  return true;
};
const SECTIONS = [
  { key: 'today', label: "Today" },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'other', label: 'Past' },
];

const STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS = {
  SCHEDULED: '#FFA500',
  COMPLETED: '#4CAF50',
  CANCELLED: '#F44336',
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
      const response = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
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

  // const handleDownload = (fileUrl) => {
  //   Linking.openURL(fileUrl);
  // };
  const handleDownload = async (fileUrl, fileName) => {
  try {
    // Validate input
    if (!fileUrl) throw new Error('Invalid file URL');

    // Request permissions
    const hasStoragePermission = await requestStoragePermission();
    if (!hasStoragePermission) {
      Alert.alert('Permission Denied', 'Cannot download file without storage permission.');
      return;
    }
    await requestNotificationPermission();

    // Prepare filename
    const baseFileName = fileName || getFileNameFromUrl(fileUrl);
    if (!baseFileName || !baseFileName.includes('.')) throw new Error('Invalid filename or extension');
    const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const ext = sanitizedFileName.split('.').pop().toLowerCase();
    const timestamp = Date.now();
    const finalFileName = `${sanitizedFileName.split('.')[0]}_${timestamp}.${ext}`;

    // Determine download destination
    let downloadDir;
    if (Platform.OS === 'android') {
      if (Platform.Version <= 29) {
        downloadDir = `${RNFS.ExternalStorageDirectoryPath}/Download`;
      } else {
        downloadDir = RNFS.DownloadDirectoryPath;
      }
    } else {
      downloadDir = RNFS.DocumentDirectoryPath;
    }

    // Ensure download directory exists
    const dirExists = await RNFS.exists(downloadDir);
    if (!dirExists) await RNFS.mkdir(downloadDir);

    const downloadDest = `${downloadDir}/${finalFileName}`;

    // Get auth token
    const token = await getToken();

    // Use secure download endpoint
    const filename = getFileNameFromUrl(fileUrl);
    const secureUrl = `${BASE_URL}/labs/secure-download/${filename}/`;

    const options = {
      fromUrl: secureUrl,
      toFile: downloadDest,
      background: true,
      headers: { Authorization: `Bearer ${token}` },
    };

    const ret = RNFS.downloadFile(options);
    const res = await ret.promise;

    if (res.statusCode === 200) {
      if (Platform.OS === 'android') await RNFS.scanFile(downloadDest);
      Alert.alert('Download Complete', `File saved to: ${downloadDest}`, [
        { text: 'OK', style: 'cancel' },
      ]);
    } else {
      throw new Error(`Server responded with status: ${res.statusCode}`);
    }
  } catch (err) {
    Alert.alert('Download Failed', `An error occurred: ${err.message}`);
  }
};

  const renderReportModal = () => (
    <Modal
      visible={reportModal.visible}
      transparent
      animationType="fade"
      onRequestClose={closeReportModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Test Reports</Text>
          <ScrollView style={{ maxHeight: '70%' }}>
            {reportModal.reports.map((report, idx) => (
              <View key={report.id} style={styles.reportItem}>
                <Text style={styles.reportDesc}>{idx + 1}. {report.description}</Text>
                {report.file && (
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    // onPress={() => handleDownload(report.file)}
                    onPress={() => handleDownload(report.file, getFileNameFromUrl(report.file))}
                  >
                    <Text style={styles.downloadBtnText}>
                      {Platform.OS === 'ios' ? 'Open Report' : 'Download Report'}
                    </Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.reportDate}>
                  {moment(report.published_at).format('MMM D, YYYY [at] h:mm A')}
                </Text>
                {idx < reportModal.reports.length - 1 && (
                  <View style={styles.reportDivider} />
                )}
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
    const statusColor = STATUS_COLORS[item.status] || '#666';
    
    return (
      <View style={styles.patientCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.patientName}>{item.patient_name || 'Unknown Patient'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[item.status] || item.status}</Text>
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Test Type:</Text>
            <Text style={styles.infoValue}>{item.test_type}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date & Time:</Text>
            <Text style={styles.infoValue}>
              {moment(item.scheduled_date).format('MMM D, YYYY [at] h:mm A')}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registration #:</Text>
            <Text style={styles.infoValue}>{item.registration_number}</Text>
          </View>
          
          {item.reports && item.reports.length > 0 && (
            <TouchableOpacity
              style={styles.reportBtn}
              onPress={() => openReportModal(item.reports)}
            >
              <Text style={styles.reportBtnText}>
                View Reports ({item.reports.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {selectedSection === 'today' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancel(item.id)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => handleDone(item.id)}
            >
              <Text style={styles.buttonText}>Mark Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Image 
            source={require('../assets/left-arrow.png')} 
            style={styles.backIcon} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Appointments</Text>
      </View>

      {/* Compact Section Tabs */}
      <View style={styles.sectionTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionTabsContent}
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
              {selectedSection === section.key && (
                <View style={styles.activeTabIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5D5FEF" />
          </View>
        ) : (
          <FlatList
            data={getSectionData()}
            keyExtractor={(item) => item.id}
            renderItem={renderPatientCard}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#5D5FEF']}
                tintColor="#5D5FEF"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {/* <Image 
                  source={require('../assets/empty-appointments.png')} 
                  style={styles.emptyImage}
                /> */}
                <Text style={styles.emptyTitle}>No appointments</Text>
                <Text style={styles.emptySubtitle}>
                  {selectedSection === 'today' 
                    ? "You don't have any appointments today"
                    : `No ${selectedSection} appointments found`}
                </Text>
              </View>
            }
            contentContainerStyle={[
              styles.listContent,
              getSectionData().length === 0 && styles.emptyListContent,
            ]}
          />
        )}
      </View>

      {/* Report Modal */}
      {renderReportModal()}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#4A5568',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  // Section tabs styling
  sectionTabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    height: 48, // Fixed height for tabs container
  },
  sectionTabsContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  sectionTab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 8,
    position: 'relative',
  },
  selectedSectionTab: {
    backgroundColor: '#5D5FEF',
  },
  sectionTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#718096',
  },
  selectedSectionTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: '#5D5FEF',
    borderRadius: 2,
  },
  // Content area styling
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // borderWidth:1,
    borderColor: '#E2E8F0',
    borderBottomWidth:2,
    // elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 110,
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '500',
  },
  reportBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reportBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4299E1',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FED7D7',
    borderRadius: 8,
    marginRight: 8,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#C6F6D5',
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  reportItem: {
    marginBottom: 16,
  },
  reportDesc: {
    fontSize: 15,
    color: '#2D3748',
    marginBottom: 8,
    fontWeight: '500',
  },
  downloadBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  downloadBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4299E1',
  },
  reportDate: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  reportDivider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginTop: 16,
  },
  closeBtn: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#5D5FEF',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TodaysLabTest;