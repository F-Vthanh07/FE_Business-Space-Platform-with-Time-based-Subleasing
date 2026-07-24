/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from '../../../config/api';

const authHeaders = () => {
  const token = localStorage.getItem('portal_token');
  return { Authorization: `Bearer ${token}`, accept: '*/*' };
};

const normalizeList = (data: any) => (Array.isArray(data) ? data : data?.data || data?.items || []);

// GetAll không trả sẵn field "status" trong từng item, nên phải lọc theo query status.
export const fetchBookingRequestsByStatus = async (status: string): Promise<any[]> => {
  const res = await fetch(`${API_BASE_URL}/api/PrimaryBookingRequest/GetAll?status=${status}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return normalizeList(data);
};

// Số lượng hợp đồng/booking đã xác nhận của chính mình — dùng cho dashboard overview
export const fetchMyContractsCount = async (token: string): Promise<number> => {
  const res = await fetch(`${API_BASE_URL}/api/PrimaryBookingRequest/user/my-contracts`, {
    headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return normalizeList(data).length;
};

export type BookingRequestStatus = 'Pending' | 'Negotiating' | 'Approved' | 'Rejected' | 'Canceled';

export const updateBookingRequestStatus = async (
  requestId: number | string,
  status: 'Approved' | 'Rejected'
): Promise<Response> => {
  const token = localStorage.getItem('portal_token');
  return fetch(`${API_BASE_URL}/api/PrimaryBookingRequest/Status/${requestId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
};

export interface BookingRequestUpdatePayload {
  listingId: number;
  offeredPrice: number;
  duration: number;
  durationUnit: string;
  purpose: string;
  note: string;
  expectedStartDate: string;
}

export const updateBookingRequest = async (
  requestId: number | string,
  payload: BookingRequestUpdatePayload
): Promise<Response> => {
  const token = localStorage.getItem('portal_token');
  return fetch(`${API_BASE_URL}/api/PrimaryBookingRequest/Update/${requestId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
};

export const deleteBookingRequest = async (requestId: number | string): Promise<Response> => {
  return fetch(`${API_BASE_URL}/api/PrimaryBookingRequest/Delete/${requestId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
};
