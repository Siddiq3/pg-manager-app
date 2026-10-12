import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { can } from '../lib/access';
import { QueryState, Screen, StateView } from './ui';
export function usePropertyAccess(propertyId) {
  const { api, activePropertyId } = useAuth();
  const query = useQuery({ queryKey: ['properties'], queryFn: async () => (await api.get('/properties')).data.data, staleTime: 0 });
  const property = query.data?.find((p) => p._id === (propertyId || activePropertyId));
  return { property, query, can: (permission) => can(property, permission) };
}
export function guarded(Component, permission) {
  return function AccessScreen(props) {
    const access = usePropertyAccess(props.route?.params?.propertyId);
    if (!access.property || !(Array.isArray(permission) ? permission.every(access.can) : access.can(permission))) return <Screen><QueryState query={access.query}><StateView icon="lock-closed-outline" title="Access restricted" message="Ask the property owner to update your permissions." /></QueryState></Screen>;
    return <Component {...props} />;
  };
}
