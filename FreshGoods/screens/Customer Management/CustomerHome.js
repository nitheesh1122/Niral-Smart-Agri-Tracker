/**
 * CustomerHome.js
 * Main customer container with navigation and premium UI
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Screens
import CustomerDashboard from './components/CustomerHomePlaceholder';
import CustomerProfile from './components/CustomerProfile';
import CustomerViewGoods from './components/CustomerViewGoods';
import CustomerTrackingScreen from './components/CustomerTrackingScreen';
import VendorSelectList from './components/VendorSelectList';
import CustomerChat from './components/CustomerChatPlaceholder';

// Components
import SidebarMenu from '../components/SidebarMenu';
import AppHeader from '../components/AppHeader';
import SettingsScreen from '../components/SettingsScreen';
import NotificationCenter from '../components/NotificationCenter';
import { colors, spacing } from '../theme';

const MENU_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'viewGoods', label: 'Browse Goods', icon: '🛒' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const CustomerHome = () => {
  const navigation = useNavigation();

  // State
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [userName, setUserName] = useState('Customer');
  const [userEmail, setUserEmail] = useState('');

  // Chat state
  const [customerId, setCustomerId] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [vendorName, setVendorName] = useState(null);

  // Tracking state
  const [trackingData, setTrackingData] = useState(null);

  // Get user data
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = await AsyncStorage.getItem('userId');
      const name = await AsyncStorage.getItem('userName');
      const email = await AsyncStorage.getItem('userEmail');
      setCustomerId(userId);
      if (name) setUserName(name);
      if (email) setUserEmail(email);
    };
    fetchUserData();
  }, []);

  // Get page title
  const getPageTitle = () => {
    if (activeSection === 'tracking') return 'Track Shipment';
    if (activeSection === 'chat' && vendorName) return `Chat with ${vendorName}`;
    const item = MENU_ITEMS.find((m) => m.id === activeSection);
    return item ? item.label : 'Home';
  };

  // Handle navigation from dashboard
  const handleNavigate = (section, data) => {
    if (section === 'tracking' && data) {
      setTrackingData(data);
      setActiveSection('tracking');
    } else {
      setActiveSection(section);
    }
  };

  // Handle back in chat or tracking
  const handleBack = () => {
    if (activeSection === 'tracking') {
      setTrackingData(null);
      setActiveSection('home');
    } else if (vendorId) {
      setVendorId(null);
      setVendorName(null);
    } else {
      setActiveSection('home');
    }
  };

  // Render content
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <CustomerProfile />;

      case 'viewGoods':
        return (
          <CustomerViewGoods
            onTrack={(exportData) => handleNavigate('tracking', { exportData })}
          />
        );

      case 'tracking':
        return (
          <CustomerTrackingScreen
            exportId={trackingData?.exportId}
            exportData={trackingData?.exportData}
            onBack={handleBack}
          />
        );

      case 'chat':
        return vendorId ? (
          <CustomerChat
            vendorId={vendorId}
            vendorName={vendorName}
            customerId={customerId}
            onBack={() => {
              setVendorId(null);
              setVendorName(null);
            }}
          />
        ) : (
          <VendorSelectList
            onSelectVendor={(id, name) => {
              setVendorId(id);
              setVendorName(name);
            }}
          />
        );

      case 'notifications':
        return <NotificationCenter onBack={() => setActiveSection('home')} />;

      case 'settings':
        return <SettingsScreen onBack={() => setActiveSection('home')} />;

      case 'home':
      default:
        return <CustomerDashboard onNavigate={handleNavigate} />;
    }
  };

  const showBackButton =
    activeSection === 'tracking' ||
    (activeSection === 'chat' && vendorId);

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader
        title={getPageTitle()}
        subtitle="Customer"
        showBack={showBackButton}
        onBack={handleBack}
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
          setActiveSection(id);
          setVendorId(null);
          setVendorName(null);
          setTrackingData(null);
        }}
        navigation={navigation}
        userName={userName}
        userEmail={userEmail}
        userRole="Customer"
      />
    </View>
  );
};

export default CustomerHome;

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
