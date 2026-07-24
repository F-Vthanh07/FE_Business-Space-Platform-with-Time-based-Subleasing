/* eslint-disable @typescript-eslint/no-explicit-any */
const BASE_URL = 'https://flexi-space-capstone-project.onrender.com/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('portal_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'accept': '*/*'
  };
};

export interface ShareListingPayload {
  spaceId: number;
  allowedStartTime: string;
  allowedEndTime: string;
  description: string;
  price: number;
  shareSpaceDetailMaxSubRenter: number;
  shareSpaceDetailIsOwner: boolean;
  shareSpaceDetailIsLegalCommitted: boolean;
  shareSpaceDetailShareSpaceAmenities: { amenityId: number; isIncluded: boolean; price: number }[];
  shareSpaceDetailAvailabilitiesTimes: {
    daysOfWeek: string[];
    specificdate: string;
    startTime: string;
    endTime: string;
    validFrom: string;
    validTo: string;
  }[];
  shareSpaceDetailShareSpaceCategories: { bussinessCategoryId: number }[];
}

export const createShareListing = async (payload: ShareListingPayload) => {
  const res = await fetch(`${BASE_URL}/Listing/CreateShareListing`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload) // BE nhận payload phẳng, KHÔNG bọc key ngoài
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.title || errData.message || 'Lỗi tạo bài đăng chia sẻ');
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const updateShareListing = async (id: number, payload: ShareListingPayload) => {
  const res = await fetch(`${BASE_URL}/Listing/UpdateShareListing/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload) // tương tự, không bọc
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.title || errData.message || 'Lỗi cập nhật bài đăng chia sẻ');
  }

  return res.ok;
};


// --- LẤY DANH SÁCH BÀI SHARE CỦA CHÍNH MÌNH (B) ---
// TODO: verify field name — hiện đang lọc theo shareSpaceDetail tồn tại.
// Nếu backend trả field khác (vd `listingType: 'share'`), sửa lại điều kiện filter bên dưới.
export const fetchMyShareListings = async () => {
  const token = localStorage.getItem('portal_token');
  const userId = localStorage.getItem('current_user_id');

  const res = await fetch(`${BASE_URL}/Listing/GetAll`, {
    headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
  });

  if (!res.ok) return [];

  const data = await res.json();
  const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);

  return safeData.filter((l: any) =>
    (l.shareSpaceDetail || l.shareSpaceDetailMaxSubRenter !== undefined) &&
    (l.createdBy === userId || l.lesseeId === userId || l.ownerId === userId)
  );
};

// --- XÓA SHARE LISTING (dùng chung endpoint Listing/Delete vì cùng bảng Listing) ---
export const deleteShareListing = async (id: number) => {
  const token = localStorage.getItem('portal_token');
  const res = await fetch(`${BASE_URL}/Listing/Delete/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
  });
  return res.ok;
};