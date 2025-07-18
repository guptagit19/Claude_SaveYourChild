// src/components/common/AppCard.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const AppCard = ({ 
  appName, 
  packageName, 
  icon, 
  isSelected, 
  onPress 
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isSelected && styles.selectedContainer
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {icon ? (
          <Image source={{ uri: icon }} style={styles.appIcon} />
        ) : (
          <View style={styles.defaultIcon}>
            <Text style={styles.defaultIconText}>
              {appName ? appName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.appName} numberOfLines={1}>
          {appName || 'Unknown App'}
        </Text>
        <Text style={styles.packageName} numberOfLines={1}>
          {packageName || 'com.unknown.app'}
        </Text>
      </View>
      
      <View style={[
        styles.checkbox,
        isSelected && styles.checkboxSelected
      ]}>
        {isSelected && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#F0F8FF',
  },
  iconContainer: {
    marginRight: 15,
  },
  appIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  defaultIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultIconText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  packageName: {
    fontSize: 12,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppCard;