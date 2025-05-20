import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentMonthIndex = new Date().getMonth();

const DoctorSchedule = () => {
  const navigation = useNavigation();

  const renderItem = ({ item, index }) => {
    const isDisabled = index < currentMonthIndex;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.monthBox,
          isDisabled ? styles.disabledBox : styles.enabledBox,
        ]}
        disabled={isDisabled}
        onPress={() =>
          navigation.navigate('MonthAvailability', {
            monthIndex: index,
            monthName: item,
          })
        }
      >
        <View style={styles.monthContent}>
          <Image
            source={require('../assets/homepage/calendar.png')}
            style={[
              styles.calendarIcon,
              isDisabled && styles.disabledIcon,
            ]}
          />
          <Text style={[styles.monthText, isDisabled && styles.disabledText]}>
            {item}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#EAF3FC', '#D2E9FC']} style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.backIconContainer}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require('../assets/UserProfile/back-arrow.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Choose a Month</Text>
      </View>

      <FlatList
        data={months}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#2c3e50',
  },
  backIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#ffffff33',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  backIcon: {
    width: 16,
    height: 16,
    tintColor: '#000',
  },
  gridContainer: {
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  monthBox: {
    flex: 1,
    margin: 10,
    paddingVertical: 26,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#6495ED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  enabledBox: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#90BDF3',
  },
  disabledBox: {
    backgroundColor: '#eaeaea',
    borderWidth: 2,
    borderColor: '#cccccc',
  },
  monthContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  calendarIcon: {
    width: 20,
    height: 20,
    tintColor: '#2c3e50',
  },
  disabledIcon: {
    tintColor: '#999',
  },
  monthText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2c3e50',
    letterSpacing: 0.5,
  },
  disabledText: {
    color: '#999',
  },
});

export default DoctorSchedule;
