import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  ScrollView,
  Linking
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { BASE_URL } from "../auth/Api";
import { fetchWithAuth } from "../auth/fetchWithAuth";
import { getToken } from "../auth/tokenHelper";
import Header from "../../components/Header";
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
const TAG_OPTIONS = [
  { label: "Health Tip", value: "health_tip" },
  { label: "General", value: "general" },
  { label: "Promotion", value: "promotion" },
  { label: "Alert", value: "alert" },
];

const AdminNotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    id: null,
    title: "",
    body: "",
    url: "",
    tags: "general",
    image: null,
    imageFile: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState('');
  const [imagePreviewModalVisible, setImagePreviewModalVisible] = useState(false);
  const navigation = useNavigation();
  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetchWithAuth(`${BASE_URL}/notification/admin/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle image picking
  const pickImage = async () => {
  const options = {
    mediaType: "photo",
    quality: 0.8,
    maxWidth: 800,
    maxHeight: 800,
    selectionLimit: 1,
  };
  launchImageLibrary(options, (response) => {
    if (!response.didCancel && !response.errorCode && response.assets && response.assets.length > 0) {
      const asset = response.assets[0];
      setForm((f) => ({
        ...f,
        image: asset.uri,
        imageFile: {
          uri: asset.uri,
          name: asset.fileName || "image.jpg",
          type: asset.type || "image/jpeg",
        },
      }));
    }
  });
};

  // Handle create or update
  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      Alert.alert("Validation", "Title and body are required.");
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      let url = `${BASE_URL}/notification/admin/notifications/`;
      let method = "POST";
      if (editMode && form.id) {
        url += `${form.id}/`;
        method = "PUT";
      }
      let body;
      let headers = {
        Authorization: `Bearer ${token}`,
      };
      if (form.imageFile) {
        body = new FormData();
        body.append("title", form.title);
        body.append("body", form.body);
        body.append("tags", form.tags);
        if (form.url) body.append("url", form.url);
          body.append("image", form.imageFile);

        // body.append("image", {
        //   uri: form.imageFile.uri,
        //   name: form.imageFile.fileName || "image.jpg",
        //   type: form.imageFile.type || "image/jpeg",
        // });
        headers["Content-Type"] = "multipart/form-data";
      } else {
        body = JSON.stringify({
          title: form.title,
          body: form.body,
          tags: form.tags,
          url: form.url,
        });
        headers["Content-Type"] = "application/json";
      }
      const res = await fetch(url, {
        method,
        headers,
        body,
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to submit notification");
      }
      setModalVisible(false);
      setForm({
        id: null,
        title: "",
        body: "",
        url: "",
        tags: "general",
        image: null,
        imageFile: null,
      });
      setEditMode(false);
      fetchNotifications();
      Alert.alert("Success", editMode ? "Notification updated." : "Notification posted.");
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to submit notification.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = (id) => {
    Alert.alert("Delete", "Are you sure you want to delete this notification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getToken();
            const res = await fetchWithAuth(
              `${BASE_URL}/notification/admin/notifications/${id}/`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (!res.ok) throw new Error("Failed to delete notification");
            fetchNotifications();
            Alert.alert("Deleted", "Notification deleted.");
          } catch (e) {
            Alert.alert("Error", e.message || "Failed to delete notification.");
          }
        },
      },
    ]);
  };

  // Handle edit
  const handleEdit = (item) => {
    setForm({
      id: item.id,
      title: item.title,
      body: item.body,
      url: item.url || "",
      tags: item.tags,
      image: item.image,
      imageFile: null,
    });
    setEditMode(true);
    setModalVisible(true);
  };

  // Handle image preview
  const handleImagePress = (imageUri) => {
    setPreviewImageUri(imageUri);
    setImagePreviewModalVisible(true);
  };

  // Render notification card
  const renderItem = ({ item }) => {
    const imageUri = item.image
      ? `${BASE_URL}/notification/secure-image/${item.image.split("/").pop()}`
      : null;
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.tagContainer}>
            <Text style={styles.tagText}>{item.tags.replace("_", " ")}</Text>
          </View>
          <Text style={styles.body}>{item.body}</Text>
          {item.url ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(item.url)}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>Open Link</Text>
              <Icon name="launch" size={16} color="#3b82f6" />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
    minute: '2-digit',
    hour12: true,
            })}
          </Text>
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleEdit(item)}
            >
              <Icon name="edit" size={20} color="#0284c7" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { marginLeft: 12 }]}
              onPress={() => handleDelete(item.id)}
            >
              <Icon name="delete" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        {imageUri && (
          <TouchableOpacity onPress={() => handleImagePress(imageUri)}>
            <Image
              source={{ uri: imageUri }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* <Header title="Admin Notifications" /> */}
      <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                      <Feather name="chevron-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                      <Text style={styles.headerTitle}>Admin Notifications</Text>
                      {/* <Text style={styles.headerSubtitle}>Manage patient visits</Text> */}
                    </View>
                    
                  </View>
      <View style={styles.headerRow}>
        {/* <Text style={styles.headerTitle}>Add Notifications</Text> */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setForm({
              id: null,
              title: "",
              body: "",
              url: "",
              tags: "general",
              image: null,
              imageFile: null,
            });
            setEditMode(false);
            setModalVisible(true);
          }}
        >
          <Icon name="add-circle" size={32} color="#1c78f2" />
                      <Text style={styles.addButtonText}>Add Notification</Text>

        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1c78f2" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No notifications found.</Text>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal for Add/Edit */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editMode ? "Edit Notification" : "Post Notification"}
              </Text>
              {/* Title (Required) */}
<Text style={styles.inputLabel}>Title <Text style={styles.required}>*</Text></Text>
<TextInput
  style={styles.input}
  placeholder="Enter title"
  placeholderTextColor="#94a3b8"
  value={form.title}
  onChangeText={(text) => setForm((f) => ({ ...f, title: text }))}
/>

{/* Body (Required) */}
<Text style={styles.inputLabel}>Body <Text style={styles.required}>*</Text></Text>
<TextInput
  style={[styles.input, { height: 80 }]}
  placeholder="Enter message"
  placeholderTextColor="#94a3b8"
  multiline
  value={form.body}
  onChangeText={(text) => setForm((f) => ({ ...f, body: text }))}
/>

{/* URL (Optional) */}
<Text style={styles.inputLabel}>URL <Text style={styles.optional}>(optional)</Text></Text>
<TextInput
  style={styles.input}
  placeholder="Enter website or YouTube URL"
  placeholderTextColor="#94a3b8"
  value={form.url}
  autoCapitalize="none"
  keyboardType="url"
  onChangeText={(text) => setForm((f) => ({ ...f, url: text }))}
/>

              <View style={styles.tagPickerRow}>
                {TAG_OPTIONS.map((tag) => (
                  <TouchableOpacity
                    key={tag.value}
                    style={[
                      styles.tagOption,
                      form.tags === tag.value && styles.tagOptionSelected,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, tags: tag.value }))}
                  >
                    <Text
                      style={[
                        styles.tagOptionText,
                        form.tags === tag.value && styles.tagOptionTextSelected,
                      ]}
                    >
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>
  Image <Text style={styles.optional}>(optional)</Text>
</Text>
<TouchableOpacity
  style={styles.imagePickerBtn}
  onPress={pickImage}
>
  <Icon name="image" size={22} color="#1c78f2" />
  <Text style={{ color: "#1c78f2", marginLeft: 8 }}>
    {form.image ? "Change Image" : "Pick Image"}
  </Text>
</TouchableOpacity>

{form.image && (
  <Image
    // source={{ uri: form.image }}
    source={{
      uri:
        editMode && !form.imageFile
          ? `${BASE_URL}/notification/secure-image/${form.image.split("/").pop()}`
          : form.image,
    }}
    style={styles.previewImage}
    resizeMode="cover"
  />
)}

              {/* <TouchableOpacity
                style={styles.imagePickerBtn}
                onPress={pickImage}
              >
                <Icon name="image" size={22} color="#1c78f2" />
                <Text style={{ color: "#1c78f2", marginLeft: 8 }}>
                  {form.image ? "Change Image" : "Pick Image"}
                </Text>
              </TouchableOpacity>
              {form.image && (
                <Image
                  source={{ uri: form.image }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              )} */}
              <View style={{ flexDirection: "row", marginTop: 18 }}>
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: "#1c78f2" }]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  <Text style={styles.submitBtnText}>
                    {submitting
                      ? editMode
                        ? "Updating..."
                        : "Posting..."
                      : editMode
                      ? "Update"
                      : "Post"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: "#64748b", marginLeft: 10 }]}
                  onPress={() => setModalVisible(false)}
                  disabled={submitting}
                >
                  <Text style={styles.submitBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  container: { flex: 1, backgroundColor: "#f8fafc" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    paddingBottom: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1c78f2",
  },
  addBtn: {
    // backgroundColor: "#e0e7ff",
    // borderRadius: 50,
    // padding: 2,
      flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e7ff",
    borderRadius: 20,
    paddingRight: 12,
    marginBottom: 10,
    // paddingHorizontal: 16,
    // paddingVertical: 8,
    // width: 120,
    // marginTop: 12,
    // marginLeft: 16,
  },
   addButtonText: {
    color: "#1c78f2",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 0,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderBottomWidth: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginLeft: 10,
    backgroundColor: "#f1f5f9",
  },
  title: {
    fontWeight: "600",
    fontSize: 17,
    color: "#1e293b",
    marginBottom: 8,
    lineHeight: 24,
  },
  body: {
    color: "#64748b",
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
  },
  tagContainer: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  tagText: {
    color: "#0284c7",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f1f5ff",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  linkText: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 6,
  },
  date: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "500",
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 16,
    marginTop: 40,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1c78f2",
    marginBottom: 18,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  tagPickerRow: {
    flexDirection: "row",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  tagOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#e0e7ff",
    marginRight: 8,
    marginBottom: 8,
  },
  tagOptionSelected: {
    backgroundColor: "#1c78f2",
  },
  tagOptionText: {
    color: "#1c78f2",
    fontWeight: "600",
  },
  tagOptionTextSelected: {
    color: "#fff",
  },
  imagePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e7ff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  previewImage: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#f1f5f9",
  },
  submitBtn: {
    flex: 1,
    backgroundColor: "#1c78f2",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    // borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 20,
  },
  fullScreenModalCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
  inputLabel: {
  fontSize: 14,
  fontWeight: "600",
  color: "#1e293b",
  marginBottom: 4,
  marginTop: 12,
},
required: {
  color: "#dc2626", // red asterisk
},
optional: {
  color: "#64748b",
  fontSize: 13,
  fontWeight: "400",
},
inputLabel: {
  fontSize: 14,
  fontWeight: "600",
  color: "#1e293b",
  marginBottom: 6,
},

optional: {
  fontSize: 13,
  fontWeight: "400",
  color: "#94a3b8",
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
});

export default AdminNotificationScreen;