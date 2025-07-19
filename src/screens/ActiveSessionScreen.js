// src/screens/ActiveSessionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../services/StorageService';
import { COLORS } from '../utils/constants';

const { width } = Dimensions.get('window');

const ActiveSessionScreen = ({ navigation, route }) => {
  const { sessionData } = route.params;
  const [timeRemaining, setTimeRemaining] = useState(sessionData.accessTime * 60); // convert to seconds
  const [isActive, setIsActive] = useState(true);
  const [progressValue] = useState(new Animated.Value(1));

  useEffect(() => {
    let interval;
    
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            // Time's up - navigate to lock screen
            handleTimeExpired();
            return 0;
          }
          
          // Update progress animation
          const progress = newTime / (sessionData.accessTime * 60);
          Animated.timing(progressValue, {
            toValue: progress,
            duration: 500,
            useNativeDriver: false,
          }).start();
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining]);

  const handleTimeExpired = () => {
    setIsActive(false);
    
    // Update session in storage
    const updatedSession = {
      ...sessionData,
      endTime: new Date().toISOString(),
      isActive: false,
    };
    StorageService.setActiveSession(updatedSession);
    
    // Navigate to lock screen
    navigation.navigate('LockScreen', {
      sessionData: updatedSession,
      lockTimeRemaining: sessionData.lockTime * 60, // convert to seconds
    });
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Session Early?',
      'Are you sure you want to end this session? The apps will be locked immediately.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => handleTimeExpired(),
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    const progress = timeRemaining / (sessionData.accessTime * 60);
    if (progress > 0.5) return COLORS.SUCCESS;
    if (progress > 0.2) return COLORS.WARNING;
    return COLORS.ERROR;
  };

  const AppItem = ({ app }) => (
    <View style={styles.appItem}>
      <Icon name="smartphone" size={24} color={COLORS.PRIMARY} />
      <Text style={styles.appName}>{app.appName}</Text>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>Active</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎯 Session Active</Text>
          <Text style={styles.subtitle}>Stay focused! You're doing great!</Text>
        </View>

        {/* Countdown Timer Card */}
        <View style={styles.timerCard}>
          <LinearGradient
            colors={['#ffffff', '#f8f9fa']}
            style={styles.timerGradient}
          >
            {/* Circular Progress */}
            <View style={styles.progressContainer}>
              <Animated.View style={[
                styles.progressCircle,
                {
                  backgroundColor: getProgressColor() + '20',
                  borderColor: getProgressColor(),
                }
              ]}>
                <Text style={[styles.timerText, { color: getProgressColor() }]}>
                  {formatTime(timeRemaining)}
                </Text>
                <Text style={styles.timerLabel}>remaining</Text>
              </Animated.View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: getProgressColor(),
                  }
                ]}
              />
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{sessionData.accessTime}min</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{sessionData.apps.length}</Text>
                <Text style={styles.statLabel}>Apps</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.floor((sessionData.accessTime * 60 - timeRemaining) / 60)}min</Text>
                <Text style={styles.statLabel}>Used</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Apps List */}
        <View style={styles.appsContainer}>
          <Text style={styles.sectionTitle}>📱 Accessible Apps</Text>
          {sessionData.apps.map((app, index) => (
            <AppItem key={index} app={app} />
          ))}
        </View>

        {/* Motivational Section */}
        <View style={styles.motivationCard}>
          <LinearGradient
            colors={[COLORS.SUCCESS + '20', COLORS.SUCCESS + '10']}
            style={styles.motivationGradient}
          >
            <Icon name="emoji-events" size={48} color={COLORS.SUCCESS} />
            <Text style={styles.motivationTitle}>You're Doing Amazing! 🌟</Text>
            <Text style={styles.motivationText}>
              Every minute of focused time brings you closer to your goals. 
              Stay strong and keep going!
            </Text>
          </LinearGradient>
        </View>

        {/* Lock Preview */}
        <View style={styles.lockPreviewCard}>
          <Text style={styles.lockPreviewTitle}>⏰ After This Session</Text>
          <Text style={styles.lockPreviewText}>
            Apps will be locked for <Text style={styles.lockTime}>{sessionData.lockTime} minutes</Text>
          </Text>
          <Text style={styles.lockPreviewSubtext}>
            Use this time to focus on your studies, work, or spend time with family!
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndSession}
          activeOpacity={0.8}
        >
          <Icon name="stop" size={24} color={COLORS.ERROR} />
          <Text style={styles.endButtonText}>End Early</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          activeOpacity={0.8}
          disabled
        >
          <LinearGradient
            colors={[COLORS.PRIMARY, '#6A5ACD']}
            style={styles.continueButtonGradient}
          >
            <Icon name="schedule" size={24} color="#ffffff" />
            <Text style={styles.continueButtonText}>Session Running</Text>
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
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff90',
    textAlign: 'center',
  },
  timerCard: {
    borderRadius: 20,
    marginBottom: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  timerGradient: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  timerLabel: {
    fontSize: 14,
    color: COLORS.TEXT + '80',
    marginTop: 5,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT + '80',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
  },
  appsContainer: {
    marginBottom: 25,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff20',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  appName: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  motivationCard: {
    marginBottom: 20,
    borderRadius: 15,
  },
  motivationGradient: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
    marginVertical: 10,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: 14,
    color: COLORS.TEXT,
    textAlign: 'center',
    lineHeight: 20,
  },
  lockPreviewCard: {
    backgroundColor: '#ffffff20',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  lockPreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  lockPreviewText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  lockTime: {
    fontWeight: 'bold',
    color: COLORS.WARNING,
  },
  lockPreviewSubtext: {
    fontSize: 14,
    color: '#ffffff80',
    textAlign: 'center',
    lineHeight: 18,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 30,
  },
  endButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff20',
    paddingVertical: 15,
    borderRadius: 25,
    marginRight: 10,
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ERROR,
    marginLeft: 8,
  },
  continueButton: {
    flex: 2,
    borderRadius: 25,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 25,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
});

export default ActiveSessionScreen;