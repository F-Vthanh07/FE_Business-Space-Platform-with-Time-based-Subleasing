export type PortalRole = 'admin' | 'user';

export const ROUTES = {
  HOME: '/',
  USER: '/user',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  ONBOARDING: '/onboarding/profile',
  ADMIN: '/admin',
  ACCESS_DENIED: '/access-denied',
  PRICING: '/pricing',
} as const;
