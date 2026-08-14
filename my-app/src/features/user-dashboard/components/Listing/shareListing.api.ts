import type { ShareListingPayload } from '../../types';

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

// --- Helper dùng chung: đọc response lỗi từ backend (kể cả ValidationProblemDetails của .NET) ---
const parseErrorResponse = async (res: Response, fallback: string): Promise<string> => {
  const rawText = await res.text().catch(() => '');

  if (!rawText) return fallback;

  // Thử parse JSON trước
  try {
    const errData = JSON.parse(rawText);

    // .NET ValidationProblemDetails: { title, errors: { FieldName: ["msg1", "msg2"] } }
    if (errData.errors && typeof errData.errors === 'object') {
      const fieldMessages = Object.values(errData.errors)
        .flat()
        .filter(Boolean) as string[];
      if (fieldMessages.length > 0) {
        return fieldMessages.join(' | ');
      }
    }

    return errData.detail || errData.message || errData.title || rawText;
  } catch {
    // Không phải JSON -> backend trả plain text, dùng luôn nội dung này
    return rawText;
  }
};

export const createShareListing = async (payload: ShareListingPayload, amount: number, durationInDays: number) => {
  const params = new URLSearchParams({
    amount: String(amount),
    durationInDays: String(durationInDays)
  });

  const res = await fetch(`${BASE_URL}/Listing/CreateShareListing?${params.toString()}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, 'Lỗi tạo bài đăng chia sẻ'));
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
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, 'Lỗi cập nhật bài đăng chia sẻ'));
  }

  return true;
};

// --- LẤY DANH SÁCH BÀI SHARE CỦA CHÍNH MÌNH (B) ---
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

export const deleteShareListing = async (id: number) => {
  const token = localStorage.getItem('portal_token');
  const res = await fetch(`${BASE_URL}/Listing/Delete/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
  });
  return res.ok;
};
