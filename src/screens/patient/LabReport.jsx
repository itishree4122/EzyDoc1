import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
  Modal,
} from "react-native";
import RNFS from "react-native-fs";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import Icon from "react-native-vector-icons/FontAwesome5";
import { BASE_URL } from "../auth/Api";
import { getToken } from "../auth/tokenHelper";
import Share from "react-native-share";
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Header from "../../components/Header";
// import Pdf from 'react-native-pdf';

// import DownloadManager from "react-native-android-download-manager";

const LabReport = () => {
  const navigation = useNavigation();
  const [labTests, setLabTests] = useState([]);
  const [labProfiles, setLabProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
//   const [previewVisible, setPreviewVisible] = useState(false);
// const [previewSource, setPreviewSource] = useState(null);
// const [previewType, setPreviewType] = useState(null); // 'pdf' or 'image'
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      // Fetch lab tests (with reports)
      // const testsRes = await fetch(`${BASE_URL}/labs/lab-tests/`, {
      const testsRes = await fetchWithAuth(`${BASE_URL}/labs/lab-tests/`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!testsRes.ok) throw new Error("Failed to fetch lab tests");
      const testsData = await testsRes.json();

      // Fetch lab types (to get lab_profiles)
      // const labTypesRes = await fetch(`${BASE_URL}/labs/lab-types/`, {
      const labTypesRes = await fetchWithAuth(`${BASE_URL}/labs/lab-types/`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!labTypesRes.ok) throw new Error("Failed to fetch lab types");
      const labTypesData = await labTypesRes.json();

      // Flatten all lab_profiles into a map by id for quick lookup
      const profileMap = {};
      labTypesData.forEach(type => {
        (type.lab_profiles || []).forEach(profile => {
          profileMap[profile.id] = {
            name: profile.name,
            address: profile.address,
            phone: profile.phone,
          };
        });
      });
      console.log("Lab Profiles Map:", profileMap);
      console.log("Lab types data:", labTypesData);
      setLabProfiles(profileMap);
      setLabTests(testsData);
    } catch (err) {
      console.error("Error fetching lab tests/types:", err);
      Alert.alert("Error", "Unable to fetch lab tests or lab profiles.");
    } finally {
      setLoading(false);
    }
  };
// const handleDownload = async (fileUrl, fileName, reportId) => {
//   try {
//     setDownloading(reportId);

//     // Sanitize filename
//     const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
//     const ext = sanitizedFileName.split(".").pop().toLowerCase();
//     const timestamp = Date.now();
//     const finalFileName = `${sanitizedFileName}_${timestamp}.${ext}`;

//     // Download destination
//     const downloadDest =
//       Platform.OS === "android"
//         ? `${RNFS.DownloadDirectoryPath}/${finalFileName}`
//         : `${RNFS.DocumentDirectoryPath}/${finalFileName}`;

//     // Get auth token
//     const token = await getToken();

//     // Download file
//     const options = {
//       fromUrl: fileUrl,
//       toFile: downloadDest,
//       background: true,
//       headers: { Authorization: `Bearer ${token}` },
//     };

//     const ret = RNFS.downloadFile(options);
//     const res = await ret.promise;

//     if (res.statusCode === 200) {
//       // Notify Android MediaStore
//       if (Platform.OS === "android") {
//         await RNFS.scanFile(downloadDest);
//       }

//       // Verify file exists
//       if (!(await RNFS.exists(downloadDest))) {
//         throw new Error("Downloaded file does not exist");
//       }

//       // Show alert without "Open" option
//       Alert.alert(
//         "Download Complete",
//         `File saved to: ${downloadDest}`,
//         [
//           { text: "OK", style: "cancel" },
//         ]
//       );
//     } else {
//       Alert.alert("Download Failed", `Server responded with status: ${res.statusCode}`);
//     }
//   } catch (err) {
//     console.error("Download error:", err);
//     Alert.alert("Download Failed", `An error occurred: ${err.message}`);
//   } finally {
//     setDownloading(null);
//   }
// };

// Extract filename from URL
const getFileNameFromUrl = (url) => {
  if (!url) return 'downloaded_file';
  const fileName = url.split('/').pop().split('?')[0];
  return fileName || 'downloaded_file';
};

