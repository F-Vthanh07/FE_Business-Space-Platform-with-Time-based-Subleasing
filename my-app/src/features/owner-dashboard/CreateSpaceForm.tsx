import React, { useState } from 'react';
import { Plus, Trash2, MapPin, Clock, CheckCircle } from 'lucide-react';
import './CreateSpaceForm.css';

export const CreateSpaceForm: React.FC = () => {
  
  // 1. STATE THÔNG TIN CƠ BẢN
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState<number>(0);

  // 2. STATE TIỆN ÍCH (Mảng động có thể thêm/bớt)
  const [amenities, setAmenities] = useState([{ name: '', quantity: 1, isActive: true }]);

  // 3. STATE GIỜ HOẠT ĐỘNG (Mảng động)
  const [operatingHours, setOperatingHours] = useState([{ dayOfWeek: 1, openTime: '08:00', closeTime: '22:00' }]);

  // 4. TRẠNG THÁI HỆ THỐNG
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // --- LOGIC XỬ LÝ MẢNG ĐỘNG ---
  const handleAddAmenity = () => setAmenities([...amenities, { name: '', quantity: 1, isActive: true }]);
  const handleRemoveAmenity = (index: number) => setAmenities(amenities.filter((_, i) => i !== index));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAmenityChange = (index: number, field: string, value: any) => {
    const newAm = [...amenities];
    newAm[index] = { ...newAm[index], [field]: value };
    setAmenities(newAm);
  };

  const handleAddHours = () => setOperatingHours([...operatingHours, { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00' }]);
  const handleRemoveHours = (index: number) => setOperatingHours(operatingHours.filter((_, i) => i !== index));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleHourChange = (index: number, field: string, value: any) => {
    const newHrs = [...operatingHours];
    newHrs[index] = { ...newHrs[index], [field]: value };
    setOperatingHours(newHrs);
  };

  // --- GỌI API CREATE SPACE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Lấy token từ LocalStorage (Đã lưu lúc đăng nhập)
    const token = localStorage.getItem('portal_token');
    if (!token) {
      setError('Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn!');
      return;
    }

    // Build payload theo đúng cấu trúc Swagger
    const payload = {
      name: name,
      address: address,
      city: city,
      area: area,
      isDeleted: false,
      isActive: true,
      amenities: amenities.filter(a => a.name.trim() !== ''), // Chỉ lấy các tiện ích có nhập tên
      operatingHours: operatingHours,
      spaceAllowedCategories: [
        { bussinessCategoryId: 1 } // Tạm fix cứng category id = 1 để test, sau này làm dropdown chọn sau
      ]
    };

    setIsLoading(true);
    try {
      const response = await fetch('https://localhost:7069/api/Space/Create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // <= CỰC KỲ QUAN TRỌNG
          'accept': '*/*'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Lỗi khi tạo mặt bằng. Vui lòng kiểm tra lại dữ liệu.');
      }

      // TẠO THÀNH CÔNG
      setSuccess(true);
      // Có thể dùng navigate('/owner/dashboard') để đá về trang quản lý

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="cs-success-card">
        <CheckCircle size={48} color="#00D4A0" />
        <h2>Tạo mặt bằng thành công!</h2>
        <p>Mặt bằng của bạn đã được đưa lên hệ thống.</p>
        <button onClick={() => window.location.reload()} className="cs-btn-primary">Trở về bảng điều khiển</button>
      </div>
    );
  }

  return (
    <div className="cs-wrapper">
      <div className="cs-container">
        <div className="cs-header">
          <h2>Đăng Tin Mặt Bằng Mới</h2>
          <p>Điền thông tin chi tiết để thu hút khách thuê</p>
        </div>

        <form onSubmit={handleSubmit} className="cs-form">
          
          {/* SECTION 1: THÔNG TIN CƠ BẢN */}
          <div className="cs-section">
            <h3 className="cs-section-title"><MapPin size={18} /> Thông tin cơ bản</h3>
            
            <div className="cs-form-group">
              <label>Tên mặt bằng / Tiêu đề tin</label>
              <input type="text" required placeholder="VD: Mặt bằng góc 2 mặt tiền Quận 1" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="cs-row-2">
              <div className="cs-form-group">
                <label>Thành phố</label>
                <input type="text" required placeholder="Hồ Chí Minh" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="cs-form-group">
                <label>Diện tích (m2)</label>
                <input type="number" required min="1" placeholder="VD: 50" value={area} onChange={(e) => setArea(Number(e.target.value))} />
              </div>
            </div>

            <div className="cs-form-group">
              <label>Địa chỉ cụ thể</label>
              <input type="text" required placeholder="Số nhà, Tên đường, Phường, Quận..." value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          {/* SECTION 2: THỜI GIAN HOẠT ĐỘNG */}
          <div className="cs-section">
            <h3 className="cs-section-title"><Clock size={18} /> Thời gian hoạt động</h3>
            {operatingHours.map((hour, idx) => (
              <div key={idx} className="cs-dynamic-row">
                <select value={hour.dayOfWeek} onChange={(e) => handleHourChange(idx, 'dayOfWeek', Number(e.target.value))}>
                  <option value={1}>Thứ 2</option><option value={2}>Thứ 3</option>
                  <option value={3}>Thứ 4</option><option value={4}>Thứ 5</option>
                  <option value={5}>Thứ 6</option><option value={6}>Thứ 7</option>
                  <option value={0}>Chủ Nhật</option>
                </select>
                <input type="time" value={hour.openTime} onChange={(e) => handleHourChange(idx, 'openTime', e.target.value)} />
                <span>đến</span>
                <input type="time" value={hour.closeTime} onChange={(e) => handleHourChange(idx, 'closeTime', e.target.value)} />
                {operatingHours.length > 1 && (
                  <button type="button" className="cs-btn-icon-danger" onClick={() => handleRemoveHours(idx)}><Trash2 size={16} /></button>
                )}
              </div>
            ))}
            <button type="button" className="cs-btn-add" onClick={handleAddHours}><Plus size={16} /> Thêm khung giờ</button>
          </div>

          {/* SECTION 3: TIỆN ÍCH */}
          <div className="cs-section">
            <h3 className="cs-section-title"><CheckCircle size={18} /> Tiện ích (Bàn ghế, Wifi, Máy lạnh...)</h3>
            {amenities.map((item, idx) => (
              <div key={idx} className="cs-dynamic-row">
                <input type="text" placeholder="Tên tiện ích (VD: Máy lạnh)" value={item.name} onChange={(e) => handleAmenityChange(idx, 'name', e.target.value)} style={{ flex: 2 }} />
                <input type="number" min="1" placeholder="Số lượng" value={item.quantity} onChange={(e) => handleAmenityChange(idx, 'quantity', Number(e.target.value))} style={{ flex: 1 }} />
                {amenities.length > 1 && (
                  <button type="button" className="cs-btn-icon-danger" onClick={() => handleRemoveAmenity(idx)}><Trash2 size={16} /></button>
                )}
              </div>
            ))}
            <button type="button" className="cs-btn-add" onClick={handleAddAmenity}><Plus size={16} /> Thêm tiện ích</button>
          </div>

          {/* BÁO LỖI & NÚT SUBMIT */}
          {error && <div className="cs-error-alert">{error}</div>}
          
          <div className="cs-footer">
            <button type="submit" className="cs-btn-submit" disabled={isLoading}>
              {isLoading ? 'Đang tạo dữ liệu...' : 'Hoàn tất & Đăng tin'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};