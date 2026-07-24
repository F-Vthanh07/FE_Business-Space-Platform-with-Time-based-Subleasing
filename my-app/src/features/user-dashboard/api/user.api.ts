import { API_BASE_URL } from '../../../config/api';

export interface BasicUserInfo {
  userId: string;
  userName: string;
  phoneNumber: string | null;
  email: string;
  profileFullName: string | null;
}

// Lấy thông tin cơ bản (tên/sđt/email) của 1 user khác — dùng để hiển thị thông tin
// người thuê (lessee) trong trang Tenants. KHÔNG dùng chung với fetchUserProfile của
// feature auth vì hàm đó ghi đè localStorage của phiên đăng nhập hiện tại.
export const fetchUserById = async (userId: string): Promise<BasicUserInfo | null> => {
  const token = localStorage.getItem('portal_token');
  try {
    const res = await fetch(`${API_BASE_URL}/api/User/${userId}`, {
      headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};
