/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from '../../../config/api';

const authHeaders = () => {
  const token = localStorage.getItem('portal_token');
  return { Authorization: `Bearer ${token}`, accept: '*/*' };
};

const normalizeList = (data: any) => (Array.isArray(data) ? data : data?.data || data?.items || []);

// Tạo (hoặc lấy) phòng chat giữa lessor/lessee — gọi sau khi duyệt 1 yêu cầu thuê.
export const createConversation = async (lessorId: string, lesseeId: string): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/Conversation/Create?lessorId=${lessorId}&lesseeId=${lesseeId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
};

// Lấy tên 2 bên (lessorUserName/lesseeUserName) từ danh sách hội thoại của 1 user —
// Contract GetAll không trả tên nên phải bổ sung từ đây.
export const fetchConversationsByUser = async (userId: string): Promise<any[]> => {
  const res = await fetch(`${API_BASE_URL}/api/Conversation/User/${userId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return normalizeList(data);
};
