import React, { useState,useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from './components/loader/SplashScreen';

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
function AdminMainTabs({ onLogout , user }) {
  const [activeScreen, setActiveScreen] = useState('home');

  const handleTabPress = (id) => {
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
        {(props) => <AdminProfilePage {...props} onLogout={onLogout} 
        user={user}/>}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ========== EMPLOYEE MAIN TABS ==========
function EmployeeMainTabs({ onLogout }) {
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
  // if false showslanding screen ==========
  const [hasSeenLanding, setHasSeenLanding] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
   const [isLoading, setIsLoading] = useState(true);

 // Check for saved token + user on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user has seen landing (skip if true)
        const seenLanding = await AsyncStorage.getItem('hasSeenLanding');
        if (seenLanding === 'true') {
          setHasSeenLanding(true);
        }

        // Check for saved token AND user data
        const savedToken = await AsyncStorage.getItem('authToken');
        const savedUser = await AsyncStorage.getItem('userData');
        
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser)); // Restore user object
        }
      } catch (err) {
        console.log('Init error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenLanding ? (
          <Stack.Screen name="Landing">
            {props => (
              <LandingScreen
                {...props}
                onContinue={async () => {
                  await AsyncStorage.setItem('hasSeenLanding', 'true');
                  setHasSeenLanding(true);
                }}
              />
            )}
          </Stack.Screen>
        ) : !user ? (
          <>
            <Stack.Screen name="Login">
              {props => (
                <LoginScreen
                  {...props}
                  onLogin={async (userData, jwt) => {
                    // Save BOTH token AND user data
                    await AsyncStorage.setItem('authToken', jwt);
                    await AsyncStorage.setItem('userData', JSON.stringify(userData));
                    
                    setUser(userData);
                    setToken(jwt);
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <Stack.Screen name="Main">
            {props =>
              user.role === 'admin'
                ? <AdminMainTabs {...props} onLogout={async () => {
                    await AsyncStorage.multiRemove(['authToken', 'userData']);
                    setUser(null);
                    setToken(null);
                  }}
                  user={user} />
                : <EmployeeMainTabs {...props} onLogout={async () => {
                    await AsyncStorage.multiRemove(['authToken', 'userData']);
                    setUser(null);
                    setToken(null);
                  }} />
            }
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
    // <NavigationContainer>
    //   <Stack.Navigator screenOptions={{ headerShown: false }}>
    //     {!hasSeenLanding ? (
    //       <Stack.Screen name="Landing">
    //         {(props) => (
    //           <LandingScreen
    //             {...props}
    //             onContinue={() => setHasSeenLanding(true)}
    //           />
    //         )}
    //       </Stack.Screen>
    //     ) : !isLoggedIn ? (
    //       // Show Auth Screens after landing
    //       <>
    //         <Stack.Screen name="Login">
    //           {(props) => <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
    //         </Stack.Screen>
    //         <Stack.Screen name="Register" component={RegisterScreen} />
    //       </>
    //     ) : (
    //       // Show Main App after login
    //       <Stack.Screen name="Main">
    //         {(props) => <AdminMainTabs {...props} onLogout={() => setIsLoggedIn(false)} />}
    //       </Stack.Screen>
    //     )}
    //   </Stack.Navigator>
    // </NavigationContainer>
}