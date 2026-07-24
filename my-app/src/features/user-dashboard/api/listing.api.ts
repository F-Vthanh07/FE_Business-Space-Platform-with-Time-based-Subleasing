/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from '../../../config/api';

const authHeaders = () => {
  const token = localStorage.getItem('portal_token');
  return { Authorization: `Bearer ${token}`, accept: '*/*' };
};

const normalizeList = (data: any) => (Array.isArray(data) ? data : data?.data || data?.items || []);

// Lấy toàn bộ bài đăng trên hệ thống (FE tự lọc theo mặt bằng của mình sau đó)
export const fetchAllListings = async (): Promise<any[]> => {
  const res = await fetch(`${API_BASE_URL}/api/Listing/GetAll`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return normalizeList(data);
};

// Bài đăng của chính mình (dùng token để BE tự suy ra owner) — dùng cho dashboard overview
export const fetchMyListings = async (token: string): Promise<any[]> => {
  const res = await fetch(`${API_BASE_URL}/api/Listing/mine`, {
    headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return normalizeList(data);
};

export const deleteListing = async (listingId: number | string): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/Listing/Delete/${listingId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
};

export interface EntireSpaceListingPayload {
  spaceId: number;
  allowedStartTime: string;
  allowedEndTime: string;
  description: string;
  price: number;
  listingPictures: string[];
}

export const createListing = async (payload: EntireSpaceListingPayload): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/Listing/Create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
};

export const updateListing = async (listingId: number | string, payload: EntireSpaceListingPayload): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/Listing/Update/${listingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ ...payload, id: listingId }),
  });
};
