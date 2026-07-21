/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
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
  User
} from 'lucide-react';
import '../../shared/ModalShell.css';

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
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<BookingRequestEditData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

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

  const handleDelete = async (requestId: number) => {
    if (!window.confirm('Bạn có chắc muốn xoá yêu cầu thuê này không?')) return;
    try {
      const res = await fetch(
        `https://flexi-space-capstone-project.onrender.com/api/PrimaryBookingRequest/Delete/${requestId}`,
        { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' } }
      );
      if (!res.ok) {
        alert('Lỗi khi xoá yêu cầu thuê!');
        return;
      }
      fetchRequests();
    } catch (error) {
      console.error('Lỗi xoá đơn:', error);
      alert('Lỗi kết nối máy chủ!');
    }
  };

  return (
    <div className="animate-in">
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
                  <th style={{ padding: '16px 12px' }}>Mã tin</th>
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
                  return (
                    <tr key={req.id || req.Id} style={{ borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>
                      <td style={{ padding: '16px 12px', fontWeight: 500 }}>#{req.listingId}</td>
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
                          {req.expectedStartDate ? new Date(req.expectedStartDate).toLocaleDateString('vi-VN') : 'N/A'}
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
                        {canEdit ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', opacity: 0.5 }}>Không thể chỉnh sửa</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL SỬA YÊU CẦU THUÊ — DÙNG ĐÚNG KHUNG CỦA SPACEFORM */}
      {editingRequest && editForm && (
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
        </div>
      )}
    </div>
  );
};