import React, { useState } from 'react';
import { Alert, RefreshControl, Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Field, QueryState, Row, Screen, SectionTitle, typography, theme } from '../components/ui';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { errorMessage, money } from '../lib/format';

export default function RoomsScreen({ navigation, route }) {
  const toast = useToast();
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const { propertyId } = route.params;
  const [form, setForm] = useState({ roomNumber: '', type: '', monthlyRent: '' });
  const [errors, setErrors] = useState({});
  const [adding, setAdding] = useState(false);

  const rooms = useQuery({
    queryKey: ['rooms', propertyId],
    queryFn: async () => (await api.get('/rooms', { params: { propertyId } })).data.data,
  });

  const beds = useQuery({
    queryKey: ['beds', propertyId],
    queryFn: async () => (await api.get('/beds', { params: { propertyId } })).data.data,
  });

  const addRoom = useMutation({
    mutationFn: (body) => api.post('/rooms', body),
    onSuccess: ({ data }) => {
      setForm({ roomNumber: '', type: '', monthlyRent: '' });
      queryClient.setQueryData(['rooms', propertyId], (current = []) => [
        ...current.filter((room) => room._id !== data.data._id),
        data.data,
      ]);
      toast.success('Room added.');
      setAdding(false);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const set = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  function submit() {
    if (!form.roomNumber.trim()) {
      setErrors({ roomNumber: 'Enter a room number.' });
      return;
    }
    if (form.monthlyRent && Number.isNaN(Number(form.monthlyRent))) {
      setErrors({ monthlyRent: 'Rent must be a number.' });
      return;
    }
    addRoom.mutate({
      propertyId,
      roomNumber: form.roomNumber.trim(),
      type: form.type.trim() || undefined,
      monthlyRent: form.monthlyRent ? Number(form.monthlyRent) : undefined,
    });
  }

  const bedsOf = (roomId) => (beds.data || []).filter((bed) => (bed.roomId?._id || bed.roomId) === roomId);
  const refreshing = rooms.isRefetching || beds.isRefetching;

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            rooms.refetch();
            beds.refetch();
          }}
          tintColor={theme.brand}
        />
      }
    >
      <Text style={{ ...typography.h1, color: theme.text }}>Rooms</Text>

      <SectionTitle action={<Button variant="tertiary" onPress={() => setAdding(true)}>Add room</Button>}>{`${(rooms.data || []).length} rooms`}</SectionTitle>
      <QueryState query={rooms} empty="No rooms yet. Add your first room above.">
        {(rooms.data || []).map((room) => {
          const roomBeds = bedsOf(room._id);
          const occupied = roomBeds.filter((bed) => bed.status === 'OCCUPIED').length;
          return (
            <Row
              key={room._id}
              title={`Room ${room.roomNumber}`}
              subtitle={[room.type, money(room.monthlyRent)].filter(Boolean).join(' · ')}
              badge={roomBeds.length ? `${occupied}/${roomBeds.length} filled` : 'No beds'}
              right="Open"
              onPress={() => navigation.navigate('RoomDetail', { roomId: room._id, propertyId })}
            />
          );
        })}
      </QueryState>

      {!!(rooms.data || []).length && (
        <View>
          <Text style={{ color: theme.muted, fontSize: 12 }}>Open a room to add or remove its beds.</Text>
        </View>
      )}
      <Sheet visible={adding} onClose={() => setAdding(false)} title="Add a room">
        <Field label="Room number" value={form.roomNumber} onChangeText={set('roomNumber')} error={errors.roomNumber} />
        <Field label="Type (optional)" value={form.type} onChangeText={set('type')} placeholder="Double sharing" autoCapitalize="sentences" />
        <Field label="Monthly rent (optional)" value={form.monthlyRent} onChangeText={set('monthlyRent')} keyboardType="numeric" error={errors.monthlyRent} />
        <Button onPress={submit} loading={addRoom.isPending}>Add room</Button>
      </Sheet>
    </Screen>
  );
}
