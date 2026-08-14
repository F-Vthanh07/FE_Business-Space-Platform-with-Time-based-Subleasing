/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, FileText, Calendar, User } from 'lucide-react';
import { formatDate } from '../../../../utils/dateUtils';

export const OwnerBookingRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = localStorage.getItem('current_user_id');
  const token = localStorage.getItem('portal_token');

  // ĐÁNH DẤU CÁC ĐƠN ĐÃ FETCH LÀ "ĐÃ XEM" ĐỂ HEADER TẮT BADGE ĐỎ
  const markRequestsAsSeen = (ids: (string | number)[]) => {
    try {
      const raw = localStorage.getItem('seen_booking_request_ids');
      const seen = new Set<string | number>(raw ? JSON.parse(raw) : []);
      ids.forEach((id) => seen.add(id));
      localStorage.setItem('seen_booking_request_ids', JSON.stringify(Array.from(seen)));
      window.dispatchEvent(new CustomEvent('booking-request-seen'));
    } catch (e) {
      console.error('Lỗi lưu trạng thái đã xem:', e);
    }
  };

  // 1. LẤY DANH SÁCH YÊU CẦU THUÊ TỪ API
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/PrimaryBookingRequest/GetAll?status=Pending', {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });
      if (res.ok) {
        const data = await res.json();
        const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);

        const myRequests = safeData.filter((req: any) => req.lessorId === currentUserId);
        setRequests(myRequests);

        // Đánh dấu tất cả các đơn vừa load là "đã xem" -> Header sẽ tắt badge đỏ
        markRequestsAsSeen(myRequests.map((r: any) => r.id || r.Id));
      }
    } catch (error) {
      console.error("Lỗi tải danh sách yêu cầu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. XỬ LÝ DUYỆT / TỪ CHỐI VÀ TẠO CHAT
  const handleUpdateStatus = async (requestId: number, newStatus: 'Approved' | 'Rejected', lesseeId: string) => {
    if (!window.confirm(`Bạn có chắc muốn ${newStatus === 'Approved' ? 'DUYỆT' : 'TỪ CHỐI'} yêu cầu này?`)) return;

    try {
      // SỬA FIX LỖI JSON BỊ 400 BAD REQUEST CHỖ NÀY RỒI NHA
      const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/PrimaryBookingRequest/Status/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }) 
      });

      if (!res.ok) {
        alert("Lỗi khi cập nhật trạng thái đơn!");
        return;
      }

      if (newStatus === 'Approved' && lesseeId) {
        try {
          const convRes = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Conversation/Create?lessorId=${currentUserId}&lesseeId=${lesseeId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'accept': '*/*'
            }
          });

          if (convRes.ok) {
            // Đọc luôn data phòng chat vừa tạo (BE trả về object chứa id/lessorId/lesseeId...)
            const newConversation = await convRes.json().catch(() => null);

            // BẮN SỰ KIỆN RA TOÀN APP: báo cho FloatingChat (đang mount sẵn ở layout ngoài)
            // biết vừa có phòng chat mới, để nó tự fetch lại danh sách + tự Join phòng qua
            // SignalR ngay lập tức, KHÔNG cần người dùng load lại trang.
            // Đây chỉ giải quyết được cho TAB CỦA CHỦ NHÀ (người vừa bấm duyệt) - vì sự kiện
            // window này chỉ chạy trong đúng trình duyệt đang thao tác. Để bên Khách thuê (lessee)
            // cũng tự thấy phòng chat xuất hiện ngay mà không cần F5, cần Backend bắn thêm 1
            // sự kiện SignalR (vd "ReceiveNewConversation") tới đúng userId của lessee.
            window.dispatchEvent(new CustomEvent('conversation-created', {
              detail: newConversation || { lessorId: currentUserId, lesseeId }
            }));
          }

          alert("🎉 Đã duyệt đơn và tạo phòng chat thành công! Khách thuê giờ đã có thể nhắn tin cho bạn.");
        } catch (chatErr) {
          console.error("Lỗi tạo phòng chat:", chatErr);
          alert("Đã duyệt đơn nhưng không thể tạo phòng chat tự động.");
        }
      } else {
        alert("Đã từ chối yêu cầu thuê!");
      }

      fetchRequests();

    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert("Lỗi kết nối máy chủ!");
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          {/* Lược bỏ màu cứng, xài class mặc định của dự án */}
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 'bold' }}>Yêu cầu chờ duyệt</h1>
          <p className="page-subtitle text-secondary">Quản lý các yêu cầu thuê mặt bằng từ khách hàng</p>
        </div>
      </div>

      {/* Dùng mỗi class glass-card, gỡ bỏ background-color white */}
      <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>Đang tải danh sách...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
            <FileText size={48} style={{ margin: '0 auto 16px auto' }} />
            <p>Hiện không có yêu cầu thuê nào đang chờ duyệt.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(128, 128, 128, 0.2)', opacity: 0.7, fontSize: '13px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px 12px' }}>Mã tin</th>
                  <th style={{ padding: '16px 12px' }}>Khách đề xuất</th>
                  <th style={{ padding: '16px 12px' }}>Thời gian thuê</th>
                  <th style={{ padding: '16px 12px' }}>Mục đích</th>
                  <th style={{ padding: '16px 12px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id || req.Id} style={{ borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>
                    
                    {/* MÃ TIN */}
                    <td style={{ padding: '16px 12px', fontWeight: 500 }}>
                      #{req.listingId}
                    </td>
                    
                    {/* KHÁCH ĐỀ XUẤT */}
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} /> {req.lesseeName || 'Khách vãng lai'}
                      </div>
                      <div style={{ color: '#4ADE80', fontSize: '15px', fontWeight: 'bold', marginTop: '4px' }}>
                        {req.offeredPrice ? `${req.offeredPrice.toLocaleString('vi-VN')} ₫` : 'Thỏa thuận'}
                      </div>
                    </td>
                    
                    {/* THỜI GIAN THUÊ */}
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '4px' }}>
                        <Calendar size={14} style={{ opacity: 0.7 }}/> 
                        {formatDate(req.expectedStartDate, 'vi-VN', 'N/A')}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        Thời lượng: {req.duration} {req.durationUnit || 'kỳ'}
                      </div>
                    </td>

                    {/* MỤC ĐÍCH */}
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ fontSize: '14px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.purpose}>
                        {req.purpose || 'Không rõ'}
                      </div>
                      {req.note && <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>Có ghi chú: {req.note}</div>}
                    </td>
                    
                    {/* THAO TÁC */}
                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleUpdateStatus(req.id || req.Id, 'Rejected', req.lesseeId)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          <XCircle size={16} /> Từ chối
                        </button>
                        
                        <button 
                          onClick={() => handleUpdateStatus(req.id || req.Id, 'Approved', req.lesseeId)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#16A34A', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          <CheckCircle2 size={16} /> Duyệt đơn
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};