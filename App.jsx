import React,{useState,useEffect} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

import LoginScreen from "./src/screens/auth/Login"; // ✅ Corrected Path
import HomePage from "./src/screens/patient/HomePage"; // ✅ Ensure correct import
import LocationScreen from "./src/screens/patient/LocationScreen";
import VisitClinic from "./src/screens/patient/VisitClinic";
import LabTests from "./src/screens/patient/LabTests";
import ClinicAppointment from "./src/screens/patient/ClinicAppointment";
import UserProfile from "./src/screens/patient/UserProfile";
import DoctorListScreen from "./src/screens/patient/DoctorListScreen";
import BookingScreen from "./src/screens/patient/BookingScreen";
import LabTestClinics from "./src/screens/patient/LabTestClinics";
import BookingLabScreen from "./src/screens/patient/BookingLabScreen";
import DoctorDashboard from "./src/screens/doctor/Dashboard";
import UpcomingAppointments from "./src/screens/doctor/UpcomingAppointments";
import TodaysPatients from "./src/screens/doctor/PatientsToday";
import Profile from "./src/screens/patient/profile";
import Prescription from "./src/screens/patient/prescription";
import Insurance from "./src/screens/patient/insurance";
import AmbulanceRegister from "./src/screens/ambulance/AmbulanceRegister";
import AmbulanceBooking from "./src/screens/patient/AmbulanceBooking";
import RegisterScreen from "./src/screens/auth/SignUp";
import AdminDashboard from "./src/screens/admin/AdminDashboard";

import DoctorRegister from "./src/screens/doctor/DoctorRegister";
import AmbulanceDashboard from "./src/screens/ambulance/AmbulanceDashboard";
import DoctorProfile from "./src/screens/doctor/DoctorProfile";
import LabTestDashboard from "./src/screens/Lab/LabTestDashboard";
import LabRegister from "./src/screens/Lab/LabRegister";
import LabProfile from "./src/screens/Lab/LabProfile";

import DoctorSchedule from "./src/screens/doctor/DoctorSchedule";
import MonthAvailability from "./src/screens/doctor/MonthAvailability";
import LabReport from "./src/screens/patient/LabReport";
import TodaysLabTest from "./src/screens/Lab/TodaysLabTest";
import AppointmentList from "./src/screens/doctor/AppointmentList";
import LabTypes from "./src/screens/Lab/LabTypes";
import LabSchedule from "./src/screens/Lab/LabSchedule";
import DoctorAppointments from "./src/screens/patient/DoctorAppointments";
import DoctorAppointments1 from "./src/screens/patient/DoctorAppointments1";
import RegisteredAmbulance from "./src/screens/ambulance/RegisteredAmbulance";
import ActiveAmbulance from "./src/screens/ambulance/ActiveAmbulance";
import DoctorListScreen1 from "./src/screens/patient/DoctorListScreen1";
import RegisteredDoctor from "./src/screens/admin/RegisteredDoctor";
import DoctorAppointmentList from "./src/screens/admin/DoctorAppointmentList";
import RegisteredAmbulanceList from "./src/screens/admin/RegisteredAmbulanceList";
import NotificationHandler from "./src/screens/util/NotificationHandler";
import { NotificationProvider } from "./src/screens/util/NotificationContext";
// import NotificationScreen from "./src/screens/patient/NotificationScreen";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import LabTestReports from "./src/screens/Lab/UpcomingLabTest";

import { LocationProvider } from "./src/context/LocationContext";

import LabAppointmentsScreen from "./src/screens/patient/LabAppointments";
import RegisteredLabScreen from "./src/screens/admin/RegisteredLab";
import LabTestList from "./src/screens/admin/LabTestList";
import AsyncStorage from '@react-native-async-storage/async-storage';
import PendingAccounts from './src/screens/admin/PendingAccounts';
import { navigationRef } from "./src/screens/util/NavigationService";
import PendingRequestsPreview from "./src/screens/admin/admincomponent/PendingRequestsPreview";

const Stack = createStackNavigator();

