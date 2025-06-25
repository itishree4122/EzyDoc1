import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { getToken } from '../auth/tokenHelper';
import { BASE_URL } from '../auth/Api';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const RegisteredLabScreen = () => {
  const [labTypes, setLabTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedLabId, setSelectedLabId] = useState(null);
  const flatListRef = React.useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLabProfiles, setModalLabProfiles] = useState([]);
  const navigation = useNavigation();
  

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

  

    const getUniqueTestCountPerLab = (labTypes) => {
      const labTestMap = {};

      labTypes.forEach((type) => {
        type.lab_profiles.forEach((lab) => {
          if (!labTestMap[lab.name]) {

            labTestMap[lab.name] = new Set();
          }

          type.tests.forEach((test) => {
            labTestMap[lab.name].add(test);
          });
        });
      });

      const labels = Object.keys(labTestMap);
      const data = labels.map((labName) => labTestMap[labName].size);

      return { labels, data };
    };

    const { labels: fullLabels, data } = getUniqueTestCountPerLab(labTypes);

    // Truncated labels just for display
    const displayLabels = fullLabels.map(name =>
      name.length > 10 ? name.substring(0, 8) + '...' : name
    );


  const renderItem = ({ item }) => (
    <View style={styles.cardSplit}>
      <Text style={styles.serviceTitle}>{item.name}</Text>
      <View style={styles.labNameDivider} />
      <View style={styles.splitRow}>
        {/* Left: Tests */}
        <View style={styles.leftColumn}>
          <Text style={styles.sectionLabel}>Tests</Text>
          {renderTests(item.tests)}
        </View>

        {/* Right: Lab Info */}
        <View style={styles.rightColumn}>
          <Text style={styles.sectionLabel}>Labs</Text>
          <TouchableOpacity
            style={styles.labCountButton}
            onPress={() => {
              setModalLabProfiles(item.lab_profiles);
              setModalVisible(true);
            }}
          >
            <Text style={styles.labCountButtonText}>
              {item.lab_profiles.length} Lab{item.lab_profiles.length !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {navigation.goBack()}}>
    <Image
      source={require('../assets/UserProfile/back-arrow.png')} // Replace with your arrow icon path
      style={styles.arrowIcon}
      resizeMode="contain"
    />
  </TouchableOpacity>
  <Text style={styles.screenTitle}>Registered Lab Types</Text>
  
    </View>
        {/* line chart */}
        <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>Unique Tests Offered per Lab</Text>
      {loading ? (
  <Text style={styles.loadingText}>Loading chart...</Text>
) : labTypes.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
        
        >
        <LineChart
      data={{
        labels: displayLabels,
        datasets: [
          {
            data,
            strokeWidth: 2,
            color: () => '#1c78f2',
          },
        ],
      }}
      width={Math.max(fullLabels.length * 80, Dimensions.get('window').width)}
      height={260}
      fromZero
      yAxisInterval={1}
      chartConfig={{
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(28, 120, 242, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: { borderRadius: 8 },
        propsForDots: {
          r: '5',
          strokeWidth: '2',
          stroke: '#1c78f2',
        },
      }}
      bezier
      style={{ borderRadius: 12 }}
      getDotProps={(value, index) => ({
        onPress: () => {
          const fullLabName = fullLabels[index]; // Use original full label
          alert(fullLabName); // Or show a custom tooltip/modal/snackbar

          const targetIndex = labTypes.findIndex(type =>
            type.lab_profiles.some(p => p.name === fullLabName)
          );

          if (targetIndex !== -1) {
            setSelectedLabId(fullLabName);
            flatListRef.current?.scrollToIndex({ index: targetIndex, animated: true });
          }
        },
      })}
    />
        </ScrollView>
      ): (
        <Text style={styles.emptyText}>No lab types available</Text>
      )}
    </View>

      {loading ? (
  <Text style={[styles.loadingText, { marginTop: 40 }]}>Loading labs...</Text>
) : (
            <FlatList
      ref={flatListRef}
      data={labTypes}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContainer}
    />

      )}

        <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Lab Details</Text>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            {modalLabProfiles.map((lab, index) => (
              <View
      key={index}
      style={[
        styles.modalLabCard,
        { backgroundColor: index % 2 === 0 ? '#f4f4f4' : '#f4f4f4' },
      ]}
    >
      <View style={styles.labCardRow}>
        {/* Vertical colored line */}
        <View style={styles.leftAccentLine} />

        {/* Lab details */}
        <View style={styles.labDetails}>
          {lab.isPreferred && (
            <Text style={styles.highlightTag}>Recommended</Text>
          )}
          <Text style={styles.modalLabName}>{lab.name}</Text>
          <View style={styles.labNameDivider} />
          <View style={styles.infoBlock}>
      <View style={styles.labelRow}>
        <View style={styles.labelLine} />
        <Text style={styles.modalLabInfoLabel}>Address:</Text>
      </View>
      <Text style={styles.modalLabInfo}>{lab.address}</Text>
    </View>

    <View style={styles.infoBlock}>
      <View style={styles.labelRow}>
        <View style={styles.labelLine} />
        <Text style={styles.modalLabInfoLabel}>Location:</Text>
      </View>
      <Text style={styles.modalLabInfo}>{lab.location}</Text>
    </View>

    <View style={styles.infoBlock}>
      <View style={styles.labelRow}>
        <View style={styles.labelLine} />
        <Text style={styles.modalLabInfoLabel}>Phone:</Text>
      </View>
      <Text style={styles.modalLabInfo}>{lab.phone}</Text>
    </View>

        </View>
      </View>
    </View>

            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    </SafeAreaView>
  );
};

export default RegisteredLabScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f2f3',
  },
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
  marginBottom: 10,
  height: 60,
},

