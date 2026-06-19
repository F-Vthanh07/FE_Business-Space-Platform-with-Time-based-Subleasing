import React, { useState, useEffect } from 'react';
import { X, FileText, Building2, Clock, DollarSign, Plus, Trash2, ShieldAlert } from 'lucide-react';
import './ListingForm.css';

interface ListingFormProps {
  onClose: () => void;
  onSuccess: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

const SESSION_OPTIONS = ['Sáng', 'Chiều', 'Tối', 'Cả ngày'];
const TYPE_OPTIONS = ['Cố định', 'Linh hoạt'];
const DAYS_OF_WEEK_OPTIONS = ['Hàng ngày', 'Thứ 2 - Thứ 6', 'Thứ 7 - CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

export const ListingForm: React.FC<ListingFormProps> = ({ onClose, onSuccess, initialData }) => {
  // 1. STATE CHO FORM
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [spaces, setSpaces] = useState<any[]>([]);
  const [spaceId, setSpaceId] = useState(initialData?.spaceId || '');
  const [title, setTitle] = useState(initialData?.name || '');
  const [hourlyRate, setHourlyRate] = useState(initialData?.price || '');
  const [allowedStartTime, setAllowedStartTime] = useState(initialData?.allowedStartTime || '08:00');
  const [allowedEndTime, setAllowedEndTime] = useState(initialData?.allowedEndTime || '22:00');
  const [status, setStatus] = useState(initialData?.status || 'published');
  
  // Khởi tạo danh sách ListingSlot
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [slots, setSlots] = useState<any[]>(
    initialData?.slots || [
      // eslint-disable-next-line react-hooks/purity
      { id: Date.now(), day: 'Hàng ngày', startTime: '08:00', endTime: '12:00', session: 'Sáng', type: 'Cố định', price: '' },
      // eslint-disable-next-line react-hooks/purity
      { id: Date.now() + 1, day: 'Hàng ngày', startTime: '13:00', endTime: '17:00', session: 'Chiều', type: 'Cố định', price: '' },
    ]
  );

  // 2. STATE HỆ THỐNG
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 3. TỰ ĐỘNG LẤY DANH SÁCH MẶT BẰNG
  useEffect(() => {
    const fetchSpacesForDropdown = async () => {
      try {
        const token = localStorage.getItem('portal_token');
        const res = await fetch('https://localhost:7069/api/Space/GetAll', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSpaces(data);
          // Tự động chọn mặt bằng đầu tiên nếu là tạo mới
          if (data.length > 0 && !initialData) {
            setSpaceId(data[0].id.toString());
          }
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách mặt bằng:", err);
      }
    };
    fetchSpacesForDropdown();
  }, [initialData]);

  // 4. LOGIC XỬ LÝ MẢNG SLOTS
  const handleAddSlot = () => {
    setSlots(prev => [
      ...prev,
      { id: Date.now(), day: 'Hàng ngày', startTime: '18:00', endTime: '22:00', session: 'Tối', type: 'Linh hoạt', price: '' },
    ]);
  };

  const handleRemoveSlot = (id: number) => {
    setSlots(prev => prev.filter(slot => slot.id !== id));
  };

  const handleSlotChange = (id: number, field: string, value: string) => {
    setSlots(prev => prev.map(slot => (slot.id === id ? { ...slot, [field]: value } : slot)));
  };

  // 5. BẮN API TẠO/SỬA BÀI ĐĂNG
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !spaceId || !hourlyRate) {
      setError('Vui lòng điền đầy đủ các thông tin bài đăng chính!');
      return;
    }

    const token = localStorage.getItem('portal_token');
    if (!token) {
      setError('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
      return;
    }

    // Tùy chỉnh Payload theo cấu trúc Backend (Ông có thể cần sửa lại field name nếu Swagger yêu cầu khác)
    const payload = {
      spaceId: Number(spaceId),
      name: title,
      price: Number(hourlyRate),
      allowedStartTime,
      allowedEndTime,
      status: status,
      slots: slots.map(s => ({
        dayOfWeek: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        sessionType: s.session,
        priceOverwrite: s.price ? Number(s.price) : null
      }))
    };

    setIsLoading(true);
    try {
      const isEditing = !!initialData;
      const url = isEditing 
        ? `https://localhost:7069/api/Listing/Update/${initialData.id}` 
        : 'https://localhost:7069/api/Listing/Create';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        },
        body: JSON.stringify(isEditing ? { ...payload, id: initialData.id } : payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Lỗi từ hệ thống khi ${isEditing ? 'sửa' : 'tạo'} bài đăng.`);
      }

      onSuccess(); // Thành công thì báo cha tắt form đi

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="listing-form-backdrop">
      <div className="glass-card listing-form-modal animate-in">
        
        {/* Header */}
        <div className="listing-form-header">
          <div className="listing-form-title-area">
            <div className="listing-form-icon-wrap">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="form-modal-title">{initialData ? 'Chỉnh sửa bài đăng' : 'Tạo bài đăng cho thuê'}</h2>
              <p className="form-modal-subtitle text-secondary">Cấu hình biểu giá và chia nhỏ khung giờ hoạt động thành các slot thuê</p>
            </div>
          </div>
          <button className="btn-icon close-btn" onClick={onClose} disabled={isLoading}>
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="listing-form-body">
          
          {/* Thông tin bài đăng */}
          <div className="form-section">
            <h3 className="form-section-title">1. Thông tin bài đăng (Listing Table)</h3>
            
            <div className="form-group">
              <label className="form-label">Tiêu đề bài đăng</label>
              <div className="input-with-icon">
                <FileText size={14} className="input-icon" />
                <input type="text" placeholder="Ví dụ: Cho thuê mặt bằng thời trang theo giờ Lê Lợi" value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" disabled={isLoading} required />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label font-label">Chọn mặt bằng vật lý</label>
                <div className="input-with-icon">
                  <Building2 size={14} className="input-icon" />
                  <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} className="form-select-input" disabled={isLoading || spaces.length === 0} required>
                    {spaces.length === 0 && <option value="">Đang tải mặt bằng...</option>}
                    {spaces.map(space => (
                      <option key={space.id} value={space.id}>
                        {space.name} ({space.area})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Đơn giá thuê cơ bản (đ/giờ)</label>
                <div className="input-with-icon">
                  <DollarSign size={14} className="input-icon" />
                  <input type="number" placeholder="Ví dụ: 50000" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="form-input" disabled={isLoading} required />
                </div>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Giờ bắt đầu cho thuê</label>
                <div className="input-with-icon">
                  <Clock size={14} className="input-icon" />
                  <input type="time" value={allowedStartTime} onChange={(e) => setAllowedStartTime(e.target.value)} className="form-input" disabled={isLoading} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Giờ kết thúc cho thuê</label>
                <div className="input-with-icon">
                  <Clock size={14} className="input-icon" />
                  <input type="time" value={allowedEndTime} onChange={(e) => setAllowedEndTime(e.target.value)} className="form-input" disabled={isLoading} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Trạng thái đăng bài</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-select-input" style={{ paddingLeft: 14 }} disabled={isLoading}>
                  <option value="published">Đăng ngay</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="draft">Lưu nháp</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cấu hình các ListingSlot */}
          <div className="form-section">
            <div className="slots-section-header">
              <h3 className="form-section-title">2. Phân chia Khung giờ chi tiết (ListingSlot Table)</h3>
              <button type="button" className="btn-ghost add-slot-btn" onClick={handleAddSlot} disabled={isLoading}>
                <Plus size={12} /> Thêm Slot
              </button>
            </div>
            <p className="section-desc text-secondary">Người thuê thứ cấp sẽ đặt lịch dựa trên các slot cấu hình dưới đây</p>

            <div className="slots-editor-list">
              {slots.map((slot, index) => (
                <div key={slot.id || index} className="slot-editor-row glass-card--inset">
                  
                  <div className="slot-field">
                    <label className="slot-field-label">Tần suất</label>
                    <select value={slot.day} onChange={(e) => handleSlotChange(slot.id, 'day', e.target.value)} className="slot-input-select" disabled={isLoading}>
                      {DAYS_OF_WEEK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="slot-field">
                    <label className="slot-field-label">Từ</label>
                    <input type="time" value={slot.startTime} onChange={(e) => handleSlotChange(slot.id, 'startTime', e.target.value)} className="slot-input-time" disabled={isLoading} />
                  </div>

                  <div className="slot-field">
                    <label className="slot-field-label">Đến</label>
                    <input type="time" value={slot.endTime} onChange={(e) => handleSlotChange(slot.id, 'endTime', e.target.value)} className="slot-input-time" disabled={isLoading} />
                  </div>

                  <div className="slot-field">
                    <label className="slot-field-label">Buổi</label>
                    <select value={slot.session} onChange={(e) => handleSlotChange(slot.id, 'session', e.target.value)} className="slot-input-select" disabled={isLoading}>
                      {SESSION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="slot-field">
                    <label className="slot-field-label">Loại slot</label>
                    <select value={slot.type} onChange={(e) => handleSlotChange(slot.id, 'type', e.target.value)} className="slot-input-select" disabled={isLoading}>
                      {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="slot-field">
                    <label className="slot-field-label">Giá riêng (đ/giờ)</label>
                    <input type="number" placeholder="Mặc định" value={slot.price} onChange={(e) => handleSlotChange(slot.id, 'price', e.target.value)} className="slot-input-text" disabled={isLoading} />
                  </div>

                  <button type="button" className="btn-icon delete-slot-btn" onClick={() => handleRemoveSlot(slot.id)} disabled={slots.length <= 1 || isLoading}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', border: '1px dashed #f85149', color: '#f85149', background: 'rgba(248,81,73,0.05)' }}>
              <ShieldAlert size={16} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="form-actions-footer">
            <button type="button" className="btn-ghost cancel-btn" onClick={onClose} disabled={isLoading}>
              Hủy
            </button>
            <button type="submit" className="btn-primary submit-btn" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Đăng tin cho thuê'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};