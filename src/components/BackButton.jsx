import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
const BackButton = ({
  style,
  iconStyle,
  containerStyle,
  color = "#000",
  size = 24,
}) => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={[styles.backButton, style]}
      activeOpacity={0.7}
      android_ripple={{ color: "#e3eafc", borderless: true }}
    >
        <Feather name="chevron-left" size={30} color="#fff" />

      {/* <View style={[styles.backIconContainer, containerStyle]}>
        <Ionicons
          name="arrow-back"
          size={size}
          color={color}
          style={iconStyle}
        />
        
      </View> */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    marginRight: 10,
    borderRadius: 20,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  backIconContainer: {
    width: 38,
    height: 38,
    backgroundColor: "#fff",
    // borderColor: "#fff",
    // borderWidth: 1,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});

export default BackButton;