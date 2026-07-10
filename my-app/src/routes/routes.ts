export type PortalRole = 'admin' | 'user';

export const ROUTES = {
  HOME: '/',
  USER: '/user',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: '/admin',
  ACCESS_DENIED: '/access-denied',
} as const;
