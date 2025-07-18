// src/components/common/QuoteCard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../../utils/constants';

const QuoteCard = ({ quote, author, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.quoteContainer}>
        <Text style={styles.quoteIcon}>"</Text>
        <Text style={styles.quoteText}>{quote}</Text>
        <Text style={styles.quoteIcon}>"</Text>
      </View>
      
      {author && (
        <Text style={styles.authorText}>— {author}</Text>
      )}
      
      <View style={styles.decorativeLines}>
        <View style={styles.line} />
        <View style={styles.dot} />
        <View style={styles.line} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    marginVertical: 10,
    marginHorizontal: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  quoteIcon: {
    fontSize: 30,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    marginTop: -5,
  },
  quoteText: {
    flex: 1,
    fontSize: 18,
    lineHeight: 26,
    color: COLORS.TEXT,
    fontStyle: 'italic',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  authorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    fontWeight: '500',
    marginTop: 10,
  },
  decorativeLines: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  line: {
    height: 1,
    backgroundColor: '#E0E0E0',
    flex: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.PRIMARY,
    marginHorizontal: 10,
  },
});

export default QuoteCard;