// src/components/common/AppCard.js
import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
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
  
  const renderIcon = () => {
    if (icon && icon.startsWith('data:image')) {
      // Base64 icon from native module
      return (
        <Image 
          source={{ uri: icon }} 
          style={styles.appIcon}
          resizeMode="cover"
        />
      );
    }
    
    // Fallback to text icon
    const firstLetter = appName ? appName.charAt(0).toUpperCase() : '?';
    return (
      <View style={[styles.appIcon, styles.textIconContainer]}>
        <Text style={styles.textIcon}>{firstLetter}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isSelected && styles.selectedContainer
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* App Icon */}
        <View style={styles.iconContainer}>
          {renderIcon()}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName} numberOfLines={1}>
            {appName}
          </Text>
          {/* <Text style={styles.packageName} numberOfLines={1}>
            {packageName}
          </Text> */}
        </View>

        {/* Selection Indicator */}
        <View style={[
          styles.selectionIndicator,
          isSelected && styles.selectedIndicator
        ]}>
          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedContainer: {
    borderColor: COLORS.SUCCESS,
    backgroundColor: '#F8FFF8',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  textIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
  },
  textIcon: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkmark: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.SUCCESS,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appInfo: {
    flex: 1,
    marginRight: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  packageName: {
    fontSize: 12,
    color: '#888',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    borderColor: COLORS.SUCCESS,
    backgroundColor: COLORS.SUCCESS,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
});

export default AppCard;