// Request storage permissions for Android 10 and below
const requestStoragePermission = async () => {
  if (Platform.OS !== 'android' || Platform.Version >= 30) {
    return true; // Android 11+ uses Scoped Storage
  }

  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    ];
    const granted = await PermissionsAndroid.requestMultiple(permissions);
    const hasPermission =
      granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
        PermissionsAndroid.RESULTS.GRANTED;
    console.log('Storage permissions granted:', hasPermission);
    return hasPermission;
  } catch (err) {
    console.warn('Permission request error:', err);
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
      console.log('Notification permission granted:', granted === PermissionsAndroid.RESULTS.GRANTED);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Notification permission error:', err);
      return false;
    }
  }
  return true;
};

const handleDownload = async (fileUrl, fileName, reportId) => {
  try {
    setDownloading(reportId);

    // Validate input
    if (!fileUrl) {
      throw new Error('Invalid file URL');
    }

    // Request permissions
    const hasStoragePermission = await requestStoragePermission();
    if (!hasStoragePermission) {
      Alert.alert('Permission Denied', 'Cannot download file without storage permission.');
      return;
    }

    await requestNotificationPermission(); // For Android 13+ notifications

    // Sanitize and prepare filename
    const baseFileName = fileName || getFileNameFromUrl(fileUrl);
    if (!baseFileName || !baseFileName.includes('.')) {
      throw new Error('Invalid filename or extension');
    }

    const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const ext = sanitizedFileName.split('.').pop().toLowerCase();
    const timestamp = Date.now();
    const finalFileName = `${sanitizedFileName.split('.')[0]}_${timestamp}.${ext}`;

    // Determine download destination
    const isAndroid = Platform.OS === 'android';
    const isAndroid10 = isAndroid && Platform.Version === 29;
    const isAndroid9OrBelow = isAndroid && Platform.Version <= 28;

    let downloadDir;
    if (isAndroid) {
      if (isAndroid10 || isAndroid9OrBelow) {
        downloadDir = `${RNFS.ExternalStorageDirectoryPath}/Download`;
      } else {
        downloadDir = RNFS.DownloadDirectoryPath; // Android 11+
      }
    } else {
      downloadDir = RNFS.DocumentDirectoryPath; // iOS
    }

    // Log directory for debugging
    console.log('Download directory:', downloadDir);

    // Ensure download directory exists
    const dirExists = await RNFS.exists(downloadDir);
    console.log('Directory exists:', dirExists);
    if (!dirExists) {
      console.log('Creating directory:', downloadDir);
      await RNFS.mkdir(downloadDir);
    }

    const downloadDest = `${downloadDir}/${finalFileName}`;
    console.log('Download destination:', downloadDest);

    // Get auth token
    const token = await getToken();

    // Download options
    // const options = {
    //   fromUrl: fileUrl,
    //   toFile: downloadDest,
    //   background: true,
    //   headers: { Authorization: `Bearer ${token}` },
    // };
    // Extract just the filename from the fileUrl
const filename = getFileNameFromUrl(fileUrl);
const secureUrl = `${BASE_URL}/labs/secure-download/${filename}/`;

const options = {
  fromUrl: secureUrl,
  toFile: downloadDest,
  background: true,
  headers: { Authorization: `Bearer ${token}` },
};

    console.log('Starting download with options:', options);

    const ret = RNFS.downloadFile(options);
    const res = await ret.promise;
    console.log('Download response:', res);

    if (res.statusCode === 200) {
      // Verify file exists
      const fileExists = await RNFS.exists(downloadDest);
      console.log('File exists after download:', fileExists);
      if (!fileExists) {
        throw new Error('Downloaded file does not exist');
      }

      // Notify Android Media Store
      if (isAndroid) {
        console.log('Scanning file for Media Store:', downloadDest);
        await RNFS.scanFile(downloadDest);
      }

      Alert.alert('Download Complete', `File saved to: ${downloadDest}`, [
        { text: 'OK', style: 'cancel' },
      ]);
    } else {
      throw new Error(`Server responded with status: ${res.statusCode}`);
    }
  } catch (err) {
    console.error('Download error:', err);
    Alert.alert('Download Failed', `An error occurred: ${err.message}`);
  } finally {
    setDownloading(null);
  }
};


