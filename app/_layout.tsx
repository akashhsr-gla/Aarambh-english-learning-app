import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="LoginScreen">
        <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ChatScreen" options={{ headerShown: false }} />
        <Stack.Screen name="CallScreen" options={{ headerShown: false }} />
        <Stack.Screen name="RegionScreen" options={{ headerShown: false }} />
        <Stack.Screen name="LearnScreen" options={{ headerShown: false }} />
        <Stack.Screen name="GameScreen" options={{ headerShown: false }} />
        <Stack.Screen name="GrammarQuiz" options={{ headerShown: false }} />
        <Stack.Screen name="PronunciationGame" options={{ headerShown: false }} />
        <Stack.Screen name="IdentificationGame" options={{ headerShown: false }} />
        <Stack.Screen name="StoryTellingGame" options={{ headerShown: false }} />
        <Stack.Screen name="DailyChallenges" options={{ headerShown: false }} />
        <Stack.Screen name="GroupDiscussionScreen" options={{ headerShown: false }} />
        <Stack.Screen name="CreateGroupScreen" options={{ headerShown: false }} />
        <Stack.Screen name="GroupWaitingRoom" options={{ headerShown: false }} />
        <Stack.Screen name="GroupChatScreen" options={{ headerShown: false }} />
        <Stack.Screen name="GroupVideoCallScreen" options={{ headerShown: false }} />
        <Stack.Screen name="ProfileScreen" options={{ headerShown: false }} />
        <Stack.Screen name="SubscriptionScreen" options={{ headerShown: false }} />
        <Stack.Screen name="SessionsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="TeacherDashboard" options={{ headerShown: false }} />
        <Stack.Screen name="PrivacyPolicyScreen" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
