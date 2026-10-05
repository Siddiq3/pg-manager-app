import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Button, FadeIn, Screen, theme, typography, spacing, radius } from '../components/ui';

export default function BillingStatusErrorScreen({ navigation }) {
  const { entitlementError, refreshEntitlement, entitlementLoading, logout } = useAuth();
  return <Screen><FadeIn style={s.wrap}>
    <View style={s.icon}><Ionicons name="cloud-offline-outline" size={28} color={theme.brand}/></View>
    <Text style={s.title}>Could not verify subscription</Text>
    <Text style={s.body}>{entitlementError || 'PG Manager could not verify your subscription with the server. Access stays locked until verification succeeds.'}</Text>
    <Button size="lg" loading={entitlementLoading} onPress={() => refreshEntitlement().catch(() => null)}>Try again</Button>
    <Button variant="danger" onPress={() => navigation.navigate('DeleteAccount')}>Delete account</Button>
    <Button variant="secondary" onPress={logout}>Sign out</Button>
  </FadeIn></Screen>;
}
const s=StyleSheet.create({wrap:{flex:1,justifyContent:'center',gap:spacing.lg},icon:{width:68,height:68,borderRadius:34,backgroundColor:theme.brandWeak,alignItems:'center',justifyContent:'center'},title:{...typography.h1,color:theme.text},body:{...typography.body,color:theme.muted}});
