import React, { useState } from 'react';
import { Alert, RefreshControl, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Field, QueryState, Row, Screen, SectionTitle, typography, theme } from '../components/ui';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { errorMessage, money } from '../lib/format';

export default function RoomDetailScreen({ navigation, route }) {
  const toast = useToast();
  const { api } = useAuth();
  const queryClient = useQueryClient();
  const { roomId, propertyId } = route.params;
  const [bedLabel, setBedLabel] = useState('');

  const room = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => (await api.get(`/rooms/${roomId}`)).data.data,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    queryClient.invalidateQueries({ queryKey: ['beds', propertyId] });
    queryClient.invalidateQueries({ queryKey: ['rooms', propertyId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const addBed = useMutation({
    mutationFn: (label) => api.post('/beds', { roomId, bedLabel: label }),
    onSuccess: () => {
      setBedLabel('');
      refreshAll();
    },
    onError: (error) => Alert.alert('Bed not added', errorMessage(error)),
  });

  const removeBed = useMutation({
    mutationFn: (bedId) => api.delete(`/beds/${bedId}`),
    onSuccess: refreshAll,
    onError: (error) => Alert.alert('Bed not deleted', errorMessage(error)),
  });

  const deleteRoom = useMutation({
    mutationFn: () => api.delete(`/rooms/${roomId}`),
    onSuccess: () => {
      refreshAll();
      navigation.goBack();
    },
    onError: (error) => Alert.alert('Room not deleted', errorMessage(error)),
  });

  const beds = room.data?.beds || [];
  const occupied = beds.filter((bed) => bed.status === 'OCCUPIED').length;

  function confirmDeleteRoom() {
    if (occupied) {
      Alert.alert('Room in use', 'Check out the tenants in this room before deleting it.');
      return;
    }
    Alert.alert('Delete room?', `Room ${room.data?.roomNumber} and its ${beds.length} bed(s) will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRoom.mutate() },
    ]);
  }

  function confirmRemoveBed(bed) {
    if (bed.status === 'OCCUPIED') {
      Alert.alert('Bed occupied', 'Check the tenant out before deleting this bed.');
      return;
    }
    Alert.alert('Delete bed?', `Bed ${bed.bedLabel} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeBed.mutate(bed._id) },
    ]);
  }

  return (
    <Screen scroll refreshControl={<RefreshControl refreshing={room.isRefetching} onRefresh={room.refetch} tintColor={theme.brand} />}>
      <Text style={{ ...typography.h2, color: theme.text }}>Room {room.data?.roomNumber || ''}</Text>
      {!!room.data && (
        <Text style={{ color: theme.muted }}>
          {[room.data.type, room.data.floor && `Floor ${room.data.floor}`, money(room.data.monthlyRent)].filter(Boolean).join(' · ')}
          {beds.length ? ` · ${occupied}/${beds.length} filled` : ''}
        </Text>
      )}

      <QueryState query={room}>
        <SectionTitle>Beds</SectionTitle>
        {beds.length === 0 ? (
          <Text style={{ color: theme.muted }}>No beds yet. Add the first one below.</Text>
        ) : (
          beds.map((bed) => (
            <Row
              key={bed._id}
              title={`Bed ${bed.bedLabel}`}
              badge={bed.status}
              right={bed.status === 'VACANT' ? 'Delete' : ''}
              onPress={() => confirmRemoveBed(bed)}
            />
          ))
        )}

        <View style={{ gap: 10, marginTop: 6 }}>
          <Field label="New bed label" value={bedLabel} onChangeText={setBedLabel} placeholder="A" autoCapitalize="characters" />
          <Button onPress={() => bedLabel.trim() && addBed.mutate(bedLabel.trim())} loading={addBed.isPending} disabled={!bedLabel.trim()}>
            Add bed
          </Button>
          <Button variant="danger" onPress={confirmDeleteRoom} loading={deleteRoom.isPending}>
            Delete room
          </Button>
        </View>
      </QueryState>
    </Screen>
  );
}
