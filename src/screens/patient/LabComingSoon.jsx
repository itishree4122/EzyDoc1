import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../../components/Header';
const LabComingSoon = () => {
  return (
    <>
      <Header/>
    
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon name="flask-outline" size={50} color="#1E3A8A" />
      </View>
      <Text style={styles.title}>Lab Services Coming Soon</Text>
      <Text style={styles.subtitle}>
        We're working hard to bring lab features to you shortly!
      </Text>
    </View>
    </>
  );
};

export default LabComingSoon;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    // elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
    marginBottom: 30,
  },
});
