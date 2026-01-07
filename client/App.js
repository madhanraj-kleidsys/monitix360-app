import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter, Alert } from 'react-native';
import SplashScreen from './components/loader/SplashScreen';

// common screens 
import LandingScreen from './components/commonScreens/LandingScreen';
import LoginScreen from './components/commonScreens/LoginScreen';
import RegisterScreen from './components/commonScreens/RegisterScreen';
import companyServices from './components/admin/services/CompanyService';

//admin pages
import AdminDockNavigation from './components/admin/DockNavigation';
import AdminHomePage from './components/admin/home/HomePage';
import AdminProjectPage from './components/admin/ProjectPage';
import AdminEmployeePage from './components/admin/EmployeePage';
import AdminHolidayPage from './components/admin/HolidayPage';
import AdminShiftPage from './components/admin/ShiftPage';
import AdminProfilePage from './components/admin/profile/ProfilePage';
import PremiumAlert from './components/common/PremiumAlert';


// employees pages 
import HomePage from './components/employees/HomePage';
import TaskScreen from './components/employees/TaskPage';
import ProgressPage from './components/employees/ProgressPage';
import ProfilePage from './components/employees/ProfilePage';
import DockNavigation from './components/employees/DockNavigation';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ========== ADMIN MAIN TABS ==========
function AdminMainTabs({ onLogout, user, userCompany }) {
  const [activeScreen, setActiveScreen] = useState('home');
  const [filteredProjectCount, setFilteredProjectCount] = useState(0);
  const handleTabPress = (id) => {
    setActiveScreen(id);
  };
  return (
    <>
      <Tab.Navigator
        tabBar={(props) => <AdminDockNavigation {...props} onLogout={onLogout}
          activeScreen={activeScreen}
          onTabPress={handleTabPress}
          filteredProjectCount={filteredProjectCount}
        />}
        screenOptions={{ headerShown: false }}
      >

        <Tab.Screen name="AdminHome" component={AdminHomePage} />
        <Tab.Screen name="AdminProjects">
          {(props) => (
            <AdminProjectPage
              {...props}
              setFilteredProjectCount={setFilteredProjectCount} // Pass setter function as a prop
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="AdminEmployees" component={AdminEmployeePage} />
        <Tab.Screen name="AdminHolidays" component={AdminHolidayPage} />
        <Tab.Screen name="AdminShift" component={AdminShiftPage} />
        <Tab.Screen name="AdminProfile">
          {(props) => <AdminProfilePage {...props} onLogout={onLogout}
            user={user}
            userCompany={userCompany} 
            filteredProjectCount={filteredProjectCount}
            />}
        </Tab.Screen>
      </Tab.Navigator>

    </>

  );
}

// ========== EMPLOYEE MAIN TABS ==========
function EmployeeMainTabs({ onLogout, user, userCompany }) {
  const [activeScreen, setActiveScreen] = useState('home');

  const handleTabPress = (id) => {
    setActiveScreen(id);
  };
  return (
    <>
      <Tab.Navigator
        tabBar={(props) => <DockNavigation {...props}
          activeScreen={activeScreen}
          onTabPress={handleTabPress}
        />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" >
          {(props) => <HomePage {...props} user={user} />}
        </Tab.Screen>
        <Tab.Screen name="Tasks">
          {(props) => <TaskScreen {...props} user={user} />}
        </Tab.Screen>
        <Tab.Screen name="Progress" component={ProgressPage} />
        <Tab.Screen name="Profile">
          {(props) => <ProfilePage {...props} onLogout={onLogout}
            user={user}
            userCompany={userCompany} />}
        </Tab.Screen>
      </Tab.Navigator>
    </>
  );
}


export default function App() {
  // if false showslanding screen ==========
  const [hasSeenLanding, setHasSeenLanding] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userCompany, setUserCompany] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info' });

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
          const parsedUser = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(parsedUser); // Restore user object

          // fetch company detaols
          if (parsedUser.company_id) {
            const company = await companyServices.getCompanyById(parsedUser.company_id);
            try {
              setUserCompany(company);
              // console.log('company details', company);
            }
            catch (err) {
              console.log('Error fetching company:', err);
            }

          }
        }
      } catch (err) {
        console.log('Init error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('logout', () => {
      setUser(null);      // existing state
      setToken(null);
      setAlertConfig({
        visible: true,
        title: 'Session Expired 🔒',
        message: 'Your session has timed out for your security. Please log in again to continue.',
        type: 'warning'
      });
    });
    return () => sub.remove();
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
                ?
                <AdminMainTabs {...props}
                  onLogout={
                    async () => {
                      await AsyncStorage.multiRemove(['authToken', 'userData']);
                      setUser(null);
                      setToken(null);
                    }
                  }
                  user={user}
                  userCompany={userCompany}
                />
                :
                <EmployeeMainTabs {...props}
                  user={user}
                  userCompany={userCompany}
                  onLogout={
                    async () => {
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
}