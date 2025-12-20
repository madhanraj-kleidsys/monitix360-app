// src/hooks/useProjects.js
import { useState, useEffect } from 'react';
import api from '../../../api/client';
import { useWebSocket } from './useWebSocket';

export default function useProjects() {
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const res = await api.get('/projects');
      const mapped = res.data.map(p => ({
        id: p.id,
        name: p.project_name,
        code: p.project_code,
      }));
      setProjects(mapped);
    } catch (e) {
      console.error('Error fetching projects in hook:', e);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const { on, off, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    const handleProjectUpdate = (data) => {
      console.log('🔄 Project update received:', data);
      fetchProjects();
    };

    on('project:created', handleProjectUpdate);
    on('project:updated', handleProjectUpdate);
    on('project:deleted', handleProjectUpdate);

    return () => {
      off('project:created', handleProjectUpdate);
      off('project:updated', handleProjectUpdate);
      off('project:deleted', handleProjectUpdate);
    };
  }, [isConnected, on, off]);

  return { projects, projectsLoading, refetchProjects: fetchProjects };
}