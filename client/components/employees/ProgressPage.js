import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#1E5A8E',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
};

export default function ProgressPage() {
  const progressData = [
    { project: 'ERP Module Development', progress: 75, color: COLORS.success },
    { project: 'Mobile App UI Design', progress: 45, color: COLORS.warning },
    { project: 'Database Optimization', progress: 90, color: COLORS.primary },
    { project: 'API Integration', progress: 30, color: COLORS.danger },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress Overview</Text>
        <Text style={styles.headerSubtitle}>Track your project milestones</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {progressData.map((item, index) => (
          <View key={index} style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.projectName}>{item.project}</Text>
              <Text style={styles.progressPercent}>{item.progress}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${item.progress}%`, backgroundColor: item.color }]} />
            </View>
            <View style={styles.progressFooter}>
              <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
              <Text style={styles.progressTime}>
                {item.progress < 50 ? 'Just started' : item.progress < 80 ? 'In progress' : 'Almost done'}
              </Text>
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTime: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
});
