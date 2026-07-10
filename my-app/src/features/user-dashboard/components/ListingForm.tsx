/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, FileText } from 'lucide-react';
import './ListingForm.css';

interface ListingFormProps {
  onClose: () => void;
  onSuccess: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

// HÀM AN TOÀN ĐỂ CHUYỂN ĐỔI NGÀY THÁNG, TRÁNH CRASH 100%
const getSafeDateString = (dateString: any) => {
  try {
    if (!dateString) return new Date().toISOString().slice(0, 16);
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return new Date().toISOString().slice(0, 16); // Bắt lỗi Invalid Date
    return date.toISOString().slice(0, 16);
  } catch {
    return new Date().toISOString().slice(0, 16);
  }
};

export const ListingForm: React.FC<ListingFormProps> = ({ onClose, onSuccess, initialData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mySpaces, setMySpaces] = useState<any[]>([]);

  // --- STATE DỮ LIỆU ---
  const [spaceId, setSpaceId] = useState<number | ''>(initialData?.spaceId || '');
  const [price, setPrice] = useState<number>(initialData?.price || 0);
  const [description, setDescription] = useState(initialData?.description || '');
  
  // DÙNG HÀM AN TOÀN ĐỂ KHỞI TẠO STATE
  const [allowedStartTime, setAllowedStartTime] = useState(() => getSafeDateString(initialData?.allowedStartTime));
  const [allowedEndTime, setAllowedEndTime] = useState(() => {
    if (initialData?.allowedEndTime) return getSafeDateString(initialData.allowedEndTime);
    // Mặc định tạo mới thì +30 ngày
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return getSafeDateString(nextMonth);
  });

useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const token = localStorage.getItem('portal_token');
        
        // Luôn luôn có ID (Lấy từ localStorage hoặc dùng mã dự phòng)
        const ownerId = localStorage.getItem('current_user_id') || '01KVJGBEXR0X7A2PN520FJTVZT';
        
        // Nối thẳng ?OwnerId= vào URL
        const url = `https://localhost:7069/api/Space/GetAll?OwnerId=${encodeURIComponent(ownerId)}`;
        
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
        });
        
        if (res.ok) {
          const data = await res.json();
          setMySpaces(Array.isArray(data) ? data : (data?.data || []));
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách mặt bằng:", err);
      }
    };
    fetchSpaces();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (spaceId === '') return alert('Vui lòng chọn mặt bằng!');

    setIsLoading(true);
    const token = localStorage.getItem('portal_token');

    // Ép lại ngày tháng chuẩn ISO trước khi gửi
    const payload = {
      spaceId: Number(spaceId),
      allowedStartTime: new Date(allowedStartTime).toISOString(),
      allowedEndTime: new Date(allowedEndTime).toISOString(),
      description: description,
      price: Number(price),
      listingPictures: ["string"]
    };

    try {
      const isEditing = !!initialData;
      const targetId = initialData?.id || initialData?.Id;
      const url = isEditing
        ? `https://localhost:7069/api/Listing/Update/${targetId}`
        : `https://localhost:7069/api/Listing/Create`;

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify(isEditing ? { ...payload, id: targetId } : payload)
      });

      if (res.ok) {
        onSuccess();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("LỖI GỬI API:", errData);
        alert(`Lỗi: ${errData.title || errData.message || 'Kiểm tra Console log'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="listing-form-backdrop">
      <div className="listing-form-modal">
        <div className="listing-form-header">
          <div className="listing-form-title-area">
            <div className="listing-form-icon-wrap"><FileText size={18} /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {initialData ? 'Cập nhật bài đăng' : 'Tạo bài đăng cho thuê'}
              </h2>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} disabled={isLoading} style={{ width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Chọn mặt bằng vật lý <span style={{ color: 'red' }}>*</span></label>
              <select 
                className="form-select-input" 
                value={spaceId} 
                onChange={(e) => setSpaceId(Number(e.target.value))}
                required
                disabled={isLoading || !!initialData}
              >
                <option value="">-- Chọn mặt bằng --</option>
                {mySpaces.map(s => (
                  <option key={s.id || s.Id} value={s.id || s.Id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Đơn giá cơ bản (VNĐ) <span style={{ color: 'red' }}>*</span></label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <DollarSign size={16} style={{ position: 'absolute', left: 12, color: 'var(--color-text-secondary)' }} />
                <input 
                  type="number" 
                  min="0"
                  className="slot-input-text" 
                  style={{ paddingLeft: 36, height: 40, width: '100%', boxSizing: 'border-box' }}
                  value={price} 
                  onChange={e => setPrice(Number(e.target.value))} 
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Thời gian bắt đầu</label>
              <input 
                type="datetime-local" 
                className="slot-input-text" 
                style={{ height: 40, width: '100%', boxSizing: 'border-box' }}
                value={allowedStartTime}
                onChange={e => setAllowedStartTime(e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Thời gian kết thúc</label>
              <input 
                type="datetime-local" 
                className="slot-input-text" 
                style={{ height: 40, width: '100%', boxSizing: 'border-box' }}
                value={allowedEndTime}
                onChange={e => setAllowedEndTime(e.target.value)} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Tiêu đề / Mô tả <span style={{ color: 'red' }}>*</span></label>
            <textarea 
              className="slot-input-text"
              style={{ minHeight: '80px', paddingTop: 10, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn-ghost" onClick={onClose} disabled={isLoading}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={isLoading} style={{ padding: '0 24px' }}>
              {isLoading ? 'Đang xử lý...' : (initialData ? 'Lưu thay đổi' : 'Đăng tin')}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};