const App = () => {

  
  const [initialRoute, setInitialRoute] = useState(null);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const userData = await AsyncStorage.getItem('userData');
        if (token && userData) {
          const user = JSON.parse(userData);
          const userRole = user.role?.toLowerCase();
          if (user.is_admin) {
            setInitialRoute('AdminDashboard');
          } else if (userRole === 'lab') {
            setInitialRoute('LabTestDashboard');
          } else if (userRole === 'doctor') {
            setInitialRoute('DoctorDashboard');
          } else if (userRole === 'ambulance') {
            setInitialRoute('AmbulanceDashboard');
          } else if (userRole === 'patient') {
            setInitialRoute('HomePage');
          } else {
            setInitialRoute('Login');
          }
        } else {
          setInitialRoute('Login');
        }
      } catch (e) {
        setInitialRoute('Login');
      }
      setLoading(false);
    };
    checkLogin();

  //  useEffect(() => {
    GoogleSignin.configure({
      // webClientId: '287276868185-0vlh343lpknjra6nn313lfnc0fv48q5i.apps.googleusercontent.com',
      webClientId: '287276868185-jindirgfpur91ps1nb9doqgqao26qltu.apps.googleusercontent.com', 
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);
if (loading || !initialRoute) {
    return null;
  }
  return (
    <LocationProvider>
    <SafeAreaProvider>
    <NotificationProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor:"#f5f5f5" }} edges={["top", "left", "right","bottom"]}>

  

    <NotificationHandler />
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}  initialRouteName={initialRoute}>
        {/* Ensure LoginScreen is the first screen */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen name="HomePage" component={HomePage} />
        <Stack.Screen name="LocationScreen" component={LocationScreen} />
        <Stack.Screen name="VisitClinic" component={VisitClinic} />
        <Stack.Screen name="LabTests" component={LabTests} />
        <Stack.Screen name="ClinicAppointment" component={ClinicAppointment} />
        <Stack.Screen name="UserProfile" component={UserProfile} />
        <Stack.Screen name="DoctorListScreen" component={DoctorListScreen} />
        <Stack.Screen name="DoctorListScreen1" component={DoctorListScreen1} />
        <Stack.Screen name="BookingScreen" component={BookingScreen} />
        <Stack.Screen name="LabTestClinics" component={LabTestClinics} />
        <Stack.Screen name="BookingLabScreen" component={BookingLabScreen} />
        <Stack.Screen name="AmbulanceBooking" component={AmbulanceBooking} />
        <Stack.Screen name="DoctorAppointments" component={DoctorAppointments} />
        <Stack.Screen name="LabAppointments" component={LabAppointmentsScreen} />
        <Stack.Screen name="DoctorAppointments1" component={DoctorAppointments1} />
        <Stack.Screen name="ActiveAmbulance" component={ActiveAmbulance} />
       
       

        {/* UserProfile */}
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Prescription" component={Prescription} />
        <Stack.Screen name="Insurance" component={Insurance} />
        <Stack.Screen name="LabReport" component={LabReport} />


        {/* Doctor Dashboard */}
        <Stack.Screen name="DoctorDashboard" component={DoctorDashboard}/>
        <Stack.Screen name="UpcomingAppointments" component={UpcomingAppointments}/>
        <Stack.Screen name="TodaysPatients" component={TodaysPatients}/>
        <Stack.Screen name="DoctorProfile" component={DoctorProfile}/>
        <Stack.Screen name="DoctorRegister" component={DoctorRegister}/>
        <Stack.Screen name="DoctorSchedule" component={DoctorSchedule}/>
        <Stack.Screen name="MonthAvailability" component={MonthAvailability}/>
        <Stack.Screen name="AppointmentList" component={AppointmentList}/>

        {/* Ambulance */}
        <Stack.Screen name="AmbulanceDashboard" component={AmbulanceDashboard}/>
        <Stack.Screen name="AmbulanceRegister" component={AmbulanceRegister}/>
        
        <Stack.Screen name="RegisteredAmbulance" component={RegisteredAmbulance}/>

        {/* Admin */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboard}/>
        <Stack.Screen name="RegisteredDoctor" component={RegisteredDoctor}/>
         <Stack.Screen name="DoctorAppointmentList" component={DoctorAppointmentList}/>
         <Stack.Screen name="RegisteredAmbulanceList" component={RegisteredAmbulanceList} />
         <Stack.Screen name="RegisteredLab" component={RegisteredLabScreen} />
         <Stack.Screen name="PendingAccounts" component={PendingAccounts} options={{ headerShown: false }} />
        <Stack.Screen name="PendingRequestsPreview" component={PendingRequestsPreview} />

        {/* Lab Dashboard */}
        <Stack.Screen name="LabTestDashboard" component={LabTestDashboard}/>
        <Stack.Screen name="LabRegister" component={LabRegister}/>
        <Stack.Screen name="LabProfile" component={LabProfile}/>
        <Stack.Screen name="TodaysLabTest" component={TodaysLabTest}/>
        <Stack.Screen name="UpcomingLabTest" component={LabTestReports}/>
        <Stack.Screen name="LabTypes" component={LabTypes}/>
        <Stack.Screen name="LabSchedule" component={LabSchedule}/>
        <Stack.Screen name="LabTestList" component={LabTestList}/>


      </Stack.Navigator>
    </NavigationContainer>
            </SafeAreaView>


    </NotificationProvider>
    </SafeAreaProvider>
</LocationProvider>
 
    
  );
};

export default App;
