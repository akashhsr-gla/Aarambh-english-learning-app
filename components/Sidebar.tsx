import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, Platform, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const navigation = useNavigation(); 
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const navigateToScreen = (screenName: string) => {
    onClose();
    // @ts-ignore
    navigation.navigate(screenName);
  };

  if (!visible) return null;

  return (
    
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeArea} onPress={onClose} />
        <Animated.View 
          style={[
            styles.sidebar,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          {/* User Profile Section with Close Button */}
          <View style={styles.profileSection}>
            <View style={styles.profileContent}>
              <View style={styles.profileAvatar}>
                <FontAwesome name="user" size={40} color="#FFFFFF" />
              </View>
              <View style={styles.profileInfo}>
                <ThemedText style={styles.profileName}>User Name</ThemedText>
                <ThemedText style={styles.profileEmail}>user@example.com</ThemedText>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesome name="times" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            <TouchableOpacity style={styles.menuItem}>
              <FontAwesome name="user-circle" size={24} color="#333333" style={styles.menuIcon} />
              <ThemedText style={styles.menuText}>Account</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <FontAwesome name="star" size={24} color="#dc2929" style={styles.menuIcon} />
              <ThemedText style={styles.menuText}>Subscription</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <FontAwesome name="bell" size={24} color="#226cae" style={styles.menuIcon} />
              <ThemedText style={styles.menuText}>Notifications</ThemedText>
              <View style={styles.notificationBadge}>
                <ThemedText style={styles.notificationText}>3</ThemedText>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem}>
              <FontAwesome name="book" size={24} color="#dc2929" style={styles.menuIcon} />
              <ThemedText style={styles.menuText}>Lessons</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateToScreen('RegionScreen')}
            >
              <FontAwesome name="map-marker" size={24} color="#226cae" style={styles.menuIcon} />
              <ThemedText style={styles.menuText}>Region</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <FontAwesome name="history" size={24} color="#dc2929" style={styles.menuIcon} />
              <ThemedText style={styles.menuText}>History</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <FontAwesome name="question-circle" size={24} color="#226cae" style={styles.menuIcon} />
              <ThemedText style={styles.menuText}>Help</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                onClose();
                // @ts-ignore
                navigation.navigate('LoginScreen');
              }}
            >
              <FontAwesome name="sign-out" size={24} color="#FFFFFF" style={styles.logoutIcon} />
              <ThemedText style={styles.logoutText}>Logout</ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeArea: {
    flex: 1,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#FFFFFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  profileSection: {
    backgroundColor: '#226cae',
    padding: 20,
    paddingTop: STATUS_BAR_HEIGHT + 20,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 15,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  profileEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  menuItems: {
    paddingVertical: 10,
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuIcon: {
    marginRight: 15,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 10,
    marginHorizontal: 20,
  },
  notificationBadge: {
    backgroundColor: '#dc2929',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  logoutButton: {
    backgroundColor: '#dc2929',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});