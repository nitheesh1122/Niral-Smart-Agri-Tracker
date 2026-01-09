/**
 * LoginScreen - Updated to use pre-selected role from RoleSelectionScreen
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { IPADD } from './ipadd';
import { registerForPushNotificationsAsync } from './utils/notification';
import { colors, spacing, typography, borderRadius } from './theme';

const backgroundImage = require('../assets/image1.jpg');

const ROLE_CONFIG = {
  Customer: { icon: '🛒', color: '#00CEC9' },
  Vendor: { icon: '🏪', color: '#0984E3' },
  Driver: { icon: '🚚', color: '#6C5CE7' },
};

export default function LoginScreen({ navigation, route }) {
  // Get pre-selected role from navigation params
  const selectedRole = route.params?.selectedRole || 'Customer';
  const roleConfig = ROLE_CONFIG[selectedRole];

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Validation Error', 'Username & password are required');
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.post(`http://${IPADD}:5000/api/login`, {
        username,
        password,
        role: selectedRole,
      });

      if (!data.success) {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
        return;
      }

      const { user } = data;

      // Register for push notifications
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await axios.post(`http://${IPADD}:5000/api/user/token`, {
          userId: user._id,
          pushToken: token,
          role: selectedRole,
        });
      }

      // Persist auth info
      await AsyncStorage.multiSet([
        ['userId', user._id],
        ['role', selectedRole],
      ]);

      // Navigate to role-specific home
      switch (selectedRole) {
        case 'Vendor': navigation.replace('VendorHome'); break;
        case 'Driver': navigation.replace('DriverHome'); break;
        default: navigation.replace('CustomerHome'); break;
      }

    } catch (err) {
      console.error('Login error:', err.message);
      Alert.alert('Error', err.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#000" />

      <ImageBackground source={backgroundImage} style={styles.bg} resizeMode="cover">
        <BlurView intensity={90} tint="dark" style={styles.blur}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.card}>
              {/* Role indicator */}
              <View style={[styles.roleIndicator, { backgroundColor: roleConfig.color + '20' }]}>
                <Text style={styles.roleIcon}>{roleConfig.icon}</Text>
                <Text style={[styles.roleLabel, { color: roleConfig.color }]}>
                  {selectedRole}
                </Text>
              </View>

              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>

              <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                mode="outlined"
                placeholder="Enter your username"
                autoCapitalize="none"
                left={<TextInput.Icon icon="account" />}
                theme={{ colors: { primary: roleConfig.color } }}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={styles.input}
                placeholder="Enter your password"
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                theme={{ colors: { primary: roleConfig.color } }}
              />

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.forgot, { color: roleConfig.color }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: roleConfig.color }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              {/* Change role link */}
              <TouchableOpacity
                style={styles.changeRole}
                onPress={() => navigation.navigate('RoleSelection', { mode: 'login' })}
              >
                <Text style={styles.changeRoleText}>
                  Not a {selectedRole}? <Text style={{ color: roleConfig.color }}>Change Role</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </BlurView>
      </ImageBackground>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1, width, height },
  blur: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  keyboardView: { flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  roleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginBottom: spacing.lg,
  },
  roleIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  roleLabel: {
    ...typography.body,
    fontWeight: 'bold',
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  forgot: {
    textAlign: 'right',
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  loginButton: {
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loginButtonText: {
    ...typography.button,
    color: '#fff',
  },
  changeRole: {
    alignItems: 'center',
  },
  changeRoleText: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
});
