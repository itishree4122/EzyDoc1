import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import {getToken} from '../auth/tokenHelper'; // make sure path is correct
import {BASE_URL} from '../auth/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import moment from 'moment';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const Prescription = () => {
  const navigation = useNavigation();
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showUploadedView, setShowUploadedView] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const cameraGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        const storageGranted = await PermissionsAndroid.request(
          Platform.Version >= 33
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        return (
          cameraGranted === PermissionsAndroid.RESULTS.GRANTED &&
          storageGranted === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleAddPrescription = () => {
    Alert.alert(
      "Add Prescription Image",
      "Choose an option",
      [
        { text: "Camera", onPress: () => openCamera() },
        { text: "Gallery", onPress: () => openGallery() },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const uploadPrescriptionImage = async (imageUri, index = 0) => {
    try {
      const token = await getToken();
      const patientId = await AsyncStorage.getItem("patientId");

      if (!token || !patientId) {
        Alert.alert("Error", "Missing token or patient ID");
        return;
      }

      const base64Data = await RNFS.readFile(imageUri, "base64");

      const response = await fetch(`${BASE_URL}/patients/prescriptions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file: base64Data,
          description: `Prescription ${index + 1}`,
          patient: parseInt(patientId),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Upload failed:", errText);
        Alert.alert("Error", "Upload failed");
        return;
      }

      Alert.alert("Success", "Image uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Error", "Failed to upload image");
    }
  };

  const openCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert("Permission denied");
      return;
    }

    launchCamera({ mediaType: "photo", saveToPhotos: true }, async (response) => {
      if (!response.didCancel && !response.errorCode && response.assets) {
        const imageUri = response.assets[0].uri;
        setSelectedImages((prev) => [...prev, imageUri]);
        await uploadPrescriptionImage(imageUri);
      }
    });
  };

  const openGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert("Permission denied");
      return;
    }

    launchImageLibrary({ mediaType: "photo", selectionLimit: 0 }, async (response) => {
      if (!response.didCancel && !response.errorCode && response.assets) {
        const uris = response.assets.map((asset) => asset.uri);
        setSelectedImages((prev) => [...prev, ...uris]);

        for (let i = 0; i < uris.length; i++) {
          await uploadPrescriptionImage(uris[i], i);
        }
      }
    });
  };

  const removeImage = (indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const fetchUploadedImages = async () => {
    try {
      const token = await getToken();
      const patientUserId = await AsyncStorage.getItem("patientId");
      if (!token || !patientUserId) {
        Alert.alert("Error", "Missing token or patient user ID");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/patients/prescriptions/?patient_user_id=${patientUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("Fetch error:", errText);
        Alert.alert("Error", "Failed to fetch uploaded images");
        return;
      }

      const data = await response.json();
      const sortedData = data.sort(
        (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
      );
      setUploadedImages(sortedData);
      setShowUploadedView(true); // ✅ Toggle to show uploaded images
    } catch (err) {
      console.error("Error fetching images:", err);
      Alert.alert("Error", "Unable to load images");
    }
  };

  // delete function
  const confirmDelete = (imageId) => {
  Alert.alert(
    "Confirm Delete",
    "Are you sure you want to delete this prescription?",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", onPress: () => handleDeleteUploadedImage(imageId), style: "destructive" }
    ]
  );
};

const handleDeleteUploadedImage = async (imageId) => {
  try {
    const token = await getToken();

    if (!token) {
      Alert.alert("Error", "Authentication token not found.");
      return;
    }

    const response = await fetch(`${BASE_URL}/patients/prescriptions/${imageId}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: '*/*', // optional, safe default
      },
    });

    if (response.ok) {
      setUploadedImages(prev => prev.filter(img => img.id !== imageId));
      Alert.alert("Deleted", "Prescription deleted successfully.");
    } else {
      const errorText = await response.text();
      console.error("Delete failed:", response.status, errorText);
      Alert.alert("Error", "Failed to delete prescription.");
    }
  } catch (error) {
    console.error("Delete error:", error);
    Alert.alert("Error", "Something went wrong while deleting.");
  }
};


// expand image
const handleImagePress = (index) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.backIconContainer}>
            <Image
              source={require("../assets/UserProfile/back-arrow.png")}
              style={styles.backIcon}
            />
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>Add Prescription</Text>
      </View>

      {/* Toggle Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowUploadedView(false)}
        >
          <Text style={styles.buttonText}>Upload Image</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={fetchUploadedImages}
        >
          <Text style={styles.buttonText}>View Uploaded</Text>
        </TouchableOpacity>
      </View>

      {/* Content View */}
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.imageGrid}>
          {!showUploadedView ? (
            <>
              {/* Add Prescription Button */}
              <TouchableOpacity
                style={styles.addPrescriptionContainer}
                onPress={handleAddPrescription}
              >
                <Image
                  source={require("../assets/UserProfile/plus.png")}
                  style={styles.plusIcon}
                />
                <Text style={styles.addPrescriptionText}>Add Prescription</Text>
              </TouchableOpacity>

              {/* Selected Images */}
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.prescriptionImage} />
                  <TouchableOpacity
                    style={styles.removeIconContainer}
                    onPress={() => removeImage(index)}
                  >
                    <Image
                      source={require("../assets/ambulance/cross.png")}
                      style={styles.removeIcon}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : (
            <>
              {/* Uploaded Images */}
              {uploadedImages.map((item, index) => {
        const isExpanded = expandedIndex === index;
        return (
          <View key={index} style={[styles.imageWrapper, isExpanded && styles.expandedWrapper]}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => handleImagePress(index)}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${item.file}` }}
                style={isExpanded ? styles.expandedImage : styles.prescriptionImage}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteIconOverlay}
              onPress={() => confirmDelete(item.id)}
            >
              <View style={styles.deleteCircle}>
                <Image
                  source={require("../assets/ambulance/cross.png")}
                  style={styles.deleteIcon}
                />
              </View>
            </TouchableOpacity>

            <Text style={styles.uploadedDate}>
              {moment(item.uploaded_at).format('MMMM D, YYYY h:mm A')}
            </Text>
          </View>
        );
      })}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const imageSize = (Dimensions.get("window").width - 60) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6495ED",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  backIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#AFCBFF",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 10,
  },
  addPrescriptionContainer: {
    width: imageSize,
    height: 200,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  plusIcon: {
    width: 50,
    height: 50,
    tintColor: "#6495ED",
  },
  addPrescriptionText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
    textAlign: "center",
  },
  imageWrapper: {
    width: imageSize,
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#eee",
    position: "relative",
  },
  prescriptionImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeIconContainer: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 15,
    padding: 5,
  },
  removeIcon: {
    width: 20,
    height: 20,
    tintColor: "#000",
  },
  // button row
  buttonRow: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginVertical: 10,
},
button: {
  padding: 10,
  backgroundColor: '#007bff',
  borderRadius: 8,
},
buttonText: {
  color: '#fff',
  fontWeight: 'bold',
},
// delete icon
deleteIconOverlay: {
  position: "absolute",
  top: 5,
  right: 5,
  zIndex: 1,
},

deleteCircle: {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: "rgba(0,0,0,0.6)",
  justifyContent: "center",
  alignItems: "center",
},

deleteIcon: {
  width: 12,
  height: 12,
  tintColor: "#fff",
},
uploadedDate: {
    marginTop: 5,
    fontSize: 12,
    color: 'black',
    textAlign: 'center',
  },
  // expanded image
  expandedWrapper: {
    width: screenWidth,
    height: screenHeight * 0.8,
    backgroundColor: '#000',
    borderRadius: 0,
    zIndex: 10,
  },
  expandedImage: {
    width: '100%',
    height: '100%',
    resizeMode: "contain",
  },
});

export default Prescription;
