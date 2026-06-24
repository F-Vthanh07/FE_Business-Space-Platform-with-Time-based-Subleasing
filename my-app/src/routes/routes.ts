export type PortalRole = 'owner' | 'renter' | 'admin';

export const ROUTES = {
  HOME: '/',
  OWNER: '/owner',
  RENTER: '/renter',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: '/admin',
  ACCESS_DENIED: '/access-denied',
} as const;
