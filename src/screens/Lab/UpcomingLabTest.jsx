import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
// import FilePickerManager from 'react-native-file-picker';
import {pick, types, isCancel} from '@react-native-documents/picker';
// import DocumentPicker from 'react-native-document-picker';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import moment from 'moment';
import RNFS from 'react-native-fs';
import { fetchWithAuth } from '../auth/fetchWithAuth';
const LabTestReports = () => {
  const [reports, setReports] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [selectedLabTest, setSelectedLabTest] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
// Helper to extract filename from URL
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
  // Fetch all lab reports (not filtered by test)
  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      // const res = await fetch(`${BASE_URL}/labs/lab-reports/`, {
      const res = await fetchWithAuth(`${BASE_URL}/labs/lab-reports/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setReports(data);
      else {
        console.error('Fetch reports error:', data);
        Alert.alert('Error', 'Could not fetch reports');
      }
    } catch (err) {
      console.error('Fetch reports exception:', err);
      Alert.alert('Error', 'Could not fetch reports');
    } finally {
      setLoading(false);
    }
  };
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
  // Fetch all lab tests for dropdown
  const fetchLabTests = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      // const res = await fetch(`${BASE_URL}/labs/lab-tests/`, {
      const res = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLabTests(data);
        if (data.length > 0) setSelectedLabTest(data[0].id);
      } else {
        Alert.alert('Error', 'Could not fetch lab tests');
      }
    } catch {
      Alert.alert('Error', 'Could not fetch lab tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchLabTests();
  }, []);

  // Upload report for selected lab test
const requestStoragePermissionForPick = async () => {
  if (Platform.OS === 'android') {
    try {
      if (Platform.Version >= 33) {
        // Android 13+ granular permissions
        const imagePerm = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
        const videoPerm = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
        );
        const audioPerm = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
        );
        // Also request legacy permission for compatibility
        const legacyPerm = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        return (
          imagePerm === PermissionsAndroid.RESULTS.GRANTED ||
          videoPerm === PermissionsAndroid.RESULTS.GRANTED ||
          audioPerm === PermissionsAndroid.RESULTS.GRANTED ||
          legacyPerm === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // Older Android versions
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to select files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      return false;
    }
  }
  return true;
};

// const pickFile = async () => {
//   const hasPermission = await requestStoragePermission();
//   if (!hasPermission) {
//     Alert.alert('Permission denied', 'Cannot select file without storage permission.');
//     return;
//   }
//   FilePickerManager.showFilePicker(null, (response) => {
//     if (response.didCancel) {
//       // User cancelled
//     } else if (response.error) {
//       Alert.alert('Error', 'File selection failed');
//     } else {
//       setFile({
//         uri: response.uri,
//         name: response.fileName,
//         type: response.type || 'application/octet-stream',
//       });
//     }
//   });
// };
const pickFile = async () => {
  try {
    const [file] = await pick({
      type: [types.allFiles],
    });
    if (file && file.uri.startsWith('content://')) {
      // Copy to temp path
      const destPath = `${RNFS.TemporaryDirectoryPath}/${file.name}`;
      await RNFS.copyFile(file.uri, destPath);
      setFile({
        uri: 'file://' + destPath,
        name: file.name,
        type: file.type || 'application/octet-stream',
      });
    } else if (file) {
      setFile({
        uri: file.uri,
        name: file.name,
        type: file.type || 'application/octet-stream',
      });
    }
  } catch (err) {
    if (isCancel(err)) {
      // User cancelled
    } else {
      Alert.alert('Error', 'File selection failed');
    }
  }
};
const MAX_FILE_SIZE = 1024 * 1024 ; // 1 MB

  const uploadReport = async () => {
    if (!file) return Alert.alert('Select a file');
    if (!selectedLabTest) return Alert.alert('Select a lab test');
     try {
    const stat = await RNFS.stat(file.uri.replace('file://', ''));
    if (stat.size > MAX_FILE_SIZE) {
      return Alert.alert('File Too Large', 'Please select a file smaller than 1 MB.');
    }
  } catch (e) {
    // handle stat error
  }
    setUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('lab_test', selectedLabTest);
      formData.append('description', desc);
      formData.append('file', {
  uri: file.uri,
  name: file.name,
  type: file.type || 'application/octet-stream',
});
      console.log("Form data:", formData);
      // const res = await fetch(`${BASE_URL}/labs/lab-reports/`, {
      const res = await fetchWithAuth(`${BASE_URL}/labs/lab-reports/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      if (res.ok) {
        setDesc('');
        setFile(null);
        fetchReports();
        Alert.alert('Success', 'Report uploaded');
      } else {
        const data = await res.json();
        Alert.alert('Error', data?.detail || 'Upload failed');
      }
    } catch {
      Alert.alert('Error', 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
const deleteReport = async (reportId) => {
  Alert.alert(
    'Delete Report',
    'Are you sure you want to delete this report?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getToken();
            // const res = await fetch(`${BASE_URL}/labs/lab-reports/${reportId}/`, {
            const res = await fetchWithAuth(`${BASE_URL}/labs/lab-reports/${reportId}/`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              Alert.alert('Deleted', 'Report deleted successfully');
              closeModal();
              fetchReports();
            } else {
              const data = await res.json();
              Alert.alert('Error', data?.detail || 'Could not delete report');
            }
          } catch (err) {
            Alert.alert('Error', 'Could not delete report');
          }
        },
      },
    ]
  );
};

  const openReport = (report) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedReport(null);
  };

  // const handleDownload = (url) => {
  //   Linking.openURL(url);
  // };

  // Helper to get test info for a report
  const getTestInfo = (lab_test_id) => {
  const test = labTests.find((t) => t.id === lab_test_id);
  if (!test) return {};
  return {
    testType: test.test_type,
    scheduledDate: moment(test.scheduled_date).format('YYYY-MM-DD'),
    registrationNumber: test.registration_number,
    status: test.status,
    patient: test.patient,
    patientName: test.patient_name,
  };
};

