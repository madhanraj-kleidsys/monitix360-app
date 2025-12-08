import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../api/client';

const { height, width } = Dimensions.get('window');

// Detect device type
const isTablet = width >= 768;

// Responsive modal height
// const getModalHeight = () => {
//   if (isTablet) {
//     return Math.min(height * 0.6, 600);  // Tablets: max 60% or 600px, whichever is smaller
//   }
//   return height * 0.8;  // Phones: 80% of height
// };

const getModalWidth = () => {
  if (isTablet) {
    return Math.min(width * 0.8, 700);   // Tablets: max 80% width or 700px
  }
  return width;  // Phones: full width
};

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


// ========== VALIDATION SCHEMA ==========
const validationSchema = Yup.object({
  first_name: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .required('First name is required'),
  last_name: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .required('Last name is required'),
  user_code: Yup.string()
    .required('User code is required'),
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  contact_no: Yup.string()
    .matches(/^\d{10,12}$/, 'Contact number must be 10-12 digits')
    .required('Contact number is required'),
  date_of_birth: Yup.date()
    .required('Date of birth is required')
    .typeError('Invalid date format'),
  department: Yup.string()
    .required('Department is required'),
  division: Yup.string()
    .required('Division is required'),
  role: Yup.string()
    .oneOf(['admin', 'user'], 'Role must be admin or user')
    .required('Role is required'),
});

// ========== ERROR MESSAGE EXTRACTOR ==========
const getErrorMessage = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    return Object.values(errors)[0] || 'Validation error occurred';
  }

  if (error.response?.status) {
    const statusMessages = {
      400: 'Bad request - Please check your input',
      401: 'Unauthorized - Please login again',
      409: 'Duplicate entry - User code or email already exists',
      422: 'Unprocessable entity - Invalid data',
      500: 'Server error - Please try again later',
    };
    return statusMessages[error.response.status] || 'Error occurred';
  }

  return error.message || 'Failed to save employee';
};

