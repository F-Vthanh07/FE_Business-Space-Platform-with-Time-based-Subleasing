/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from '../../../config/api';

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
    `${API_BASE_URL}/api/Contract/GetAll?LesseeId=${encodeURIComponent(userId)}&Status=Active`,
    { headers: authHeaders() }
  );
  if (!res.ok) return [];
  return normalizeList(await res.json());
};

// Cùng logic fallback với spaceNameOf() trong MyContractsPage.tsx
export const spaceNameOf = (c: RentedContract) =>
  c.spaceName || c.space?.name || `Mặt bằng #${c.spaceId}`;

// Tất cả hợp đồng mà mình là Lessor (chủ mặt bằng) — dùng cho trang "Tenants".
export const fetchLessorContracts = async (lessorId: string): Promise<any[]> => {
  const res = await fetch(`${API_BASE_URL}/api/Contract/GetAll?LessorId=${encodeURIComponent(lessorId)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  return normalizeList(await res.json());
};

// Gọi 2 lần vì 1 user có thể vừa là Lessor vừa là Lessee tuỳ hợp đồng — API GetAll chỉ lọc
// theo đúng 1 role trong 1 lần gọi. status = null nghĩa là không lọc theo Status (tab "Tất cả").
export const fetchMyContractsAsEitherParty = async (userId: string, status: string | null): Promise<any[]> => {
  const statusQuery = status ? `&Status=${status}` : '';
  const [asLessorRes, asLesseeRes] = await Promise.all([
    fetch(`${API_BASE_URL}/api/Contract/GetAll?LessorId=${userId}${statusQuery}`, { headers: authHeaders() }),
    fetch(`${API_BASE_URL}/api/Contract/GetAll?LesseeId=${userId}${statusQuery}`, { headers: authHeaders() }),
  ]);

  const asLessor = asLessorRes.ok ? normalizeList(await asLessorRes.json()) : [];
  const asLessee = asLesseeRes.ok ? normalizeList(await asLesseeRes.json()) : [];

  const map = new Map<string, any>();
  [...asLessor, ...asLessee].forEach((c) => map.set(String(c.id ?? c.Id), c));

  return Array.from(map.values()).sort((a, b) => {
    const idA = Number(a.id ?? a.Id ?? 0);
    const idB = Number(b.id ?? b.Id ?? 0);
    return idB - idA;
  });
};

export const deleteContract = async (contractId: string | number): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/Contract/Delete/${contractId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
};
