import { API_BASE_URL } from '../../../config/api';
import type { UpdateProfileRequest } from '../types';

export const updateProfile = async (
  body: UpdateProfileRequest,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/Profile`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      accept: '*/*',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Không thể cập nhật hồ sơ. Vui lòng thử lại.');
  }
};
