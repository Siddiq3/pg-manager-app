import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Screen, theme, typography, radius, spacing } from '../components/ui';

export default function AccountScreen({ navigation }) {
  const { user, logout, activePropertyId, entitlement } = useAuth();
  const confirmLogout = () => Alert.alert('Sign out?', 'You will need to sign in again to manage your PG.', [
    { text: 'Stay', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: logout },
  ]);
  return <Screen scroll>
    <Text style={styles.title}>Account</Text>
    <View style={styles.profile}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{(user?.name || 'P').slice(0,1).toUpperCase()}</Text></View>
      <View style={{flex:1}}><Text style={styles.name}>{user?.name || 'PG owner'}</Text><Text style={styles.caption}>{user?.email}</Text></View>
    </View>
    {entitlement?.status === 'TRIAL' && <View style={styles.trial}><Ionicons name="time-outline" size={20} color={theme.brand}/><View style={{flex:1}}><Text style={styles.name}>Free trial</Text><Text style={styles.caption}>{entitlement.daysRemaining} day{entitlement.daysRemaining===1?'':'s'} remaining</Text></View></View>}
    <Group title="YOU">
      <Item icon="person-outline" label="Profile" value={user?.phone} onPress={() => navigation.navigate('Profile')} />
      {!user?.emailVerified && <Item icon="mail-unread-outline" label="Verify email" value="Recommended" onPress={() => navigation.navigate('EmailVerification')} />
      {activePropertyId && <Item icon="business-outline" label="Property settings" onPress={() => navigation.navigate('PropertySettings',{propertyId:activePropertyId})} />}
      <Item icon="lock-closed-outline" label="Password & devices" onPress={() => navigation.navigate('Security')} last />
    </Group>
    <Group title="SUPPORT">
      <Item icon="help-circle-outline" label="Help centre" onPress={() => navigation.navigate('Help')} />
      <Item icon="chatbubble-ellipses-outline" label="Contact support" onPress={() => navigation.navigate('Support')} />
      <Item icon="document-text-outline" label="Terms of service" onPress={() => navigation.navigate('Legal', { type: 'terms' })} />
      <Item icon="shield-outline" label="Privacy policy" onPress={() => navigation.navigate('Legal', { type: 'privacy' })} last />
    </Group>
    <Pressable onPress={confirmLogout} style={styles.logout}><Ionicons name="log-out-outline" size={18} color={theme.danger}/><Text style={styles.logoutText}>Sign out</Text></Pressable>
    <Text style={styles.version}>PG Manager · v0.1.0</Text>
  </Screen>;
}
function Group({title,children}){return <View style={styles.group}><Text style={styles.groupTitle}>{title}</Text><View style={styles.card}>{children}</View></View>}
function Item({icon,label,value,onPress,last}){return <><Pressable onPress={onPress} style={({pressed})=>[styles.item,pressed&&{opacity:.65}]}><Ionicons name={icon} size={19} color={theme.textSecondary}/><Text style={styles.itemLabel}>{label}</Text>{value?<Text style={styles.value} numberOfLines={1}>{value}</Text>:null}<Ionicons name="chevron-forward" size={17} color={theme.textDisabled}/></Pressable>{last?null:<View style={styles.divider}/>}</>}
const styles=StyleSheet.create({title:{...typography.display,color:theme.text,fontSize:28},profile:{flexDirection:'row',alignItems:'center',gap:16,backgroundColor:theme.surface,padding:16,borderRadius:radius.lg,borderWidth:1,borderColor:theme.border},avatar:{width:52,height:52,borderRadius:16,backgroundColor:theme.brandWeak,alignItems:'center',justifyContent:'center'},avatarText:{fontSize:20,fontWeight:'700',color:theme.brand},name:{...typography.body,color:theme.text,fontWeight:'700'},caption:{...typography.caption,color:theme.muted,marginTop:2},group:{gap:8,marginTop:8},groupTitle:{...typography.caption,color:theme.muted,letterSpacing:.8},card:{backgroundColor:theme.surface,borderRadius:radius.lg,borderWidth:1,borderColor:theme.border,overflow:'hidden'},item:{minHeight:56,flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:16},itemLabel:{...typography.body,color:theme.text,flex:1},value:{...typography.caption,color:theme.muted,maxWidth:'35%'},divider:{height:1,backgroundColor:theme.border,marginLeft:47},logout:{minHeight:52,flexDirection:'row',gap:10,alignItems:'center',justifyContent:'center'},logoutText:{...typography.body,color:theme.danger},trial:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:theme.brandWeak,padding:14,borderRadius:radius.md},version:{...typography.caption,color:theme.textDisabled,textAlign:'center',paddingBottom:spacing.lg}});