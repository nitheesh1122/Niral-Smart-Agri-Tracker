// VendorHome.js - Updated with SidebarMenu, logout, and Service Requests
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

/* Management sub‑pages */
import DriverManagement from './components/DriverManagement';
import VehicleManagement from './components/VehicleManagement';
import ExportManagement from './components/ExportManagement';
import VendorHomePlaceHolder from './components/vendorHomePlaceHolder';
import ServiceRequestManager from './components/ServiceRequestManager';
import VendorExportDashboard from './components/VendorExportDashboard';

/* Chat helpers */
import CustomerSelectList from './components/CustomerSelectionList';
import DriverSelectList from './components/DriverSelectList';
import VendorChat from './components/VendorChat';

import SidebarMenu from '../components/SidebarMenu';
import AppHeader from '../components/AppHeader';
import { colors } from '../theme';

const MENU_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'exportDashboard', label: 'Export Dashboard', icon: '📊' },
  { id: 'serviceRequests', label: 'Service Requests', icon: '📋' },
  { id: 'driver', label: 'Driver Management', icon: '👨‍✈️' },
  { id: 'vehicle', label: 'Vehicle Management', icon: '🚗' },
  { id: 'export', label: 'Create Export', icon: '📦' },
  { id: 'customerChat', label: 'Chat with Customers', icon: '💬' },
  { id: 'driverChat', label: 'Chat with Drivers', icon: '🗣️' },
];

const VendorHome = () => {
  const navigation = useNavigation();

  /* Sidebar + nav state */
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [userName, setUserName] = useState('Vendor');

  /* Chat state */
  const [vendorId, setVendorId] = useState(null);
  const [chatMode, setChatMode] = useState(null);
  const [chatTargetId, setChatTargetId] = useState(null);
  const [chatTargetName, setChatTargetName] = useState('');

  /* Fetch vendorId once */
  useEffect(() => {
    const fetchData = async () => {
      const id = await AsyncStorage.getItem('userId');
      setVendorId(id);
    };
    fetchData();
  }, []);

  /* Helpers */
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

  /* Get page title */
  const getPageTitle = () => {
    if ((activeSection === 'customerChat' || activeSection === 'driverChat') && chatTargetName) {
      return `Chat with ${chatTargetName}`;
    }
    const item = MENU_ITEMS.find(m => m.id === activeSection);
    return item ? item.label : 'Home';
  };

  /* Page renderer */
  const renderContent = () => {
    /* Chat page (target selected) */
    if ((activeSection === 'customerChat' || activeSection === 'driverChat') && chatTargetId) {
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

    /* Selector lists (no target yet) */
    if (activeSection === 'customerChat') {
      return (
        <CustomerSelectList onSelectCustomer={(id, name) => startChat('customer', id, name)} />
      );
    }
    if (activeSection === 'driverChat') {
      return (
        <DriverSelectList onSelect={(id, name) => startChat('driver', id, name)} />
      );
    }

    /* Management sub‑pages */
    switch (activeSection) {
      case 'exportDashboard': return <VendorExportDashboard />;
      case 'serviceRequests': return <ServiceRequestManager vendorId={vendorId} />;
      case 'driver': return <DriverManagement />;
      case 'vehicle': return <VehicleManagement />;
      case 'export': return <ExportManagement />;
      default: return <VendorHomePlaceHolder />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader
        title={getPageTitle()}
        subtitle="Vendor"
        showBack={(activeSection === 'customerChat' || activeSection === 'driverChat') && chatTargetId}
        onBack={resetChat}
        rightComponent={
          <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
        }
      />

      {/* Main content */}
      <View style={styles.mainContent}>
        {renderContent()}
      </View>

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
  menuIcon: {
    fontSize: 24,
    color: colors.text.light,
    fontWeight: 'bold',
  },
});
