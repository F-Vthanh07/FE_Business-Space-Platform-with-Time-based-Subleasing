import { useEffect, useState } from 'react';
import { fetchBookingRequestsByStatus } from '../api/bookingRequest.api';

const getSeenBookingIds = (): Set<string | number> => {
  try {
    const raw = localStorage.getItem('seen_booking_request_ids');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

// Số đơn "chờ duyệt" (yêu cầu thuê) mà mình là lessor và chưa xem — dùng để hiện badge đỏ
// trên sidebar. Tự poll mỗi 15s và tự cập nhật ngay khi có sự kiện 'booking-request-seen'.
export const usePendingBookingCount = (): number => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const role = localStorage.getItem('portal_role');
    const currentUserId = localStorage.getItem('current_user_id');
    if (role !== 'user' || !currentUserId) return;

    const check = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requests = await fetchBookingRequestsByStatus('Pending');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const myRequests = requests.filter((req: any) => req.lessorId === currentUserId);

      const seenIds = getSeenBookingIds();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unseen = myRequests.filter((r: any) => !seenIds.has(r.id ?? r.Id));
      setPendingCount(unseen.length);
    };

    check();
    const interval = setInterval(check, 15000);

    const handleSeen = () => check();
    window.addEventListener('booking-request-seen', handleSeen);

    return () => {
      clearInterval(interval);
      window.removeEventListener('booking-request-seen', handleSeen);
    };
  }, []);

  return pendingCount;
};