const renderReport = ({ item }) => {
  const testInfo = getTestInfo(item.lab_test);
  return (
    <TouchableOpacity style={styles.reportCard} onPress={() => openReport(item)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.reportDesc} numberOfLines={1}>{item.description || 'No description'}</Text>
        <Text style={styles.reportTest}>Test: {testInfo.testType || '-'}</Text>
        {/* <Text style={styles.reportTest}>Patient: {testInfo.patient?.user_id || '-'}</Text> */}
        <Text style={styles.reportTest}>Patient Name: {testInfo.patientName || '-'}</Text>
        <Text style={styles.reportTest}>Patient ID: {testInfo.patient?.user_id || '-'}</Text>
        <Text style={styles.reportTest}>Reg. No: {testInfo.registrationNumber || '-'}</Text>
        <Text style={styles.reportTest}>Date: {moment(testInfo.scheduledDate,'YYYY-MM-DD').format('DD-MM-YYYY') || '-'}</Text>
        <Text style={styles.reportTest}>Status: {testInfo.status || '-'}</Text>
      </View>
      <Text style={styles.reportDate}>{moment(item.published_at).format('YYYY-MM-DD hh:mm A')}</Text>
      {/* <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(item.file)}>
        <Text style={styles.downloadBtnText}>Download</Text>
      </TouchableOpacity> */}
      <TouchableOpacity
  style={styles.downloadBtn}
  onPress={() => handleDownload(item.file, getFileNameFromUrl(item.file))}
>
  <Text style={styles.downloadBtnText}>Download</Text>
</TouchableOpacity>
    </TouchableOpacity>
  );
};

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>All Lab Reports</Text>

      {loading ? (
        <ActivityIndicator color="#1c78f2" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          renderItem={renderReport}
          ListEmptyComponent={<Text style={styles.empty}>No reports uploaded yet.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Upload Section */}
      <View style={styles.uploadSection}>
        <Text style={styles.pickerLabel}>Upload New Report</Text>
        <View style={styles.pickerWrapper}>
          <Picker
  selectedValue={selectedLabTest}
  style={styles.picker}
  onValueChange={(itemValue) => setSelectedLabTest(itemValue)}
>
  {labTests.map((test) => (
    <Picker.Item
      key={test.id}
      label={
        `${test.patient_name || '-'} | Reg: ${test.registration_number || '-'} | ` +
        `${test.test_type || '-'} | Date: ${moment(test.scheduled_date).format('YYYY-MM-DD')}`
      }
      value={test.id}
    />
  ))}
</Picker>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={desc}
          onChangeText={setDesc}
          placeholderTextColor="#A0A4AE"
        />
        <TouchableOpacity style={styles.fileBtn} onPress={pickFile}>
          <Text style={styles.fileBtnText}>{file ? file.name : 'Choose File'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}
          onPress={uploadReport}
          disabled={uploading}
        >
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadBtnText}>Upload</Text>}
        </TouchableOpacity>
      </View>

      {/* Report Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Details</Text>
            {selectedReport && (() => {
  const testInfo = getTestInfo(selectedReport.lab_test);
  return (
    <>
      <Text style={styles.modalLabel}>Description:</Text>
  <Text style={styles.modalValue}>{selectedReport.description || 'No description'}</Text>
  <Text style={styles.modalLabel}>Test:</Text>
  <Text style={styles.modalValue}>{testInfo.testType || '-'}</Text>
  <Text style={styles.modalLabel}>Patient Name:</Text>
  <Text style={styles.modalValue}>{testInfo.patientName || '-'}</Text>
  <Text style={styles.modalLabel}>Patient ID:</Text>
  <Text style={styles.modalValue}>{testInfo.patient?.user_id || '-'}</Text>
  <Text style={styles.modalLabel}>Registration No:</Text>
  <Text style={styles.modalValue}>{testInfo.registrationNumber || '-'}</Text>
  <Text style={styles.modalLabel}>Date:</Text>
  <Text style={styles.modalValue}>{moment(testInfo.scheduledDate,'YYYY-MM-DD').format('DD-MM-YYYY') || '-'}</Text>
  <Text style={styles.modalLabel}>Status:</Text>
  <Text style={styles.modalValue}>{testInfo.status || '-'}</Text>
  <Text style={styles.modalLabel}>Published:</Text>
  <Text style={styles.modalValue}>{moment(selectedReport.published_at).format('YYYY-MM-DD hh:mm A')}</Text>
      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() => handleDownload(selectedReport.file)}
      >
        <Text style={styles.downloadBtnText}>Open / Download File</Text>
      </TouchableOpacity>
      <TouchableOpacity
      style={[styles.downloadBtn, { backgroundColor: '#ffdddd', marginTop: 10 }]}
      onPress={() => deleteReport(selectedReport.id)}
    >
      <Text style={[styles.downloadBtnText, { color: '#d00' }]}>Delete Report</Text>
    </TouchableOpacity>
    </>
  );
})()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8faff', padding: 16 },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c78f2',
    marginBottom: 10,
    alignSelf: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    color: '#222',
    marginBottom: 4,
    marginLeft: 2,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d0d7e2',
    borderRadius: 7,
    backgroundColor: '#f9fafd',
    marginBottom: 10,
  },
  picker: {
    height: 60,
    width: '100%',
    color: '#000',
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginVertical: 6,
    borderWidth: 0.5,
    borderColor: '#e3e6ee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportDesc: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
  },
  reportTest: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    marginBottom: 2,
  },
  reportDate: {
    fontSize: 12,
    color: '#888',
    marginLeft: 10,
    marginRight: 10,
  },
  downloadBtn: {
    backgroundColor: '#f2f7ff',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: 4,
  },
  downloadBtnText: {
    color: '#0047ab',
    fontWeight: '500',
    fontSize: 13,
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 30,
    fontSize: 14,
  },
  uploadSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginTop: 18,
    borderWidth: 0.5,
    borderColor: '#e3e6ee',
    shadowOpacity: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d7e2',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: '#f9fafd',
    color: '#222',
  },
  fileBtn: {
    backgroundColor: '#f2f7ff',
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  fileBtnText: {
    color: '#0047ab',
    fontWeight: '500',
    fontSize: 14,
  },
  uploadBtn: {
    backgroundColor: '#1c78f2',
    borderRadius: 7,
    paddingVertical: 10,
    alignItems: 'center',
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c78f2',
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 8,
  },
  modalValue: {
    fontSize: 14,
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: 14,
    backgroundColor: '#1c78f2',
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 28,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default LabTestReports;