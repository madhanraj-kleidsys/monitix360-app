import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../api/client';

const COLORS = {
  primary: '#0099FF',
  secondary: '#00D4FF',
  accent: '#6366F1',
  success: '#10B981',
  danger: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
};

export default function EmailSettings({ companyId, onClose, onUpdate }) {
  const [emailUser, setEmailUser] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setFetching(true);
        const res = await api.get(`/companyDetails/${companyId}/email-settings`);
        if (res.data.company) {
          setEmailUser(res.data.company.email_user || '');
          // Logic to show if password is set
          if (res.data.company.hasPassword) {
            setPassword('********'); // Placeholder to show it's set
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setFetching(false);
      }
    };
    if (companyId) fetchSettings();
  }, [companyId]);

  const handleSave = async () => {
    if (!emailUser.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      // If password is still placeholder, don't send it (or send empty so backend ignores)
      // Actually backend should only update if provided.
      // But here we want to update.
      // If user didn't change password (still stars), we might send empty string or handle in backend.
      // Let's assume user re-enters password if they want to change it.

      const payload = {
        company_id: companyId,
        email_user: emailUser.trim(),
      };

      if (password !== '********') {
        // Validate format: 4 groups of 4 letters separated by spaces
        const appPassRegex = /^[a-zA-Z]{4} [a-zA-Z]{4} [a-zA-Z]{4} [a-zA-Z]{4}$/;
        if (!appPassRegex.test(password.trim())) {
          Alert.alert('Invalid Format', 'App Password must be 16 letters with spaces: "xxxx xxxx xxxx xxxx"');
          setLoading(false);
          return;
        }
        payload.email_pass = password.trim();
      }

      await api.post('/companyDetails/email-settings', payload);

      Alert.alert('Success', 'Email settings updated successfully');
      if (onUpdate) onUpdate(); // Trigger refresh in parent
      onClose?.();
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  /* State for eye icon */
  const [showPassword, setShowPassword] = useState(false);

  if (fetching) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.formContainer}>
      <View style={styles.infoSection}>
        <LinearGradient
          colors={['#EFF6FF', '#E0F2FE']}
          style={styles.infoBadge}
        >
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Use a Google App Password (16 characters including spaces) to enable automated task notifications. Example: &quot;okke hmxl exyk rkbg&quot;
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sender Email</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            value={emailUser}
            onChangeText={setEmailUser}
            placeholder="e.g. alerts@company.com"
            placeholderTextColor="#A0AEC0"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>App Password</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="•••• •••• •••• ••••"
            placeholderTextColor="#A0AEC0"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.disabledBtn]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrapper: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  formContainer: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoBadge: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
    lineHeight: 18,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
