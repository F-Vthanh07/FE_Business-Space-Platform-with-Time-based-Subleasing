export interface PriorityLevel {
  id: number;
  price: number;
  isActive: boolean;
  name: string;
  description?: string | null;
  durationInDays?: number | null;
  durationForBanner?: number | null;
  type?: 'Listing' | 'Banner' | string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
}

const normalizePriorityLevelType = (type?: string | null): 'Listing' | 'Banner' => {
  return String(type || '').toLowerCase() === 'banner' ? 'Banner' : 'Listing';
};

const BASE_URL = 'https://flexi-space-capstone-project.onrender.com/api';

export const fetchPriorityLevels = async (): Promise<PriorityLevel[]> => {
  const token = localStorage.getItem('portal_token');
  const res = await fetch(`${BASE_URL}/PriorityLevel/GetAll`, {
    headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
  });

  if (!res.ok) return [];

  const data = await res.json();
  const safeData: PriorityLevel[] = Array.isArray(data) ? data : (data?.data || data?.items || []);
  return safeData
    .map(p => ({ ...p, type: normalizePriorityLevelType(p.type) }))
    .filter(p => p.isActive && p.type === 'Listing')
    .sort((a, b) => a.id - b.id);
};

export const fetchBannerPriorityLevels = async (): Promise<PriorityLevel[]> => {
  const token = localStorage.getItem('portal_token');
  const res = await fetch(`${BASE_URL}/PriorityLevel/GetAll`, {
    headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
  });

  if (!res.ok) return [];

  const data = await res.json();
  const safeData: PriorityLevel[] = Array.isArray(data) ? data : (data?.data || data?.items || []);
  return safeData
    .map(p => ({ ...p, type: normalizePriorityLevelType(p.type) }))
    .filter(p => p.isActive && p.type === 'Banner')
    .sort((a, b) => a.id - b.id);
};
