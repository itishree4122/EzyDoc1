import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';

const LabTests = () => {
  const [labProfiles, setLabProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchLabTests = async () => {
    setLoading(true);

    const token = await getToken();

    if (!token) {
      console.log('❌ No token available');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/labs/lab-tests/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to fetch lab tests: ${response.status} ${response.statusText}`);
        console.error('Response body:', errorText); // helpful for debugging backend error message
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setLabProfiles(data); // or setLabTests if you're using different state
      } else {
        console.warn('⚠️ Unexpected response structure:', data);
        setLabProfiles([]);
      }
    } catch (error) {
      console.error('❌ Error fetching lab tests:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchLabTests();
}, []);



  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
     <FlatList
      data={labProfiles}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.labName}>{item.name}</Text>
          <Text>User: {item.user}</Text>
          <Text>Address: {item.address}</Text>
          <Text>Phone: {item.phone}</Text>
          <Text>Home Sample Collection: {item.home_sample_collection ? 'Yes' : 'No'}</Text>

          <Text style={styles.labTypesTitle}>Lab Types:</Text>
          {item.lab_types.length > 0 ? (
            item.lab_types.map(type => (
              <View key={type.id} style={styles.labType}>
                <Text>Name: {type.name}</Text>
                <Text>Tests: {type.tests.join(', ')}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noLabTypes}>No lab types available.</Text>
          )}
        </View>
      )}
      ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No lab profiles found.</Text>}
    />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  labName: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  labTypesTitle: {
    marginTop: 8,
    fontWeight: '600',
  },
  labType: {
    paddingLeft: 8,
    marginTop: 4,
  },
  noLabTypes: {
    paddingLeft: 8,
    fontStyle: 'italic',
  },
});

export default LabTests;
