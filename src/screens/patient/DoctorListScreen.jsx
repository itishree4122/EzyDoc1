import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { BASE_URL } from '../auth/Api';
import { getToken } from '../auth/tokenHelper';
import { useNavigation } from "@react-navigation/native";

const DoctorListScreen = ({route}) => {
  const {patientId} = route.params;
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
const [allDoctors, setAllDoctors] = useState([]); // full data set
const [searchQuery, setSearchQuery] = useState('');


  const fetchDoctors = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/doctor/get_all/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
        setAllDoctors(data); // store original list
      } else {
        console.error('Failed to fetch doctors:', response.status);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filterDoctors = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setDoctors(allDoctors); // show all
      return;
    }
  
    const filtered = allDoctors.filter((doc) =>
      doc.doctor_name.toLowerCase().includes(query.toLowerCase()) ||
      doc.specialist.toLowerCase().includes(query.toLowerCase())
    );
  
    setDoctors(filtered);
  };
  

  const renderDoctorCard = ({ item }) => {
    const defaultImage = require('../assets/UserProfile/profile-circle-icon.png'); // Replace with your default image path
    const imageSource = item.profile_image
      ? { uri: item.profile_image }
      : defaultImage;

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
        <Image source={imageSource} style={styles.profileImage} />
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.doctor_name}</Text>
        <Text style={[styles.name, { display: 'none' }]}>{item.doctor_user_id}</Text>
        <Text style={[styles.name, { display: 'none' }]}>{item.experience}</Text>
        <Text style={styles.specialist}>{item.specialist}</Text>
        <Text style={styles.clinic}>{item.clinic_name}</Text>
        <Text style={styles.address}>{item.clinic_address}</Text>
        {item.status && (
          <Text style={styles.bio}>
            Experienced {item.specialist} with {item.experience} years in practice
          </Text>
        )}
        </View>
      
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate("BookingScreen",
          {
            doctor_name: item.doctor_name,
            specialist: item.specialist,
            doctor_user_id: item.doctor_user_id,
            clinic_name: item.clinic_name,
            clinic_address: item.clinic_address,
            experience: item.experience,
            patientId
          }
        )}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      
    </View>
    
    );
  };

  return (
    <>
      <View style={styles.toolbar}>
       <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <View style={styles.backIconContainer}>
                <Image
                  source={require("../assets/UserProfile/back-arrow.png")} // Replace with your back arrow image
                  style={styles.backIcon}
                />
              </View>
            </TouchableOpacity>
        
      </View>
       {/* Search Bar */}
             <View style={styles.searchContainer}>
              <TextInput
                placeholder="Search for doctors..."
                placeholderTextColor="#888"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={filterDoctors}
              />
              <Image
                source={require("../assets/search.png")}
                style={styles.searchIcon}
              />
            </View>

            <Text style= {{display: 'none'}}>{patientId}</Text>

      <View style={styles.container}>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderDoctorCard}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
    </>
    
  );
};

export default DoctorListScreen;

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: "#6495ED",
    paddingTop: 70,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 10, // Adds spacing between icon and title
  },
  backIconContainer: {
    width: 30,
    height: 30,
    backgroundColor: "#AFCBFF", // White background
    borderRadius: 20, // Makes it circular
    alignItems: "center",
    justifyContent: "center",
    marginTop: -40,
    
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
    
    
  },
  
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 0,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: "#333",
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: "#999",
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  list: {
    paddingHorizontal: 16,
  },
  card: {
    
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderColor: '#e6e6e6',
    // borderTopWidth:4,
    borderBottomWidth: 4,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    elevation: 0,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardRow: {
    flexDirection: 'row',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: '#ccc',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  specialist: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  clinic: {
    fontSize: 14,
    color: '#333',
  },
  address: {
    fontSize: 13,
    color: '#666',
  },
  bio: {
    fontSize: 13,
    color: '#007BFF',
    marginTop: 4,
  },
  bookButton: {
    marginTop: 10,
    backgroundColor: '#6495ed',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'center',
    width: '100%',
    marginLeft: 10,
    marginRight: 10,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  
});
