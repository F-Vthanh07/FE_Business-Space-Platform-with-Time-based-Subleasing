/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Edit3,
  Trash2,
  FileText,
  Calendar,
  Clock,
  X,
  DollarSign,
  Hash,
  StickyNote,
  User,
  Star,
  Eye,
  MapPin,
  Building2
} from 'lucide-react';
import '../../../shared/ModalShell.css';
import { formatDate } from '../../../../utils/dateUtils';
import { getListingPictureUrl } from '../../../shared/listingPictures';
import { fetchSpacesById, getListingAddress } from '../../../shared/listingAddress';
import { useConfirm } from '../../../../components/ConfirmModal';

interface BookingRequestEditData {
  listingId: number;
  offeredPrice: number;
  duration: number;
  durationUnit: string;
  purpose: string;
  note: string;
  expectedStartDate: string;
}

// DANH SÁCH STATUS HỢP LỆ THEO SWAGGER — API GetAll KHÔNG TRẢ SẴN FIELD "status"
// TRONG ITEM NÊN PHẢI GỌI RIÊNG TỪNG STATUS RỒI TỰ GẮN NHÃN VÀO
const STATUS_LIST = ['Pending', 'Negotiating', 'Approved', 'Rejected', 'Canceled'] as const;

const statusLabel = (status: string) => {
  switch (status) {
    case 'Pending': return { text: 'Chờ duyệt', color: '#F59E0B' };
    case 'Negotiating': return { text: 'Đang thoả thuận', color: '#3B82F6' };
    case 'Approved': return { text: 'Đã duyệt', color: '#16A34A' };
    case 'Rejected': return { text: 'Đã từ chối', color: '#EF4444' };
    case 'Canceled': return { text: 'Đã huỷ', color: '#6B7280' };
    default: return { text: status, color: '#6B7280' };
  }
};

