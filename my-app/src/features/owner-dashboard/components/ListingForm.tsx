import React, { useState } from 'react';
import { X, FileText, Building2, Clock, DollarSign, Plus, Trash2 } from 'lucide-react';
import './ListingForm.css';

interface ListingFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  spaces: any[];
  initialData?: any;
}

const SESSION_OPTIONS = ['Sáng', 'Chiều', 'Tối', 'Cả ngày'];
const TYPE_OPTIONS = ['Cố định', 'Linh hoạt'];
const DAYS_OF_WEEK_OPTIONS = ['Hàng ngày', 'Thứ 2 - Thứ 6', 'Thứ 7 - CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

export const ListingForm: React.FC<ListingFormProps> = ({ onClose, onSubmit, spaces, initialData }) => {
  const [spaceId, setSpaceId] = useState(initialData?.spaceId || (spaces.length > 0 ? spaces[0].id : ''));
  const [hourlyRate, setHourlyRate] = useState(initialData?.hourlyRate || '');
  const [allowedStartTime, setAllowedStartTime] = useState(initialData?.allowedStartTime || '08:00');
  const [allowedEndTime, setAllowedEndTime] = useState(initialData?.allowedEndTime || '22:00');
  const [title, setTitle] = useState(initialData?.name || '');
  const [status, setStatus] = useState<'published' | 'draft' | 'pending'>(initialData?.status || 'published');

  // Khởi tạo danh sách ListingSlot
  const [slots, setSlots] = useState<any[]>(
    initialData?.slots || [
      { id: Date.now(), day: 'Hàng ngày', startTime: '08:00', endTime: '12:00', session: 'Sáng', type: 'Cố định', price: '' },
      { id: Date.now() + 1, day: 'Hàng ngày', startTime: '13:00', endTime: '17:00', session: 'Chiều', type: 'Cố định', price: '' },
    ]
  );

  const handleAddSlot = () => {
    setSlots(prev => [
      ...prev,
      {
        id: Date.now(),
        day: 'Hàng ngày',
        startTime: '18:00',
        endTime: '22:00',
        session: 'Tối',
        type: 'Linh hoạt',
        price: '',
      },
    ]);
  };

  const handleRemoveSlot = (id: number) => {
    setSlots(prev => prev.filter(slot => slot.id !== id));
  };

  const handleSlotChange = (id: number, field: string, value: string) => {
    setSlots(prev =>
      prev.map(slot => (slot.id === id ? { ...slot, [field]: value } : slot))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !spaceId || !hourlyRate) {
      alert('Vui lòng điền đầy đủ các thông tin bài đăng chính!');
      return;
    }

    const selectedSpace = spaces.find(s => s.id === Number(spaceId)) || spaces[0];

    const data = {
      id: initialData?.id || Date.now(),
      name: title,
      location: selectedSpace?.address || 'N/A',
      price: `${Number(hourlyRate).toLocaleString('vi-VN')}₫`,
      period: '/giờ',
      area: selectedSpace?.area || 'N/A',
      type: selectedSpace?.categories ? selectedSpace.categories.map((c: string) => c.toUpperCase()).join(', ') : 'Mặt bằng',
      status,
      views: initialData?.views || 0,
      inquiries: initialData?.inquiries || 0,
      rating: initialData?.rating || 0,
      subleasing: true,
      postedDate: new Date().toLocaleDateString('vi-VN'),
      slots: slots,
    };

    onSubmit(data);
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
          <button className="btn-icon close-btn" onClick={onClose}>
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
                <input
                  type="text"
                  placeholder="Ví dụ: Cho thuê mặt bằng thời trang theo giờ Lê Lợi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label font-label">Chọn mặt bằng vật lý</label>
                <div className="input-with-icon">
                  <Building2 size={14} className="input-icon" />
                  <select
                    value={spaceId}
                    onChange={(e) => setSpaceId(e.target.value)}
                    className="form-select-input"
                    required
                  >
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
                  <input
                    type="number"
                    placeholder="Ví dụ: 50000"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Giờ bắt đầu cho thuê</label>
                <div className="input-with-icon">
                  <Clock size={14} className="input-icon" />
                  <input
                    type="time"
                    value={allowedStartTime}
                    onChange={(e) => setAllowedStartTime(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Giờ kết thúc cho thuê</label>
                <div className="input-with-icon">
                  <Clock size={14} className="input-icon" />
                  <input
                    type="time"
                    value={allowedEndTime}
                    onChange={(e) => setAllowedEndTime(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Trạng thái đăng bài</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="form-select-input"
                  style={{ paddingLeft: 14 }}
                >
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
              <button type="button" className="btn-ghost add-slot-btn" onClick={handleAddSlot}>
                <Plus size={12} />
                Thêm Slot
              </button>
            </div>
            <p className="section-desc text-secondary">Người thuê thứ cấp sẽ đặt lịch dựa trên các slot cấu hình dưới đây</p>

            <div className="slots-editor-list">
              {slots.map((slot, index) => (
                <div key={slot.id || index} className="slot-editor-row glass-card--inset">
                  
                  {/* Tần suất */}
                  <div className="slot-field">
                    <label className="slot-field-label">Tần suất</label>
                    <select
                      value={slot.day}
                      onChange={(e) => handleSlotChange(slot.id, 'day', e.target.value)}
                      className="slot-input-select"
                    >
                      {DAYS_OF_WEEK_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Giờ bắt đầu */}
                  <div className="slot-field">
                    <label className="slot-field-label">Từ</label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleSlotChange(slot.id, 'startTime', e.target.value)}
                      className="slot-input-time"
                    />
                  </div>

                  {/* Giờ kết thúc */}
                  <div className="slot-field">
                    <label className="slot-field-label">Đến</label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleSlotChange(slot.id, 'endTime', e.target.value)}
                      className="slot-input-time"
                    />
                  </div>

                  {/* Buổi */}
                  <div className="slot-field">
                    <label className="slot-field-label">Buổi</label>
                    <select
                      value={slot.session}
                      onChange={(e) => handleSlotChange(slot.id, 'session', e.target.value)}
                      className="slot-input-select"
                    >
                      {SESSION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Loại slot */}
                  <div className="slot-field">
                    <label className="slot-field-label">Loại slot</label>
                    <select
                      value={slot.type}
                      onChange={(e) => handleSlotChange(slot.id, 'type', e.target.value)}
                      className="slot-input-select"
                    >
                      {TYPE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Giá riêng */}
                  <div className="slot-field">
                    <label className="slot-field-label">Giá riêng (đ/giờ)</label>
                    <input
                      type="number"
                      placeholder="Mặc định"
                      value={slot.price}
                      onChange={(e) => handleSlotChange(slot.id, 'price', e.target.value)}
                      className="slot-input-text"
                    />
                  </div>

                  {/* Nút xóa */}
                  <button
                    type="button"
                    className="btn-icon delete-slot-btn"
                    onClick={() => handleRemoveSlot(slot.id)}
                    disabled={slots.length <= 1}
                  >
                    <Trash2 size={12} />
                  </button>

                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="form-actions-footer">
            <button type="button" className="btn-ghost cancel-btn" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary submit-btn">
              Đăng tin cho thuê
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
