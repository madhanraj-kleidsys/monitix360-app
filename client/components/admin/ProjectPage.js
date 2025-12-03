import React, { useState, useMemo ,useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native';

const { height } = Dimensions.get('window');

const COLORS = {
  primary: '#0099FF',
  secondary: '#00D4FF',
  accent: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  text: '#0F172A',
  textLight: '#64748B',
  border: '#E2E8F0',
};

// ========== PROJECT CARD COMPONENT ==========
function ProjectCard({ project, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{project.name}</Text>
          <Text style={styles.projectCode}>{project.code}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(project)}
        >
          <Ionicons name="pencil" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(project.id)}
        >
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ========== ADD/EDIT PROJECT MODAL ==========
function ProjectModal({ visible, project, onClose, onSave }) {
  const [projectName, setProjectName] = useState(project?.name || '');
  const [projectCode, setProjectCode] = useState(project?.code || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setProjectName(project?.name || '');
      setProjectCode(project?.code || '');
    }
  }, [visible, project]);

  const handleSave = async () => {
    if (!projectName.trim() || !projectCode.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      onSave({
        id: project?.id || Date.now(),
        name: projectName,
        code: projectCode,
      });

      setProjectName('');
      setProjectCode('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setProjectName('');
    setProjectCode('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => { }}>
            <View style={styles.modalContent}>
              {/* <View style={{
            heiht:20,backgroundColor:COLORS.background
          }} /> */}
              {/* Modal Header */}
              {/* <View style={styles.sheet}> */}
                <LinearGradient
                  colors={['#00D4FF', '#0099FF', '#667EEA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalHeader}
                >
                  <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>
                    {project ? 'Edit Project' : 'Add Project'}
                  </Text>
                  <View style={{ width: 44 }} />
                </LinearGradient>
              {/* </View> */}
              {/* Modal Body */}
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
              >
                <ScrollView style={styles.modalBody}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">
                  <View style={styles.section}>
                    <Text style={styles.label}>Project Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter project name"
                      value={projectName}
                      onChangeText={setProjectName}
                      editable={!loading}
                    />

                    <Text style={styles.label}>Project Code</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter project code"
                      value={projectCode}
                      onChangeText={setProjectCode}
                      editable={!loading}
                    />

                    <TouchableOpacity
                      style={[styles.saveButton, loading && { opacity: 0.6 }]}
                      onPress={handleSave}
                      disabled={loading}
                    >
                      <Text style={styles.saveButtonText}>
                        {loading ? 'Saving...' : 'Save Project'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
      {/* <View style={{ height: 40, backgroundColor: COLORS.background }} /> */}
              </KeyboardAvoidingView>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ========== MAIN PROJECTS PAGE ==========
export default function AdminProjectPage() {
  const [projects, setProjects] = useState([
    { id: 1, name: 'Admin Portal', code: 'AP-001' },
    { id: 2, name: 'Mobile App Backend', code: 'MAB-002' },
    { id: 3, name: 'Performance Enhancement', code: 'PE-003' },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const handleAddProject = () => {
    setSelectedProject(null);
    setModalVisible(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setModalVisible(true);
  };

  const handleDeleteProject = (projectId) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project?',
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Delete',
          onPress: () => {
            setProjects(projects.filter(p => p.id !== projectId));
            Alert.alert('Success', 'Project deleted successfully');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSaveProject = (projectData) => {
    if (selectedProject) {
      // Edit existing project
      setProjects(
        projects.map(p =>
          p.id === selectedProject.id ? { ...projectData, id: p.id } : p
        )
      );
      Alert.alert('Success', 'Project updated successfully');
    } else {
      // Add new project
      setProjects([...projects, projectData]);
      Alert.alert('Success', 'Project added successfully');
    }
  };

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#00D4FF', '#0099FF', '#667EEA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Projects</Text>
            <Text style={styles.headerSubtitle}>Manage all projects</Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Add Project Button */}
          <View style={styles.topSection}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddProject}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add New Project</Text>
            </TouchableOpacity>
          </View>

          {/* Projects List */}
          <View style={styles.projectsSection}>
            <Text style={styles.sectionTitle}>All Projects ({projects.length})</Text>

            {projects.length > 0 ? (
              projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="folder-outline" size={48} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No projects yet</Text>
                <Text style={styles.emptySubtext}>Click "Add New Project" to create one</Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Add/Edit Project Modal */}
        <ProjectModal
          visible={modalVisible}
          project={selectedProject}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveProject}
        />
      </View>
    </>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingBottom: 100,
  },

  // HEADER STYLES
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 10,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },

  // CONTENT STYLES
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // TOP SECTION
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // PROJECTS SECTION
  projectsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },

  // PROJECT CARD
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  projectInfo: {
    gap: 6,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  projectCode: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },

  // CARD ACTIONS
  cardActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // EMPTY STATE
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },

  // MODAL STYLES
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    // flex: 1,
    // justifyContent: 'flex-end',
    height: height * 0.65,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  // sheet: {
  //   backgroundColor: COLORS.background,
  //   borderTopLeftRadius: 24,
  //   borderTopRightRadius: 24,
  //   maxHeight: height * 0.8,
  // },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },

  // MODAL BODY
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },

  // SAVE BUTTON
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});


