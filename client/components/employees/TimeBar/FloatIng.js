import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';

const AnimatedFloatingTimeline = () => {
  const resources = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' },
  { id: 3, name: 'Mike Johnson' },
  { id: 4, name: 'Sarah Williams' },
  ];
  
  const tasks = [
  {
    id: 1,
    resource_id: 1,
    title: 'Design Mockups',
    start_time: moment().startOf('day').add(9, 'hours').toDate(),
    end_time: moment().startOf('day').add(11, 'hours').toDate(),
    priority: 'high',
  },
  {
    id: 2,
    resource_id: 1,
    title: 'Code Review',
    start_time: moment().startOf('day').add(14, 'hours').toDate(),
    end_time: moment().startOf('day').add(16, 'hours').toDate(),
    priority: 'medium',
  },
  {
    id: 3,
    resource_id: 2,
    title: 'API Development',
    start_time: moment().startOf('day').add(10, 'hours').toDate(),
    end_time: moment().startOf('day').add(13, 'hours').toDate(),
    priority: 'high',
  },
  {
    id: 4,
    resource_id: 2,
    title: 'Testing',
    start_time: moment().startOf('day').add(13, 'hours').toDate(),
    end_time: moment().startOf('day').add(15, 'hours').toDate(),
    priority: 'low',
  },
  {
    id: 5,
    resource_id: 3,
    title: 'Database Optimization',
    start_time: moment().startOf('day').add(11, 'hours').toDate(),
    end_time: moment().startOf('day').add(14, 'hours').toDate(),
    priority: 'medium',
  },
  {
    id: 6,
    resource_id: 3,
    title: 'Documentation',
    start_time: moment().startOf('day').add(15, 'hours').toDate(),
    end_time: moment().startOf('day').add(17, 'hours').toDate(),
    priority: 'low',
  },
  {
    id: 7,
    resource_id: 4,
    title: 'Project Planning',
    start_time: moment().startOf('day').add(9, 'hours').toDate(),
    end_time: moment().startOf('day').add(10, 'hours').toDate(),
    priority: 'high',
  },
  {
    id: 8,
    resource_id: 4,
    title: 'Team Meeting',
    start_time: moment().startOf('day').add(10, 'hours').toDate(),
    end_time: moment().startOf('day').add(11, 'hours').toDate(),
    priority: 'medium',
  },
  {
    id: 9,
    resource_id: 4,
    title: 'Client Presentation',
    start_time: moment().startOf('day').add(14, 'hours').toDate(),
    end_time: moment().startOf('day').add(16, 'hours').toDate(),
    priority: 'high',
  },
  ];

  const { width } = Dimensions.get('window');
  
  // Use useRef to keep the animated values stable across re-renders
  const animatedValuesRef = useRef([]);

  // Initialize animated values only once
  if (animatedValuesRef.current.length !== tasks.length) {
    animatedValuesRef.current = tasks.map(() => new Animated.Value(0));
  }

  const animatedValues = animatedValuesRef.current;

  // Animate each task bar on mount
  useEffect(() => {
    if (animatedValues.length === 0) return;

    animatedValues.forEach((value, index) => {
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.timing(value, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [animatedValues.length]); // Only re-run if task count changes

  const calculateProgress = (task) => {
    const start = moment(task.start_time);
    const end = moment(task.end_time);
    const now = moment();

    if (now.isBefore(start)) return 0;
    if (now.isAfter(end)) return 100;

    const total = end.diff(start);
    const elapsed = now.diff(start);
    return Math.round((elapsed / total) * 100);
  };

  const getGradientColors = (priority) => {
    const gradients = {
      high: ['#ff6b6b', '#ee5a52'],
      medium: ['#4facfe', '#00f2fe'],
      low: ['#43e97b', '#38f9d7'],
    };
    return gradients[priority] || gradients.medium;
  };

  const getDotColor = (priority) => {
    const dotColors = {
      high: '#ff6b6b',
      medium: '#4facfe',
      low: '#43e97b',
    };
    return dotColors[priority] || '#4facfe';
  };

  // Guard: Don't render if no tasks
  if (!tasks || tasks.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No tasks available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSection}>
        <Text style={styles.mainTitle}>Task Timeline</Text>
        <Text style={styles.subtitle}>
          {tasks.length} tasks across {resources.length} resources
        </Text>
      </View>

      {/* Central Vertical Line */}
      <View style={styles.centralLine} />

      {/* Tasks */}
      {tasks.map((task, index) => {
        const progress = calculateProgress(task);
        const colors = getGradientColors(task.priority);
        const dotColor = getDotColor(task.priority);
        const isEven = index % 2 === 0;

        // Make sure we have an animated value for this index
        if (!animatedValues[index]) {
          return null;
        }

        const animatedStyle = {
          opacity: animatedValues[index],
          transform: [
            {
              translateY: animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
            {
              scaleX: animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        };

        const resource = resources.find(r => r.id === task.resource_id);

        return (
          <Animated.View
            key={task.id}
            style={[
              styles.timelineItem,
              isEven ? styles.itemLeft : styles.itemRight,
              animatedStyle,
            ]}
          >
            {/* Dot on the timeline */}
            <View
              style={[
                styles.timelineDot,
                {
                  backgroundColor: dotColor,
                  shadowColor: dotColor,
                },
              ]}
            >
              <View style={styles.dotPulse} />
            </View>

            {/* Card */}
            <LinearGradient
              colors={colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.taskCard}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.titleSection}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.resourceName}>
                    {resource?.name || 'Unknown'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                    },
                  ]}
                >
                  <Text style={styles.priorityText}>
                    {task.priority.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Time Info */}
              <View style={styles.timeSection}>
                <Text style={styles.timeLabel}>
                  ⏱️ {moment(task.start_time).format('h:mm A')}
                </Text>
                <Text style={styles.timeSeparator}>→</Text>
                <Text style={styles.timeLabel}>
                  {moment(task.end_time).format('h:mm A')}
                </Text>
              </View>

              {/* Duration */}
              <Text style={styles.durationText}>
                Duration:{' '}
                {moment(task.end_time).diff(
                  moment(task.start_time),
                  'hours'
                )}
                h
              </Text>

              {/* Animated Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progress}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{progress}%</Text>
              </View>

              {/* Status Badge */}
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {progress === 100
                    ? '✓ Completed'
                    : progress > 0
                    ? '⟳ In Progress'
                    : '○ Upcoming'}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        );
      })}

      {/* Footer Spacer */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  emptyText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  centralLine: {
    position: 'absolute',
    left: '50%',
    top: 140,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(79, 172, 254, 0.2)',
    marginLeft: -1,
  },
  timelineItem: {
    marginBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLeft: {
    paddingRight: '52%',
    justifyContent: 'flex-end',
  },
  itemRight: {
    paddingLeft: '52%',
    justifyContent: 'flex-start',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: -8,
    zIndex: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  taskCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleSection: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  resourceName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginHorizontal: 6,
  },
  durationText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    minWidth: 30,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
});

export default AnimatedFloatingTimeline;