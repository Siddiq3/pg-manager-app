import React, { useState } from 'react';
import { RefreshControl, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sheet } from '../components/Sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Field, PageHeader, QueryState, Row, Screen, typography, theme } from '../components/ui';
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
    onSuccess: () => {
      setForm({ roomNumber: '', type: '', monthlyRent: '' });
      queryClient.invalidateQueries({ queryKey: ['rooms', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
      <PageHeader
        eyebrow="Rooms & vacancy"
        title="Rooms"
        subtitle={rooms.data ? `${rooms.data.length} room${rooms.data.length === 1 ? '' : 's'} · ${(beds.data || []).length} beds` : undefined}
        right={<Button size="sm" variant="ghost" icon={<Ionicons name="add" size={18} color={theme.primaryText} />} onPress={() => setAdding(true)}>Add</Button>}
      />
      <QueryState query={rooms} empty="No rooms yet. Add your first room above.">
        {(rooms.data || []).map((room) => {
          const roomBeds = bedsOf(room._id);
          const occupied = roomBeds.filter((bed) => bed.status === 'OCCUPIED').length;
          return (
            <Row
              key={room._id}
              icon="bed-outline"
              title={`Room ${room.roomNumber}`}
              subtitle={[room.type, money(room.monthlyRent)].filter(Boolean).join(' · ')}
              badge={roomBeds.length ? `${occupied}/${roomBeds.length} filled` : 'No beds'}
              onPress={() => navigation.navigate('RoomDetail', { roomId: room._id, propertyId })}
            />
          );
        })}
      </QueryState>

      {!!(rooms.data || []).length && (
        <Text style={{ ...typography.caption, color: theme.textMuted, textAlign: 'center' }}>Open a room to add or remove its beds.</Text>
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
