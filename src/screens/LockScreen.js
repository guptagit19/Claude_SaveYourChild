// src/screens/LockScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  BackHandler,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import QuoteCard from '../components/common/QuoteCard';
import { COLORS } from '../utils/constants';
import { MOTIVATIONAL_QUOTES } from '../utils/motivationalQuotes';
import StorageService from '../services/StorageService';

const { width, height } = Dimensions.get('window');

const LockScreen = ({ route, navigation }) => {
  const { lockedAppName, remainingTime } = route.params || {};
  
  // State management
  const [currentQuote, setCurrentQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const [timeLeft, setTimeLeft] = useState(remainingTime || 0);
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [fadeAnimation] = useState(new Animated.Value(0));

  // Initialize component
  useEffect(() => {
    // Disable back button
    const backAction = () => {
      Alert.alert(
        "Stay Strong! 💪",
        "You're building discipline. Keep going!",
        [{ text: "OK" }]
      );
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    // Start animations
    startAnimations();
    
    // Random quote selection
    selectRandomQuote();
    
    // Setup timer
    setupTimer();

    return () => {
      backHandler.remove();
    };
  }, []);

  // Animation functions
  const startAnimations = () => {
    // Fade in animation
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Pulse animation for lock icon
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  };

  // Quote management
  const selectRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setCurrentQuote(MOTIVATIONAL_QUOTES[randomIndex]);
    
    // Change quote every 30 seconds
    const quoteInterval = setInterval(() => {
      const newIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
      setCurrentQuote(MOTIVATIONAL_QUOTES[newIndex]);
    }, 30000);

    return () => clearInterval(quoteInterval);
  };

  // Timer management
  const setupTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleUnlock();
          return 0;
        }
        return prevTime - 1;
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  };

  // Handle unlock
  const handleUnlock = async () => {
    try {
      // Clear active session
      await StorageService.setActiveSession(null);
      
      // Show success message
      Alert.alert(
        "Well Done! 🎉",
        "You've successfully completed your focus time!",
        [
          {
            text: "Continue",
            onPress: () => navigation.navigate('AppSelection')
          }
        ]
      );
    } catch (error) {
      console.error('Error handling unlock:', error);
    }
  };

  // Format time display
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnimation }
          ]}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.lockIconContainer,
                { transform: [{ scale: pulseAnimation }] }
              ]}
            >
              <Icon name="lock" size={80} color="#ffffff" />
            </Animated.View>
            
            <Text style={styles.appName}>
              {lockedAppName} is Locked
            </Text>
            
            <Text style={styles.subtitle}>
              Stay focused on your goals! 🎯
            </Text>
          </View>

          {/* Time Remaining */}
          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>Time Remaining</Text>
            <Text style={styles.timeDisplay}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={styles.timeSubtext}>
              Keep going, you're doing great!
            </Text>
          </View>

          {/* Motivational Quote */}
          <View style={styles.quoteContainer}>
            <QuoteCard 
              quote={currentQuote.text}
              author={currentQuote.author}
              style={styles.quoteCard}
            />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${Math.max(0, (1 - timeLeft / (remainingTime || 1)) * 100)}%` 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              Building your focus strength... 💪
            </Text>
          </View>

          {/* Bottom Section */}
          <View style={styles.footer}>
            <View style={styles.tipContainer}>
              <Icon name="lightbulb-outline" size={24} color="#ffffff" />
              <Text style={styles.tipText}>
                Use this time to study, read, or relax without distractions
              </Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  lockIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
  },
  timeContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 24,
    marginVertical: 20,
    backdropFilter: 'blur(10px)',
  },
  timeLabel: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 8,
  },
  timeDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  timeSubtext: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 8,
    textAlign: 'center',
  },
  quoteContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 20,
  },
  quoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressContainer: {
    marginVertical: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 12,
    opacity: 0.8,
  },
  footer: {
    alignItems: 'center',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    maxWidth: width * 0.9,
  },
  tipText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 12,
    flex: 1,
    opacity: 0.9,
  },
});

export default LockScreen;