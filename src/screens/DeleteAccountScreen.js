import React,{useState} from 'react';
import {Alert,StyleSheet,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useAuth} from '../context/AuthContext';
import {Button,PasswordField,Screen,Field,theme,typography,radius,spacing} from '../components/ui';

export default function DeleteAccountScreen(){
  const {api,clearSession}=useAuth();
  const [password,setPassword]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const remove=()=>Alert.alert('Permanently delete account?','This deletes your PG Manager account and associated PG data. This cannot be undone.',[
    {text:'Cancel',style:'cancel'},
    {text:'Delete permanently',style:'destructive',onPress:async()=>{setBusy(true);setError('');try{await api.delete('/auth/account',{data:{currentPassword:password,confirmation}});await clearSession();}catch(e){setError(e?.response?.data?.message||'Could not delete your account. Please try again.');}finally{setBusy(false);}}}
  ]);
  return <Screen scroll>
    <View style={s.icon}><Ionicons name="trash-outline" size={24} color={theme.danger}/></View>
    <Text style={s.title}>Delete account</Text>
    <Text style={s.body}>Permanently deletes your account and associated PG Manager data, including properties you own, rooms, tenant records and rent records. This cannot be undone.</Text>
    <View style={s.notice}><Text style={s.noticeTitle}>Before you continue</Text><Text style={s.noticeText}>Any recurring PG Manager subscription will be cancelled before deletion. Payments already processed are not automatically refunded.</Text></View>
    <PasswordField label="Current password" value={password} onChangeText={setPassword}/>
    <Field label='Type DELETE to confirm' value={confirmation} onChangeText={setConfirmation} autoCapitalize="characters"/>
    {!!error&&<Text style={s.error}>{error}</Text>}
    <Button variant="danger" disabled={!password||confirmation!=='DELETE'} loading={busy} onPress={remove}>Delete account permanently</Button>
  </Screen>;
}
const s=StyleSheet.create({icon:{width:52,height:52,borderRadius:radius.md,backgroundColor:theme.dangerWeak,alignItems:'center',justifyContent:'center'},title:{...typography.h1,color:theme.text},body:{...typography.body,color:theme.muted},notice:{gap:6,padding:spacing.lg,borderRadius:radius.md,backgroundColor:theme.dangerWeak},noticeTitle:{...typography.label,color:theme.danger},noticeText:{...typography.small,color:theme.text},error:{...typography.small,color:theme.danger}});
