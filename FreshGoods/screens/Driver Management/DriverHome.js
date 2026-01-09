// DriverHome.js - Updated with SidebarMenu and logout functionality
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

/* Screens */
import DriverProfile from './components/DriverProfile';
import DriverAssignedExports from './components/DriverAssignedExports';
import DriverDeliveryHistory from './components/DriverDeliveryHistory';
import DriverHomePlaceholder from './components/DriverHomePlaceholder';

/* Chat helpers */
import VendorSelectList from './components/VendorSelectList';
import DriverChat from './components/DriverChat';

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

  /* Sidebar state */
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [userName, setUserName] = useState('Driver');

  /* Chat state */
  const [driverId, setDriverId] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [vendorName, setVendorName] = useState('');

  /* Get driverId from storage */
  useEffect(() => {
    const fetchData = async () => {
      const id = await AsyncStorage.getItem('userId');
      setDriverId(id);
    };
    fetchData();
  }, []);

  /* Helpers */
  const resetChat = () => {
    setVendorId(null);
    setVendorName('');
  };

  /* Get page title */
  const getPageTitle = () => {
    if (activeSection === 'chat' && vendorName) {
      return `Chat with ${vendorName}`;
    }
    const item = MENU_ITEMS.find(m => m.id === activeSection);
    return item ? item.label : 'Home';
  };

  /* Render content */
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
      case 'profile': return <DriverProfile />;
      case 'exports': return <DriverAssignedExports />;
      case 'history': return <DriverDeliveryHistory />;
      default: return <DriverHomePlaceholder />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader
        title={getPageTitle()}
        subtitle="Driver"
        showBack={activeSection === 'chat' && vendorId}
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
  menuIcon: {
    fontSize: 24,
    color: colors.text.light,
    fontWeight: 'bold',
  },
});
