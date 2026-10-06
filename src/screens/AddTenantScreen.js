import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Field, Notice, PageHeader, QueryState, Row, Screen, SectionTitle, Toggle } from '../components/ui';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/format';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function AddTenantScreen({ navigation, route }) {
  const toast = useToast();
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const { propertyId } = route.params;
  const [form, setForm] = useState({
    name: '',
    phone: '',
    rentAmount: '',
    depositAmount: '',
    joinedDate: new Date().toISOString().slice(0, 10),
    idProofUrl: '', noticeGivenDate: '', expectedVacateDate: '', depositPaid: false,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);

  const beds = useQuery({
    queryKey: ['vacantBeds', propertyId],
    queryFn: async () => (await api.get('/beds', { params: { propertyId, status: 'VACANT' } })).data.data,
  });

  const set = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  /** Catch the obvious mistakes here so the server round-trip is only for real conflicts. */
  function validate() {
    const found = {};
    if (form.name.trim().length < 2) found.name = 'Enter the tenant name.';
    if (form.phone.replace(/\D/g, '').length < 10) found.phone = 'Enter a valid mobile number.';
    if (!(Number(form.rentAmount) > 0)) found.rentAmount = 'Enter the monthly rent.';
    if (form.depositAmount && Number.isNaN(Number(form.depositAmount))) found.depositAmount = 'Deposit must be a number.';
    if (!DATE_PATTERN.test(form.joinedDate) || Number.isNaN(new Date(form.joinedDate).getTime())) {
      found.joinedDate = 'Use the format YYYY-MM-DD.';
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  async function submit() {
    if (!selectedBed) {
      Alert.alert('Choose a bed', 'Select a vacant bed before adding the tenant.');
      return;
    }
    if (!validate() || saving) return;

    try {
      setSaving(true);
      await api.post('/tenants', {
        propertyId,
        roomId: selectedBed.roomId?._id || selectedBed.roomId,
        bedId: selectedBed._id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        rentAmount: Number(form.rentAmount),
        depositAmount: Number(form.depositAmount || 0),
        joinedDate: new Date(form.joinedDate).toISOString(),
        idProofUrl: form.idProofUrl.trim(),
        noticeGivenDate: form.noticeGivenDate ? new Date(form.noticeGivenDate).toISOString() : undefined,
        expectedVacateDate: form.expectedVacateDate ? new Date(form.expectedVacateDate).toISOString() : undefined,
        depositPaid: form.depositPaid,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard', propertyId] }),
        queryClient.invalidateQueries({ queryKey: ['beds', propertyId] }),
        queryClient.invalidateQueries({ queryKey: ['vacantBeds', propertyId] }),
        queryClient.invalidateQueries({ queryKey: ['rentCycles', propertyId] }),
        queryClient.invalidateQueries({ queryKey: ['tenants', propertyId] }),
      ]);
      navigation.popToTop();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <PageHeader eyebrow="New tenant" title="Add a tenant" subtitle="Pick a vacant bed, then fill in their details." />

      <SectionTitle>Pick a vacant bed</SectionTitle>
      <QueryState query={beds} empty="No vacant beds. Add a room and beds first.">
        {(beds.data || []).map((bed) => (
          <Row
            key={bed._id}
            icon={selectedBed?._id === bed._id ? 'checkmark-circle' : 'bed-outline'}
            title={`Bed ${bed.bedLabel}`}
            subtitle={`Room ${bed.roomId?.roomNumber || '-'}`}
            right={selectedBed?._id === bed._id ? 'Selected' : 'Pick'}
            chevron={false}
            onPress={() => setSelectedBed(bed)}
          />
        ))}
      </QueryState>

      <SectionTitle>Tenant details</SectionTitle>
      <Field label="Name" placeholder="Enter tenant's name" value={form.name} onChangeText={set('name')} error={errors.name} autoCapitalize="words" />
      <Field label="Mobile number" placeholder="Enter tenant's mobile number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={errors.phone} />
      <Field label="Monthly rent" placeholder="Enter monthly rent" value={form.rentAmount} onChangeText={set('rentAmount')} keyboardType="numeric" error={errors.rentAmount} />
      <Field label="Deposit amount" placeholder="Enter deposit amount" value={form.depositAmount} onChangeText={set('depositAmount')} keyboardType="numeric" error={errors.depositAmount} />
      <Field label="Joined date" placeholder="Enter date (YYYY-MM-DD)" value={form.joinedDate} onChangeText={set('joinedDate')} error={errors.joinedDate} />

      <Field label="ID proof URL (optional)" placeholder="Enter ID proof link" value={form.idProofUrl} onChangeText={set('idProofUrl')} keyboardType="url" />
      <Field label="Notice given date (optional)" placeholder="Enter date (YYYY-MM-DD)" value={form.noticeGivenDate} onChangeText={set('noticeGivenDate')} />
      <Field label="Expected vacate date (optional)" placeholder="Enter date (YYYY-MM-DD)" value={form.expectedVacateDate} onChangeText={set('expectedVacateDate')} />
      <Toggle label="Deposit paid" hint="Turn on if the tenant has paid the deposit." value={form.depositPaid} onChange={(v) => setForm((p) => ({ ...p, depositPaid: v }))} />

      {!selectedBed && <Notice tone="muted" icon="information-circle-outline" message="Select a bed above to continue." />}
      <Button size="lg" onPress={submit} loading={saving} disabled={!selectedBed}>Add tenant</Button>
    </Screen>
  );
}
