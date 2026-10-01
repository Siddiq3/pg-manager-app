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

import { theme, useReducedMotion } from '../components/ui';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const reducedMotion = useReducedMotion();
  const { accessToken, restoring } = useAuth();

  // Avoid flashing the login screen while a stored session is being restored.
  if (restoring) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.brand} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ animation: reducedMotion ? 'none' : 'slide_from_right', headerShadowVisible: false, headerStyle: { backgroundColor: theme.bg }, headerTintColor: theme.brand, headerTitleStyle: { color: theme.text, fontSize: 18, fontWeight: '600' }, contentStyle: { backgroundColor: theme.bg } }}>
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
