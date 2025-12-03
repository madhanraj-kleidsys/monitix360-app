import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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

// ========== EMPLOYEE CARD COMPONENT ==========
function EmployeeCard({ employee, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>
            {employee.firstName} {employee.lastName}
          </Text>
          <Text style={styles.employeeDetail}>
            <Text style={styles.label}>Code:</Text> {employee.userCode}
          </Text>
          <Text style={styles.employeeDetail}>
            <Text style={styles.label}>Email:</Text> {employee.email}
          </Text>
          <Text style={styles.employeeDetail}>
            <Text style={styles.label}>Department:</Text> {employee.department}
          </Text>
          <Text style={styles.employeeDetail}>
            <Text style={styles.label}>Role:</Text>{' '}
            {employee.role === 'admin' ? 'Admin' : 'Employee'}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit(employee)}
          >
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete(employee.id)}
          >
            <Ionicons name="trash" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ========== ADD/EDIT EMPLOYEE MODAL ==========
function EmployeeModal({ visible, employee, onClose, onSave }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userCode: '',
    username: '',
    email: '',
    password: '',
    contactNo: '',
    division: '',
    dateOfBirth: '',
    department: '',
    role: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        userCode: employee.userCode || '',
        username: employee.username || '',
        email: employee.email || '',
        password: employee.password || '',
        contactNo: employee.contactNo || '',
        division: employee.division || '',
        dateOfBirth: employee.dateOfBirth || '',
        department: employee.department || '',
        role: employee.role || '',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        userCode: '',
        username: '',
        email: '',
        password: '',
        contactNo: '',
        division: '',
        dateOfBirth: '',
        department: '',
        role: '',
      });
    }
    setShowPassword(false);
    setRoleDropdownOpen(false);
  }, [employee, visible]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.userCode.trim() ||
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password.trim() ||
      !formData.contactNo.trim() ||
      !formData.division.trim() ||
      !formData.dateOfBirth.trim() ||
      !formData.department.trim() ||
      !formData.role.trim()
    ) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      onSave({
        id: employee?.id || Date.now(),
        ...formData,
      });

      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRoleDropdownOpen(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
            style={styles.sheetWrapper}
          >
            <View style={styles.modalContent}>
              {/* Header */}
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
                  {employee ? 'Edit Employee' : 'Add Employee'}
                </Text>
                <View style={{ width: 44 }} />
              </LinearGradient>

              {/* Body */}
              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.section}>
                  {/* First Name */}
                  <Text style={styles.fieldLabel}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter first name"
                    placeholderTextColor={COLORS.textLight}
                    value={formData.firstName}
                    onChangeText={value => handleInputChange('firstName', value)}
                    editable={!loading}
                  />

                  {/* Last Name */}
                  <Text style={styles.fieldLabel}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter last name"
                    placeholderTextColor={COLORS.textLight}
                    value={formData.lastName}
                    onChangeText={value => handleInputChange('lastName', value)}
                    editable={!loading}
                  />

                  {/* User Code */}
                  <Text style={styles.fieldLabel}>User Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter user code"
                    placeholderTextColor={COLORS.textLight}
                    value={formData.userCode}
                    onChangeText={value => handleInputChange('userCode', value)}
                    editable={!loading}
                  />

                  {/* Username */}
                  <Text style={styles.fieldLabel}>Username</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter username"
                    placeholderTextColor={COLORS.textLight}
                    value={formData.username}
                    onChangeText={value => handleInputChange('username', value)}
                    editable={!loading}
                  />

                  {/* Email */}
                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email"
                    placeholderTextColor={COLORS.textLight}
                    value={formData.email}
                    onChangeText={value => handleInputChange('email', value)}
                    editable={!loading}
                    keyboardType="email-address"
                  />

                  {/* Password */}
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, paddingRight: 40 }]}
                      placeholder="Enter password"
                      placeholderTextColor={COLORS.textLight}
                      value={formData.password}
                      onChangeText={value => handleInputChange('password', value)}
                      editable={!loading}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.passwordEye}
                      onPress={() => setShowPassword(prev => !prev)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Contact No */}
                  <Text style={styles.fieldLabel}>Contact No</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter contact number"
                    placeholderTextColor={COLORS.textLight}
                    value={formData.contactNo}
                    onChangeText={value => handleInputChange('contactNo', value)}
                    editable={!loading}
                    keyboardType="phone-pad"
                  />

                  {/* Division */}
                  <Text style={styles.fieldLabel}>Division</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter division"
                    placeholderTextColor={COLORS.textLight}
                    value={formData.division}
                    onChangeText={value => handleInputChange('division', value)}
                    editable={!loading}
                  />

                  {/* Date of Birth */}
                  <Text style={styles.fieldLabel}>Date of Birth</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textLight}
                    value={formData.dateOfBirth}
                    onChangeText={value => handleInputChange('dateOfBirth', value)}
                    editable={!loading}
                  />

                  {/* Department */}
                  <Text style={styles.fieldLabel}>Department</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter department"
                    placeholderTextColor={COLORS.textLight}
                    value={formData.department}
                    onChangeText={value => handleInputChange('department', value)}
                    editable={!loading}
                  />

                  {/* Role dropdown */}
                  <Text style={styles.fieldLabel}>Role</Text>
                  <View>
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => setRoleDropdownOpen(prev => !prev)}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          !formData.role && { color: COLORS.textLight },
                        ]}
                      >
                        {formData.role === 'admin'
                          ? 'Admin'
                          : formData.role === 'user'
                          ? 'Employee'
                          : 'Select role'}
                      </Text>
                      <Ionicons
                        name={roleDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORS.textLight}
                      />
                    </TouchableOpacity>

                    {roleDropdownOpen && (
                      <View style={styles.dropdownMenu}>
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            handleInputChange('role', 'admin');
                            setRoleDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>Admin</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            handleInputChange('role', 'user');
                            setRoleDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>Employee</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Buttons */}
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={[styles.saveButton, loading && { opacity: 0.6 }]}
                      onPress={handleSave}
                      disabled={loading}
                    >
                      <Text style={styles.saveButtonText}>
                        {loading ? 'Saving...' : 'Save'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleClose}
                      disabled={loading}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ========== MAIN EMPLOYEES PAGE ==========
export default function AdminEmployeePage() {
  const [employees, setEmployees] = useState([
    {
      id: 1,
      firstName: 'madhaneeh',
      lastName: 'J',
      userCode: 'EMP-001',
      username: 'madhaneeh.j',
      email: 'madhaneeh@kleidsys.com',
      password: '78946513',
      contactNo: '9876543210',
      division: 'Development',
      dateOfBirth: '2005-05-15',
      department: 'Development',
      role: 'user',
    },
    {
      id: 2,
      firstName: 'kavi',
      lastName: 'S',
      userCode: 'EMP-002',
      username: 'kavi.s',
      email: 'kavi@kleidsys.com',
      password: '865876565',
      contactNo: '9876543211',
      division: 'Frontend',
      dateOfBirth: '2008-08-22',
      department: 'UI/UX',
      role: 'user',
    },
    {
      id: 3,
      firstName: 'arun',
      lastName: 's',
      userCode: 'EMP-003',
      username: 'arun.s',
      email: 'arun@kleidsys.com',
      password: '8645465454',
      contactNo: '9876543212',
      division: 'Backend',
      dateOfBirth: '1988-12-10',
      department: 'Infrastructure',
      role: 'admin',
    },
    {
      id: 4,
      firstName: 'patel',
      lastName: 's',
      userCode: 'EMP-004',
      username: 'patel.s',
      email: 'patel@kleidsys.com',
      password: '8645465454',
      contactNo: '9876543212',
      division: 'Backend',
      dateOfBirth: '1988-12-10',
      department: 'Infrastructure',
      role: 'user',
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setModalVisible(true);
  };

  const handleEditEmployee = employee => {
    setSelectedEmployee(employee);
    setModalVisible(true);
  };

  const handleDeleteEmployee = employeeId => {
    Alert.alert(
      'Delete Employee',
      'Are you sure you want to delete this employee?',
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Delete',
          onPress: () => {
            setEmployees(prev => prev.filter(e => e.id !== employeeId));
            Alert.alert('Success', 'Employee deleted successfully');
          },
          style: 'destructive',
        },
      ],
    );
  };

  const handleSaveEmployee = employeeData => {
    if (selectedEmployee) {
      setEmployees(prev =>
        prev.map(e => (e.id === selectedEmployee.id ? { ...employeeData, id: e.id } : e)),
      );
      Alert.alert('Success', 'Employee updated successfully');
    } else {
      setEmployees(prev => [...prev, employeeData]);
      Alert.alert('Success', 'Employee added successfully');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#00D4FF', '#0099FF', '#667EEA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Employees</Text>
          <Text style={styles.headerSubtitle}>Manage all employees</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.topSection}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddEmployee}>
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add New Employee</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.employeesSection}>
          <Text style={styles.sectionTitle}>All Employees ({employees.length})</Text>

          {employees.length > 0 ? (
            employees.map(employee => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onEdit={handleEditEmployee}
                onDelete={handleDeleteEmployee}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No employees yet</Text>
              <Text style={styles.emptySubtext}>Click "Add New Employee" to create one</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <EmployeeModal
        visible={modalVisible}
        employee={selectedEmployee}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveEmployee}
      />
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

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

  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

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

  employeesSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },

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
  cardContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  employeeInfo: {
    flex: 1,
    marginRight: 12,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  employeeDetail: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textLight,
    marginBottom: 4,
  },
  label: {
    fontWeight: '700',
    color: COLORS.text,
  },

  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
  },

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
  modalRoot: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
  width: '100%',
},
  modalContainer: {
    width: '100%',
    maxHeight: height * 0.95,
  },
  // keyboardAvoidingInner: {
  //   flex: 1,
  // },
  modalContent: {
    height: height * 0.95,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
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

  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: COLORS.background,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },

  passwordRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordEye: {
    position: 'absolute',
    right: 12,
  },

  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 2,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.text,
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORS.text,
  },

  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
