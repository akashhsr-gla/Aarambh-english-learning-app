import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import Sidebar from './Sidebar';

interface HeaderProps {
  onMenuPress?: () => void;
  title?: string;
}

export default function Header({ onMenuPress, title }: HeaderProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
    if (onMenuPress) {
      onMenuPress();
    }
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Image
            source={require('@/assets/images/logo.svg')}
            style={styles.logoImage}
          />
        </View>
        
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
          <FontAwesome name="bars" size={24} color="#dc2929" />
        </TouchableOpacity>
      </View>
      
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logo: {
    width: 50,
    height: 50,
    justifyContent: 'flex-start',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 5,
  },
}); 