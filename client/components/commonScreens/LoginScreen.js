import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { saveTokens, saveUserData } from '../../utils/tokenStorage';
import Modal from 'react-native-modal';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// const API_URL ='http://192.168.0.147:5000'
//  || 'http://192.168.0.147:5000';
// const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.147:5000';
const API_URL = 'http://192.168.0.147:5000' || process.env.EXPO_PUBLIC_API_URL;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const isSmallDevice = SCREEN_HEIGHT < 700;
const isMediumDevice = SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 850;

const responsiveSize = (small, medium, large) => {
  if (isSmallDevice) return small;
  if (isMediumDevice) return medium;
  return large;
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

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // New State for OTP
  const [forgotStep, setForgotStep] = useState(0); // 0: Email, 1: OTP
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', "Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email: email.trim(),
        password: password.trim(),
      });

      const { user, accessToken, refreshToken, token } = res.data;
      const finalAccessToken = accessToken || token;

      // Passing to parent (App.js handles storage)
      if (onLogin) onLogin(user, finalAccessToken, refreshToken);

    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Unable to connect to server');
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setIsForgotLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email: forgotEmail.trim() });
      // Assume success moves efficiently to next step
      Alert.alert('OTP Sent', 'If an account exists, an OTP has been sent to your email.');
      setForgotStep(1);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotOtp.trim() || !newPassword.trim()) {
      Alert.alert('Error', 'Please enter OTP and new password');
      return;
    }
    setIsForgotLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: newPassword.trim()
      });
      Alert.alert('Success', 'Password reset successfully! Please login with your new password.');
      setForgotPasswordVisible(false);
      setForgotStep(0);
      setForgotEmail('');
      setForgotOtp('');
      setNewPassword('');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const logoOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const characterOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.ease });
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 800, easing: Easing.ease }));
    characterOpacity.value = withDelay(800, withTiming(1, { duration: 800, easing: Easing.ease }));
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value }));
  const contentAnimatedStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
  const characterAnimatedStyle = useAnimatedStyle(() => ({ opacity: characterOpacity.value }));

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#00D4FF" />
        <LinearGradient
          colors={['#00D4FF', '#0099FF', '#0066CC', '#004999']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
          <View style={styles.circle4} />
          <View style={styles.circle5} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <Animated.View style={[styles.headerContainer, logoAnimatedStyle]}>
                <View style={styles.logoBackground}>
                  <Image
                    source={require('../../assets/app-icon.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.companyTitle}>Kleidsys</Text>
                <Text style={styles.companySubtitle}>Planning Tool</Text>
              </Animated.View>

              <View style={styles.loginArea}>
                <Animated.View style={[styles.characterOverlay, characterAnimatedStyle]}>
                  <Image
                    source={require('../../assets/login-girl.png')}
                    style={styles.characterImage}
                    resizeMode="contain"
                  />
                </Animated.View>

                <Animated.View style={[styles.cardWrapper, contentAnimatedStyle]}>
                  <BlurView intensity={30} tint="light" style={styles.blurContainer}>
                    <View style={styles.glassCard}>
                      <Text style={styles.heading}>Welcome Back</Text>
                      <View style={styles.divider} />

                      <View style={styles.inputContainer}>
                        <Text style={styles.label}>EMAIL</Text>
                        <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={email}
                            onChangeText={setEmail}
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            selectionColor="rgba(255, 255, 255, 0.8)"
                            editable={!isLoading}
                          />
                        </View>
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.label}>PASSWORD</Text>
                        <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                          <View style={styles.passwordRow}>
                            <TextInput
                              style={styles.input}
                              placeholder="Enter your password"
                              placeholderTextColor="rgba(255, 255, 255, 0.5)"
                              value={password}
                              onChangeText={setPassword}
                              onFocus={() => setPasswordFocused(true)}
                              onBlur={() => setPasswordFocused(false)}
                              selectionColor="rgba(255, 255, 255, 0.8)"
                              secureTextEntry={!showPassword}
                              editable={!isLoading}
                            />
                            <TouchableOpacity
                              style={styles.passwordEye}
                              onPress={() => setShowPassword(prev => !prev)}
                              disabled={isLoading}
                            >
                              <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color='#fff'
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.forgotPassword}
                        activeOpacity={0.7}
                        onPress={() => setForgotPasswordVisible(true)}
                        disabled={isLoading}
                      >
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.buttonWrapper, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        activeOpacity={0.85}
                        disabled={isLoading}
                      >
                        <LinearGradient
                          colors={['#FFFFFF', 'rgba(255, 255, 255, 0.95)']}
                          style={styles.buttonGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          {isLoading ? (
                            <ActivityIndicator size="small" color="#0099FF" />
                          ) : (
                            <Text style={styles.buttonText}>LOGIN</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      <View style={styles.registerRow}>
                        <Text style={styles.registerText}>New here? </Text>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('Register')}
                          activeOpacity={0.7}
                          disabled={isLoading}
                        >
                          <Text style={styles.registerLink}>Create Account</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </BlurView>
                </Animated.View>
              </View>

              <Text style={styles.copyright}>© {new Date().getFullYear()} Kleidsys Technologies Pvt Ltd</Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>

        {/* Forgot Password Modal */}
        <Modal
          isVisible={forgotPasswordVisible}
          onBackdropPress={() => {
            setForgotPasswordVisible(false);
            setForgotStep(0);
            setForgotEmail('');
            setForgotOtp('');
            setNewPassword('');
          }}
          onBackButtonPress={() => setForgotPasswordVisible(false)}
          backdropOpacity={0.5}
          animationIn="zoomIn"
          animationOut="zoomOut"
          useNativeDriver
        >
          <BlurView intensity={40} tint="light" style={styles.modalBlur}>
            <View style={styles.forgotModalContent}>
              <View style={styles.modalHeader}>
                <Ionicons
                  name={forgotStep === 0 ? "lock-open-outline" : "key-outline"}
                  size={32}
                  color={COLORS.primary}
                  style={styles.modalHeaderIcon}
                />
                <Text style={styles.modalTitle}>
                  {forgotStep === 0 ? "Forgot Password?" : "Reset Password"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {forgotStep === 0
                    ? "Enter your email to receive a One-Time Password (OTP)."
                    : "Enter the OTP sent to your email and your new password."}
                </Text>
              </View>

              {forgotStep === 0 ? (
                // STEP 0: EMAIL
                <View style={styles.modalInputContainer}>
                  <View style={styles.modalInputWrapper}>
                    <Ionicons name="mail-outline" size={20} color={COLORS.primary} style={styles.modalIcon} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Email Address"
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>
              ) : (
                // STEP 1: OTP + NEW PASSWORD
                <View style={styles.modalInputContainer}>
                  <View style={[styles.modalInputWrapper, { marginBottom: 12 }]}>
                    <Ionicons name="keypad-outline" size={20} color={COLORS.primary} style={styles.modalIcon} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      value={forgotOtp}
                      onChangeText={setForgotOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <View style={styles.modalInputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.modalIcon} />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="New Password"
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                    />
                  </View>
                </View>
              )}

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setForgotPasswordVisible(false);
                    setForgotStep(0);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={forgotStep === 0 ? handleRequestOtp : handleResetPassword}
                  disabled={isForgotLoading}
                >
                  {isForgotLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {forgotStep === 0 ? "Send OTP" : "Reset Password"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  circle1: { position: 'absolute', width: SCREEN_WIDTH * 0.75, height: SCREEN_WIDTH * 0.75, borderRadius: SCREEN_WIDTH * 0.375, backgroundColor: 'rgba(255, 255, 255, 0.12)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.2)', top: -SCREEN_WIDTH * 0.35, right: -SCREEN_WIDTH * 0.25 },
  circle2: { position: 'absolute', width: SCREEN_WIDTH * 0.65, height: SCREEN_WIDTH * 0.65, borderRadius: SCREEN_WIDTH * 0.325, backgroundColor: 'rgba(0, 0, 0, 0.12)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.15)', bottom: -SCREEN_WIDTH * 0.2, left: -SCREEN_WIDTH * 0.25 },
  circle3: { position: 'absolute', width: SCREEN_WIDTH * 0.5, height: SCREEN_WIDTH * 0.5, borderRadius: SCREEN_WIDTH * 0.25, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.18)', top: SCREEN_HEIGHT * 0.4, right: -SCREEN_WIDTH * 0.15 },
  circle4: { position: 'absolute', width: SCREEN_WIDTH * 0.4, height: SCREEN_WIDTH * 0.4, borderRadius: SCREEN_WIDTH * 0.2, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.22)', top: SCREEN_HEIGHT * 0.12, left: -SCREEN_WIDTH * 0.12 },
  circle5: { position: 'absolute', width: SCREEN_WIDTH * 0.3, height: SCREEN_WIDTH * 0.3, borderRadius: SCREEN_WIDTH * 0.15, backgroundColor: 'rgba(0, 0, 0, 0.06)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.12)', bottom: SCREEN_HEIGHT * 0.25, right: SCREEN_WIDTH * 0.1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'space-between', paddingVertical: responsiveSize(SCREEN_HEIGHT * 0.025, SCREEN_HEIGHT * 0.03, SCREEN_HEIGHT * 0.04), paddingHorizontal: SCREEN_WIDTH * 0.05 },
  headerContainer: { alignItems: 'center', marginTop: responsiveSize(10, 15, 25), marginBottom: responsiveSize(15, 20, 25) },
  logoBackground: { width: responsiveSize(85, 100, 115), height: responsiveSize(85, 100, 115), borderRadius: responsiveSize(42.5, 50, 57.5), backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 10, marginBottom: 12 },
  logoImage: { width: 70, height: isSmallDevice ? 70 : 85 },
  companyTitle: { fontSize: responsiveSize(SCREEN_WIDTH * 0.065, SCREEN_WIDTH * 0.07, SCREEN_WIDTH * 0.075), fontWeight: '800', color: '#FFFFFF', letterSpacing: 3, textShadowColor: 'rgba(0, 0, 0, 0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  companySubtitle: { fontSize: responsiveSize(SCREEN_WIDTH * 0.038, SCREEN_WIDTH * 0.04, SCREEN_WIDTH * 0.042), fontWeight: '500', color: 'rgba(255, 255, 255, 0.95)', letterSpacing: 1.5, textShadowColor: 'rgba(0, 0, 0, 0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  loginArea: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  characterOverlay: { position: 'absolute', right: -SCREEN_WIDTH * 0.08, top: responsiveSize('10%', '12%', '15%'), zIndex: 1, shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.6, shadowRadius: 25, elevation: 20 },
  characterImage: { maxWidth: 230, maxHeight: 280, transform: [{ scale: 1.80 }, { translateX: 0 }, { scaleX: -1 }] },
  cardWrapper: { width: '100%', maxWidth: 420, zIndex: 5 },
  blurContainer: { borderRadius: 30, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 15 },
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: responsiveSize(SCREEN_WIDTH * 0.055, SCREEN_WIDTH * 0.06, SCREEN_WIDTH * 0.065), borderRadius: 30, borderWidth: 1.5, borderTopWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(255, 255, 255, 0.18)', borderTopColor: 'rgba(255, 255, 255, 0.3)', borderLeftColor: 'rgba(255, 255, 255, 0.25)' },
  heading: { fontSize: responsiveSize(SCREEN_WIDTH * 0.068, SCREEN_WIDTH * 0.072, SCREEN_WIDTH * 0.078), fontWeight: '800', color: '#FFFFFF', marginBottom: 8, textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8, letterSpacing: 0.8 },
  divider: { width: '25%', height: 3, backgroundColor: 'rgba(255, 255, 255, 0.7)', alignSelf: 'center', borderRadius: 2, marginBottom: responsiveSize(SCREEN_HEIGHT * 0.02, SCREEN_HEIGHT * 0.025, SCREEN_HEIGHT * 0.03), shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.7, shadowRadius: 5 },
  inputContainer: { marginBottom: responsiveSize(SCREEN_HEIGHT * 0.015, SCREEN_HEIGHT * 0.018, SCREEN_HEIGHT * 0.022) },
  label: { fontSize: responsiveSize(SCREEN_WIDTH * 0.032, SCREEN_WIDTH * 0.034, SCREEN_WIDTH * 0.036), color: '#FFFFFF', marginBottom: 7, fontWeight: '700', letterSpacing: 1.5 },
  inputWrapper: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.22)', borderRadius: 15, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 14 : 11 },
  inputWrapperFocused: { backgroundColor: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.45)', borderWidth: 2 },
  input: { fontSize: responsiveSize(SCREEN_WIDTH * 0.038, SCREEN_WIDTH * 0.04, SCREEN_WIDTH * 0.042), color: '#FFFFFF', fontWeight: '600', padding: 12, marginRight: 35 },
  passwordRow: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  passwordEye: { position: 'absolute', right: 12 },
  buttonWrapper: { marginTop: responsiveSize(SCREEN_HEIGHT * 0.008, SCREEN_HEIGHT * 0.01, SCREEN_HEIGHT * 0.012), borderRadius: 18, overflow: 'hidden', shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  buttonDisabled: { opacity: 0.7 },
  buttonGradient: { paddingVertical: responsiveSize(14, 15, 16), alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  buttonText: { color: '#0099FF', fontSize: responsiveSize(SCREEN_WIDTH * 0.042, SCREEN_WIDTH * 0.044, SCREEN_WIDTH * 0.046), fontWeight: '800', letterSpacing: 2.5 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: responsiveSize(SCREEN_HEIGHT * 0.016, SCREEN_HEIGHT * 0.02, SCREEN_HEIGHT * 0.024), marginTop: 4 },
  forgotPasswordText: { color: 'rgba(255, 255, 255, 0.92)', fontSize: responsiveSize(SCREEN_WIDTH * 0.033, SCREEN_WIDTH * 0.035, SCREEN_WIDTH * 0.037), fontWeight: '600', textDecorationLine: 'underline' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: responsiveSize(SCREEN_HEIGHT * 0.018, SCREEN_HEIGHT * 0.022, SCREEN_HEIGHT * 0.026), flexWrap: 'wrap' },
  registerText: { color: 'rgba(255, 255, 255, 0.88)', fontSize: responsiveSize(SCREEN_WIDTH * 0.035, SCREEN_WIDTH * 0.037, SCREEN_WIDTH * 0.039), fontWeight: '500' },
  registerLink: { color: '#FFFFFF', fontSize: responsiveSize(SCREEN_WIDTH * 0.035, SCREEN_WIDTH * 0.037, SCREEN_WIDTH * 0.039), fontWeight: '800', textDecorationLine: 'underline' },
  copyright: { textAlign: 'center', color: 'rgba(255, 255, 255, 0.75)', fontSize: responsiveSize(SCREEN_WIDTH * 0.029, SCREEN_WIDTH * 0.031, SCREEN_WIDTH * 0.033), fontWeight: '500', marginTop: 10 },
  modalBlur: { borderRadius: 25, overflow: 'hidden' },
  forgotModalContent: { backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: 24, borderRadius: 25 },
  modalHeader: { alignItems: 'center', marginBottom: 24 },
  modalHeaderIcon: { marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#333', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  modalInputContainer: { marginBottom: 24 },
  modalInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 15 },
  modalIcon: { marginRight: 12 },
  modalInput: { flex: 1, height: 50, fontSize: 16, color: '#333', fontWeight: '600' },
  modalFooter: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  cancelButton: { backgroundColor: '#F1F5F9' },
  cancelButtonText: { color: '#64748B', fontWeight: '700', fontSize: 16 },
  submitButton: { backgroundColor: '#0099FF' },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});