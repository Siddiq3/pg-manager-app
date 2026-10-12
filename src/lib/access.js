export const STAFF_PERMISSIONS = ['tenants.view', 'tenants.manage', 'beds.view', 'beds.manage', 'rent.view', 'rent.manage', 'reports.view'];
export function can(property, permission) {
  if (!property) return false;
  if (property.role === 'STAFF') return property.permissions?.includes(permission) || false;
  return ['OWNER', 'CO_OWNER'].includes(property.role) || !property.role;
}
