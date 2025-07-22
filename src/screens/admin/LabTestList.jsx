import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import { useNavigation } from '@react-navigation/native';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import RNFS from 'react-native-fs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import moment from 'moment';

const LabTestList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Helper function to extract filename from URL
  const getFileNameFromUrl = (url) => {
    if (!url) return 'report.pdf';
    const fileName = url.split('/').pop().split('?')[0];
    return fileName || 'report.pdf';
  };

  // Request storage permissions for Android
  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android' || Platform.Version >= 30) return true;
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

  // Handle file download
  const handleDownload = async (fileUrl, fileName) => {
    try {
      if (!fileUrl) throw new Error('Invalid file URL');

      const hasStoragePermission = await requestStoragePermission();
      if (!hasStoragePermission) {
        Alert.alert('Permission Denied', 'Cannot download file without storage permission.');
        return;
      }
      await requestNotificationPermission();

      const baseFileName = fileName || getFileNameFromUrl(fileUrl);
      if (!baseFileName || !baseFileName.includes('.')) throw new Error('Invalid filename or extension');
      const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const ext = sanitizedFileName.split('.').pop().toLowerCase();
      const timestamp = Date.now();
      const finalFileName = `${sanitizedFileName.split('.')[0]}_${timestamp}.${ext}`;

      let downloadDir;
      if (Platform.OS === 'android') {
        downloadDir = Platform.Version <= 29 
          ? `${RNFS.ExternalStorageDirectoryPath}/Download` 
          : RNFS.DownloadDirectoryPath;
      } else {
        downloadDir = RNFS.DocumentDirectoryPath;
      }

      const dirExists = await RNFS.exists(downloadDir);
      if (!dirExists) await RNFS.mkdir(downloadDir);

      const downloadDest = `${downloadDir}/${finalFileName}`;
      const token = await getToken();
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
        Alert.alert('Download Complete', `File saved to: ${downloadDest}`);
      } else {
        throw new Error(`Server responded with status: ${res.statusCode}`);
      }
    } catch (err) {
      Alert.alert('Download Failed', `An error occurred: ${err.message}`);
    }
  };

  // Fetch lab appointments
  const fetchLabAppointments = async () => {
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      console.log('Lab appointments fetched:', data);
      if (Array.isArray(data)) {
        setAppointments(data);
      } else {
        console.error("Unexpected response format:", data);
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabAppointments();
  }, []);

  // Filter and pagination logic
  const filteredAppointments = useMemo(() => {
    let result = [...appointments];

    if (filter !== 'ALL') {
      result = result.filter((a) => a.status.toLowerCase() === filter.toLowerCase());
    }

    if (searchQuery.trim() !== '') {
      result = result.filter((a) =>
        a.test_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.lab_profile?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    }

    return result.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));
  }, [appointments, filter, searchQuery]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredAppointments.length / itemsPerPage);
  }, [filteredAppointments]);

  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAppointments.slice(startIndex, endIndex);
  }, [filteredAppointments, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#2ecc71';
      case 'scheduled': return '#3498db';
      case 'pending': return '#f39c12';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  // Render each lab test item
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: '#1c78f2' }]}>
            <MaterialCommunityIcons name="test-tube" size={20} color="#fff" />
          </View>
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.nameText}>{item.patient_name}</Text>
          <Text style={styles.regNumber}>Reg: {item.registration_number}</Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="person-outline" size={18} color="#5d6d7e" />
          <Text style={styles.sectionTitle}>Patient Details</Text>
        </View>
        <View style={styles.detailsGrid}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gender:</Text>
            <Text style={styles.detailValue}>{item.patient?.gender || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Age:</Text>
            <Text style={styles.detailValue}>{item.patient?.age || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue}>{item.patient?.address || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="flask" size={18} color="#5d6d7e" />
          <Text style={styles.sectionTitle}>Test Details</Text>
        </View>
        <View style={styles.timelineContainer}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Test Type</Text>
              <Text style={styles.timelineValue}>{item.test_type || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Lab Profile</Text>
              <Text style={styles.timelineValue}>{item.lab_profile || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Scheduled Date</Text>
              <Text style={styles.timelineValue}>
                {item.scheduled_date ? moment(item.scheduled_date).format('DD MMM YYYY') : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="description" size={18} color="#5d6d7e" />
          <Text style={styles.sectionTitle}>Reports</Text>
        </View>
        {item.reports?.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setSelectedReports(item.reports);
              setModalVisible(true);
            }}
            style={styles.reportsButton}
          >
            <Text style={styles.reportsButtonText}>View Reports ({item.reports.length})</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noReportsText}>No reports available</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Lab Tests</Text>
          <Text style={styles.headerSubtitle}>Patient test records</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setShowSearchInput(prev => !prev)} 
          style={styles.searchButton}
        >
          <Feather name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {showSearchInput && (
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
          <TextInput
            placeholder="Search tests, profiles..."
            placeholderTextColor="#95a5a6"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
         <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsContainer}
      >
        {['ALL', 'SCHEDULED', 'COMPLETED'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, filter === type && styles.activeFilterChip]}
            onPress={() => setFilter(type)}
          >
            <Text style={[styles.filterChipText, filter === type && styles.activeFilterChipText]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>
      

      {/* Appointment List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingAnimation}>
              <Feather name="flask" size={40} color="#1c78f2" />
              <View style={styles.loadingDots}>
                <View style={styles.loadingDot} />
                <View style={styles.loadingDot} />
                <View style={styles.loadingDot} />
              </View>
            </View>
            <Text style={styles.loadingText}>Loading lab tests...</Text>
          </View>
        ) : (
          <FlatList
            data={paginatedAppointments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="flask" size={48} color="#bdc3c7" />
                <Text style={styles.emptyTitle}>No Lab Tests Found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Pagination */}
      {filteredAppointments.length > 0 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
          >
            <Feather name="chevron-left" size={20} color={currentPage === 1 ? "#bdc3c7" : "#1c78f2"} />
          </TouchableOpacity>
          
          <View style={styles.pageIndicator}>
            <Text style={styles.pageText}>{currentPage}</Text>
            <Text style={styles.pageSeparator}>/</Text>
            <Text style={styles.pageText}>{totalPages}</Text>
          </View>
          
          <TouchableOpacity
            onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
          >
            <Feather name="chevron-right" size={20} color={currentPage === totalPages ? "#bdc3c7" : "#1c78f2"} />
          </TouchableOpacity>
        </View>
      )}

      {/* Reports Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Available Reports</Text>
            <ScrollView style={styles.modalScroll}>
              {selectedReports.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  style={styles.reportItem}
                  onPress={() => handleDownload(report.file, report.description)}
                >
                  <MaterialIcons name="picture-as-pdf" size={24} color="#e74c3c" />
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportName}>{report.description ? report.description : 'No Description'}</Text>
                    <Text style={styles.reportDate}>
                      {report.published_at ? moment(report.published_at).format('DD MMM YYYY') : 'N/A'}
                    </Text>
                  </View>
                  <Feather name="download" size={20} color="#1c78f2" />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
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
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
   filterContainer: {
  backgroundColor: '#f5f7fa',
  borderBottomWidth: 1,
  borderBottomColor: '#ecf0f1',
},
  filterChipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 50,
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: '#ecf0f1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#1c78f2',
  },
  filterChipText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  activeFilterChipText: {
    color: '#fff',
  },
  listContainer: {
  flex: 1,
  
},
  listContent: {
    padding: 16,
   
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  regNumber: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#7f8c8d',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    width: '50%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 4,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1c78f2',
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  reportsButton: {
    backgroundColor: '#e8f4fc',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  reportsButtonText: {
    color: '#1c78f2',
    fontWeight: '500',
  },
  noReportsText: {
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 10,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1c78f2',
    marginHorizontal: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#95a5a6',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  paginationButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  pageText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  pageSeparator: {
    fontSize: 16,
    color: '#bdc3c7',
    marginHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    marginBottom: 16,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportName: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  reportDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  modalCloseButton: {
    backgroundColor: '#1c78f2',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default LabTestList;