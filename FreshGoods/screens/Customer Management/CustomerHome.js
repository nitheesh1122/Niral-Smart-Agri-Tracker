// CustomerHome.js - Updated with SidebarMenu and logout functionality
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import CustomerHomePlaceholder from './components/CustomerHomePlaceholder';
import CustomerProfilePlaceholder from './components/CustomerProfilePlaceholder';
import CustomerViewGoods from './components/CustomerViewGoods';
import VendorSelectList from './components/VendorSelectList';
import CustomerChat from './components/CustomerChatPlaceholder';

import SidebarMenu from '../components/SidebarMenu';
import AppHeader from '../components/AppHeader';
import { colors, spacing } from '../theme';

const MENU_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'viewGoods', label: 'View Goods', icon: '🛒' },
  { id: 'chat', label: 'Chat', icon: '💬' },
];

const CustomerHome = () => {
  const navigation = useNavigation();

  /* State */
  const [activeSection, setActiveSection] = useState('home');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [userName, setUserName] = useState('Customer');

  /* Chat state */
  const [customerId, setCustomerId] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [vendorName, setVendorName] = useState(null);

  /* Get user data */
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = await AsyncStorage.getItem('userId');
      setCustomerId(userId);
      // You could fetch user name from API here
    };
    fetchUserData();
  }, []);

  /* Get page title */
  const getPageTitle = () => {
    if (activeSection === 'chat' && vendorName) {
      return `Chat with ${vendorName}`;
    }
    const item = MENU_ITEMS.find(m => m.id === activeSection);
    return item ? item.label : 'Home';
  };

  /* Handle back in chat */
  const handleChatBack = () => {
    setVendorId(null);
    setVendorName(null);
  };

  /* Render content */
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <CustomerProfilePlaceholder />;

      case 'viewGoods':
        return <CustomerViewGoods />;

      case 'chat':
        return vendorId ? (
          <CustomerChat
            vendorId={vendorId}
            vendorName={vendorName}
            customerId={customerId}
            onBack={handleChatBack}
          />
        ) : (
          <VendorSelectList
            onSelectVendor={(id, name) => {
              setVendorId(id);
              setVendorName(name);
            }}
          />
        );

      case 'home':
      default:
        return <CustomerHomePlaceholder onNavigate={setActiveSection} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader
        title={getPageTitle()}
        subtitle="Customer"
        showBack={activeSection === 'chat' && vendorId}
        onBack={handleChatBack}
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
          setActiveSection(id);
          // Reset chat state when switching sections
          if (id !== 'chat') {
            setVendorId(null);
            setVendorName(null);
          }
        }}
        navigation={navigation}
        userName={userName}
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
  menuIcon: {
    fontSize: 24,
    color: colors.text.light,
    fontWeight: 'bold',
  },
});
