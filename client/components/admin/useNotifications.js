import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { useWebSocket } from './hooks/useWebSocket';

export const useNotifications = () => {
  const { on, off } = useWebSocket();

  useEffect(() => {
    on('task:created', (task) => {
      Toast.show({
        type: 'success',
        text1: '🎉 New Task',
        text2: `"${task.name}" assigned to ${task.assigned_to_name}`,
        position: 'top',
        duration: 4000,
      });
    });

    on('task:updated', (task) => {
      Toast.show({
        type: 'info',
        text1: '🔄 Task Updated',
        text2: `"${task.name}" status changed`,
        position: 'top',
      });
    });

    return () => {
      off('task:created', null);
      off('task:updated', null);
    };
  }, [on, off]);
};
