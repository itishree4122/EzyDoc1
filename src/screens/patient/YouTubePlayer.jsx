import React, { useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import Header from '../../components/Header';
const YouTubePlayer = ({ route }) => {
  const { videoId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  return (
    <View style={styles.container}>
      <Header title="YouTube Player" />
   
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Could not load video</Text>
        </View>
      ) : (
        <YoutubePlayer
          height={300}
          play={true}
          videoId={videoId}
          onReady={() => setLoading(false)}
          onChangeState={(state) => {
            if (state === 'errored') setError(true);
          }}
          webViewProps={{
            allowsFullscreenVideo: true,
          }}
        />
      )}
    </View>
     </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default YouTubePlayer;