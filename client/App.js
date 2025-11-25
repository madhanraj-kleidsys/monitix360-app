import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LandingScreen from './components/screens/LandingScreen';
import LoginScreen from './components/screens/LoginScreen';
import RegisterScreen from './components/screens/RegisterScreen';
import HomePage from './components/screens/HomePage';
import TaskScreen from './components/screens/TaskPage';
import ProgressPage from './components/screens/ProgressPage';
import ProfilePage from './components/screens/ProfilePage';
import DockNavigation from './components/DockNavigation';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ onLogout }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <DockNavigation {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Tasks" component={TaskScreen} />
      <Tab.Screen name="Progress" component={ProgressPage} />
      <Tab.Screen name="Profile">
        {(props) => <ProfilePage {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}


export default function App() {
  const [hasSeenLanding, setHasSeenLanding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    // <NavigationContainer>
    //   <Stack.Navigator screenOptions={{ headerShown: false }}>
    //     {!isLoggedIn ? (
    //       <>
    //         <Stack.Screen name="Login">
    //           {(props) => <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
    //         </Stack.Screen>
    //         <Stack.Screen name="Register" component={RegisterScreen} />
    //       </>
    //     ) : (
    //       <Stack.Screen name="Main">
    //         {(props) => <MainTabs {...props} onLogout={() => setIsLoggedIn(false)} />}
    //       </Stack.Screen>
    //     )}
    //   </Stack.Navigator>
    // </NavigationContainer>

    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenLanding ? (
          <Stack.Screen name="Landing">
            {(props) => (
              <LandingScreen
                {...props}
                onContinue={() => setHasSeenLanding(true)}
              />
            )}
          </Stack.Screen>
        ) : !isLoggedIn ? (
          // Show Auth Screens after landing
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Show Main App after login
          <Stack.Screen name="Main">
            {(props) => <MainTabs {...props} onLogout={() => setIsLoggedIn(false)} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}