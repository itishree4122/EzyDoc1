import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
import { fetchWithAuth } from '../auth/fetchWithAuth'
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const Prescription = () => {
  const navigation = useNavigation();
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showUploadedView, setShowUploadedView] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [selectedButton, setSelectedButton] = useState('upload'); // default selection
  const [loading, setLoading] = useState(false);



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

      // const response = await fetch(`${BASE_URL}/patients/prescriptions/`, {
      const response = await fetchWithAuth(`${BASE_URL}/patients/prescriptions/`, {
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

    // const response = await fetch(
    const response = await fetchWithAuth(
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
  } catch (err) {
    console.error("Error fetching images:", err);
    Alert.alert("Error", "Unable to load images");
  } finally {
    setLoading(false);
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

    // const response = await fetch(`${BASE_URL}/patients/prescriptions/${imageId}/`, {
    const response = await fetchWithAuth(`${BASE_URL}/patients/prescriptions/${imageId}/`, {
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
 


      {/* Content View */}
      <View style={styles.card}>
      <View style={styles.buttonRow}>
  <TouchableOpacity
    style={[
      styles.button,
      selectedButton === 'upload' && styles.selectedButton,
    ]}
    onPress={() => {
      setSelectedButton('upload');
      setShowUploadedView(false);
    }}
  >
    <Text
      style={[
        styles.buttonText,
        selectedButton === 'upload' && styles.selectedButtonText,
      ]}
    >
      Upload Image
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.button,
      selectedButton === 'view' && styles.selectedButton,
    ]}
    onPress={async() => {
      setSelectedButton('view');
  setShowUploadedView(true); // Show loading section immediately
  setLoading(true);          // Show loading spinner
  await fetchUploadedImages(); // Fetch data
    }}
  >
    <Text
      style={[
        styles.buttonText,
        selectedButton === 'view' && styles.selectedButtonText,
      ]}
    >
      View Uploaded
    </Text>
  </TouchableOpacity>
</View>
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
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

      {/* Selected Images in Grid */}
      <View style={styles.imageGrid}>
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
      </View>
    </>
  ) : (
    <>
      {/* Uploaded Images List */}
      {loading ? (
        <View style={{ alignItems: 'center', marginTop: 100, justifyContent: 'center', flex: 1 }}>
          <ActivityIndicator size="large" color="#1c78f2" />
          <Text style={{ marginTop: 10, fontSize: 14, color: '#1c78f2' }}>
            Loading prescriptions...
          </Text>
        </View>
      ) : (
        <View style={styles.uploadedListContainer}>
          {uploadedImages.map((item, index) => {
            const isExpanded = expandedIndex === index;
            const imageUri = item.file.startsWith('data:image')
              ? item.file
              : `data:image/jpeg;base64,${item.file}`;

            return (
              <View key={index} style={styles.prescriptionCard}>
                {/* Info Section */}
                <View style={styles.infoSection}>
                  <Text style={styles.metaId}>📄 Prescription #{item.id}</Text>
                  <Text style={styles.metaDescription}>📝 {item.description}</Text>
                  <Text style={styles.timestamp}>🕒 {moment(item.uploaded_at).format('MMM D, YYYY [at] h:mm A')}</Text>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Image Section */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleImagePress(index)}
                  style={styles.imageContainer}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={isExpanded ? styles.expandedImage : styles.clippedImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>

                {/* Delete Text */}
                <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.deleteTextContainer}>
                  <Text style={styles.deleteText}> Delete</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
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
    backgroundColor: "#1c78f2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 40,
    marginBottom: 15,
  },
  backButton: {
    marginRight: 10,
  },
  uploadedListContainer: {
  flexDirection: 'column',
  paddingHorizontal: 0,
  alignContent: 'center',
  justifyContent: 'center',
  alignItems: 'center',
  flex: 1,
  marginTop: 15,
  
},
  backIconContainer: {
     width: 30,
    height: 30,
    backgroundColor: "#7EB8F9", // White background
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 18,
    height: 18,
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
    marginTop: 20,
  },
prescriptionCard: {
  backgroundColor: '#F6F8FA',
  borderRadius: 16,
  padding: 16,
  marginHorizontal: 0,
  marginBottom: 20,
  shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'visible', // <-- important
},

infoSection: {
  marginBottom: 8,
},

metaId: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1c1c1e',
},

metaDescription: {
  fontSize: 14,
  color: '#444',
  marginTop: 2,
},

timestamp: {
  fontSize: 12,
  color: '#888',
  marginTop: 4,
},

divider: {
  height: 1,
  backgroundColor: '#d3d3d3',
  marginVertical: 10,
},

imageContainer: {
  borderRadius: 12,
  overflow: 'hidden',
},

clippedImage: {
  width: '100%',
  height: 140,
  borderRadius: 12,
},

expandedImage: {
  width: '100%',
  height: 400,
  borderRadius: 12,
  resizeMode: 'contain'
},

deleteTextContainer: {
  marginTop: 12,
  alignItems: 'flex-end',
},

deleteText: {
  color: '#e53935',
  fontSize: 14,
  fontWeight: '500',
  backgroundColor: '#fbc9c9',
  textAlign: 'center',
  height: 30,
  width: 70,
  paddingTop: 5,
  borderRadius: 5,
},


cardHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},

  plusIcon: {
    width: 50,
    height: 50,
    tintColor: "#1c78f2",
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
  backgroundColor: 'transparent',
  borderRadius: 8,
},
buttonText: {
  color: '#333',
  fontWeight: 'bold',
},


  selectedButton: {
     borderBottomWidth: 2,       // Only bottom border
  borderBottomColor: '#1c78f2', // Bottom border color
  borderRadius: 0,
  },
  
  selectedButtonText: {
    color: '#1c78f2',
  },

});

export default Prescription;
