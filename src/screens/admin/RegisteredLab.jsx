import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';

const RegisteredLabScreen = () => {
  const [labTypes, setLabTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLabTypes = async () => {
    const token = await getToken();
    if (!token) {
      console.warn('No token found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/labs/lab-types/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch lab types');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setLabTypes(data);
    } catch (error) {
      console.error('Error fetching lab types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabTypes();
  }, []);

  const renderLabProfiles = (profiles) => {
    return profiles.map((profile, index) => (
      <View key={index} style={styles.profileContainer}>
        <Text style={styles.profileText}>Lab Name: {profile.name}</Text>
        <Text style={styles.profileText}>Address: {profile.address}</Text>
        <Text style={styles.profileText}>Location: {profile.location}</Text>
        <Text style={styles.profileText}>Phone: {profile.phone}</Text>
      </View>
    ));
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.labTypeName}>🧪 {item.name}</Text>
      <Text style={styles.sectionTitle}>Tests:</Text>
      <Text style={styles.valueText}>{item.tests.join(', ') || 'No tests listed'}</Text>

      <Text style={styles.sectionTitle}>Lab Profiles:</Text>
      {item.lab_profiles.length > 0 ? (
        renderLabProfiles(item.lab_profiles)
      ) : (
        <Text style={styles.valueText}>No lab profiles available</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Registered Lab Types</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={labTypes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      )}
    </ScrollView>
  );
};

export default RegisteredLabScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  labTypeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  sectionTitle: {
    fontWeight: '600',
    marginTop: 8,
    color: '#555',
  },
  valueText: {
    color: '#444',
    marginLeft: 4,
    marginBottom: 4,
  },
  profileContainer: {
    marginLeft: 10,
    marginTop: 6,
    padding: 6,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },
  profileText: {
    fontSize: 14,
    color: '#222',
    marginBottom: 2,
  },
});
