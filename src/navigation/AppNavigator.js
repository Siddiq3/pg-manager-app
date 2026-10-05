import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AddTenantScreen from '../screens/AddTenantScreen';
import AccountScreen from '../screens/AccountScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HelpScreen from '../screens/HelpScreen';
import LegalScreen from '../screens/LegalScreen';
import LoginScreen from '../screens/LoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PropertySettingsScreen from '../screens/PropertySettingsScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RentScreen from '../screens/RentScreen';
import RoomDetailScreen from '../screens/RoomDetailScreen';
import RoomsScreen from '../screens/RoomsScreen';
import SecurityScreen from '../screens/SecurityScreen';
import SupportScreen from '../screens/SupportScreen';
import TenantDetailScreen from '../screens/TenantDetailScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SubscriptionRequiredScreen from '../screens/SubscriptionRequiredScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import BillingStatusErrorScreen from '../screens/BillingStatusErrorScreen';
import { StateView, fonts, theme, typography, useReducedMotion } from '../components/ui';

const Stack=createNativeStackNavigator(); const Tab=createBottomTabNavigator();

function MainTabs(){
 const insets=useSafeAreaInsets();
 const common=({route})=>({headerShown:false,tabBarActiveTintColor:theme.brand,tabBarInactiveTintColor:theme.muted,tabBarStyle:{height:60+insets.bottom,paddingTop:6,paddingBottom:Math.max(insets.bottom,4),borderTopColor:theme.border,backgroundColor:theme.surface},tabBarLabelStyle:{...typography.caption,fontFamily:fonts.semibold,fontSize:11,marginBottom:5},tabBarIcon:({color,size,focused})=>{const icons={Home:'home',RoomsTab:'bed',RentTab:'wallet',Account:'person-circle'};const base=icons[route.name];return <Ionicons name={focused?base:`${base}-outline`} size={size} color={color}/>;}});
 return <Tab.Navigator screenOptions={common}><Tab.Screen name="Home" component={DashboardScreen}/><Tab.Screen name="RoomsTab" component={RoomsHub} options={{title:'Rooms'}}/><Tab.Screen name="RentTab" component={RentHub} options={{title:'Rent'}}/><Tab.Screen name="Account" component={AccountScreen}/></Tab.Navigator>;
}
function RoomsHub(props){const {activePropertyId}=useAuth();return activePropertyId?<RoomsScreen {...props} route={{...props.route,params:{propertyId:activePropertyId}}}/>:<NoProperty icon="bed-outline" title="Rooms & vacancy" navigation={props.navigation}/>}
function RentHub(props){const {activePropertyId}=useAuth();return activePropertyId?<RentScreen {...props} route={{...props.route,params:{propertyId:activePropertyId}}}/>:<NoProperty icon="wallet-outline" title="Rent" navigation={props.navigation}/>}
function NoProperty({icon,title,navigation}){return <View style={{flex:1,justifyContent:'center',padding:16,backgroundColor:theme.bg}}><StateView icon={icon} title={title} message="Create or select a property from Home first." actionLabel="Go to Home" onAction={()=>navigation.navigate('Home')}/></View>}

export default function AppNavigator(){const reducedMotion=useReducedMotion();const {accessToken,restoring,entitlement,entitlementState}=useAuth();if(restoring || (accessToken && (entitlementState==='idle' || entitlementState==='loading')))return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:theme.bg}}><ActivityIndicator size="large" color={theme.brand}/></View>;const options={animation:reducedMotion?'none':'slide_from_right',headerShadowVisible:false,headerStyle:{backgroundColor:theme.surface},headerTintColor:theme.text,headerTitleStyle:{color:theme.text,fontSize:18,fontFamily:fonts.semibold},headerBackTitleVisible:false,contentStyle:{backgroundColor:theme.bg}};return <Stack.Navigator screenOptions={options}>{!accessToken?<><Stack.Screen name="Welcome" component={WelcomeScreen} options={{headerShown:false}}/><Stack.Screen name="Login" component={LoginScreen} options={{headerShown:false}}/><Stack.Screen name="Register" component={RegisterScreen} options={{headerShown:false}}/><Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{headerShown:false}}/></>:entitlementState==='error'?<><Stack.Screen name="BillingStatusError" component={BillingStatusErrorScreen} options={{headerShown:false}}/><Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{title:'Delete account'}}/></>:!entitlement?.hasAccess?<><Stack.Screen name="SubscriptionRequired" component={SubscriptionRequiredScreen} options={{headerShown:false}}/><Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{title:'Delete account'}}/></>:<><Stack.Screen name="Main" component={MainTabs} options={{headerShown:false}}/><Stack.Screen name="Rooms" component={RoomsScreen}/><Stack.Screen name="RoomDetail" component={RoomDetailScreen} options={{title:'Room'}}/><Stack.Screen name="TenantDetail" component={TenantDetailScreen} options={{title:'Tenant'}}/><Stack.Screen name="AddTenant" component={AddTenantScreen} options={{title:'Add tenant'}}/><Stack.Screen name="Rent" component={RentScreen}/><Stack.Screen name="Profile" component={ProfileScreen}/><Stack.Screen name="PropertySettings" component={PropertySettingsScreen} options={{title:'Property settings'}}/><Stack.Screen name="EmailVerification" component={EmailVerificationScreen} options={{title:'Verify email'}}/><Stack.Screen name="Security" component={SecurityScreen} options={{title:'Password & devices'}}/><Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{title:'Delete account'}}/><Stack.Screen name="Help" component={HelpScreen} options={{title:'Help'}}/><Stack.Screen name="Support" component={SupportScreen} options={{title:'Support'}}/><Stack.Screen name="Legal" component={LegalScreen} options={({route})=>({title:route.params?.type==='privacy'?'Privacy policy':'Terms of service'})}/></>}</Stack.Navigator>}