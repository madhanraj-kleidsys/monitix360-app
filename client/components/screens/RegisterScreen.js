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

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [company, setCompany] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [companyFocused, setCompanyFocused] = useState(false);
  const [companyCodeFocused, setCompanyCodeFocused] = useState(false);

  const handleRegister = () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    console.log('Register:', { name, email, password, company, companyCode });
    // Navigate or handle registration
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00D4FF" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#00D4FF', '#0099FF', '#0066CC', '#004999']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Enhanced Background Circles */}
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

            {/* Main Register Area */}
            <View style={styles.registerArea}>
              
              {/* Character Image - Side Overlay */}
              <Animated.View style={[styles.characterOverlay, characterAnimatedStyle]}>
                <Image
                  source={require('../../assets/register-man.png')}
                  style={styles.characterImage}
                  resizeMode="contain"
                />
              </Animated.View>

              {/* Glass Register Card */}
              <Animated.View style={[styles.cardWrapper, contentAnimatedStyle]}>
                <BlurView intensity={30} tint="light" style={styles.blurContainer}>
                  <View style={styles.glassCard}>
                    <Text style={styles.heading}>Create Account</Text>
                    <View style={styles.divider} />

                    {/* Name Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>FULL NAME</Text>
                      <View style={[
                        styles.inputWrapper,
                        nameFocused && styles.inputWrapperFocused
                      ]}>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your full name"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={name}
                          onChangeText={setName}
                          onFocus={() => setNameFocused(true)}
                          onBlur={() => setNameFocused(false)}
                          selectionColor="rgba(255, 255, 255, 0.8)"
                        />
                      </View>
                    </View>

                    {/* Email Input */}
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
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => setEmailFocused(false)}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          selectionColor="rgba(255, 255, 255, 0.8)"
                        />
                      </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>PASSWORD</Text>
                      <View style={[
                        styles.inputWrapper,
                        passwordFocused && styles.inputWrapperFocused
                      ]}>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your password"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={password}
                          onChangeText={setPassword}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          secureTextEntry
                          selectionColor="rgba(255, 255, 255, 0.8)"
                        />
                      </View>
                    </View>

                    {/* Confirm Password Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>CONFIRM PASSWORD</Text>
                      <View style={[
                        styles.inputWrapper,
                        confirmPasswordFocused && styles.inputWrapperFocused
                      ]}>
                        <TextInput
                          style={styles.input}
                          placeholder="Re-enter your password"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          onFocus={() => setConfirmPasswordFocused(true)}
                          onBlur={() => setConfirmPasswordFocused(false)}
                          secureTextEntry
                          selectionColor="rgba(255, 255, 255, 0.8)"
                        />
                      </View>
                    </View>

                    {/* Company Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>COMPANY</Text>
                      <View style={[
                        styles.inputWrapper,
                        companyFocused && styles.inputWrapperFocused
                      ]}>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter company name"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={company}
                          onChangeText={setCompany}
                          onFocus={() => setCompanyFocused(true)}
                          onBlur={() => setCompanyFocused(false)}
                          selectionColor="rgba(255, 255, 255, 0.8)"
                        />
                      </View>
                    </View>

                    {/* Company Code Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>COMPANY CODE</Text>
                      <View style={[
                        styles.inputWrapper,
                        companyCodeFocused && styles.inputWrapperFocused
                      ]}>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter company code"
                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                          value={companyCode}
                          onChangeText={setCompanyCode}
                          onFocus={() => setCompanyCodeFocused(true)}
                          onBlur={() => setCompanyCodeFocused(false)}
                          selectionColor="rgba(255, 255, 255, 0.8)"
                        />
                      </View>
                    </View>

                    {/* Register Button */}
                    <TouchableOpacity
                      style={styles.buttonWrapper}
                      onPress={handleRegister}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#FFFFFF', 'rgba(255, 255, 255, 0.95)']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.buttonText}>REGISTER</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={styles.loginRow}>
                      <Text style={styles.loginText}>Already have an account? </Text>
                      <TouchableOpacity 
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.loginLink}>Login</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </BlurView>
              </Animated.View>

            </View>

            {/* Copyright Footer */}
            <Text style={styles.copyright}>© 2025 Kleidsys Technologies Pvt Ltd</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },

  // Enhanced Background Circles
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
    paddingVertical: responsiveSize(SCREEN_HEIGHT * 0.02, SCREEN_HEIGHT * 0.025, SCREEN_HEIGHT * 0.03),
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    minHeight: SCREEN_HEIGHT,
  },

  // Header
  headerContainer: {
    alignItems: 'center',
    marginTop: responsiveSize(10, 15, 20),
    marginBottom: responsiveSize(10, 15, 20),
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
     width: isSmallDevice ? 70 : 70,
    height: isSmallDevice ? 70 : 85,
    // width: isSmallDevice ? 60 : 70,
    // height: isSmallDevice ? 60 : 75,
  },
  companyTitle: {
    fontSize: responsiveSize(SCREEN_WIDTH * 0.06, SCREEN_WIDTH * 0.065, SCREEN_WIDTH * 0.07),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 4,
  },
  companySubtitle: {
    fontSize: responsiveSize(SCREEN_WIDTH * 0.036, SCREEN_WIDTH * 0.038, SCREEN_WIDTH * 0.04),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Register Area
  registerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: responsiveSize(10, 12, 15),
  },

  // Character Image
  characterOverlay: {
    position: 'absolute',
    // left: -SCREEN_WIDTH * 0.08,
      right: -SCREEN_WIDTH * 0.08,
    top: responsiveSize('8%', '10%', '12%'),
    zIndex: -10,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
  characterImage: {
    marginTop: responsiveSize(20, 200, 60-30),
    width: responsiveSize(SCREEN_WIDTH * 0.38, SCREEN_WIDTH * 0.42, SCREEN_WIDTH * 0.45),
    height: responsiveSize(SCREEN_HEIGHT * 0.18, SCREEN_HEIGHT * 0.22, SCREEN_HEIGHT * 0.25),
    maxWidth: 200,
    maxHeight: 250,
    transform: [
      { scale: 3.05 },
      { scaleX: -1 }
    ],
  },

  // Glass Card
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
    padding: responsiveSize(SCREEN_WIDTH * 0.05, SCREEN_WIDTH * 0.055, SCREEN_WIDTH * 0.06),
    borderRadius: 30,
    borderWidth: 1.5,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.25)',
  },
  heading: {
    fontSize: responsiveSize(SCREEN_WIDTH * 0.065, SCREEN_WIDTH * 0.07, SCREEN_WIDTH * 0.075),
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
    marginBottom: responsiveSize(SCREEN_HEIGHT * 0.018, SCREEN_HEIGHT * 0.022, SCREEN_HEIGHT * 0.025),
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },

  // Input Fields
  inputContainer: {
    marginBottom: responsiveSize(SCREEN_HEIGHT * 0.012, SCREEN_HEIGHT * 0.015, SCREEN_HEIGHT * 0.018),
  },
  label: {
    fontSize: responsiveSize(SCREEN_WIDTH * 0.03, SCREEN_WIDTH * 0.032, SCREEN_WIDTH * 0.034),
    color: '#FFFFFF',
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9,
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
    fontSize: responsiveSize(SCREEN_WIDTH * 0.037, SCREEN_WIDTH * 0.039, SCREEN_WIDTH * 0.041),
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Button
  buttonWrapper: {
    marginTop: responsiveSize(SCREEN_HEIGHT * 0.012, SCREEN_HEIGHT * 0.015, SCREEN_HEIGHT * 0.018),
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonGradient: {
    paddingVertical: responsiveSize(13, 14, 15),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  buttonText: {
    color: '#0099FF',
    fontSize: responsiveSize(SCREEN_WIDTH * 0.04, SCREEN_WIDTH * 0.042, SCREEN_WIDTH * 0.044),
    fontWeight: '800',
    letterSpacing: 2.5,
  },

  // Login Link
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: responsiveSize(SCREEN_HEIGHT * 0.015, SCREEN_HEIGHT * 0.018, SCREEN_HEIGHT * 0.022),
    flexWrap: 'wrap',
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: responsiveSize(SCREEN_WIDTH * 0.034, SCREEN_WIDTH * 0.036, SCREEN_WIDTH * 0.038),
    fontWeight: '500',
  },
  loginLink: {
    color: '#FFFFFF',
    fontSize: responsiveSize(SCREEN_WIDTH * 0.034, SCREEN_WIDTH * 0.036, SCREEN_WIDTH * 0.038),
    fontWeight: '800',
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Copyright
  copyright: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: responsiveSize(SCREEN_WIDTH * 0.028, SCREEN_WIDTH * 0.03, SCREEN_WIDTH * 0.032),
    fontWeight: '500',
    marginTop: responsiveSize(12, 15, 18),
    marginBottom: 10,
  },
});