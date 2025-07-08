import React, { useState, useEffect } from "react";
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
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import moment from 'moment';
import { fetchWithAuth } from '../auth/fetchWithAuth';
import Header from "../../components/Header";
import Icon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const Prescription = () => {
  const navigation = useNavigation();
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showUploadedView, setShowUploadedView] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [selectedButton, setSelectedButton] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [imageToUpload, setImageToUpload] = useState(null);
  const [description, setDescription] = useState('');
  const [imagePreviewModalVisible, setImagePreviewModalVisible] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState('');

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
      "Add Prescription",
      "Choose an option to add prescription",
      [
        { 
          text: "Take Photo", 
          onPress: () => openCamera(),
          style: 'default'
        },
        { 
          text: "Choose from Gallery", 
          onPress: () => openGallery(),
          style: 'default'
        },
        { 
          text: "Cancel", 
          style: "cancel" 
        },
      ],
      { cancelable: true }
    );
  };

  const uploadPrescriptionImage = async () => {
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description for the prescription");
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      const patientId = await AsyncStorage.getItem("patientId");

      if (!token || !patientId) {
        Alert.alert("Error", "Authentication required");
        return;
      }

      const base64Data = await RNFS.readFile(imageToUpload, "base64");

      const response = await fetchWithAuth(`${BASE_URL}/patients/prescriptions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file: base64Data,
          description: description,
          patient: parseInt(patientId),
        }),
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      Alert.alert("Success", "Prescription uploaded successfully");
      setDescriptionModalVisible(false);
      setDescription('');
      setImageToUpload(null);
      fetchUploadedImages();
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Error", "Failed to upload prescription");
    } finally {
      setLoading(false);
    }
  };

  const openCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert("Permission required", "Please enable camera and storage permissions in settings");
      return;
    }

    launchCamera({ 
      mediaType: "photo", 
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    }, (response) => {
      if (!response.didCancel && !response.errorCode && response.assets) {
        const imageUri = response.assets[0].uri;
        setImageToUpload(imageUri);
        setSelectedImages((prev) => [...prev, imageUri]);
        setDescriptionModalVisible(true);
      }
    });
  };

  const openGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert("Permission required", "Please enable storage permissions in settings");
      return;
    }

    launchImageLibrary({ 
      mediaType: "photo", 
      selectionLimit: 5,
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    }, (response) => {
      if (!response.didCancel && !response.errorCode && response.assets) {
        const uris = response.assets.map((asset) => asset.uri);
        setSelectedImages((prev) => [...prev, ...uris]);
        
        // For simplicity, we'll handle one image at a time with description
        if (uris.length > 0) {
          setImageToUpload(uris[0]);
          setDescriptionModalVisible(true);
        }
      }
    });
  };

  const removeImage = (indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const fetchUploadedImages = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const patientUserId = await AsyncStorage.getItem("patientId");

      if (!token || !patientUserId) {
        throw new Error("Authentication required");
      }

      const response = await fetchWithAuth(
        `${BASE_URL}/patients/prescriptions/?patient_user_id=${patientUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch prescriptions");
      }

      const data = await response.json();
      const sortedData = data.sort(
        (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
      );
      setUploadedImages(sortedData);
    } catch (err) {
      console.error("Error fetching images:", err);
      Alert.alert("Error", "Unable to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (imageId) => {
    setImageToDelete(imageId);
    setDeleteModalVisible(true);
  };

  const handleDeleteUploadedImage = async () => {
    try {
      setLoading(true);
      setDeleteModalVisible(false);
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetchWithAuth(`${BASE_URL}/patients/prescriptions/${imageToDelete}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setUploadedImages(prev => prev.filter(img => img.id !== imageToDelete));
        Alert.alert("Success", "Prescription deleted successfully");
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", "Failed to delete prescription");
    } finally {
      setLoading(false);
      setImageToDelete(null);
    }
  };

  const handleImagePress = (imageUri) => {
    setPreviewImageUri(imageUri);
    setImagePreviewModalVisible(true);
  };

  const filteredUploadedImages = uploadedImages.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.description.toLowerCase().includes(query) ||
      moment(item.uploaded_at).format('MMM D, YYYY [at] h:mm A').toLowerCase().includes(query)
    );
  });

  return (
    <View style={styles.container}>
      <Header title="My Prescriptions" />
      
      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedButton === 'upload' && styles.activeToggleButton
          ]}
          onPress={() => {
            setSelectedButton('upload');
            setShowUploadedView(false);
          }}
        >
          <Text style={[
            styles.toggleButtonText,
            selectedButton === 'upload' && styles.activeToggleButtonText
          ]}>
            Upload Prescription
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedButton === 'view' && styles.activeToggleButton
          ]}
          onPress={async () => {
            setSelectedButton('view');
            setShowUploadedView(true);
            await fetchUploadedImages();
          }}
        >
          <Text style={[
            styles.toggleButtonText,
            selectedButton === 'view' && styles.activeToggleButtonText
          ]}>
            View Prescriptions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {showUploadedView ? (
          <>
            {/* Search Bar for Uploaded Prescriptions */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                placeholder="Search prescriptions..."
                placeholderTextColor="#888"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4a8fe7" />
                <Text style={styles.loadingText}>Loading your prescriptions...</Text>
              </View>
            ) : filteredUploadedImages.length === 0 ? (
              <View style={styles.emptyState}>
                <IonIcon name="document" size={50} color="#ccc" />
                <Text style={styles.emptyStateText}>No prescriptions found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery ? 'Try a different search' : 'Upload your first prescription'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredUploadedImages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const imageUri = item.file.startsWith('data:image')
                    ? item.file
                    : `data:image/jpeg;base64,${item.file}`;

                  return (
                    <View style={styles.prescriptionCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardIcon}>
                          <Icon name="description" size={20} color="#4a8fe7" />
                        </View>
                        <View style={styles.cardText}>
                          <Text style={styles.cardTitle}>{item.description}</Text>
                          <Text style={styles.cardDate}>
                            {moment(item.uploaded_at).format('MMM D, YYYY [at] h:mm A')}
                          </Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => confirmDelete(item.id)}
                        >
                          <Icon name="delete" size={20} color="#e74c3c" />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleImagePress(imageUri)}
                        style={styles.imageContainer}
                      >
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.clippedImage}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  );
                }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        ) : (
          <ScrollView contentContainerStyle={styles.uploadContainer}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleAddPrescription}
            >
              <View style={styles.uploadIcon}>
                <Icon name="add" size={30} color="#4a8fe7" />
              </View>
              <Text style={styles.uploadText}>Add Prescription</Text>
              <Text style={styles.uploadSubtext}>
                Take a photo or upload from gallery
              </Text>
            </TouchableOpacity>

            {selectedImages.length > 0 && (
              <View style={styles.selectedImagesContainer}>
                <Text style={styles.sectionTitle}>Selected Prescriptions</Text>
                <View style={styles.selectedImagesGrid}>
                  {selectedImages.map((uri, index) => (
                    <View key={index} style={styles.imageCard}>
                      <Image source={{ uri }} style={styles.selectedImage} />
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeImage(index)}
                      >
                        <Icon name="close" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Description Input Modal */}
      <Modal
        transparent={true}
        visible={descriptionModalVisible}
        onRequestClose={() => setDescriptionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Enter prescription description"
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setDescriptionModalVisible(false);
                  setDescription('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={uploadPrescriptionImage}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIcon}>
              <Icon name="warning" size={40} color="#e74c3c" />
            </View>
            <Text style={styles.modalTitle}>Delete Prescription?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete this prescription? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalDeleteButton}
                onPress={handleDeleteUploadedImage}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalDeleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        transparent={true}
        visible={imagePreviewModalVisible}
        onRequestClose={() => setImagePreviewModalVisible(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <TouchableOpacity 
            style={styles.fullScreenModalCloseButton}
            onPress={() => setImagePreviewModalVisible(false)}
          >
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: previewImageUri }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    // elevation: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeToggleButton: {
    backgroundColor: '#e6f0ff',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeToggleButtonText: {
    color: '#4a8fe7',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: 10,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#333',
    fontSize: 15,
  },
  uploadContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  uploadButton: {
    backgroundColor: '#f5f7fa',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    backgroundColor: '#e6f0ff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  selectedImagesContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  selectedImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageCard: {
    width: (width - 50) / 2,
    height: 180,
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prescriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    borderLeftColor: "#4a8fe7",
    // elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardIcon: {
    backgroundColor: '#e6f0ff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  cardDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
  },
  deleteButton: {
    padding: 8,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f7fa',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  clippedImage: {
    width: '100%',
    height: 150,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    fontSize: 14,
    color: '#4a8fe7',
    marginTop: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  listContent: {
    paddingBottom: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '85%',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 20,
    fontSize: 16,
  },
  modalIcon: {
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '500',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#4a8fe7',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  modalDeleteText: {
    color: '#fff',
    fontWeight: '500',
  },
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenModalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
});

export default Prescription;