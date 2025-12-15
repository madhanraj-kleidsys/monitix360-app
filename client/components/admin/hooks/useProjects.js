// src/hooks/useProjects.js
import { useState, useEffect } from 'react';
import api from '../../../api/client';

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

  return { projects, projectsLoading, refetchProjects: fetchProjects };
}