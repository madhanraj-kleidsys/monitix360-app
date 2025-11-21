import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Header from '../Header';

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');

  const handleLogin = () => {
    console.log('Login:', { email, password, company });
    // navigation.replace('Main');
    // alert('login successful');
    if (onLogin){
      onLogin();
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <Header />
        <Text style={styles.heading}>Login</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Company *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter company name"
            value={company}
            onChangeText={setCompany}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>Copyrights © Kleidsys Technologies Private Limited</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E5A8E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#D4E7F5',
    padding: 24,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E5A8E',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#1E5A8E',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E5A8E',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1E5A8E',
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#1E5A8E',
    fontSize: 14,
  },
  registerLink: {
    color: '#1E5A8E',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  copyright: {
    textAlign: 'center',
    color: '#1E5A8E',
    fontSize: 11,
    marginTop: 20,
  },
});