// Share-Download
// const handleDownload = async (fileUrl, fileName) => {
//   try {
//     let finalFileName = fileName || fileUrl.split("/").pop();
//     let downloadDest = `${RNFS.DocumentDirectoryPath}/${finalFileName}`;

//     // Download the file
//     const options = {
//       fromUrl: fileUrl,
//       toFile: downloadDest,
//     };
//     const result = await RNFS.downloadFile(options).promise;

//     if (result.statusCode === 200) {
//       Alert.alert(
//         "Download Complete",
//         "File downloaded. Tap OK to open or share.",
//         [
//           {
//             text: "OK",
//             onPress: async () => {
//               await Share.open({
//                 url: 'file://' + downloadDest,
//                 showAppsToView: true,
//               });
//             }
//           }
//         ]
//       );
//     } else {
//       Alert.alert("Download failed", "An error occurred while downloading the file.");
//     }
//   } catch (error) {
//     Alert.alert("Download failed", `An error occurred: ${error.message}`);
//   }
// };
  // Render a single report file (PDF or image)
  const renderReportFile = (report, idx) => {
    const isPdf = report.file.toLowerCase().endsWith(".pdf");
    const fileName = getFileNameFromUrl(report.file);

    return (
      <View key={report.id} style={styles.reportFileContainer}>
        <View style={styles.reportFileRow}>
          <View style={styles.iconCircle}>
            <Icon
              name={isPdf ? "file-pdf" : "file-image"}
              size={28}
              color={isPdf ? "#e74c3c" : "#6495ED"}
              solid
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.fileName}>{fileName}</Text>
            <Text style={styles.reportDate}>
              {moment(report.published_at).format("MMM D, YYYY h:mm A")}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => handleDownload(report.file, fileName, report.id)}
            disabled={downloading === report.id}
          >
            {downloading === report.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="download" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.downloadText}>Download</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.reportInfoSection}>
          <Text style={styles.reportDescLabel}>Description:</Text>
          <Text style={styles.reportDesc}>{report.description || "No description"}</Text>
        </View>
     {/* {isPdf ? (
  <TouchableOpacity
    style={styles.openBtn}
    onPress={async () => {
      const token = await getToken();
      setPreviewSource({
        uri: `${BASE_URL}/labs/secure-download/${getFileNameFromUrl(report.file)}/`,
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreviewType('pdf');
      setPreviewVisible(true);
    }}
  >
    <Text style={styles.openText}>Open PDF</Text>
  </TouchableOpacity>
) : (
  <TouchableOpacity
    style={styles.openBtn}
    onPress={async () => {
      const token = await getToken();
      setPreviewSource({
        uri: `${BASE_URL}/labs/secure-download/${getFileNameFromUrl(report.file)}/?token=${token}`
      });
      setPreviewType('image');
      setPreviewVisible(true);
    }}
  >
    <Text style={styles.openText}>Open</Text>
  </TouchableOpacity>
)} */}
      </View>
    );
  };

  // Render a single test card with its reports and lab profile info
  const renderTestCard = (test, idx) => {
    const labProfile = labProfiles[test.lab_profile] || {};

    return (
      <View key={test.id} style={styles.testCard}>
        <View style={styles.testHeader}>
          <View style={styles.testIconCircle}>
            <Icon name="flask" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.testTitle}>{test.test_type}</Text>
            <Text style={styles.testPatient}>{test.patient_name}</Text>
            <Text style={styles.testInfo}>
              <Text style={styles.testInfoLabel}>Reg. No:</Text>{" "}
              <Text style={styles.testInfoBold}>{test.registration_number}</Text>
            </Text>
            <Text style={styles.testInfo}>
              <Text style={styles.testInfoLabel}>Scheduled:</Text>{" "}
              {moment(test.scheduled_date).format("MMM D, YYYY")}
            </Text>
            <Text style={styles.testStatus}>
              Status:{" "}
              <Text
                style={[
                  styles.statusText,
                  test.status === "COMPLETED"
                    ? styles.statusCompleted
                    : styles.statusScheduled,
                ]}
              >
                {test.status}
              </Text>
            </Text>
          </View>
        </View>
        <View style={styles.labProfileSection}>
          <Text style={styles.labProfileLabel}>Lab Profile:</Text>
          <Text style={styles.labProfileName}>{labProfile.name || "N/A"}</Text>
          {labProfile.address && (
            <Text style={styles.labProfileAddress}>{labProfile.address}</Text>
          )}
          {labProfile.phone && (
            <Text style={styles.labProfilePhone}>Phone: {labProfile.phone}</Text>
          )}
        </View>
        <View style={styles.reportsSection}>
          {test.reports && test.reports.length > 0 ? (
            test.reports.map((report, rIdx) => renderReportFile(report, `${idx}_${rIdx}`))
          ) : (
            <Text style={styles.noReportAvailable}>No reports available yet.</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.backIconContainer}>
            <Image
            source={require("../assets/UserProfile/back-arrow.png")} // Replace with your back arrow image
            style={styles.backIcon}
            />
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>Lab Test Reports</Text>
      </View> */}
<Header title="Lab Test Reports"/>

      {/* Content */}
      <View style={styles.card}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#6495ED" />
            <Text style={{ color: "#6495ED", marginTop: 10 }}>Loading reports...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {labTests.length === 0 ? (
              <Text style={styles.noReportsText}>No lab tests found.</Text>
            ) : (
              labTests.map((test, idx) => renderTestCard(test, idx))
            )}
          </ScrollView>
        )}
      </View>

