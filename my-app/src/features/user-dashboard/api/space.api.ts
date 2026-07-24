/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from '../../../config/api';

const authHeaders = () => {
  const token = localStorage.getItem('portal_token');
  return { Authorization: `Bearer ${token}`, accept: '*/*' };
};

const normalizeList = (data: any) => (Array.isArray(data) ? data : data?.data || data?.items || []);

export interface SpaceApiModel {
  id: number;
  name: string;
  address: string;
  area: string;
  isActive: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  amenities?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spaceAllowedCategories?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operatingHours?: any[];
}

// Lấy toàn bộ mặt bằng của một chủ sở hữu (OwnerId)
export const fetchOwnerSpaces = async (ownerId: string): Promise<SpaceApiModel[]> => {
  const res = await fetch(`${API_BASE_URL}/api/Space/GetAll?OwnerId=${encodeURIComponent(ownerId)}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return normalizeList(data);
};

// Mặt bằng của chính mình (dùng token để BE tự suy ra owner) — dùng cho dashboard overview
export const fetchMySpaces = async (token: string): Promise<SpaceApiModel[]> => {
  const res = await fetch(`${API_BASE_URL}/api/Space/owner`, {
    headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return normalizeList(data);
};

export const deleteSpace = async (spaceId: number | string): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/Space/Delete${spaceId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
};

export interface CreateSpacePayload {
  name: string;
  address: string;
  city: string;
  area: number;
  isActive: boolean;
  latitude: number;
  longitude: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  amenities: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operatingHours: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spaceAllowedCategories: any[];
}

export const createSpace = async (payload: CreateSpacePayload): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/Space/Create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
};

export const updateSpace = async (spaceId: number | string, payload: CreateSpacePayload): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/Space/Update${spaceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ ...payload, id: spaceId }),
  });
};

// --- Danh mục tỉnh/huyện/xã (dùng khi tạo/sửa Space) ---
export const fetchProvinces = async () => {
  const res = await fetch(`${API_BASE_URL}/api/Space/GetAddress`, {
    headers: { accept: '*/*' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchDistricts = async (provinceCode: string) => {
  const res = await fetch(
    `${API_BASE_URL}/api/Space/GetAddress?provinceCode=${encodeURIComponent(provinceCode)}`,
    { headers: { accept: '*/*' } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchWards = async (provinceCode: string, districtCode: string) => {
  const res = await fetch(
    `${API_BASE_URL}/api/Space/GetAddress?provinceCode=${encodeURIComponent(provinceCode)}&districtCode=${encodeURIComponent(districtCode)}`,
    { headers: { accept: '*/*' } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};