export const RenterBookingRequests: React.FC = () => {
  const navigate = useNavigate();
  const { confirm, confirmModal } = useConfirm();
  const [requests, setRequests] = useState<any[]>([]);
  const [listingsById, setListingsById] = useState<Record<number, any>>({});
  const [spacesById, setSpacesById] = useState<Record<number, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<BookingRequestEditData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [viewingRequest, setViewingRequest] = useState<any | null>(null);

  const [reviewingRequest, setReviewingRequest] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewDescription, setReviewDescription] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewedRequestIds, setReviewedRequestIds] = useState<number[]>([]);

  const currentUserId = localStorage.getItem('current_user_id');
  const token = localStorage.getItem('portal_token');

  // LẤY DANH SÁCH ĐƠN THUÊ CỦA CHÍNH MÌNH (LESSEE)
  // GỌI RIÊNG TỪNG STATUS VÌ RESPONSE CỦA GetAll KHÔNG TRẢ SẴN FIELD "status"
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.all(
        STATUS_LIST.map(async (status) => {
          const res = await fetch(
            `https://flexi-space-capstone-project.onrender.com/api/PrimaryBookingRequest/GetAll?status=${status}`,
            { headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' } }
          );
          if (!res.ok) return [];
          const data = await res.json();
          const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
          return safeData.map((req: any) => ({ ...req, status }));
        })
      );

      const merged = results.flat();
      const myRequests = merged.filter((req: any) => req.lesseeId === currentUserId);
      setRequests(myRequests);

      // LẤY THÔNG TIN TIN ĐĂNG (TÊN, ẢNH, GIÁ, ĐỊA CHỈ) CHO TỪNG YÊU CẦU ĐỂ HIỂN THỊ
      const uniqueListingIds = Array.from(new Set(myRequests.map((req: any) => req.listingId).filter(Boolean)));
      const listingResults = await Promise.all(
        uniqueListingIds.map(async (listingId) => {
          try {
            const res = await fetch(
              `https://flexi-space-capstone-project.onrender.com/api/Listing/GetById/${listingId}`,
              { headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' } }
            );
            if (!res.ok) return null;
            const data = await res.json();
            return { listingId, listing: data };
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
    } catch (error) {
      console.error('Lỗi tải danh sách yêu cầu đã gửi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEditForm = (req: any) => {
    setError('');
    setEditingRequest(req);
    setEditForm({
      listingId: req.listingId,
      offeredPrice: req.offeredPrice || 0,
      duration: req.duration || 0,
      durationUnit: req.durationUnit || 'Days',
      purpose: req.purpose || '',
      note: req.note || '',
      expectedStartDate: req.expectedStartDate ? req.expectedStartDate.slice(0, 10) : ''
    });
  };

  const closeEditForm = () => {
    setEditingRequest(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editingRequest || !editForm) return;
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch(
        `https://flexi-space-capstone-project.onrender.com/api/PrimaryBookingRequest/Update/${editingRequest.id || editingRequest.Id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            ...editForm,
            expectedStartDate: new Date(editForm.expectedStartDate).toISOString()
          })
        }
      );
      if (!res.ok) {
        setError('Lỗi khi cập nhật yêu cầu thuê!');
        return;
      }
      closeEditForm();
      fetchRequests();
    } catch (error) {
      console.error('Lỗi cập nhật đơn:', error);
      setError('Lỗi kết nối máy chủ!');
    } finally {
      setIsSaving(false);
    }
  };

  const openReviewForm = (req: any) => {
    setReviewError('');
    setReviewRating(5);
    setReviewDescription('');
    setReviewingRequest(req);
  };

  const closeReviewForm = () => {
    setReviewingRequest(null);
  };

  const handleSubmitReview = async () => {
    if (!reviewingRequest) return;
    setIsSubmittingReview(true);
    setReviewError('');
    try {
      // API BOOKING REQUEST KHÔNG TRẢ SẴN spaceId NÊN PHẢI LẤY QUA LISTING
      const listingRes = await fetch(
        `https://flexi-space-capstone-project.onrender.com/api/Listing/GetById/${reviewingRequest.listingId}`,
        { headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' } }
      );
      if (!listingRes.ok) {
        setReviewError('Không thể lấy thông tin mặt bằng để đánh giá!');
        return;
      }
      const listingData = await listingRes.json();
      const spaceId = listingData?.spaceId || listingData?.SpaceId;
      if (!spaceId) {
        setReviewError('Không tìm thấy mặt bằng liên kết với tin đăng này!');
        return;
      }

      const requestId = reviewingRequest.id || reviewingRequest.Id;
      const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/Review/Create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'accept': '*/*' },
        body: JSON.stringify({
          bookingRequestId: requestId,
          spaceId,
          rating: reviewRating,
          description: reviewDescription
        })
      });

      if (!res.ok) {
        const rawMessage = (await res.text().catch(() => '')).trim();
        if (rawMessage.includes('chỉ có thể đánh giá khi đã có hợp đồng thuê')) {
          setReviewError('Bạn chỉ có thể đánh giá khi đã có hợp đồng thuê');
        } else {
          setReviewError(rawMessage || 'Lỗi khi gửi đánh giá!');
        }
        return;
      }

      setReviewedRequestIds((prev) => [...prev, requestId]);
      closeReviewForm();
    } catch (error) {
      console.error('Lỗi gửi đánh giá:', error);
      setReviewError('Lỗi kết nối máy chủ!');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDelete = async (requestId: number) => {
    const ok = await confirm({
      title: 'Xoá yêu cầu thuê',
      message: 'Bạn có chắc muốn xoá yêu cầu thuê này không?',
      confirmLabel: 'Xoá',
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(
        `https://flexi-space-capstone-project.onrender.com/api/PrimaryBookingRequest/Delete/${requestId}`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' } }
      );
      if (!res.ok) {
        toast.error('Lỗi khi xoá yêu cầu thuê!');
        return;
      }
      toast.success('Đã xoá yêu cầu thuê!');
      fetchRequests();
    } catch (error) {
      console.error('Lỗi xoá đơn:', error);
      toast.error('Lỗi kết nối máy chủ!');
    }
  };

  return (
    <div className="animate-in">
      {confirmModal}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 'bold' }}>Yêu cầu thuê đã gửi</h1>
          <p className="page-subtitle text-secondary">Theo dõi, chỉnh sửa hoặc xoá các yêu cầu thuê mặt bằng bạn đã gửi</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>Đang tải danh sách...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
            <FileText size={48} style={{ margin: '0 auto 16px auto' }} />
            <p>Bạn chưa gửi yêu cầu thuê nào.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(128, 128, 128, 0.2)', opacity: 0.7, fontSize: '13px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px 12px' }}>Tin đăng</th>
                  <th style={{ padding: '16px 12px' }}>Đề xuất</th>
                  <th style={{ padding: '16px 12px' }}>Thời gian thuê</th>
                  <th style={{ padding: '16px 12px' }}>Trạng thái</th>
                  <th style={{ padding: '16px 12px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const st = statusLabel(req.status);
                  const canEdit = req.status === 'Pending';
                  const reqId = req.id || req.Id;
                  const canReview = req.status === 'Approved' && !reviewedRequestIds.includes(reqId);
                  const listing = listingsById[req.listingId];
                  const listingThumb = getListingPictureUrl(listing?.listingPictures?.[0]);
                  return (
                    <tr key={req.id || req.Id} style={{ borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>
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
                            <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }} title={listing?.name}>
                              {listing?.name || (listing === undefined ? 'Đang tải...' : 'Tin đăng')}
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                              <MapPin size={11} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getListingAddress(listing, spacesById) || 'Chưa cập nhật'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ color: '#4ADE80', fontSize: '15px', fontWeight: 'bold' }}>
                          {req.offeredPrice ? `${req.offeredPrice.toLocaleString('vi-VN')} ₫` : 'Thỏa thuận'}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.purpose}>
                          {req.purpose || 'Không rõ mục đích'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', marginBottom: '4px' }}>
                          <Calendar size={14} style={{ opacity: 0.7 }} />
                          {formatDate(req.expectedStartDate, 'vi-VN', 'N/A')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: 0.7 }}>
                          <Clock size={12} /> {req.duration} {req.durationUnit || 'kỳ'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <span className="status-pill" style={{ color: st.color, border: `1px solid ${st.color}`, backgroundColor: `${st.color}1A` }}>
                          {st.text}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => setViewingRequest(req)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(128,128,128,0.4)', backgroundColor: 'transparent', color: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          >
                            <Eye size={16} /> Chi tiết
                          </button>
                          {canEdit ? (
                            <>
                              <button
                                onClick={() => openEditForm(req)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #3B82F6', backgroundColor: 'transparent', color: '#3B82F6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                              >
                                <Edit3 size={16} /> Sửa
                              </button>
                              <button
                                onClick={() => handleDelete(req.id || req.Id)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                              >
                                <Trash2 size={16} /> Xoá
                              </button>
                            </>
                          ) : canReview ? (
                            <button
                              onClick={() => openReviewForm(req)}
                              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #F59E0B', backgroundColor: 'transparent', color: '#F59E0B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            >
                              <Star size={16} /> Đánh giá
                            </button>
                          ) : req.status === 'Approved' ? (
                            <span style={{ fontSize: '12px', opacity: 0.5, color: '#16A34A' }}>Đã đánh giá</span>
                          ) : null}
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
                const st = statusLabel(viewingRequest.status);
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
                          {listing?.description && (
                            <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '6px', lineHeight: 1.5 }}>{listing.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <h3 className="form-section-title">Thông tin yêu cầu</h3>
                      <div className="form-grid-2">
                        <div>
                          <span className="text-secondary" style={{ fontSize: '12px' }}>Giá đề xuất</span>
                          <div style={{ fontWeight: 600 }}>
                            {viewingRequest.offeredPrice ? `${viewingRequest.offeredPrice.toLocaleString('vi-VN')} ₫` : 'Thỏa thuận'}
                          </div>
                        </div>
                        <div>
                          <span className="text-secondary" style={{ fontSize: '12px' }}>Trạng thái</span>
                          <div>
                            <span className="status-pill" style={{ color: st.color, border: `1px solid ${st.color}`, backgroundColor: `${st.color}1A` }}>
                              {st.text}
                            </span>
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
                          <div style={{ fontWeight: 500 }}>{viewingRequest.note}</div>
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

      {/* MODAL SỬA YÊU CẦU THUÊ — DÙNG ĐÚNG KHUNG CỦA SPACEFORM */}
      {editingRequest && editForm && createPortal(
        <div className="modal-backdrop" onClick={closeEditForm}>
          <div className="modal-shell" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <div className="modal-title-area">
                <div className="modal-icon-wrap modal-icon-wrap--blue"><Edit3 size={16} /></div>
                <div>
                  <h2 className="modal-title">Chỉnh sửa yêu cầu thuê</h2>
                  <p className="modal-subtitle text-secondary">Mã tin #{editingRequest.listingId}</p>
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={closeEditForm} disabled={isSaving}>
                <X size={15} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <h3 className="form-section-title">Thông tin đề xuất</h3>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label"><DollarSign size={14} /> Giá đề xuất (₫)</label>
                    <div className="input-with-icon">
                      <DollarSign size={14} className="input-icon" />
                      <input
                        type="number"
                        className="form-input"
                        value={editForm.offeredPrice}
                        onChange={(e) => setEditForm({ ...editForm, offeredPrice: Number(e.target.value) })}
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label"><Hash size={14} /> Thời lượng</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        className="form-input form-input--flat"
                        style={{ flex: 1 }}
                        value={editForm.duration}
                        onChange={(e) => setEditForm({ ...editForm, duration: Number(e.target.value) })}
                        disabled={isSaving}
                      />
                      <select
                        className="form-select-input form-select-input--flat"
                        style={{ flex: 1 }}
                        value={editForm.durationUnit}
                        onChange={(e) => setEditForm({ ...editForm, durationUnit: e.target.value })}
                        disabled={isSaving}
                      >
                        <option value="Days">Ngày</option>
                        <option value="Weeks">Tuần</option>
                        <option value="Months">Tháng</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label"><Calendar size={14} /> Ngày dự kiến bắt đầu</label>
                  <div className="input-with-icon">
                    <Calendar size={14} className="input-icon" />
                    <input
                      type="date"
                      className="form-input"
                      style={{ colorScheme: 'dark' }}
                      value={editForm.expectedStartDate}
                      onChange={(e) => setEditForm({ ...editForm, expectedStartDate: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Chi tiết yêu cầu</h3>

                <div className="form-group">
                  <label className="form-label"><User size={14} /> Mục đích thuê</label>
                  <div className="input-with-icon">
                    <User size={14} className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.purpose}
                      onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label"><StickyNote size={14} /> Ghi chú</label>
                  <textarea
                    className="form-textarea form-textarea--flat"
                    rows={3}
                    value={editForm.note}
                    onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {error && (
                <div className="form-error-box">
                  <span>{error}</span>
                </div>
              )}

              <div className="modal-actions-footer">
                <button type="button" className="btn-ghost cancel-btn" onClick={closeEditForm} disabled={isSaving}>
                  Hủy
                </button>
                <button type="button" className="btn-primary submit-btn" onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* MODAL ĐÁNH GIÁ MẶT BẰNG */}
      {reviewingRequest && createPortal(
        <div className="modal-backdrop" onClick={closeReviewForm}>
          <div className="modal-shell" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <div className="modal-title-area">
                <div className="modal-icon-wrap modal-icon-wrap--blue"><Star size={16} /></div>
                <div>
                  <h2 className="modal-title">Đánh giá mặt bằng</h2>
                  <p className="modal-subtitle text-secondary">Mã tin #{reviewingRequest.listingId}</p>
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={closeReviewForm} disabled={isSubmittingReview}>
                <X size={15} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <div className="form-group">
                  <label className="form-label">Số sao đánh giá</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        disabled={isSubmittingReview}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}
                      >
                        <Star
                          size={28}
                          color="#F59E0B"
                          fill={star <= reviewRating ? '#F59E0B' : 'none'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label"><StickyNote size={14} /> Nhận xét</label>
                  <textarea
                    className="form-textarea form-textarea--flat"
                    rows={4}
                    placeholder="Chia sẻ trải nghiệm của bạn về mặt bằng này..."
                    value={reviewDescription}
                    onChange={(e) => setReviewDescription(e.target.value)}
                    disabled={isSubmittingReview}
                  />
                </div>
              </div>

              {reviewError && (
                <div className="form-error-box">
                  <span>{reviewError}</span>
                </div>
              )}

              <div className="modal-actions-footer">
                <button type="button" className="btn-ghost cancel-btn" onClick={closeReviewForm} disabled={isSubmittingReview}>
                  Hủy
                </button>
                <button type="button" className="btn-primary submit-btn" onClick={handleSubmitReview} disabled={isSubmittingReview}>
                  {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
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