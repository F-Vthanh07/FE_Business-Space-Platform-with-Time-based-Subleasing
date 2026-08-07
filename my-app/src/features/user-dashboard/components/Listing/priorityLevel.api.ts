export interface PriorityLevel {
  id: number;
  price: number;
  isActive: boolean;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
}

const BASE_URL = 'https://flexi-space-capstone-project.onrender.com/api';

export const fetchPriorityLevels = async (): Promise<PriorityLevel[]> => {
  const token = localStorage.getItem('portal_token');
  const res = await fetch(`${BASE_URL}/PriorityLevel/GetAll`, {
    headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
  });

  if (!res.ok) return [];

  const data = await res.json();
  const safeData: PriorityLevel[] = Array.isArray(data) ? data : (data?.data || data?.items || []);
  return safeData.filter(p => p.isActive);
};
