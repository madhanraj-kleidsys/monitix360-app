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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.216:3000';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Enhanced responsive breakpoints
const isSmallDevice = SCREEN_HEIGHT < 700;
const isMediumDevice = SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 850;
const isLargeDevice = SCREEN_HEIGHT >= 850;

// Responsive helper function
const responsiveSize = (small, medium, large) => {
  if (isSmallDevice) return small;
  if (isMediumDevice) return medium;
  return large;
};

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword,setShowPassword] = useState(false);
  const [anyInputFocused, setAnyInputFocused] = useState(false);

  const handleLogin = async () => {
    console.log('Login:', { email, password });
    // if (onLogin) {
    //   onLogin();
    // }
    if(!email.trim() || !password.trim()) {
      Alert.alert('Validation Error:',"Please enter both email and password.");
      return;
    }

    try{
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email: email.trim(),
        password: password.trim(),
      });
      const {user,token} = res.data;
      // console.log(res.data);
      //saving token
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      //passing to parents ========
      if(onLogin){
        onLogin(user,token);
      }
    }catch(err){
      // const message = err.response?.data?.mesage || 'unable to connect to server';
      // Alert.alert('Login Failed:',message);
      Alert.alert('Login Failed', err.response?.data?.message || 'Unable to connect');
      console.log(err);
    }
  };

  // Smooth entrance animations
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

        {/* 🎨 BACKGROUND OPTIONS - Choose one */}

        {/* OPTION 1: Blue Ocean (Current) */}
        <LinearGradient
          colors={['#00D4FF', '#0099FF', '#0066CC', '#004999']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >


          {/* <LinearGradient
        colors={['#667eea', '#764ba2', '#d451e3ff', '#4facfe']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      > */}

          {/* BACKGROUND OPTION 3 - Sunset Gradient */}
          {/* <LinearGradient
        colors={['#FF6B6B', '#FF8E53', '#FE8C00', '#F83600']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      > */}

          {/* Enhanced Background Circles - More Visible */}
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
              {/* Logo and Title at Top */}
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

              {/* Main Login Area */}
              <View style={styles.loginArea}>

                {/* Character Image - Enhanced & Repositionable */}
                <Animated.View style={[styles.characterOverlay, characterAnimatedStyle]}>
                  <Image
                    // source={require('../../assets/loginimg.png')}
                    source={require('../../assets/login-girl.png')}
                    style={styles.characterImage}
                    resizeMode="contain"
                  />
                </Animated.View>

                {/* Glass Login Card */}
                <Animated.View style={[styles.cardWrapper, contentAnimatedStyle]}>
                  <BlurView intensity={30} tint="light" style={styles.blurContainer}>
                    <View style={styles.glassCard}>
                      <Text style={styles.heading}>Welcome Back</Text>
                      <View style={styles.divider} />

                      {/* Email Input - No White Flash */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.label}>EMAIL</Text>
                        <View style={[
                          styles.inputWrapper,
                          emailFocused && styles.inputWrapperFocused
                        ]}>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={email}
                            onChangeText={setEmail}
                            onFocus={() => {
                              setEmailFocused(true)
                              setAnyInputFocused(true)
                            }}
                            onBlur={() => {
                              setEmailFocused(false)
                              setAnyInputFocused(false)
                            }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            selectionColor="rgba(255, 255, 255, 0.8)"
                          />
                        </View>
                      </View>

                      {/* Password Input - No White Flash */}
                      <View style={styles.inputContainer}>
                        <Text style={styles.label}>PASSWORD</Text>
                        <View style={[
                          styles.inputWrapper,
                          passwordFocused && styles.inputWrapperFocused
                        ]}>
                          <View style={styles.passwordRow} >

                          <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            value={password}
                            onChangeText={setPassword}
                            onFocus={() =>{ setPasswordFocused(true)
                              setAnyInputFocused(true)
                            }}
                            onBlur={() =>{ setPasswordFocused(false)
                              setAnyInputFocused(false)
                            }}
                            // secureTextEntry
                            selectionColor="rgba(255, 255, 255, 0.8)"
                            secureTextEntry={!showPassword}
                            />
                          <TouchableOpacity
                          style={styles.passwordEye}
                          onPress={()=> setShowPassword(prev => !prev)}>
                            <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color='#ffffffff'
                            />
                          </TouchableOpacity>
                            </View>
                        </View>
                      </View>

                      {/* Forgot Password */}
                      <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                      </TouchableOpacity>

                      {/* Login Button */}
                      <TouchableOpacity
                        style={styles.buttonWrapper}
                        onPress={handleLogin}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={['#FFFFFF', 'rgba(255, 255, 255, 0.95)']}
                          style={styles.buttonGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.buttonText}>LOGIN</Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Register Link */}
                      <View style={styles.registerRow}>
                        <Text style={styles.registerText}>New here? </Text>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('Register')}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.registerLink}>Create Account</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </BlurView>
                </Animated.View>
                {/* ☝️ Fixed: Changed </View> to </Animated.View> */}

              </View>

              {/* Copyright Footer */}
              <Text style={styles.copyright}>© 2025 Kleidsys Technologies Pvt Ltd</Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },

  // Enhanced Background Circles - More Visible with White Borders
  circle1: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    borderRadius: SCREEN_WIDTH * 0.375,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    top: -SCREEN_WIDTH * 0.35,
    right: -SCREEN_WIDTH * 0.25,
  },
  circle2: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    borderRadius: SCREEN_WIDTH * 0.325,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    bottom: -SCREEN_WIDTH * 0.2,
    left: -SCREEN_WIDTH * 0.25,
  },
  circle3: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: SCREEN_WIDTH * 0.25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    top: SCREEN_HEIGHT * 0.4,
    right: -SCREEN_WIDTH * 0.15,
  },
  circle4: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4,
    borderRadius: SCREEN_WIDTH * 0.2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    top: SCREEN_HEIGHT * 0.12,
    left: -SCREEN_WIDTH * 0.12,
  },
  circle5: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.3,
    height: SCREEN_WIDTH * 0.3,
    borderRadius: SCREEN_WIDTH * 0.15,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    bottom: SCREEN_HEIGHT * 0.25,
    right: SCREEN_WIDTH * 0.1,
  },

  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: responsiveSize(SCREEN_HEIGHT * 0.025, SCREEN_HEIGHT * 0.03, SCREEN_HEIGHT * 0.04),
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    // minHeight: SCREEN_HEIGHT,
  },

  // Header - Fully Responsive
  headerContainer: {
    alignItems: 'center',
    marginTop: responsiveSize(10, 15, 25),
    marginBottom: responsiveSize(15, 20, 25),
  },
  logoBackground: {
    width: responsiveSize(85, 100, 115),
    height: responsiveSize(85, 100, 115),
    borderRadius: responsiveSize(42.5, 50, 57.5),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 12,
  },
  logoImage: {
    // width: responsiveSize(65, 75, 90),
    // height: responsiveSize(65, 75, 90),
    width: isSmallDevice ? 70 : 70,
    height: isSmallDevice ? 70 : 85,
  },
  companyTitle: {
    fontSize: responsiveSize(SCREEN_WIDTH * 0.065, SCREEN_WIDTH * 0.07, SCREEN_WIDTH * 0.075),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    // marginBottom: 4,
  },
  companySubtitle: {
    fontSize: responsiveSize(SCREEN_WIDTH * 0.038, SCREEN_WIDTH * 0.04, SCREEN_WIDTH * 0.042),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Login Area - Responsive
  loginArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // marginVertical: responsiveSize(10, 15, 20),
  },

  // Character Image - Enhanced & Adjustable
  characterOverlay: {
    position: 'absolute',
    // left: -SCREEN_WIDTH * 0.08,
    right: -SCREEN_WIDTH * 0.08,
    top: responsiveSize('10%', '12%', '15%'),
    zIndex: 1,
    // zIndex: -10,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
  characterImage: {
    // width: responsiveSize(SCREEN_WIDTH * 0.42, SCREEN_WIDTH * 0.48, SCREEN_WIDTH * 0.52),
    // height: responsiveSize(SCREEN_HEIGHT * 0.22, SCREEN_HEIGHT * 0.26, SCREEN_HEIGHT * 0.3),
    maxWidth: 230,
    maxHeight: 280,
    transform: [
      // { rotate: '-8deg' },
      { scale: 1.80 },
      { translateX: 0 },
      { scaleX: -1 }
    ],
  },

  // Glass Card - No White Flash Fix
  cardWrapper: {
    width: '100%',
    maxWidth: 420,
    zIndex: 5,
  },
  blurContainer: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: responsiveSize(SCREEN_WIDTH * 0.055, SCREEN_WIDTH * 0.06, SCREEN_WIDTH * 0.065),
    borderRadius: 30,
    borderWidth: 1.5,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.25)',
  },
  heading: {
    fontSize: responsiveSize(SCREEN_WIDTH * 0.068, SCREEN_WIDTH * 0.072, SCREEN_WIDTH * 0.078),
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 0.8,
  },
  divider: {
    width: '25%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: responsiveSize(SCREEN_HEIGHT * 0.02, SCREEN_HEIGHT * 0.025, SCREEN_HEIGHT * 0.03),
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },

  // Input Fields - No White Flash
  inputContainer: {
    marginBottom: responsiveSize(SCREEN_HEIGHT * 0.015, SCREEN_HEIGHT * 0.018, SCREEN_HEIGHT * 0.022),
  },
  label: {
    fontSize: responsiveSize(SCREEN_WIDTH * 0.032, SCREEN_WIDTH * 0.034, SCREEN_WIDTH * 0.036),
    color: '#FFFFFF',
    marginBottom: 7,
    fontWeight: '700',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 14 : 11,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  inputWrapperFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 2,
    shadowColor: 'rgba(255, 255, 255, 0.5)',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  input: {
    fontSize: responsiveSize(SCREEN_WIDTH * 0.038, SCREEN_WIDTH * 0.04, SCREEN_WIDTH * 0.042),
    color: '#FFFFFF',
    fontWeight: '600',
    padding: 12,
    marginRight: 35, // space for eye icon
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

  // Other Elements - Responsive
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: responsiveSize(SCREEN_HEIGHT * 0.016, SCREEN_HEIGHT * 0.02, SCREEN_HEIGHT * 0.024),
    marginTop: 4,
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: responsiveSize(SCREEN_WIDTH * 0.033, SCREEN_WIDTH * 0.035, SCREEN_WIDTH * 0.037),
    fontWeight: '600',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonWrapper: {
    marginTop: responsiveSize(SCREEN_HEIGHT * 0.008, SCREEN_HEIGHT * 0.01, SCREEN_HEIGHT * 0.012),
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonGradient: {
    paddingVertical: responsiveSize(14, 15, 16),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  buttonText: {
    color: '#0099FF',
    fontSize: responsiveSize(SCREEN_WIDTH * 0.042, SCREEN_WIDTH * 0.044, SCREEN_WIDTH * 0.046),
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: responsiveSize(SCREEN_HEIGHT * 0.018, SCREEN_HEIGHT * 0.022, SCREEN_HEIGHT * 0.026),
    flexWrap: 'wrap',
  },
  registerText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: responsiveSize(SCREEN_WIDTH * 0.035, SCREEN_WIDTH * 0.037, SCREEN_WIDTH * 0.039),
    fontWeight: '500',
  },
  registerLink: {
    color: '#FFFFFF',
    fontSize: responsiveSize(SCREEN_WIDTH * 0.035, SCREEN_WIDTH * 0.037, SCREEN_WIDTH * 0.039),
    fontWeight: '800',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  copyright: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: responsiveSize(SCREEN_WIDTH * 0.029, SCREEN_WIDTH * 0.031, SCREEN_WIDTH * 0.033),
    fontWeight: '500',
    marginTop:10,
    // marginTop: responsiveSize(15, 20, 25),
    // marginBottom: 10,
  },
});
