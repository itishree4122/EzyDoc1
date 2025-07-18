import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Linking,
  Dimensions 
} from "react-native";
import { BASE_URL } from "../auth/Api";
import { fetchWithAuth } from "../auth/fetchWithAuth";
import { getToken } from "../auth/tokenHelper";
import Icon from "react-native-vector-icons/MaterialIcons";
import Header from "../../components/Header";
import Modal from "react-native-modal";
const { width } = Dimensions.get('window');

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImageUri, setPreviewImageUri] = useState('');
  const [imagePreviewModalVisible, setImagePreviewModalVisible] = useState(false);

  const isYoutubeUrl = (url) => {
    return url?.includes('youtube.com') || url?.includes('youtu.be');
  };

  // const handleUrlPress = async (url) => {
  //   console.log('Opening URL:', url);
  //   if (!url) return;
    
  //   try {
  //     if (isYoutubeUrl(url)) {
  //       navigation.navigate("YouTubePlayer", { url });
  //       return;
  //     }
      
  //     // const supported = await Linking.canOpenURL(url);
  //     // const supported = true;
  //     // console.log("Can open:", supported);

  //     // if (supported) {
  //     //   await Linking.openURL(url);
  //     // }
  //     await Linking.openURL(url);
  //   } catch (error) {
  //     console.error('Error opening URL:', error);
  //   }
  // };
// const extractYoutubeVideoId = (url) => {
//   const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([^?&]+)/;
//   const match = url.match(regex);
//   return match ? match[1] : null;
// };
const extractYoutubeVideoId = (url) => {
  try {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtube\.com\/.*\/|youtu\.be\/|youtube\.com\/embed\/)([^?&"'>]+)/,
      /youtube\.com\/shorts\/([^?&]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch (e) {
    console.error("Error parsing YouTube URL", e);
  }

  return null;
};

  const handleUrlPress = async (url) => {
  console.log('Opening URL:', url);
  if (!url) return;

  try {
    // if (isYoutubeUrl(url)) {
    //   navigation.navigate("YouTubePlayer", { url });
    //   return;
    // }
    if (isYoutubeUrl(url)) {
      const videoId = extractYoutubeVideoId(url);
      if (videoId) {
        navigation.navigate("YouTubePlayer", { videoId });
      } else {
        console.warn("Invalid YouTube URL");
      }
      return;
    }

    const sanitizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

    await Linking.openURL(sanitizedUrl);
  } catch (error) {
    console.error('Error opening URL:', error);
    Alert.alert("Unable to open link", "The URL may be invalid or unsupported.");
  }
};
 const handleImagePress = (imageUri) => {
    setPreviewImageUri(imageUri);
    setImagePreviewModalVisible(true);
  };
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await getToken();
        const res = await fetchWithAuth(`${BASE_URL}/notification/admin/notifications/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          console.log("Notifications fetched:", data);
          setNotifications(data);
        }
      } catch (e) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const renderItem = ({ item }) => {
    const imageUri = item.image 
      ? `${BASE_URL}/notification/secure-image/${item.image.split("/").pop()}`
      : null;

    return (
      <View style={styles.card}>
        <View style={styles.textContent}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.tagContainer}>
  <Text style={styles.tagText}>
    {item.tags.replace('_', ' ')}
  </Text>
</View>

          <Text style={styles.body}>{item.body}</Text>
          
          {item.url && (
            <TouchableOpacity 
              onPress={() => handleUrlPress(item.url)}
              style={styles.linkButton}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                {isYoutubeUrl(item.url) ? 'Watch on YouTube' : 'Open Link'}
              </Text>
              
              <Icon name="launch" size={16} color="#3b82f6" />
              {/* <Text>
                {item.url}
              </Text> */}
            </TouchableOpacity>
            
          )}
          
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Notifications" />
      
      <FlatList
        data={notifications}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="notifications-off" size={40} color="#94a3b8" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    backgroundColor: "#f8fafc" 
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 0,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderBottomWidth: 4,
  },
  textContent: {
    padding: 16,
  },
  title: { 
    fontWeight: "600", 
    fontSize: 17, 
    color: "#1e293b",
    marginBottom: 8,
    lineHeight: 24
  },
  body: { 
    color: "#64748b", 
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22
  },
  cardImage: {
    width: '100%',
    height: width * 0.6,
    backgroundColor: '#f1f5f9'
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5ff',
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  linkText: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6
  },
  date: { 
    color: "#94a3b8", 
    fontSize: 13, 
    fontWeight: '500'
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: '#f8fafc'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80
  },
  emptyText: { 
    textAlign: "center", 
    color: "#94a3b8",
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500'
  },
   fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 20,
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
  tagContainer: {
  backgroundColor: '#e0f2fe',
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 20,
  alignSelf: 'flex-start',
  marginBottom: 10,
},
tagText: {
  color: '#0284c7',
  fontSize: 13,
  fontWeight: '600',
  textTransform: 'capitalize',
},


});

export default NotificationScreen;