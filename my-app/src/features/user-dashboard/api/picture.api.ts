import { API_BASE_URL } from '../../../config/api';

// Upload 1 hoặc nhiều ảnh và gắn vào 1 listing đã tồn tại (dùng chung cho EntireSpace/SharedSpace)
export const uploadListingPictures = async (listingId: number | string, files: File[]): Promise<Response> => {
  const token = localStorage.getItem('portal_token');
  const formData = new FormData();
  files.forEach((file) => formData.append('file', file));
  formData.append('listingId', String(listingId));

  return fetch(`${API_BASE_URL}/api/Picture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
    body: formData,
  });
};
