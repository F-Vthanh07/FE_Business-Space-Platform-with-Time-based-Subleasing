import { API_BASE_URL } from '../../../config/api';
import type { CccdQrData } from '../types';

export interface VerifyIdentityRequest {
  citizenIDNumber: string;
  identityCardNumber: string;
  fullName: string;
  gender: 'Male' | 'Female';
  dob: string; // yyyy-MM-dd
  permanentResidence: string;
  dateOfIssue: string; // yyyy-MM-dd
}

export interface ProfileResponse {
  userId: string;
  citizenIDNumber: string | null;
  identityCardNumber: string | null;
  fullName: string | null;
  gender: string;
  dob: string;
  permanentResidence: string | null;
  dateOfIssue: string;
  isVerified: boolean;
  avatarUrl: string | null;
  bio: string | null;
  socialLink: string | null;
}

export const fetchOwnProfile = async (token: string): Promise<ProfileResponse | null> => {
  if (!token) return null;

  const response = await fetch(`${API_BASE_URL}/api/Profile/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: '*/*',
    },
  });

  if (!response.ok) return null;

  return response.json();
};

const normalizeGender = (rawGender: string): 'Male' | 'Female' => {
  const normalized = rawGender.trim().toLowerCase();
  if (normalized === 'nam' || normalized === 'male') return 'Male';
  return 'Female';
};

export const toVerifyIdentityRequest = (data: CccdQrData): VerifyIdentityRequest => ({
  citizenIDNumber: data.idNumber,
  identityCardNumber: data.idNumber,
  fullName: data.fullName,
  gender: normalizeGender(data.gender),
  dob: data.dateOfBirthIso,
  permanentResidence: data.permanentAddress,
  dateOfIssue: data.issueDateIso,
});

export const verifyIdentity = async (
  userId: string,
  data: CccdQrData,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/Profile/${userId}/verify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    },
    body: JSON.stringify(toVerifyIdentityRequest(data)),
  });

  if (!response.ok) {
    throw new Error('Không thể xác thực định danh. Vui lòng thử lại.');
  }
};