{/* <Modal visible={previewVisible} onRequestClose={() => setPreviewVisible(false)}>
  <View style={{ flex: 1, backgroundColor: '#000' }}>
    {previewType === 'pdf' && previewSource && (
      <Pdf
        source={previewSource}
        style={{ flex: 1 }}
        onError={error => Alert.alert('Error', error.message)}
      />
    )}
    {previewType === 'image' && previewSource && (
      <Image
        source={previewSource}
        style={{ flex: 1, resizeMode: 'contain', backgroundColor: '#000' }}
      />
    )}
    <TouchableOpacity
      style={{ position: 'absolute', top: 40, right: 20, backgroundColor: '#fff', padding: 8, borderRadius: 20 }}
      onPress={() => setPreviewVisible(false)}
    >
      <Text style={{ color: '#6495ED', fontWeight: 'bold' }}>Close</Text>
    </TouchableOpacity>
  </View>
</Modal> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c78f2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 10,
  },
  backIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: "#7EB8F9",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 18,
    height: 18,
    tintColor: "#fff", // Matches your theme
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 0,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  testCard: {
    backgroundColor: "#F6F8FA",
    borderRadius: 14,
    marginBottom: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
  },
  testHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  testIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6495ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#22223b",
    marginBottom: 2,
  },
  testPatient: {
    fontSize: 13,
    color: "#6495ED",
    marginBottom: 2,
  },
  testInfo: {
    fontSize: 12,
    color: "#555",
  },
  testInfoLabel: {
    color: "#888",
    fontWeight: "500",
  },
  testInfoBold: {
    fontWeight: "bold",
    color: "#22223b",
  },
  testStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  statusText: {
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  statusCompleted: {
    color: "#22bb33",
  },
  statusScheduled: {
    color: "#ff9800",
  },
  labProfileSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  labProfileLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "bold",
  },
  labProfileName: {
    fontSize: 13,
    color: "#6495ED",
    fontWeight: "bold",
    marginTop: 2,
  },
  labProfileAddress: {
    fontSize: 12,
    color: "#555",
    marginTop: 1,
  },
  labProfilePhone: {
    fontSize: 12,
    color: "#555",
    marginTop: 1,
  },
  reportsSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10,
  },
  reportFileContainer: {
    marginBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  reportFileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  fileName: {
    fontSize: 15,
    color: "#22223b",
    fontWeight: "bold",
  },
  reportDate: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6495ED",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  downloadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  reportInfoSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  reportDescLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "bold",
  },
  reportDesc: {
    fontSize: 13,
    color: "#22223b",
    fontWeight: "500",
    marginTop: 2,
  },
  openBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  openText: {
    color: "#6495ED",
    fontSize: 12,
    fontWeight: "bold",
  },
  noReportsText: {
    textAlign: "center",
    color: "#888",
    fontSize: 15,
    marginTop: 40,
  },
  noReportAvailable: {
    color: "#888",
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 4,
    marginBottom: 2,
  },
});

export default LabReport;