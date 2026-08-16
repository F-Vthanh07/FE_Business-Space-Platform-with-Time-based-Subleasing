import { API_BASE_URL } from '../../../../config/api';

export interface CreateUserBannerPayload {
  title: string;
  description: string;
  listingId: number;
}

const parseErrorResponse = async (res: Response, fallback: string): Promise<string> => {
  const rawText = await res.text().catch(() => '');
  if (!rawText) return fallback;

  try {
    const data = JSON.parse(rawText);
    return data.detail || data.message || data.title || rawText;
  } catch {
    return rawText;
  }
};

export const createUserBanner = async (
  payload: CreateUserBannerPayload,
  durationInDays: number,
  price: number
) => {
  const token = localStorage.getItem('portal_token');
  const params = new URLSearchParams({
    durationInDays: String(durationInDays),
    price: String(price)
  });

  const res = await fetch(`${API_BASE_URL}/api/Banner/CreateForUser?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'accept': '*/*'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, 'Lỗi tạo banner cho bài đăng'));
  }

  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const uploadUserBannerPictures = async (bannerId: number, files: File[]) => {
  const token = localStorage.getItem('portal_token');
  const formData = new FormData();
  files.forEach(file => formData.append('file', file));
  formData.append('bannerId', String(bannerId));

  const res = await fetch(`${API_BASE_URL}/api/Picture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'accept': '*/*'
    },
    body: formData
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res, 'Lỗi upload ảnh banner'));
  }
};

