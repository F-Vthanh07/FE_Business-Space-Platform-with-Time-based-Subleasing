/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, FileText, Calendar, User, Eye, X, MapPin, Building2 } from 'lucide-react';
import { formatDate } from '../../../../utils/dateUtils';
import { getListingPictureUrl } from '../../../shared/listingPictures';
import { fetchSpacesById, getListingAddress } from '../../../shared/listingAddress';
import '../../../shared/ModalShell.css';

export const OwnerBookingRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<any[]>([]);
  const [listingsById, setListingsById] = useState<Record<number, any>>({});
  const [spacesById, setSpacesById] = useState<Record<number, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);

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

        // LẤY THÔNG TIN TIN ĐĂNG (TÊN, ẢNH, GIÁ, ĐỊA CHỈ) CHO TỪNG YÊU CẦU ĐỂ HIỂN THỊ
        const uniqueListingIds = Array.from(new Set(myRequests.map((r: any) => r.listingId).filter(Boolean)));
        const listingResults = await Promise.all(
          uniqueListingIds.map(async (listingId) => {
            try {
              const listingRes = await fetch(
                `https://flexi-space-capstone-project.onrender.com/api/Listing/GetById/${listingId}`,
                { headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' } }
              );
              if (!listingRes.ok) return null;
              const listingData = await listingRes.json();
              return { listingId, listing: listingData };
            } catch {
              return null;
            }
          })
        );

        const listingMap: Record<number, any> = {};
        listingResults.forEach((entry) => {
          if (entry) listingMap[entry.listingId as number] = entry.listing;
        });
        setListingsById(listingMap);

        // GHÉP ĐỊA CHỈ TỪ SPACE CHA VÌ LISTING KHÔNG TRẢ SẴN ĐỊA CHỈ
        setSpacesById(await fetchSpacesById(token));
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
                  <th style={{ padding: '16px 12px' }}>Tin đăng</th>
                  <th style={{ padding: '16px 12px' }}>Khách đề xuất</th>
                  <th style={{ padding: '16px 12px' }}>Thời gian thuê</th>
                  <th style={{ padding: '16px 12px' }}>Mục đích</th>
                  <th style={{ padding: '16px 12px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const listing = listingsById[req.listingId];
                  const listingThumb = getListingPictureUrl(listing?.listingPictures?.[0]);
                  return (
                  <tr key={req.id || req.Id} style={{ borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>

                    {/* TIN ĐĂNG */}
                    <td style={{ padding: '16px 12px' }}>
                      <div
                        onClick={() => navigate(`/listing/${req.listingId}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                        title="Xem bài đăng"
                      >
                        <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'rgba(128,128,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {listingThumb ? (
                            <img src={listingThumb} alt={listing?.name || 'Tin đăng'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Building2 size={18} style={{ opacity: 0.5 }} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }} title={listing?.name}>
                            {listing?.name || (listing === undefined ? 'Đang tải...' : 'Tin đăng')}
                          </div>
                          <div style={{ fontSize: '12px', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                            {getListingAddress(listing, spacesById) || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </div>
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
                      {req.note && (
                        <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.note}>
                          Có ghi chú: {req.note}
                        </div>
                      )}
                    </td>

                    {/* THAO TÁC */}
                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setViewingRequest(req)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(128,128,128,0.4)', backgroundColor: 'transparent', color: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          <Eye size={16} /> Chi tiết
                        </button>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT YÊU CẦU THUÊ */}
      {viewingRequest && createPortal(
        <div className="modal-backdrop" onClick={() => setViewingRequest(null)}>
          <div className="modal-shell" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <div className="modal-title-area">
                <div className="modal-icon-wrap modal-icon-wrap--blue"><Eye size={16} /></div>
                <div>
                  <h2 className="modal-title">Chi tiết yêu cầu thuê</h2>
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={() => setViewingRequest(null)}>
                <X size={15} />
              </button>
            </div>

            <div className="modal-body">
              {(() => {
                const listing = listingsById[viewingRequest.listingId];
                const listingThumb = getListingPictureUrl(listing?.listingPictures?.[0]);
                return (
                  <>
                    <div className="form-section">
                      <h3 className="form-section-title">Thông tin tin đăng</h3>
                      <div
                        onClick={() => navigate(`/listing/${viewingRequest.listingId}`)}
                        style={{ display: 'flex', gap: '14px', cursor: 'pointer' }}
                        title="Xem bài đăng"
                      >
                        <div style={{ width: '96px', height: '96px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'rgba(128,128,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {listingThumb ? (
                            <img src={listingThumb} alt={listing?.name || 'Tin đăng'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Building2 size={28} style={{ opacity: 0.5 }} />
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '16px' }}>{listing?.name || 'Tin đăng'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>
                            <MapPin size={12} /> {getListingAddress(listing, spacesById) || 'Chưa cập nhật địa chỉ'}
                          </div>
                          <div style={{ color: '#4ADE80', fontSize: '15px', fontWeight: 'bold', marginTop: '6px' }}>
                            {listing?.price ? `${listing.price.toLocaleString('vi-VN')} ₫` : 'Chưa cập nhật giá'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3 className="form-section-title">Thông tin khách thuê</h3>
                      <div className="form-grid-2">
                        <div>
                          <span className="text-secondary" style={{ fontSize: '12px' }}>Khách đề xuất</span>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} /> {viewingRequest.lesseeName || 'Khách vãng lai'}
                          </div>
                        </div>
                        <div>
                          <span className="text-secondary" style={{ fontSize: '12px' }}>Giá đề xuất</span>
                          <div style={{ fontWeight: 600 }}>
                            {viewingRequest.offeredPrice ? `${viewingRequest.offeredPrice.toLocaleString('vi-VN')} ₫` : 'Thỏa thuận'}
                          </div>
                        </div>
                        <div>
                          <span className="text-secondary" style={{ fontSize: '12px' }}>Thời lượng thuê</span>
                          <div style={{ fontWeight: 600 }}>{viewingRequest.duration} {viewingRequest.durationUnit || 'kỳ'}</div>
                        </div>
                        <div>
                          <span className="text-secondary" style={{ fontSize: '12px' }}>Ngày dự kiến bắt đầu</span>
                          <div style={{ fontWeight: 600 }}>{formatDate(viewingRequest.expectedStartDate, 'vi-VN', 'N/A')}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <span className="text-secondary" style={{ fontSize: '12px' }}>Mục đích thuê</span>
                        <div style={{ fontWeight: 500 }}>{viewingRequest.purpose || 'Không rõ mục đích'}</div>
                      </div>
                      {viewingRequest.note && (
                        <div style={{ marginTop: '12px' }}>
                          <span className="text-secondary" style={{ fontSize: '12px' }}>Ghi chú</span>
                          <div style={{ fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>{viewingRequest.note}</div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              <div className="modal-actions-footer">
                <button type="button" className="btn-ghost cancel-btn" onClick={() => setViewingRequest(null)}>
                  Đóng
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};