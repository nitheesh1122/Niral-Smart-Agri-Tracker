// App.js - FreshGoods Mobile App with Auto-Login & Notifications (SDK 54)
import React, { useEffect, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* --- screens --- */
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import OTPVerificationScreen from './screens/OTPVerificationScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import CustomerHome from './screens/Customer Management/CustomerHome';
import VendorHome from './screens/Vendor Management/VendorHome';
import DriverHome from './screens/Driver Management/DriverHome';
import CustomerChat from './screens/Customer Management/components/CustomerChatPlaceholder';

/* --- services --- */
import NotificationService from './screens/services/NotificationService';

/* --- navigation setup --- */
const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

/**
 * AuthNavigator - Handles conditional navigation based on auth state
 */
const AuthNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Home');

  useEffect(() => {
    checkAuthState();

    // Initialize notifications after auth check
    const initNotifications = async () => {
      try {
        await NotificationService.initialize(navigationRef);
      } catch (error) {
        console.log('Notification init error:', error);
      }
    };

    initNotifications();

    // Cleanup on unmount
    return () => {
      NotificationService.cleanup();
    };
  }, []);

  const checkAuthState = async () => {
    try {
      const [userId, role] = await AsyncStorage.multiGet(['userId', 'role']);

      if (userId[1] && role[1]) {
        // User is logged in - determine which home screen
        switch (role[1]) {
          case 'Vendor':
            setInitialRoute('VendorHome');
            break;
          case 'Driver':
            setInitialRoute('DriverHome');
            break;
          case 'Customer':
            setInitialRoute('CustomerHome');
            break;
          default:
            setInitialRoute('Home');
        }
      } else {
        // Not logged in
        setInitialRoute('Home');
      }
    } catch (error) {
      console.warn('Auth check failed:', error);
      setInitialRoute('Home');
    } finally {
      // Small delay to show splash screen branding
      setTimeout(() => setIsLoading(false), 800);
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: { backgroundColor: '#1B3A57' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
        animation: 'fade',
      }}
    >
      {/* Auth Screens */}
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Reset Password' }} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} options={{ title: 'Verify OTP' }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'New Password' }} />

      {/* Role-Specific Home Screens */}
      <Stack.Screen name="CustomerHome" component={CustomerHome} options={{ headerShown: false }} />
      <Stack.Screen name="VendorHome" component={VendorHome} options={{ headerShown: false }} />
      <Stack.Screen name="DriverHome" component={DriverHome} options={{ headerShown: false }} />

      {/* Other Screens */}
      <Stack.Screen name="CustomerChat" component={CustomerChat} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="light" backgroundColor="#1B3A57" />
        <AuthNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

