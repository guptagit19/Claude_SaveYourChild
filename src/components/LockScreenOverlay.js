// src/components/LockScreenOverlay.js - Enhanced Version
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  BackHandler,
  NativeModules,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { AppMonitorModule } = NativeModules;
const { width, height } = Dimensions.get('window');

const LockScreenOverlay = (props) => {
  console.log('🚀 LockScreenOverlay mounted with props:', props);
  
  const { appName, packageName, remainingTime = 30 } = props;
  
  // State management
  const [timeLeft, setTimeLeft] = useState(remainingTime);
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(0.8));

  useEffect(() => {
    console.log('🔐 LockScreenOverlay initialized for:', appName);
    
    // Handle back button
    const backAction = () => {
      console.log('⬅️ Back button pressed in overlay');
      handleGoHome();
      return true;
    };
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
    // Start animations
    startEnhancedAnimations();
    
    // Setup timer
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleUnlock();
          return 0;
        }
        return prevTime - 1;
      });
    }, 60000);
    
    return () => {
      backHandler.remove();
      clearInterval(timer);
    };
  }, []);

  const startEnhancedAnimations = () => {
    // ✅ Enhanced entrance animation
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // ✅ Continuous pulse animation
    const pulseLoop = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => pulseLoop());
    };
    pulseLoop();
  };

  const handleGoHome = () => {
    console.log('🏠 Going to home screen from React Native overlay');
    try {
      // ✅ Close overlay activity
      if (AppMonitorModule.finishActivity) {
        AppMonitorModule.finishActivity();
      } else {
        AppMonitorModule.goToHomeScreen();
      }
    } catch (error) {
      console.error('❌ Error going home:', error);
    }
  };

  const handleUnlock = () => {
    console.log('🔓 Time completed, unlocking...');
    handleGoHome();
  };

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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: fadeAnimation,
              transform: [{ scale: scaleAnimation }]
            }
          ]}
        >
          {/* Enhanced Lock Icon */}
          <Animated.View
            style={[
              styles.lockIconContainer,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.iconGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            >
              <Icon name="lock" size={80} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
          
          {/* App Name */}
          <Text style={styles.title}>
            {appName || 'App'} is Locked
          </Text>
          
          <Text style={styles.subtitle}>
            Focus on your goals LockScreenOverlay.js ! 🎯
          </Text>
          
          {/* Enhanced Time Display */}
          <Animated.View style={[styles.timeContainer, { opacity: fadeAnimation }]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.timeGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            >
              <Text style={styles.timeLabel}>Time Remaining</Text>
              <Text style={styles.timeDisplay}>
                {formatTime(timeLeft)}
              </Text>
              <Text style={styles.timeSubtext}>
                Stay strong! 💪
              </Text>
            </LinearGradient>
          </Animated.View>
          
          {/* Enhanced Home Button */}
          <TouchableOpacity 
            style={styles.homeButton} 
            onPress={handleGoHome}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.buttonGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            >
              <Icon name="home" size={28} color="#ffffff" />
              <Text style={styles.buttonText}>Go Home</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Motivational Quote */}
          <Animated.View style={[styles.quoteContainer, { opacity: fadeAnimation }]}>
            <Text style={styles.quoteText}>
              "Success is built on small daily disciplines! 🌟"
            </Text>
          </Animated.View>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${Math.max(0, (1 - timeLeft / remainingTime) * 100)}%`,
                    opacity: fadeAnimation
                  }
                ]} 
              />
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lockIconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
  },
  timeContainer: {
    marginVertical: 24,
  },
  timeGradient: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    minWidth: 280,
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
    textShadowRadius: 6,
  },
  timeSubtext: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 8,
  },
  homeButton: {
    marginVertical: 32,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  quoteContainer: {
    marginTop: 20,
    paddingHorizontal: 24,
  },
  quoteText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.9,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 60,
    left: 32,
    right: 32,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
});

export default LockScreenOverlay;
