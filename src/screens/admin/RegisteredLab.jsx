import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';

const RegisteredLabScreen = () => {
  const [labTypes, setLabTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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

  const toggleExpand = (id) => {
    setExpandedId((prevId) => (prevId === id ? null : id));
  };

  const renderTests = (tests) => {
    return tests.length ? (
      <View style={styles.testTagContainer}>
        {tests.map((test, index) => (
          <View key={index} style={styles.testTag}>
            <Text style={styles.testTagText}>{test}</Text>
          </View>
        ))}
      </View>
    ) : (
      <Text style={styles.emptyText}>No tests listed</Text>
    );
  };

  const renderLabProfiles = (profiles) =>
    profiles.map((profile) => (
      <View key={profile.id} style={styles.profileCard}>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileInfo}>{profile.address}</Text>
        <Text style={styles.profileInfo}>{profile.location}</Text>
        <Text style={styles.profileInfo}>{profile.phone}</Text>
      </View>
    ));

  const renderItem = ({ item }) => {
    const isExpanded = expandedId === item.id;

    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => toggleExpand(item.id)}>
          <View style={styles.cardHeader}>
            <Text style={styles.labTypeTitle}>{item.name}</Text>
            <Text style={styles.expandIcon}>{isExpanded ? '-' : '+'}</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tests Offered</Text>
              {renderTests(item.tests)}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lab Profiles</Text>
              {item.lab_profiles.length > 0 ? (
                renderLabProfiles(item.lab_profiles)
              ) : (
                <Text style={styles.emptyText}>No lab profiles available</Text>
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.screenTitle}>Registered Lab Types</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1c78f2" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={labTypes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

export default RegisteredLabScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafd',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 16,
    color: '#1c78f2',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  expandIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c78f2',
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  testTagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  testTag: {
    backgroundColor: '#e0f0ff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  testTagText: {
    fontSize: 13,
    color: '#1c78f2',
  },
  profileCard: {
    backgroundColor: '#f1f7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c78f2',
    marginBottom: 4,
  },
  profileInfo: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
});
