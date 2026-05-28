import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Minimize2, Clock, Check } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './SpaceForm.css';

interface SpaceFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const AMENITIES_IDS = ['wifi', 'ac', 'parking', 'wc', 'projector', 'sound'];
const CATEGORIES_IDS = ['retail', 'cafe', 'office', 'kiosk'];

const DAYS_OF_WEEK_CONFIG = [
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 },
  { id: 7 },
  { id: 1 },
];

const getDayLabel = (id: number, lang: 'en' | 'vi') => {
  const days: Record<number, { en: string; vi: string }> = {
    2: { en: 'Monday', vi: 'Thứ Hai' },
    3: { en: 'Tuesday', vi: 'Thứ Ba' },
    4: { en: 'Wednesday', vi: 'Thứ Tư' },
    5: { en: 'Thursday', vi: 'Thứ Năm' },
    6: { en: 'Friday', vi: 'Thứ Sáu' },
    7: { en: 'Saturday', vi: 'Thứ Bảy' },
    1: { en: 'Sunday', vi: 'Chủ Nhật' },
  };
  return days[id]?.[lang] || '';
};

export const SpaceForm: React.FC<SpaceFormProps> = ({ onClose, onSubmit, initialData }) => {
  const { t, language } = useThemeLanguage();
  const [name, setName] = useState(initialData?.name || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [area, setArea] = useState(initialData?.area?.replace(/[^\d]/g, '') || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData?.amenities || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.categories || []);
  
  // Khởi tạo lịch hoạt động
  const [operatingHours, setOperatingHours] = useState<any[]>([]);

  useEffect(() => {
    if (initialData?.operatingHours) {
      setOperatingHours(initialData.operatingHours);
    } else {
      setOperatingHours(
        DAYS_OF_WEEK_CONFIG.map(day => ({
          dayOfWeek: day.id,
          enabled: day.id !== 1, // Chủ Nhật tắt mặc định
          openTime: '08:00',
          closeTime: '22:00',
        }))
      );
    }
  }, [initialData]);

  const handleAmenityToggle = (id: string) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDayToggle = (dayOfWeek: number) => {
    setOperatingHours(prev =>
      prev.map(item =>
        item.dayOfWeek === dayOfWeek ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const handleTimeChange = (dayOfWeek: number, type: 'openTime' | 'closeTime', value: string) => {
    setOperatingHours(prev =>
      prev.map(item =>
        item.dayOfWeek === dayOfWeek ? { ...item, [type]: value } : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !area) {
      alert(t('spaceForm.fillAllFields'));
      return;
    }

    const data = {
      id: initialData?.id || Date.now(),
      name,
      address,
      area: `${area} m²`,
      status: 'pending', // Trạng thái mặc định chờ duyệt
      revenue: '0₫',
      occupancy: 0,
      amenities: selectedAmenities,
      categories: selectedCategories,
      operatingHours: operatingHours.filter(h => h.enabled),
    };

    onSubmit(data);
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
          <button className="btn-icon close-btn" onClick={onClose}>
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
                <input
                  type="text"
                  placeholder={t('spaceForm.formPlaceholderSpaceName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">{t('spaceForm.formLabelAddress')}</label>
                <div className="input-with-icon">
                  <MapPin size={14} className="input-icon" />
                  <input
                    type="text"
                    placeholder={t('spaceForm.formPlaceholderAddress')}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('spaceForm.formLabelArea')}</label>
                <div className="input-with-icon">
                  <Minimize2 size={14} className="input-icon" />
                  <input
                    type="number"
                    placeholder={t('spaceForm.formPlaceholderArea')}
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
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
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleAmenityToggle(id)}
                        className="hidden-checkbox"
                      />
                      <span className="checkbox-indicator">
                        {isChecked && <Check size={10} />}
                      </span>
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
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCategoryToggle(id)}
                        className="hidden-checkbox"
                      />
                      <span className="checkbox-indicator">
                        {isChecked && <Check size={10} />}
                      </span>
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
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={() => handleDayToggle(item.dayOfWeek)}
                      className="hidden-checkbox"
                    />
                    <span className="checkbox-indicator">
                      {item.enabled && <Check size={10} />}
                    </span>
                    <span className="day-name">{getDayLabel(item.dayOfWeek, language)}</span>
                  </label>

                  <div className="day-time-pickers">
                    <div className="time-picker-group">
                      <Clock size={12} className="time-icon" />
                      <input
                        type="time"
                        value={item.openTime}
                        onChange={(e) => handleTimeChange(item.dayOfWeek, 'openTime', e.target.value)}
                        disabled={!item.enabled}
                        className="time-input"
                      />
                    </div>
                    <span className="time-separator">{t('spaceForm.formTimeSeparator')}</span>
                    <div className="time-picker-group">
                      <Clock size={12} className="time-icon" />
                      <input
                        type="time"
                        value={item.closeTime}
                        onChange={(e) => handleTimeChange(item.dayOfWeek, 'closeTime', e.target.value)}
                        disabled={!item.enabled}
                        className="time-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="form-actions-footer">
            <button type="button" className="btn-ghost cancel-btn" onClick={onClose}>
              {t('spaceForm.cancel')}
            </button>
            <button type="submit" className="btn-primary submit-btn">
              {t('spaceForm.saveSpaceInfo')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
