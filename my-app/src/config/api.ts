// Central place for the backend base URL. All feature `api/*.ts` files and
// components must import API_BASE_URL from here instead of hardcoding a host,
// so switching between local dev and the deployed backend only touches .env.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://flexi-space-capstone-project.onrender.com').replace(/\/$/, '');
//redeploy
//redeploy
//redeploy