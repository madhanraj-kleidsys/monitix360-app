import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// common screens 
import LandingScreen from './components/commonScreens/LandingScreen';
import LoginScreen from './components/commonScreens/LoginScreen';
import RegisterScreen from './components/commonScreens/RegisterScreen';

//admin pages
import AdminDockNavigation from './components/admin/DockNavigation';
import AdminHomePage from './components/admin/HomePage';
import AdminProjectPage from './components/admin/ProjectPage';
import AdminEmployeePage from './components/admin/EmployeePage';
import AdminHolidayPage from './components/admin/HolidayPage';
import AdminShiftPage from './components/admin/ShiftPage';
import AdminProfilePage from './components/admin/ProfilePage';


// employees pages 
import HomePage from './components/employees/HomePage';
import TaskScreen from './components/employees/TaskPage';
import ProgressPage from './components/employees/ProgressPage';
import ProfilePage from './components/employees/ProfilePage';
import DockNavigation from './components/employees/DockNavigation';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ========== ADMIN MAIN TABS ==========
function AdminMainTabs({ onLogout }) {
  const [activeScreen, setActiveScreen] = useState('home');

   const handleTabPress = (id) =>{
    setActiveScreen(id);
  };
  return (
    <Tab.Navigator
      tabBar={(props) => <AdminDockNavigation {...props} onLogout={onLogout}
      activeScreen={activeScreen} 
      onTabPress={handleTabPress}
      />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="AdminHome" component={AdminHomePage} />
      <Tab.Screen name="AdminProjects" component={AdminProjectPage} />
      <Tab.Screen name="AdminEmployees" component={AdminEmployeePage} />
      <Tab.Screen name="AdminHolidays" component={AdminHolidayPage} />
      <Tab.Screen name="AdminShift" component={AdminShiftPage} />
      <Tab.Screen name="AdminProfile">
        {(props) => <AdminProfilePage {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ========== EMPLOYEE MAIN TABS ==========
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
            {(props) => <AdminMainTabs {...props} onLogout={() => setIsLoggedIn(false)} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}