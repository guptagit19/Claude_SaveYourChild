// src/screens/TimePickerScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../services/StorageService';
import { COLORS, TIME_OPTIONS } from '../utils/constants';

const { width } = Dimensions.get('window');

const TimePickerScreen = ({ navigation, route }) => {
  const { selectedApps } = route.params;
  const [selectedAccessTime, setSelectedAccessTime] = useState(15); // default 15 minutes
  const [selectedLockTime, setSelectedLockTime] = useState(60); // default 1 hours

  const handleStartSession = () => {
    if (!selectedAccessTime || !selectedLockTime) {
      Alert.alert('Error', 'Please select both access time and lock time');
      return;
    }

    const sessionData = {
      apps: selectedApps,
      accessTime: selectedAccessTime,
      lockTime: selectedLockTime,
      startTime: new Date().toISOString(),
      isActive: true,
    };

    // Save to MMKV storage
    //StorageService.setActiveSession(sessionData);
    console.log('ActiveSession - ', StorageService.getActiveSession());
    //StorageService.setLockedApps(selectedApps);
    console.log('LockedApps - ', StorageService.getLockedApps());

    navigation.navigate('ActiveSession', {
      sessionData: sessionData,
    });
  };

  const TimeOption = ({ option, isSelected, onPress, type }) => (
    <TouchableOpacity
      style={[styles.timeOption, isSelected && styles.selectedTimeOption]}
      onPress={() => onPress(option.value)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={
          isSelected ? [COLORS.PRIMARY, '#6A5ACD'] : ['#f8f9fa', '#ffffff']
        }
        style={styles.timeOptionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon
          name={type === 'access' ? 'play-circle-filled' : 'lock'}
          size={24}
          color={isSelected ? '#ffffff' : COLORS.PRIMARY}
        />
        <Text
          style={[
            styles.timeOptionText,
            isSelected && styles.selectedTimeOptionText,
          ]}
        >
          {option.label}
        </Text>
        {isSelected && (
          <Icon
            name="check-circle"
            size={20}
            color="#ffffff"
            style={styles.checkIcon}
          />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#f8f9fa', '#e9ecef']} style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Set Time Limits</Text>
          <Text style={styles.subtitle}>
            Choose your access time and lock duration
          </Text>
        </View>

        {/* Selected Apps Summary */}
        <View style={styles.selectedAppsContainer}>
          <Text style={styles.sectionTitle}>
            📱 Selected Apps ({selectedApps.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedApps.slice(0, 5).map((app, index) => (
              <View key={index} style={styles.appChip}>
                <Text style={styles.appChipText}>{app.appName}</Text>
              </View>
            ))}
            {selectedApps.length > 5 && (
              <View style={styles.appChip}>
                <Text style={styles.appChipText}>
                  +{selectedApps.length - 5}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Access Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Access Time</Text>
          <Text style={styles.sectionDescription}>
            How long can you use these apps?
          </Text>
          <View style={styles.timeOptionsContainer}>
            {TIME_OPTIONS.ACCESS_TIME.map(option => (
              <TimeOption
                key={option.value}
                option={option}
                isSelected={selectedAccessTime === option.value}
                onPress={setSelectedAccessTime}
                type="access"
              />
            ))}
          </View>
        </View>

        {/* Lock Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Lock Duration</Text>
          <Text style={styles.sectionDescription}>
            How long should these apps be locked after use?
          </Text>
          <View style={styles.timeOptionsContainer}>
            {TIME_OPTIONS.LOCK_TIME.map(option => (
              <TimeOption
                key={option.value}
                option={option}
                isSelected={selectedLockTime === option.value}
                onPress={setSelectedLockTime}
                type="lock"
              />
            ))}
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={[COLORS.PRIMARY, '#6A5ACD']}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.summaryTitle}>Session Summary</Text>
            <View style={styles.summaryRow}>
              <Icon name="play-circle-filled" size={20} color="#ffffff" />
              <Text style={styles.summaryText}>
                Access Time:{' '}
                {
                  TIME_OPTIONS.ACCESS_TIME.find(
                    opt => opt.value === selectedAccessTime,
                  )?.label
                }
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Icon name="lock" size={20} color="#ffffff" />
              <Text style={styles.summaryText}>
                Lock Duration:{' '}
                {
                  TIME_OPTIONS.LOCK_TIME.find(
                    opt => opt.value === selectedLockTime,
                  )?.label
                }
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Icon name="apps" size={20} color="#ffffff" />
              <Text style={styles.summaryText}>
                Apps: {selectedApps.length} selected
              </Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Start Session Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartSession}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.SUCCESS, '#32CD32']}
            style={styles.startButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="play-arrow" size={28} color="#ffffff" />
            <Text style={styles.startButtonText}>Start Session</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT + '80',
    textAlign: 'center',
  },
  selectedAppsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 15,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.TEXT + '70',
    marginBottom: 15,
  },
  appChip: {
    backgroundColor: COLORS.PRIMARY + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  appChipText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  timeOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeOption: {
    width: (width - 60) / 2,
    marginBottom: 15,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
  },
  selectedTimeOption: {
    transform: [{ scale: 1.02 }],
  },
  timeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginLeft: 10,
    flex: 1,
  },
  selectedTimeOptionText: {
    color: '#ffffff',
  },
  checkIcon: {
    marginLeft: 5,
  },
  summaryCard: {
    marginBottom: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  summaryGradient: {
    padding: 20,
    borderRadius: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 10,
    fontWeight: '500',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  startButton: {
    borderRadius: 25,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 25,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 10,
  },
});

export default TimePickerScreen;