// ========== FIELD INPUT COMPONENT WITH ERROR DISPLAY ==========
function FormField({ label, placeholder, value, error, touched, onChangeText, editable, keyboardType, secureTextEntry }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const isError = error && touched;

  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.fieldLabel, isError && styles.errorLabel]}>
        {label} {isError && <Text style={styles.requiredStar}>*</Text>}
      </Text>

      <View style={[styles.inputContainer, isError && styles.inputContainerError]}>
        <TextInput
          style={[styles.input, isError && styles.inputError]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          keyboardType={keyboardType || 'default'}
          secureTextEntry={secureTextEntry && !showPassword}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.passwordEye}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
        )}
      </View>

      {isError && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

// ========== EMPLOYEE CARD COMPONENT ==========
function EmployeeCard({ employee, onEdit, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>
            {employee.first_name} {employee.last_name}
          </Text>
          <Text style={styles.employeeDetail}>
            <Text style={styles.label}>Code:</Text> {employee.user_code}
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

// ========== ADD CUSTOM DEPARTMENT MODAL ==========
function CustomDepartmentModal({ visible, onClose, onSave }) {
  const [departmentName, setDepartmentName] = React.useState('');
  const [error, setError] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (!visible) {
      setDepartmentName('');
      setError('');
    } else {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  const handleSave = () => {
    console.log('📝 Custom dept input:', departmentName);

    if (!departmentName || !departmentName.trim()) {
      setError('⚠️ Please enter a department name');
      console.log('❌ Validation failed: Empty input');
      return;
    }

    const trimmedDept = departmentName.trim();

    if (trimmedDept.length < 2 || trimmedDept.length > 50) {
      setError('⚠️ Department name must be 2-50 characters');
      console.log('❌ Validation failed: Invalid length');
      return;
    }

    if (!/^[a-zA-Z0-9\s\-&/().,]+$/.test(trimmedDept)) {
      setError('⚠️ Only letters, numbers, spaces, and basic punctuation allowed');
      console.log('❌ Validation failed: Invalid characters');
      return;
    }

    console.log('✅ Custom dept valid:', trimmedDept);
    setError('');
    onSave(trimmedDept);
    setDepartmentName('');
    onClose();
  };

  const handleCancel = () => {
    setDepartmentName('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={[styles.overlay, { justifyContent: 'center', alignItems: 'center' }]}>
          <TouchableWithoutFeedback onPress={() => { }}>
            <View style={styles.customDeptModal}>
              <LinearGradient
                colors={['#00D4FF', '#0099FF', '#667EEA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.customDeptHeader}
              >
                <Text style={styles.customDeptTitle}>Add Custom Department</Text>
              </LinearGradient>

              <View style={styles.customDeptContent}>
                <Text style={styles.customDeptLabel}>Department Name</Text>
                <Text style={styles.customDeptHint}>Enter a unique department name (2-50 characters)</Text>

                <TextInput
                  ref={inputRef}
                  style={[styles.customDeptInput, error && styles.customDeptInputError]}
                  placeholder="e.g., Quality Assurance"
                  placeholderTextColor={COLORS.textLight}
                  value={departmentName}
                  onChangeText={(text) => {
                    setDepartmentName(text);
                    if (error) setError('');
                  }}
                  maxLength={50}
                  editable={true}
                  autoFocus={true}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />

                <Text style={styles.customDeptCharCount}>
                  {departmentName.length}/50
                </Text>

                {error && (
                  <Text style={styles.customDeptError}>{error}</Text>
                )}

                <View style={styles.customDeptAllowedHint}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
                  <Text style={styles.customDeptAllowedText}>
                    Letters, numbers, spaces, and: - & / ( ) .
                  </Text>
                </View>
              </View>

              <View style={styles.customDeptButtons}>
                <TouchableOpacity
                  style={[styles.customDeptBtn, styles.customDeptBtnCancel]}
                  onPress={handleCancel}
                >
                  <Text style={styles.customDeptBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.customDeptBtn, styles.customDeptBtnSave]}
                  onPress={handleSave}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.customDeptBtnTextWhite}>Add Department</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ========== ADD/EDIT  EMPLOYEE MODAL WITH FORMIK ==========
function EmployeeModal({ visible, employee, onClose, onSave }) {
  const [loading, setLoading] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = React.useState(false);
  const [customDeptModalOpen, setCustomDeptModalOpen] = React.useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      first_name: employee?.first_name || '',
      last_name: employee?.last_name || '',
      user_code: employee?.user_code || '',
      username: employee?.username || '',
      email: employee?.email || '',
      password: employee?.password || '',
      contact_no: employee?.contact_no || '',
      division: employee?.division || '',
      date_of_birth: employee?.date_of_birth || '',
      department: employee?.department || '',
      role: employee?.role || 'user',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await onSave({
          id: employee?.id || Date.now(),
          ...values,
        });
        handleClose();
      } catch (error) {
        const errorMsg = getErrorMessage(error);
        Alert.alert('❌ Error', errorMsg);
      } finally {
        setLoading(false);
      }
    },
  });

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      formik.setFieldValue('date_of_birth', formattedDate);
    }
    setShowDatePicker(false);
  };

  const handleClose = () => {
    formik.resetForm();
    setRoleDropdownOpen(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => { }}>
            <View style={styles.sheetWrapper}>
              <View style={styles.modalContent}>
                {/* Header */}
                <LinearGradient
                  colors={['#00D4FF', '#0099FF', '#667EEA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalHeader}
                >
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                    disabled={loading}
                  >
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
                    <FormField
                      label="First Name"
                      placeholder="Enter first name"
                      value={formik.values.first_name}
                      error={formik.errors.first_name}
                      touched={formik.touched.first_name}
                      onChangeText={(value) => formik.setFieldValue('first_name', value)}
                      editable={!loading}
                    />

                    {/* Last Name */}
                    <FormField
                      label="Last Name"
                      placeholder="Enter last name"
                      value={formik.values.last_name}
                      error={formik.errors.last_name}
                      touched={formik.touched.last_name}
                      onChangeText={(value) => formik.setFieldValue('last_name', value)}
                      editable={!loading}
                    />

                    {/* User Code */}
                    <FormField
                      label="User Code"
                      placeholder="Enter user code"
                      value={formik.values.user_code}
                      error={formik.errors.user_code}
                      touched={formik.touched.user_code}
                      onChangeText={(value) => formik.setFieldValue('user_code', value)}
                      editable={!loading}
                    />

                    {/* Username */}
                    <FormField
                      label="Username"
                      placeholder="Enter username"
                      value={formik.values.username}
                      error={formik.errors.username}
                      touched={formik.touched.username}
                      onChangeText={(value) => formik.setFieldValue('username', value)}
                      editable={!loading}
                    />

                    {/* Email */}
                    <FormField
                      label="Email"
                      placeholder="Enter email"
                      value={formik.values.email}
                      error={formik.errors.email}
                      touched={formik.touched.email}
                      onChangeText={(value) => formik.setFieldValue('email', value)}
                      editable={!loading}
                      keyboardType="email-address"
                    />

                    {/* Password */}
                    <FormField
                      label="Password"
                      placeholder="Enter password"
                      value={formik.values.password}
                      error={formik.errors.password}
                      touched={formik.touched.password}
                      onChangeText={(value) => formik.setFieldValue('password', value)}
                      editable={!loading}
                      secureTextEntry={true}
                    />

                    {/* Contact No */}
                    <FormField
                      label="Contact No"
                      placeholder="Enter contact number"
                      value={formik.values.contact_no}
                      error={formik.errors.contact_no}
                      touched={formik.touched.contact_no}
                      onChangeText={(value) => formik.setFieldValue('contact_no', value)}
                      editable={!loading}
                      keyboardType="phone-pad"
                    />

                    {/* Division */}
                    <FormField
                      label="Division"
                      placeholder="Enter division"
                      value={formik.values.division}
                      error={formik.errors.division}
                      touched={formik.touched.division}
                      onChangeText={(value) => formik.setFieldValue('division', value)}
                      editable={!loading}
                    />

                    {/* Date of Birth */}
                    <View style={styles.fieldWrapper}>
                      <Text style={[styles.fieldLabel, formik.errors.date_of_birth && formik.touched.date_of_birth && styles.errorLabel]}>
                        Date of Birth {formik.errors.date_of_birth && formik.touched.date_of_birth && <Text style={styles.requiredStar}>*</Text>}
                      </Text>
                      <TouchableOpacity
                        style={[styles.input, formik.errors.date_of_birth && formik.touched.date_of_birth && styles.inputError]}
                        onPress={() => setShowDatePicker(true)}
                        disabled={loading}
                      >
                        <Text style={{ color: formik.values.date_of_birth ? COLORS.text : COLORS.textLight }}>
                          {formik.values.date_of_birth || 'Select date'}
                        </Text>
                      </TouchableOpacity>
                      {formik.errors.date_of_birth && formik.touched.date_of_birth && (
                        <Text style={styles.errorText}>{formik.errors.date_of_birth}</Text>
                      )}
                    </View>

                    {showDatePicker && (
                      <DateTimePicker
                        value={formik.values.date_of_birth ? new Date(formik.values.date_of_birth) : new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                      />
                    )}

                    {/* Department Dropdown */}

                    {/* Department Dropdown */}
                    <View style={styles.fieldWrapper}>
                      <Text style={[styles.fieldLabel, formik.errors.department && formik.touched.department && styles.errorLabel]}>
                        Department {formik.errors.department && formik.touched.department && <Text style={styles.requiredStar}>*</Text>}
                      </Text>

                      <TouchableOpacity
                        style={[styles.dropdown, formik.errors.department && formik.touched.department && styles.inputError]}
                        onPress={() => setDepartmentDropdownOpen(!departmentDropdownOpen)}
                        disabled={loading}
                      >
                        <Text style={[styles.dropdownText, !formik.values.department && { color: COLORS.textLight }]}>
                          {formik.values.department || 'Select Department'}
                        </Text>
                        <Ionicons
                          name={departmentDropdownOpen ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={COLORS.textLight}
                        />
                      </TouchableOpacity>

                      {departmentDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          {/* Predefined Departments - ALL 6 */}
                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              console.log('✅ Selected dept: Development');
                              formik.setFieldValue('department', 'Development');
                              setDepartmentDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>Development</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              console.log('✅ Selected dept: Marketing');
                              formik.setFieldValue('department', 'Marketing');
                              setDepartmentDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>Marketing</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              console.log('✅ Selected dept: Sales');
                              formik.setFieldValue('department', 'Sales');
                              setDepartmentDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>Sales</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              console.log('✅ Selected dept: HR');
                              formik.setFieldValue('department', 'HR');
                              setDepartmentDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>HR</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              console.log('✅ Selected dept: Finance');
                              formik.setFieldValue('department', 'Finance');
                              setDepartmentDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>Finance</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              console.log('✅ Selected dept: Production');
                              formik.setFieldValue('department', 'Production');
                              setDepartmentDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>Production</Text>
                          </TouchableOpacity>

                          {/* Divider */}
                          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 4 }} />

                          {/* Custom Department Option */}
                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              console.log('📝 Opening custom department modal');
                              setCustomDeptModalOpen(true);
                              // Don't close the dropdown here - let user decide after adding custom
                            }}
                          >
                            <Text style={[styles.dropdownItemText, { color: COLORS.primary, fontWeight: '700' }]}>
                              + Add Custom Department
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {formik.errors.department && formik.touched.department && (
                        <Text style={styles.errorText}>{formik.errors.department}</Text>
                      )}
                    </View>


                    {/* <FormField
                      label="Department"
                      placeholder="Enter department"
                      value={formik.values.department}
                      error={formik.errors.department}
                      touched={formik.touched.department}
                      onChangeText={(value) => formik.setFieldValue('department', value)}
                      editable={!loading}
                    /> */}

                    {/* Role Dropdown */}
                    <View style={styles.fieldWrapper}>
                      <Text style={[styles.fieldLabel, formik.errors.role && formik.touched.role && styles.errorLabel]}>
                        Role {formik.errors.role && formik.touched.role && <Text style={styles.requiredStar}>*</Text>}
                      </Text>
                      <TouchableOpacity
                        style={[styles.dropdown, formik.errors.role && formik.touched.role && styles.inputError]}
                        onPress={() => setRoleDropdownOpen(!roleDropdownOpen)}
                        disabled={loading}
                      >
                        <Text style={[styles.dropdownText, !formik.values.role && { color: COLORS.textLight }]}>
                          {formik.values.role === 'admin' ? 'Admin' : formik.values.role === 'user' ? 'Employee' : 'Select role'}
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
                              formik.setFieldValue('role', 'admin');
                              setRoleDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>Admin</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              formik.setFieldValue('role', 'user');
                              setRoleDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>Employee</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {formik.errors.role && formik.touched.role && (
                        <Text style={styles.errorText}>{formik.errors.role}</Text>
                      )}
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonGroup}>
                      <TouchableOpacity
                        style={[styles.saveButton, loading && { opacity: 0.6 }]}
                        onPress={formik.handleSubmit}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.saveButtonText}>
                            {employee ? 'Update' : 'Save'}
                          </Text>
                        )}
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
            </View>
          </TouchableWithoutFeedback>

          <CustomDepartmentModal
            visible={customDeptModalOpen}
            onClose={() => setCustomDeptModalOpen(false)}
            onSave={(deptName) => {
              console.log('✅ Custom department saved:', deptName);
              formik.setFieldValue('department', deptName);
              setDepartmentDropdownOpen(false);
              Alert.alert('✅ Added', `Department "${deptName}" added successfully`);
            }}
          />


        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default function AdminEmployeePage() {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // fetching epmloyeeeees frm server !!
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setEmployees(res.data);
    }
    catch (err) {
      console.error('Error fetching employees', err);
      Alert.alert('Error', 'failed to fetch employees');
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);


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
          style: 'destructive',
          onPress: async () => {
            // setEmployees(prev => prev.filter(e => e.id !== employeeId));
            try {
              await api.delete(`/users/${employeeId}`);
              await fetchEmployees();
              Alert.alert('Success', 'Employee deleted successfully');
            } catch (err) {
              console.error('Error deleting employee', err);
              Alert.alert('Error', 'failed to delete Employee');
            }
          },
        },
      ],
    );
  };

  const handleSaveEmployee = async (employeeData) => {
    try {
      if (selectedEmployee) {
        //update 
        await api.patch(`/users/${selectedEmployee.id}`, employeeData
          //   {
          //   first_name: employeeData.first_name,
          //   last_name: employeeData.last_name,
          //   user_code: employeeData.user_code,
          //   username: employeeData.username,
          //   email: employeeData.email,
          //   password: employeeData.password,
          //   contact_no: employeeData.contact_no,
          //   division: employeeData.division,
          //   date_of_birth: employeeData.date_of_birth,
          //   department: employeeData.department,
          //   role: employeeData.role,
          // }
        );
        // setEmployees(prev =>
        //   prev.map(e => (e.id === selectedEmployee.id ? { ...employeeData, id: e.id } : e)),
        // );
        Alert.alert('✅ Success', 'Employee updated successfully');
      }
      else {
        // create
        await api.post('/users', employeeData
          //   {
          //   first_name: employeeData.first_name,
          //   last_name: employeeData.last_name,
          //   user_code: employeeData.user_code,
          //   username: employeeData.username,
          //   email: employeeData.email,
          //   password: employeeData.password,
          //   contact_no: employeeData.contact_no,
          //   division: employeeData.division,
          //   date_of_birth: employeeData.date_of_birth,
          //   department: employeeData.department,
          //   role: employeeData.role,
          // }
        );
        // setEmployees(prev => [...prev, employeeData]);
        Alert.alert('✅ Success', 'Employee added successfully');
      }
      setModalVisible(false);
      setSelectedEmployee(null);
      await fetchEmployees();
    }
    catch (err) {
      console.error('Error saving employee', err);
      const msg = getErrorMessage(err);
      // err.response?.data?.error || err.response?.data?.errors?.email || 'failed to save employee';
      Alert.alert('Error', msg);
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
    // justifyContent: 'flex-end',
    justifyContent: isTablet ? 'center' : 'flex-end',
    alignItems: isTablet ? 'center' : 'stretch',
  },

  customDeptModal: {
    width: '85%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    maxHeight: 400,
  },

  customDeptHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },

  customDeptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },

  customDeptContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 12,
  },

  customDeptLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },

  customDeptHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 12,
  },

  customDeptInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#F5F7FA',
    marginBottom: 8,
  },

  customDeptInputError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FFF5F5',
    borderWidth: 1.5,
  },

  customDeptCharCount: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'right',
    marginBottom: 8,
  },

  customDeptError: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '500',
    marginBottom: 8,
  },

  customDeptAllowedHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 4,
  },

  customDeptAllowedText: {
    fontSize: 11,
    color: COLORS.success,
    marginLeft: 6,
    flex: 1,
  },

  customDeptButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  customDeptBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  customDeptBtnCancel: {
    backgroundColor: COLORS.border,
  },

  customDeptBtnSave: {
    backgroundColor: COLORS.primary,
  },

  customDeptBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  customDeptBtnTextWhite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },


  sheetWrapper: {
    width: isTablet ? getModalWidth() : '100%',
    justifyContent: 'flex-end',
    // width: '100%',
    // flex:1,
    // justifyContent:'flex-end',
  },
  modalContainer: {
    width: '100%',
    maxHeight: height * 0.95,
  },
  // keyboardAvoidingInner: {
  //   flex: 1,
  // },
  modalContent: {
    height: height * 0.65,
    // height: getModalHeight(),
    width: getModalWidth(),
    alignSelf: 'center',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    height: 70,
    // zIndex:100,
    // elevation:10,
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
    paddingTop: 16,
    backgroundColor: COLORS.background,
  },
  scrollViewContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 12,
  },
  errorLabel: {
    color: COLORS.danger,
  },

  requiredStar: {
    color: COLORS.danger,
    fontSize: 14,
  },

  inputContainer: {
    position: 'relative',
  },

  inputContainerError: {
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 12,
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

  inputError: {
    backgroundColor: '#FFF5F5',
    borderColor: COLORS.danger,
    borderWidth: 1.5,
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 4,
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
    zIndex: 1000,
    elevation: 8,
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
