/**
 * VendorHome.js
 * Updated vendor container with enhanced navigation
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Management sub‑pages
import DriverManagement from './components/DriverManagement';
import VehicleManagement from './components/VehicleManagement';
import ExportManagement from './components/ExportManagement';
import VendorHomePlaceHolder from './components/vendorHomePlaceHolder';
import ServiceRequestManager from './components/ServiceRequestManager';
import VendorExportDashboard from './components/VendorExportDashboard';
import VendorAnalytics from './components/VendorAnalytics';

// Chat helpers
import CustomerSelectList from './components/CustomerSelectionList';
import DriverSelectList from './components/DriverSelectList';
import VendorChat from './components/VendorChat';

// Components
import SidebarMenu from '../components/SidebarMenu';
import AppHeader from '../components/AppHeader';
import SettingsScreen from '../components/SettingsScreen';
import NotificationCenter from '../components/NotificationCenter';
import { colors } from '../theme';

const MENU_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'exportDashboard', label: 'Export Dashboard', icon: '📊' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'serviceRequests', label: 'Service Requests', icon: '📋' },
  { id: 'driver', label: 'Driver Management', icon: '👨‍✈️' },
  { id: 'vehicle', label: 'Vehicle Management', icon: '🚗' },
  { id: 'export', label: 'Create Export', icon: '📦' },
  { id: 'customerChat', label: 'Chat with Customers', icon: '💬' },
  { id: 'driverChat', label: 'Chat with Drivers', icon: '🗣️' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const VendorHome = () => {
  const navigation = useNavigation();

  // State
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [userName, setUserName] = useState('Vendor');
  const [userEmail, setUserEmail] = useState('');

  // Chat state
  const [vendorId, setVendorId] = useState(null);
  const [chatMode, setChatMode] = useState(null);
  const [chatTargetId, setChatTargetId] = useState(null);
  const [chatTargetName, setChatTargetName] = useState('');

  // Get user data
  useEffect(() => {
    const fetchData = async () => {
      const id = await AsyncStorage.getItem('userId');
      const name = await AsyncStorage.getItem('userName');
      const email = await AsyncStorage.getItem('userEmail');
      setVendorId(id);
      if (name) setUserName(name);
      if (email) setUserEmail(email);
    };
    fetchData();
  }, []);

  // Reset chat state
  const resetChat = () => {
    setChatTargetId(null);
    setChatTargetName('');
    setChatMode(null);
  };

  const startChat = (mode, id, name) => {
    setChatMode(mode);
    setChatTargetId(id);
    setChatTargetName(name);
  };

  // Get page title
  const getPageTitle = () => {
    if (
      (activeSection === 'customerChat' || activeSection === 'driverChat') &&
      chatTargetName
    ) {
      return `Chat with ${chatTargetName}`;
    }
    const item = MENU_ITEMS.find((m) => m.id === activeSection);
    return item ? item.label : 'Home';
  };

  // Render content
  const renderContent = () => {
    // Chat with target selected
    if (
      (activeSection === 'customerChat' || activeSection === 'driverChat') &&
      chatTargetId
    ) {
      return (
        <VendorChat
          vendorId={vendorId}
          chatType={chatMode}
          targetId={chatTargetId}
          targetName={chatTargetName}
          onBack={resetChat}
        />
      );
    }

    // Selector lists (no target yet)
    if (activeSection === 'customerChat') {
      return (
        <CustomerSelectList
          onSelectCustomer={(id, name) => startChat('customer', id, name)}
        />
      );
    }
    if (activeSection === 'driverChat') {
      return (
        <DriverSelectList
          onSelect={(id, name) => startChat('driver', id, name)}
        />
      );
    }

    // Management sub‑pages
    switch (activeSection) {
      case 'exportDashboard':
        return <VendorExportDashboard />;
      case 'analytics':
        return <VendorAnalytics onBack={() => setActiveSection('home')} />;
      case 'serviceRequests':
        return <ServiceRequestManager vendorId={vendorId} />;
      case 'driver':
        return <DriverManagement />;
      case 'vehicle':
        return <VehicleManagement />;
      case 'export':
        return <ExportManagement />;
      case 'notifications':
        return <NotificationCenter onBack={() => setActiveSection('home')} />;
      case 'settings':
        return <SettingsScreen onBack={() => setActiveSection('home')} />;
      default:
        return <VendorHomePlaceHolder />;
    }
  };

  const showBackButton =
    (activeSection === 'customerChat' || activeSection === 'driverChat') &&
    chatTargetId;

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader
        title={getPageTitle()}
        subtitle="Vendor"
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
        userRole="Vendor"
      />
    </View>
  );
};

export default VendorHome;

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
