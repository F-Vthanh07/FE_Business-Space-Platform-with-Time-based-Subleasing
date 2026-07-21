/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Minimize2, Clock, Check, ShieldAlert, Briefcase } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { VerificationWarningBanner, useIdentityVerification } from '../../identity-verification';
import '../../shared/ModalShell.css';
import './SpaceForm.css';

interface SpaceFormProps {
  onClose: () => void;
  onSubmit: (data?: any) => void;
  initialData?: any;
}

const AMENITIES_IDS = ['wifi', 'ac', 'parking', 'wc', 'projector', 'sound'];

const DAYS_OF_WEEK_CONFIG = [
  { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }, { id: 0 },
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
  const { isVerified } = useIdentityVerification();

  const [name, setName] = useState(initialData?.name || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [city, setCity] = useState(initialData?.city || 'Hồ Chí Minh');
  const [area, setArea] = useState(initialData?.area?.toString().replace(/[^\d]/g, '') || '');

  const initialAmenities = (initialData?.amenities || []).map((a: any) => a.name || a);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialAmenities);

  const [operatingHours, setOperatingHours] = useState<any[]>([]);

  const [apiCategories, setApiCategories] = useState<any[]>([]);
  const initialCat = initialData?.spaceAllowedCategories?.[0]?.bussinessCategoryId || '';
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>(initialCat);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/BussinessCategory/GetAll', {
          headers: { 'accept': '*/*' }
        });
        if (res.ok) {
          const data = await res.json();
          setApiCategories(data.filter((c: any) => c.isActive));
        }
      } catch (err) {
        console.error("Lỗi lấy danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialData?.operatingHours && initialData.operatingHours.length > 0) {
      const mappedHours = DAYS_OF_WEEK_CONFIG.map(day => {
        const backendDayId = day.id === 0 ? 0 : day.id - 1;
        const found = initialData.operatingHours.find((h: any) => h.dayOfWeek === backendDayId);
        if (found) {
          return {
            dayOfWeek: day.id,
            enabled: true,
            openTime: found.openTime ? found.openTime.substring(0, 5) : '08:00',
            closeTime: found.closeTime ? found.closeTime.substring(0, 5) : '22:00'
          };
        }
        return { dayOfWeek: day.id, enabled: false, openTime: '08:00', closeTime: '22:00' };
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOperatingHours(mappedHours);
    } else {
      setOperatingHours(
        DAYS_OF_WEEK_CONFIG.map(day => ({
          dayOfWeek: day.id,
          enabled: day.id !== 0,
          openTime: '08:00',
          closeTime: '22:00',
        }))
      );
    }
  }, [initialData]);

  const handleAmenityToggle = (id: string) => {
    setSelectedAmenities(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleDayToggle = (dayOfWeek: number) => {
    setOperatingHours(prev => prev.map(item => item.dayOfWeek === dayOfWeek ? { ...item, enabled: !item.enabled } : item));
  };

  const handleTimeChange = (dayOfWeek: number, type: 'openTime' | 'closeTime', value: string) => {
    setOperatingHours(prev => prev.map(item => item.dayOfWeek === dayOfWeek ? { ...item, [type]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !address || !area) {
      setError('Vui lòng điền đủ tên, địa chỉ và diện tích cơ bản!');
      return;
    }

    const token = localStorage.getItem('portal_token');
    const ownerId = localStorage.getItem('current_user_id') || '01KVJGBEXR0X7A2PN520FJTVZT';

    const payload = {
      name: name,
      address: address,
      city: city,
      area: Number(area),
      isActive: true,
      ownerId: ownerId,
      amenities: selectedAmenities.map(am => ({
        name: am,
        quantity: 1,
        isActive: true
      })),
      operatingHours: operatingHours.filter(h => h.enabled).map(h => ({
        dayOfWeek: h.dayOfWeek === 0 ? 0 : h.dayOfWeek - 1,
        openTime: h.openTime.length === 5 ? `${h.openTime}:00` : h.openTime,
        closeTime: h.closeTime.length === 5 ? `${h.closeTime}:00` : h.closeTime
      })),
      spaceAllowedCategories: selectedCategoryId !== ''
        ? [{ bussinessCategoryId: selectedCategoryId }]
        : []
    };

    setIsLoading(true);
    try {
      const isEditing = !!initialData;
      const url = isEditing
        ? `https://flexi-space-capstone-project.onrender.com/api/Space/Update${initialData.id}`
        : 'https://flexi-space-capstone-project.onrender.com/api/Space/Create';

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
        throw new Error(`Lỗi khi ${isEditing ? 'cập nhật' : 'tạo'} mặt bằng.`);
      }

      onSubmit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-card modal-shell animate-in">

        <div className="modal-header">
          <div className="modal-title-area">
            <div className="modal-icon-wrap modal-icon-wrap--blue"><Building2 size={16} /></div>
            <div>
              <h2 className="modal-title">{initialData ? t('spaceForm.editSpace') : t('spaceForm.registerSpace')}</h2>
              <p className="modal-subtitle text-secondary">{t('spaceForm.spaceFormSubtitle')}</p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} disabled={isLoading}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {!isVerified && <VerificationWarningBanner />}

          <div className="form-section">
            <h3 className="form-section-title">{t('spaceForm.formSectionBasic')}</h3>

            <div className="form-group">
              <label className="form-label">{t('spaceForm.formLabelSpaceName')}</label>
              <div className="input-with-icon">
                <Building2 size={14} className="input-icon" />
                <input type="text" placeholder={t('spaceForm.formPlaceholderSpaceName')} value={name} onChange={(e) => setName(e.target.value)} className="form-input" disabled={isLoading} required />
              </div>
            </div>

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

          <div className="form-grid-2">
            <div className="form-section">
              <h3 className="form-section-title">{t('spaceForm.formSectionAmenities')} (Tùy chọn)</h3>
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

            <div className="form-section">
              <h3 className="form-section-title">Ngành nghề cho phép (Tùy chọn)</h3>

              <div className="form-group" style={{ marginTop: '8px' }}>
                <div className="input-with-icon">
                  <Briefcase size={14} className="input-icon" />
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="form-select-input"
                    disabled={isLoading}
                  >
                    <option value="">Không (Không thiết lập)</option>
                    {apiCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="section-desc text-secondary" style={{ marginTop: '8px' }}>
                Nếu chọn "Không", mặt bằng này sẽ không có ràng buộc ngành nghề khi tạo bài đăng cho thuê.
              </p>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">{t('spaceForm.formSectionOperating')} (Tùy chọn)</h3>
            <p className="section-desc text-secondary">Tắt tất cả các ngày nếu bạn chưa muốn thiết lập giờ cố định</p>

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

          {error && (
            <div className="form-error-box">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions-footer">
            <button type="button" className="btn-ghost cancel-btn" onClick={onClose} disabled={isLoading}>
              {t('spaceForm.cancel')}
            </button>
            <button type="submit" className="btn-primary submit-btn" disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : t('spaceForm.saveSpaceInfo')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};