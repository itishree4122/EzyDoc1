import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BackButton from './BackButton';

const Header = ({ title, style, titleStyle, ...props }) => (
  <View style={[styles.toolbar, style]}>
    <BackButton />
    <Text style={[styles.headerText, titleStyle]} numberOfLines={1}>
      {title}
    </Text>
    {/* Optionally, add right-side actions here */}
  </View>
);

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 12,
    backgroundColor: '#1c78f2',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
    
  },
  headerTitleBubble: {
  backgroundColor: '#ffffff', // semi-transparent white
  paddingVertical: 6,
  paddingHorizontal: 16,
  borderRadius: 15,
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  color: '#1c78f2',
  fontSize: 16,
  fontWeight: 'bold',
  alignSelf: 'center',
  overflow: 'hidden',
//   elevation: 4, // Android shadow
//   shadowColor: '#000', // iOS shadow
//   shadowOffset: { width: 0, height: 2 },
//   shadowOpacity: 1,
//   shadowRadius: 4,
},

});

export default Header;