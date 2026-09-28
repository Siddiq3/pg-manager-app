import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AddTenantScreen from '../screens/AddTenantScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LoginScreen from '../screens/LoginScreen';
import RentScreen from '../screens/RentScreen';
import RoomDetailScreen from '../screens/RoomDetailScreen';
import RoomsScreen from '../screens/RoomsScreen';
import TenantDetailScreen from '../screens/TenantDetailScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { accessToken, restoring } = useAuth();

  // Avoid flashing the login screen while a stored session is being restored.
  if (restoring) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7f8fa' }}>
        <ActivityIndicator size="large" color="#2f6f4f" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false, headerTitleStyle: { color: '#17211b' } }}>
      {!accessToken ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'PG Manager' }} />
          <Stack.Screen name="Rooms" component={RoomsScreen} />
          <Stack.Screen name="RoomDetail" component={RoomDetailScreen} options={{ title: 'Room' }} />
          <Stack.Screen name="TenantDetail" component={TenantDetailScreen} options={{ title: 'Tenant' }} />
          <Stack.Screen name="AddTenant" component={AddTenantScreen} options={{ title: 'Add tenant' }} />
          <Stack.Screen name="Rent" component={RentScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
