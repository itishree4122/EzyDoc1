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

const LabReport = () => {
  const navigation = useNavigation();
  const [selectedImages, setSelectedImages] = useState([]);

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
        {
          text: "Camera",
          onPress: () => openCamera(),
        },
        {
          text: "Gallery",
          onPress: () => openGallery(),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const openCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert("Permission denied");
      return;
    }

    launchCamera({ mediaType: "photo", saveToPhotos: true }, (response) => {
      if (!response.didCancel && !response.errorCode && response.assets) {
        setSelectedImages((prev) => [...prev, response.assets[0].uri]);
      }
    });
  };

  const openGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert("Permission denied");
      return;
    }

    launchImageLibrary({ mediaType: "photo", selectionLimit: 0 }, (response) => {
      if (!response.didCancel && !response.errorCode && response.assets) {
        const uris = response.assets.map((asset) => asset.uri);
        setSelectedImages((prev) => [...prev, ...uris]);
      }
    });
  };

  const removeImage = (indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== indexToRemove));
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

      {/* Card */}
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.imageGrid}>
          {/* Add Prescription Button */}
         
          {/* Render each selected image */}
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
});

export default LabReport;
