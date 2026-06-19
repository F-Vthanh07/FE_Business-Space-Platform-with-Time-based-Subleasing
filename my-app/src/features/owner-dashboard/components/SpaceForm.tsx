import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Minimize2, Clock, Check, ShieldAlert } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './SpaceForm.css';

interface SpaceFormProps {
  onClose: () => void;
  onSubmit: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

const AMENITIES_IDS = ['wifi', 'ac', 'parking', 'wc', 'projector', 'sound'];
const CATEGORIES_IDS = ['retail', 'cafe', 'office', 'kiosk'];

const DAYS_OF_WEEK_CONFIG = [
  { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }, { id: 0 }, // 0 là Chủ Nhật theo chuẩn BE
];

const getDayLabel = (id: number, lang: 'en' | 'vi') => {
  const days: Record<number, { en: string; vi: string }> = {
    2: { en: 'Monday', vi: 'Thứ Hai' },
    3: { en: 'Tuesday', vi: 'Thứ Ba' },
    4: { en: 'Wednesday', vi: 'Thứ Tư' },
    5: { en: 'Thursday', vi: 'Thứ Năm' },
    6: { en: 'Friday', vi: 'Thứ Sáu' },
    7: { en: 'Saturday', vi: 'Thứ Bảy' },
    0: { en: 'Sunday', vi: 'Chủ Nhật' },
  };
  return days[id]?.[lang] || '';
};

export const SpaceForm: React.FC<SpaceFormProps> = ({ onClose, onSubmit, initialData }) => {
  const { t, language } = useThemeLanguage();
  const [name, setName] = useState(initialData?.name || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [city, setCity] = useState(initialData?.city || 'Hồ Chí Minh'); // Thêm city cho API
  const [area, setArea] = useState(initialData?.area?.replace(/[^\d]/g, '') || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData?.amenities || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categories || []);
  
  // Khởi tạo lịch hoạt động
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [operatingHours, setOperatingHours] = useState<any[]>([]);
  
  // State API
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData?.operatingHours) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOperatingHours(initialData.operatingHours);
    } else {
      setOperatingHours(
        DAYS_OF_WEEK_CONFIG.map(day => ({
          dayOfWeek: day.id,
          enabled: day.id !== 0, // Chủ Nhật (0) tắt mặc định
          openTime: '08:00',
          closeTime: '22:00',
        }))
      );
    }
  }, [initialData]);

  const handleAmenityToggle = (id: string) => {
    setSelectedAmenities(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleDayToggle = (dayOfWeek: number) => {
    setOperatingHours(prev => prev.map(item => item.dayOfWeek === dayOfWeek ? { ...item, enabled: !item.enabled } : item));
  };

  const handleTimeChange = (dayOfWeek: number, type: 'openTime' | 'closeTime', value: string) => {
    setOperatingHours(prev => prev.map(item => item.dayOfWeek === dayOfWeek ? { ...item, [type]: value } : item));
  };

  // --- API LOGIC NẰM Ở ĐÂY ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !address || !area) {
      setError(t('spaceForm.fillAllFields') || 'Vui lòng điền đủ thông tin cơ bản!');
      return;
    }

    const token = localStorage.getItem('portal_token');
    if (!token) {
      setError('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
      return;
    }

    // 1. CHUẨN BỊ PAYLOAD CHO SWAGGER
    // 1. CHUẨN BỊ PAYLOAD TẠM THỜI (THEO Ý BACKEND)
    const payload = {
      id: 0,
      ownerId: null,
      name: name,
      address: address,
      city: city,
      area: Number(area),
      isDeleted: false, // BE gửi true là hơi ngáo, mình cứ gửi false để mặt bằng không bị xóa nhé =))
      isActive: true,
      // TẠM THỜI GỬI MẢNG RỖNG ĐỂ TRÁNH LỖI 400 NOT FOUND
      amenities: [],
      operatingHours: [],
      spaceAllowedCategories: []
    };

    setIsLoading(true);
    try {
      // KIỂM TRA XEM ĐANG LÀ THÊM MỚI HAY CHỈNH SỬA
      const isEditing = !!initialData;
      
      // Nếu sửa thì gọi Update{id}, nếu tạo thì gọi Create
      const url = isEditing 
        ? `https://localhost:7069/api/Space/Update/${initialData.id}` 
        : 'https://localhost:7069/api/Space/Create';
        
      // Sửa dùng phương thức PUT, Tạo dùng POST
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        },
        // Nếu API PUT bắt bẻ ID trong body, ông ném thêm initialData.id vào đây nhé
        body: JSON.stringify({ ...payload, id: isEditing ? initialData.id : 0 }) 
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Lỗi khi ${isEditing ? 'cập nhật' : 'tạo'} mặt bằng.`);
      }

      // THÀNH CÔNG -> Đóng form và gọi hàm báo cho component cha biết
      onSubmit();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-form-backdrop">
      <div className="glass-card space-form-modal animate-in">
        
        {/* Header */}
        <div className="space-form-header">
          <div className="space-form-title-area">
            <div className="space-form-icon-wrap">
              <Building2 size={16} />
            </div>
            <div>
              <h2 className="form-modal-title">{initialData ? t('spaceForm.editSpace') : t('spaceForm.registerSpace')}</h2>
              <p className="form-modal-subtitle text-secondary">{t('spaceForm.spaceFormSubtitle')}</p>
            </div>
          </div>
          <button className="btn-icon close-btn" onClick={onClose} disabled={isLoading}>
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-form-body">
          
          {/* Thông tin cơ bản */}
          <div className="form-section">
            <h3 className="form-section-title">{t('spaceForm.formSectionBasic')}</h3>
            
            <div className="form-group">
              <label className="form-label">{t('spaceForm.formLabelSpaceName')}</label>
              <div className="input-with-icon">
                <Building2 size={14} className="input-icon" />
                <input type="text" placeholder={t('spaceForm.formPlaceholderSpaceName')} value={name} onChange={(e) => setName(e.target.value)} className="form-input" disabled={isLoading} required />
              </div>
            </div>

            {/* Thêm ô chọn Thành phố cho đủ chuẩn API */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Thành phố (Tỉnh/Thành)</label>
                <div className="input-with-icon">
                  <MapPin size={14} className="input-icon" />
                  <input type="text" placeholder="Ví dụ: Hồ Chí Minh" value={city} onChange={(e) => setCity(e.target.value)} className="form-input" disabled={isLoading} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('spaceForm.formLabelArea')}</label>
                <div className="input-with-icon">
                  <Minimize2 size={14} className="input-icon" />
                  <input type="number" placeholder={t('spaceForm.formPlaceholderArea')} value={area} onChange={(e) => setArea(e.target.value)} className="form-input" disabled={isLoading} required />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('spaceForm.formLabelAddress')}</label>
              <div className="input-with-icon">
                <MapPin size={14} className="input-icon" />
                <input type="text" placeholder={t('spaceForm.formPlaceholderAddress')} value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" disabled={isLoading} required />
              </div>
            </div>
          </div>

          {/* Tiện ích và Ngành nghề */}
          <div className="form-grid-2">
            
            {/* Tiện ích */}
            <div className="form-section">
              <h3 className="form-section-title">{t('spaceForm.formSectionAmenities')}</h3>
              <div className="checkbox-list">
                {AMENITIES_IDS.map(id => {
                  const isChecked = selectedAmenities.includes(id);
                  return (
                    <label key={id} className={`checkbox-item ${isChecked ? 'checkbox-item--checked' : ''}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => handleAmenityToggle(id)} className="hidden-checkbox" disabled={isLoading} />
                      <span className="checkbox-indicator">{isChecked && <Check size={10} />}</span>
                      <span className="checkbox-label">{t('amenity.' + id)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Ngành nghề cho phép */}
            <div className="form-section">
              <h3 className="form-section-title">{t('spaceForm.formSectionCategories')}</h3>
              <div className="checkbox-list">
                {CATEGORIES_IDS.map(id => {
                  const isChecked = selectedCategories.includes(id);
                  return (
                    <label key={id} className={`checkbox-item ${isChecked ? 'checkbox-item--checked' : ''}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => handleCategoryToggle(id)} className="hidden-checkbox" disabled={isLoading} />
                      <span className="checkbox-indicator">{isChecked && <Check size={10} />}</span>
                      <span className="checkbox-label">{t('category.' + id)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Khung giờ hoạt động */}
          <div className="form-section">
            <h3 className="form-section-title">{t('spaceForm.formSectionOperating')}</h3>
            <p className="section-desc text-secondary">{t('spaceForm.formOperatingSubtitle')}</p>
            
            <div className="operating-hours-list">
              {operatingHours.map(item => (
                <div key={item.dayOfWeek} className={`operating-day-row ${item.enabled ? '' : 'day-disabled'}`}>
                  <label className="day-toggle-label">
                    <input type="checkbox" checked={item.enabled} onChange={() => handleDayToggle(item.dayOfWeek)} className="hidden-checkbox" disabled={isLoading} />
                    <span className="checkbox-indicator">{item.enabled && <Check size={10} />}</span>
                    <span className="day-name">{getDayLabel(item.dayOfWeek, language)}</span>
                  </label>

                  <div className="day-time-pickers">
                    <div className="time-picker-group">
                      <Clock size={12} className="time-icon" />
                      <input type="time" value={item.openTime} onChange={(e) => handleTimeChange(item.dayOfWeek, 'openTime', e.target.value)} disabled={!item.enabled || isLoading} className="time-input" />
                    </div>
                    <span className="time-separator">{t('spaceForm.formTimeSeparator') || '-'}</span>
                    <div className="time-picker-group">
                      <Clock size={12} className="time-icon" />
                      <input type="time" value={item.closeTime} onChange={(e) => handleTimeChange(item.dayOfWeek, 'closeTime', e.target.value)} disabled={!item.enabled || isLoading} className="time-input" />
                    </div>
                  </div>
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
              {t('spaceForm.cancel')}
            </button>
            <button type="submit" className="btn-primary submit-btn" disabled={isLoading}>
              {isLoading ? 'Đang tạo...' : t('spaceForm.saveSpaceInfo')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};