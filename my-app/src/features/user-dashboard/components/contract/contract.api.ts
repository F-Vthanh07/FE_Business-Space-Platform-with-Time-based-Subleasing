/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE_URL = 'https://flexi-space-capstone-project.onrender.com/api';

const authHeaders = () => {
  const token = localStorage.getItem('portal_token');
  return { Authorization: `Bearer ${token}`, accept: '*/*' };
};

const normalizeList = (data: any) => (Array.isArray(data) ? data : data?.data || data?.items || []);

export interface RentedContract {
  id: number;
  lessorId: string;
  lesseeId: string;
  spaceId: number;
  spaceName?: string;
  space?: { name?: string };
  price: number;
  status: string;
}

// Hợp đồng mình là LESSEE và đang "Active" (đã ký) — dùng param Status giống MyContractsPage.tsx
export const fetchActiveRentedContracts = async (): Promise<RentedContract[]> => {
  const userId = localStorage.getItem('current_user_id');
  const token = localStorage.getItem('portal_token');
  if (!userId || !token) return [];

  const res = await fetch(
    `${BASE_URL}/Contract/GetAll?LesseeId=${encodeURIComponent(userId)}&Status=Active`,
    { headers: authHeaders() }
  );
  if (!res.ok) return [];
  return normalizeList(await res.json());
};

// Cùng logic fallback với spaceNameOf() trong MyContractsPage.tsx
export const spaceNameOf = (c: RentedContract) =>
  c.spaceName || c.space?.name || `Mặt bằng #${c.spaceId}`;