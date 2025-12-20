import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';

const HorizontalGanttChart = () => {
  // Sample data { tasks, resources }
const sampleResources = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' },
  { id: 3, name: 'Mike Johnson' },
  { id: 4, name: 'Sarah Williams' },
];

const sampleTasks = [
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

  const screenWidth = Dimensions.get('window').width;
  const CHART_WIDTH = screenWidth * 1.5;
  const PIXELS_PER_HOUR = 60;
  const RESOURCE_WIDTH = 120;

  // Generate time slots for the day
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const startTime = moment().startOf('day');

  // Calculate position and width based on task time
  const calculatePosition = (task) => {
    const taskStart = moment(task.start_time);
    const taskEnd = moment(task.end_time);
    const diffHours = taskEnd.diff(taskStart, 'hours', true);
    
    const offsetHours = taskStart.diff(startTime, 'hours', true);
    const left = offsetHours * PIXELS_PER_HOUR;
    const width = diffHours * PIXELS_PER_HOUR;

    return { left, width };
  };

  const getColorByPriority = (priority) => {
    const colors = {
      high: ['#ff6b6b', '#ee5a52'],
      medium: ['#ffd93d', '#ffb700'],
      low: ['#6bcf7f', '#4caf50'],
    };
    return colors[priority] || colors.medium;
  };

  return (
    <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
      <View style={styles.container}>
        {/* Header with Hour Labels */}
        <View style={styles.headerSection}>
          <View style={{ width: RESOURCE_WIDTH }} />
          <View style={styles.timelineHeader}>
            {hours.map((hour) => (
              <View
                key={hour}
                style={{
                  width: PIXELS_PER_HOUR,
                  paddingHorizontal: 4,
                  borderRightWidth: 1,
                  borderRightColor: '#ddd',
                }}
              >
                <Text style={styles.hourLabel}>
                  {moment().hour(hour).format('h A')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Task Rows */}
        {sampleResources.map((resource) => {
          const resourceTasks = sampleTasks.filter(t => t.resource_id === resource.id);
          return (
            <View key={resource.id} style={styles.taskRow}>
              {/* Resource Name */}
              <View style={[styles.resourceName, { width: RESOURCE_WIDTH }]}>
                <Text style={styles.resourceText} numberOfLines={2}>
                  {resource.name}
                </Text>
              </View>

              {/* Task Bars */}
              <View style={styles.timelineRow}>
                {resourceTasks.map((task) => {
                  const { left, width } = calculatePosition(task);
                  const colors = getColorByPriority(task.priority);

                  return (
                    <LinearGradient
                      key={task.id}
                      colors={colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.taskBar,
                        {
                          left,
                          width: Math.max(width, 40), // Minimum width for visibility
                        },
                      ]}
                    >
                      <Text style={styles.taskTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={styles.taskTime}>
                        {moment(task.start_time).format('h:mm A')}
                      </Text>
                    </LinearGradient>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerSection: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    backgroundColor: '#fff',
  },
  timelineHeader: {
    flexDirection: 'row',
    height: 50,
  },
  hourLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
  },
  taskRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 80,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  resourceName: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRightWidth: 2,
    borderRightColor: '#333',
    backgroundColor: '#f0f0f0',
  },
  resourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  timelineRow: {
    flex: 1,
    position: 'relative',
    height: 80,
    backgroundColor: '#fafafa',
  },
  taskBar: {
    position: 'absolute',
    top: 10,
    height: 60,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  taskTime: {
    fontSize: 9,
    color: '#fff',
    opacity: 0.9,
  },
});

export default HorizontalGanttChart;