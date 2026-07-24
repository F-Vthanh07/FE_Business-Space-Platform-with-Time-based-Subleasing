/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from '../../../config/api';

export const fetchBusinessCategories = async (): Promise<any[]> => {
  const res = await fetch(`${API_BASE_URL}/api/BussinessCategory/GetAll`, {
    headers: { accept: '*/*' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.items || []);
};
