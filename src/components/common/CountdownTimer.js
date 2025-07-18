// src/components/common/CountdownTimer.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const CountdownTimer = ({ 
  totalMinutes, 
  onTimeEnd,
  isActive = true,
  type = 'access' // 'access' or 'lock'
}) => {
  const [timeLeft, setTimeLeft] = useState(totalMinutes * 60); // Convert to seconds
  const [progress] = useState(new Animated.Value(1));

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          onTimeEnd && onTimeEnd();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onTimeEnd]);

  useEffect(() => {
    const progressValue = timeLeft / (totalMinutes * 60);
    Animated.timing(progress, {
      toValue: progressValue,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, totalMinutes, progress]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const percentage = (timeLeft / (totalMinutes * 60)) * 100;
    if (percentage > 50) return COLORS.SUCCESS;
    if (percentage > 25) return COLORS.WARNING;
    return COLORS.ERROR;
  };

  const getTimerMessage = () => {
    if (type === 'access') {
      return timeLeft > 0 ? 'Time Remaining' : 'Access Time Ended';
    } else {
      return timeLeft > 0 ? 'Lock Time Remaining' : 'Lock Time Ended';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTimerMessage()}</Text>
      
      <View style={styles.timerContainer}>
        <View style={styles.progressRing}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: getTimerColor(),
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        
        <Text style={[styles.timeText, { color: getTimerColor() }]}>
          {formatTime(timeLeft)}
        </Text>
      </View>
      
      <Text style={styles.subtitle}>
        {type === 'access' ? 'Focus on your goals! 🎯' : 'Stay disciplined! 💪'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressRing: {
    width: 200,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 10,
  },
  timeText: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default CountdownTimer;