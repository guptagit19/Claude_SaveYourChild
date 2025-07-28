// src/components/common/AppCard.js
import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const AppCard = ({
  appName,
  packageName,
  icon,
  isSelected,
  onPress,
  onSettingsPress,
  navigation,
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  // Settings button spin animation
  const startSpinAnimation = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderIcon = () => {
    if (icon && icon.startsWith('data:image')) {
      return (
        <Image
          source={{ uri: icon }}
          style={styles.appIcon}
          resizeMode="cover"
        />
      );
    }

    const firstLetter = appName ? appName.charAt(0).toUpperCase() : '?';
    return (
      <View style={[styles.appIcon, styles.textIconContainer]}>
        <Text style={styles.textIcon}>{firstLetter}</Text>
      </View>
    );
  };

  const handleSettingsPress = () => {
    startSpinAnimation();
    setTimeout(() => {
      if (navigation) {
        navigation.navigate('AppSettingsScreen', {
          appName,
          packageName,
          icon,
        });
      } else if (onSettingsPress) {
        onSettingsPress({ appName, packageName, icon });
      }
    }, 200);
  };

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* App Icon with Selection Indicator */}
        <View style={styles.iconContainer}>{renderIcon()}

          {/* Selection Status Dot */}
        {isSelected && (
          <View style={styles.checkmarkBadge}>
            <Text style={styles.checkmarkText}>🔒</Text>
          </View>
        )}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName} numberOfLines={1}>
            {appName}
          </Text>
        </View>

        {/* Selection Status Dot */}
        {isSelected && (
          <View style={styles.ChildBadge}>
            <Text style={styles.ChildText}>👶</Text>
          </View>
        )}

        {/* Settings Button - Only visible when selected */}
        {isSelected && (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettingsPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.Text
              style={[styles.settingsEmoji, { transform: [{ rotate: spin }] }]}
            >
              ⚙️
            </Animated.Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectedContainer: {
    borderColor: COLORS.SUCCESS,
    backgroundColor: '#F8FFF8',
    elevation: 6,
    shadowOpacity: 0.15,
    borderWidth: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 9,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  textIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
  },
  textIcon: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.SUCCESS,
    width: 29,
    height: 29,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  checkmarkText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    right:3,
    bottom:5,
  },
  ChildBadge:{
    backgroundColor: COLORS.PRIMARY,
    width: 32,
    height: 32,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  ChildText:{
    textAlign:'center',
    color: 'white',
    fontSize: 22,
    bottom:3,
  },
  appInfo: {
    flex: 1,
    marginRight: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  packageName: {
    fontSize: 13,
    color: '#666',
    opacity: 0.8,
  },
  settingsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    marginLeft: 7,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingsEmoji: {
    fontSize: 20,
  },
  selectionDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: 'transparent',
  },
  selectedDot: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY,
  },
});

export default AppCard;
