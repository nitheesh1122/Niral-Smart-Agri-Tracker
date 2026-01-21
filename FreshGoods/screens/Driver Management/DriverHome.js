/**
 * DriverHome.js
 * Updated driver container with enhanced navigation
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Screens
import DriverProfile from './components/DriverProfile';
import DriverAssignedExports from './components/DriverAssignedExports';
import DriverDeliveryHistory from './components/DriverDeliveryHistory';
import DriverHomePlaceholder from './components/DriverHomePlaceholder';

// Chat helpers
import VendorSelectList from './components/VendorSelectList';
import DriverChat from './components/DriverChat';

// Components
import SidebarMenu from '../components/SidebarMenu';
import AppHeader from '../components/AppHeader';
import { colors } from '../theme';

const MENU_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'exports', label: 'Assigned Exports', icon: '📦' },
  { id: 'history', label: 'Delivery History', icon: '📜' },
  { id: 'chat', label: 'Vendor Chat', icon: '💬' },
];

const DriverHome = () => {
  const navigation = useNavigation();

  // State
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [userName, setUserName] = useState('Driver');
  const [userEmail, setUserEmail] = useState('');

  // Chat state
  const [driverId, setDriverId] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [vendorName, setVendorName] = useState('');

  // Get user data
  useEffect(() => {
    const fetchData = async () => {
      const id = await AsyncStorage.getItem('userId');
      const name = await AsyncStorage.getItem('userName');
      const email = await AsyncStorage.getItem('userEmail');
      setDriverId(id);
      if (name) setUserName(name);
      if (email) setUserEmail(email);
    };
    fetchData();
  }, []);

  // Reset chat state
  const resetChat = () => {
    setVendorId(null);
    setVendorName('');
  };

  // Get page title
  const getPageTitle = () => {
    if (activeSection === 'chat' && vendorName) {
      return `Chat with ${vendorName}`;
    }
    const item = MENU_ITEMS.find((m) => m.id === activeSection);
    return item ? item.label : 'Home';
  };

  // Render content
  const renderContent = () => {
    if (activeSection === 'chat') {
      return vendorId ? (
        <DriverChat
          driverId={driverId}
          vendorId={vendorId}
          vendorName={vendorName}
          onBack={resetChat}
        />
      ) : (
        <VendorSelectList
          onSelect={(id, name) => {
            setVendorId(id);
            setVendorName(name);
          }}
        />
      );
    }

    switch (activeSection) {
      case 'profile':
        return <DriverProfile />;
      case 'exports':
        return <DriverAssignedExports />;
      case 'history':
        return <DriverDeliveryHistory />;
      default:
        return <DriverHomePlaceholder />;
    }
  };

  const showBackButton = activeSection === 'chat' && vendorId;

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader
        title={getPageTitle()}
        subtitle="Driver"
        showBack={showBackButton}
        onBack={resetChat}
        rightComponent={
          !showBackButton ? (
            <TouchableOpacity
              onPress={() => setIsMenuVisible(true)}
              style={styles.menuButton}
            >
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Main content */}
      <View style={styles.mainContent}>{renderContent()}</View>

      {/* Sidebar Menu */}
      <SidebarMenu
        isVisible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        menuItems={MENU_ITEMS}
        activeItem={activeSection}
        onItemPress={(id) => {
          resetChat();
          setActiveSection(id);
        }}
        navigation={navigation}
        userName={userName}
        userEmail={userEmail}
        userRole="Driver"
      />
    </View>
  );
};

export default DriverHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  mainContent: {
    flex: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    color: colors.text.light,
    fontWeight: 'bold',
  },
});
