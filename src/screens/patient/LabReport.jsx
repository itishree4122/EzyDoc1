import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Alert,
  Platform,
  PermissionsAndroid,
} from "react-native";
import RNFS from "react-native-fs";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import Icon from "react-native-vector-icons/FontAwesome5";
import { BASE_URL } from "../auth/Api";
import { getToken } from "../auth/tokenHelper";
// import DownloadManager from "react-native-android-download-manager";

const LabReport = () => {
  const navigation = useNavigation();
  const [labTests, setLabTests] = useState([]);
  const [labProfiles, setLabProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      // Fetch lab tests (with reports)
      const testsRes = await fetch(`${BASE_URL}/labs/lab-tests/`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!testsRes.ok) throw new Error("Failed to fetch lab tests");
      const testsData = await testsRes.json();

      // Fetch lab types (to get lab_profiles)
      const labTypesRes = await fetch(`${BASE_URL}/labs/lab-types/`, {
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

  // Download file using react-native-fs
  // const handleDownload = async (fileUrl, fileName, reportId) => {
  //   try {
  //     setDownloading(reportId);

  //     // Ask for permission on Android
  //     if (Platform.OS === "android") {
  //       const granted = await PermissionsAndroid.request(
  //         PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  //         {
  //           title: "Storage Permission Required",
  //           message: "App needs access to your storage to download the report",
  //           buttonNeutral: "Ask Me Later",
  //           buttonNegative: "Cancel",
  //           buttonPositive: "OK",
  //         }
  //       );
  //       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
  //         Alert.alert("Permission Denied", "Storage permission is required to download files.");
  //         setDownloading(null);
  //         return;
  //       }
  //     }

  //     const ext = fileUrl.split(".").pop().split("?")[0];
  //     const downloadDest =
  //       Platform.OS === "android"
  //         ? `${RNFS.DownloadDirectoryPath}/${fileName}_${Date.now()}.${ext}`
  //         : `${RNFS.DocumentDirectoryPath}/${fileName}_${Date.now()}.${ext}`;

  //     const options = {
  //       fromUrl: fileUrl,
  //       toFile: downloadDest,
  //       background: true,
  //     };

  //     const ret = RNFS.downloadFile(options);
  //     const res = await ret.promise;

  //     if (res.statusCode === 200) {
  //       Alert.alert("Download Complete", `File saved to:\n${downloadDest}`);
  //     } else {
  //       Alert.alert("Download Failed", "Could not download the file.");
  //     }
  //   } catch (err) {
  //     Alert.alert("Download Failed", "Could not download the file.");
  //   } finally {
  //     setDownloading(null);
  //   }
  // };
const handleDownload = async (fileUrl, fileName, reportId) => {
  try {
    setDownloading(reportId);

    // No permission needed for app-specific directory on Android 11+
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const ext = sanitizedFileName.split(".").pop();
    const downloadDest =
      Platform.OS === "android"
        ? `${RNFS.ExternalDirectoryPath}/${sanitizedFileName}_${Date.now()}.${ext}`
        : `${RNFS.DocumentDirectoryPath}/${sanitizedFileName}_${Date.now()}.${ext}`;

    const options = {
      fromUrl: fileUrl,
      toFile: downloadDest,
      background: true,
    };

    const ret = RNFS.downloadFile(options);
    const res = await ret.promise;

    if (res.statusCode === 200) {
      Alert.alert("Download Complete", `File saved to:\n${downloadDest}`);
    } else {
      Alert.alert("Download Failed", "Could not download the file.");
    }
  } catch (err) {
    Alert.alert("Download Failed", "Could not download the file.");
  } finally {
    setDownloading(null);
  }
};

  // Extract file name from URL
  // const getFileNameFromUrl = (url) => {
  //   try {
  //     return decodeURIComponent(url.split("/").pop().split("?")[0]);
  //   } catch {
  //     return "report";
  //   }
  // };
  const getFileNameFromUrl = (url) => {
  try {
    let name = decodeURIComponent(url.split("/").pop().split("?")[0]);
    // Remove problematic characters for file systems
    name = name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    return name;
  } catch {
    return "report";
  }
};

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
        {isPdf && (
          <TouchableOpacity
            style={styles.openBtn}
            onPress={() => Linking.openURL(report.file)}
          >
            <Text style={styles.openText}>Open PDF</Text>
          </TouchableOpacity>
        )}
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.backIconContainer}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>Lab Test Reports</Text>
      </View>

      {/* Content */}
      <View style={styles.card}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#6495ED" />
            <Text style={{ color: "#6495ED", marginTop: 10 }}>Loading reports...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {labTests.length === 0 ? (
              <Text style={styles.noReportsText}>No lab tests found.</Text>
            ) : (
              labTests.map((test, idx) => renderTestCard(test, idx))
            )}
          </ScrollView>
        )}
      </View>
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
    backgroundColor: "#AFCBFF",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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