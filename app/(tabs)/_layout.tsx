import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';

// Define the allowed icon names for type safety
type TabIconName = 'mobile' | 'gamepad' | 'trophy' | 'question-circle';

// Custom tab bar icon component for consistent alignment
function TabBarIcon({ name, color }: { name: TabIconName, color: string }) {
  // Apply specific styling for phone icon
  const iconStyle = name === 'mobile' ? { transform: [{ scaleX: -1}] } : undefined;
  
  return (
    <View style={styles.iconContainer}>
      <FontAwesome name={name} size={20} color={color} style={iconStyle} />
    </View>
  );
}

export default function TabLayout() {
  // Use an `any` spread to safely apply scene container padding without TS complaining
  const scenePadding: any = { sceneContainerStyle: { paddingBottom: 32 } };
  return (
    <Tabs
      screenOptions={{
        ...scenePadding,
        safeAreaInsets: { bottom: 32 },
        tabBarActiveTintColor: '#dc2929', // Primary red from web app
        tabBarInactiveTintColor: '#226cae', // Primary blue from web app
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          position: 'absolute',
          bottom: 1,
          left: 16,
          right: 16,
          borderRadius: 16,
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 10,
          height: 60,
          paddingBottom: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="mobile" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="gamepad" color={color} />,
        }}
      />
      <Tabs.Screen
        name="trophies"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="trophy" color={color} />,
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="question-circle" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