arrowIcon: {
  width: 22,
  height: 22,
  marginRight: 12,
  tintColor: '#000', // Optional: color the icon
},

screenTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  flex: 1, // Center the title
  textAlign: 'center',
  color: '#000',
},

  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
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
  chartContainer: {
  backgroundColor: '#fff',
  padding: 16,
  borderRadius: 12,
  marginHorizontal: 16,
  marginBottom: 20,
  elevation: 3,
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  minHeight: 280,
},
sectionTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1c78f2',
  marginBottom: 8,
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},

modalContent: {
  backgroundColor: '#fff',
  width: '100%',
  maxHeight: '80%',
  borderRadius: 16,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 5,
},

modalTitle: {
  fontSize: 20,
  fontWeight: '600',
  marginBottom: 16,
  textAlign: 'center',
  color: '#1c1c1e',
},

modalCloseButton: {
  marginTop: 20,
  backgroundColor: '#1c78f2',
  paddingVertical: 10,
  borderRadius: 8,
  alignItems: 'center',
},

modalCloseButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '500',
},

modalHandle: {
  width: 40,
  height: 4,
  backgroundColor: '#ccc',
  borderRadius: 2,
  alignSelf: 'center',
  marginBottom: 12,
},
highlightTag: {
  backgroundColor: '#E0F7FA',
  color: '#007AFF',
  fontSize: 12,
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 8,
  alignSelf: 'flex-start',
  marginBottom: 6,
  fontWeight: '600',
},
modalLabInfoLabel: {
  fontSize: 14,
  fontWeight: '500',
  color: '#555',
  marginTop: 6,
},

modalLabCard: {
  padding: 12,
  borderRadius: 12,
  marginBottom: 16,
  
},

infoBlock: {
  marginBottom: 12,
},

labelRow: {
  flexDirection: 'row',
  alignItems: 'center',
},

labelLine: {
  width: 12,
  height: 2,
  backgroundColor: '#1c78f2',
  marginRight: 6,
  borderRadius: 1,
},

modalLabInfoLabel: {
  fontWeight: '600',
  fontSize: 14,
  color: '#333',
},

modalLabInfo: {
  fontSize: 14,
  color: '#555',
  marginTop: 2,
  marginLeft: 18, // aligns under the label when labelRow has line + label
},

labNameDivider: {
  height: 1,
  backgroundColor: '#888',
  marginTop: 4,
  marginBottom: 12,
  width: '100%',
},

labCardRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
},

leftAccentLine: {
  width: 4,
  height: '100%',
  backgroundColor: '#1c78f2',
  borderRadius: 2,
  marginRight: 10,
},

labDetails: {
  flex: 1,
},

modalLabName: {
  fontSize: 16,
  fontWeight: 'bold',
  
  marginBottom: 10,
  color: '#333',
},

labCountText: {
  color: '#1c78f2',
  fontWeight: 'bold',
  marginTop: 8,
},

cardSplit: {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 16,
  marginVertical: 8,
  
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},

serviceTitle: {
  fontSize: 18,
  fontWeight: '600',
  marginBottom: 12,
  color: '#1c1c1e',
},

splitRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 12,
},

leftColumn: {
  flex: 2,
},

rightColumn: {
  flex: 1,
  justifyContent: 'flex-start',
  alignItems: 'flex-end',
},

sectionLabel: {
  fontSize: 14,
  fontWeight: '500',
  marginBottom: 6,
  color: '#333',
},

labCountButton: {
  backgroundColor: '#1c78f2',
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 8,
  marginTop: 4,
},

labCountButtonText: {
  color: '#fff',
  fontWeight: '500',
},

testTagContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
},

testTag: {
  backgroundColor: '#f0f0f0',
  borderRadius: 6,
  paddingVertical: 4,
  paddingHorizontal: 10,
  marginRight: 6,
  marginBottom: 6,
},

testTagText: {
  fontSize: 12,
  color: '#333',
},
loadingText: {
  textAlign: 'center',
  fontSize: 16,
  color: '#555',
  paddingVertical: 20,
},

});
