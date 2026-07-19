import { useEffect, useState, useCallback } from 'react';
import { fetchOwnProfile } from '../api/identityVerification.api';
import type { ProfileResponse } from '../api/identityVerification.api';

// Module-level cache so every component using this hook on the same page
// shares one fetch instead of firing a GET /api/Profile/me each.
let cachedProfile: ProfileResponse | null | undefined = undefined;
let inFlight: Promise<ProfileResponse | null> | null = null;
const listeners = new Set<(profile: ProfileResponse | null) => void>();

const loadProfile = (): Promise<ProfileResponse | null> => {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const token = localStorage.getItem('portal_token') || '';
    const profile = await fetchOwnProfile(token);
    cachedProfile = profile;
    listeners.forEach((listener) => listener(profile));
    inFlight = null;
    return profile;
  })();

  return inFlight;
};

export const invalidateIdentityVerification = (): Promise<ProfileResponse | null> => {
  cachedProfile = undefined;
  inFlight = null;
  return loadProfile();
};

export const useIdentityVerification = () => {
  const [profile, setProfile] = useState<ProfileResponse | null>(cachedProfile ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(cachedProfile === undefined);

  useEffect(() => {
    listeners.add(setProfile);

    if (cachedProfile === undefined) {
      loadProfile().finally(() => setIsLoading(false));
    }

    return () => {
      listeners.delete(setProfile);
    };
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await invalidateIdentityVerification();
    setIsLoading(false);
  }, []);

  return { isVerified: profile?.isVerified ?? false, profile, isLoading, refetch };
};
