/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Building2, Clock, Check, ShieldAlert, Briefcase } from 'lucide-react';
import { useThemeLanguage } from '../../../../context/ThemeLanguageContext';
import { VerificationWarningBanner, useIdentityVerification } from '../../../identity-verification';
import '../../../shared/ModalShell.css';
import './SpaceForm.css';

interface SpacePartFormProps {
  onClose: () => void;
  onSubmit: (data?: any) => void;
  initialData?: any;
  parentSpace: any; // Dữ liệu space gốc, bắt buộc phải có để lấy parentSpace.id, latitude, longitude
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

export const SpacePartForm: React.FC<SpacePartFormProps> = ({ onClose, onSubmit, initialData, parentSpace }) => {
  const { t, language } = useThemeLanguage();
  const { isVerified } = useIdentityVerification();

  const [name, setName] = useState(initialData?.name || '');
  const [area, setArea] = useState(initialData?.area?.toString().replace(/[^\d]/g, '') || '');

  const initialAmenities = (initialData?.amenities || []).map((a: any) => a.name || a);
  const initialCustomAmenities = initialAmenities.filter((a: string) => !AMENITIES_IDS.includes(a));
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialAmenities.filter((a: string) => AMENITIES_IDS.includes(a))
  );
  const [customAmenityChecked, setCustomAmenityChecked] = useState(initialCustomAmenities.length > 0);
  const [customAmenityText, setCustomAmenityText] = useState(initialCustomAmenities.join(', '));

  const [operatingHours, setOperatingHours] = useState<any[]>([]);
  const [operatingHourOption, setOperatingHourOption] = useState<'full' | 'custom'>('full');
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [fullWeekOpen, setFullWeekOpen] = useState('08:00');
  const [fullWeekClose, setFullWeekClose] = useState('22:00');

  const [apiCategories, setApiCategories] = useState<any[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const initialCat = initialData?.spaceAllowedCategories?.[0]?.bussinessCategoryId || '';
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>(initialCat);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingPartsTotalArea, setExistingPartsTotalArea] = useState(0);

  useEffect(() => {
    const fetchExistingParts = async () => {
      try {
        const token = localStorage.getItem('portal_token');
        const url = `https://flexi-space-capstone-project.onrender.com/api/SpacePart/GetByParent/${parentSpace.id}`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
        });
        if (res.ok) {
          const data = await res.json();
          const parts = Array.isArray(data) ? data : (data?.items || []);
          const totalArea = parts.reduce((sum: number, p: any) => sum + (p.isActive ? p.area : 0), 0);
          setExistingPartsTotalArea(totalArea);

          const usedBackendDays = new Set<number>();
          
          // Fetch chi tiết từng space part để lấy operatingHours
          const detailPromises = parts
            .filter((p: any) => p.isActive && (!initialData || (p.id || p.Id) !== (initialData.id || initialData.Id)))
            .map((p: any) => {
              const partId = p.id || p.Id;
              if (!partId) return Promise.resolve(null);
              return fetch(`https://flexi-space-capstone-project.onrender.com/api/SpacePart/GetById/${partId}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
              }).then(r => r.ok ? r.json() : null);
            });
            
          const detailedParts = await Promise.all(detailPromises);
          
          detailedParts.forEach((dp: any) => {
            const opHours = dp?.operatingHours || dp?.OperatingHours;
            if (opHours && Array.isArray(opHours)) {
              opHours.forEach((h: any) => {
                const day = h.dayOfWeek !== undefined ? h.dayOfWeek : h.DayOfWeek;
                usedBackendDays.add(day);
              });
            }
          });

          const parentBackendDays = Array.isArray(parentSpace.operatingHours) && parentSpace.operatingHours.length > 0 
            ? parentSpace.operatingHours.map((h: any) => h.dayOfWeek)
            : [0, 1, 2, 3, 4, 5, 6]; 

          const available = DAYS_OF_WEEK_CONFIG.map(d => d.id).filter(frontendId => {
            const backendId = frontendId === 0 ? 0 : frontendId - 1;
            return parentBackendDays.includes(backendId) && !usedBackendDays.has(backendId);
          });
          setAvailableDays(available);
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin space parts hiện tại:", err);
      }
    };
    if (parentSpace?.id) {
      fetchExistingParts();
    }
  }, [parentSpace, initialData]);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsCategoriesLoading(true);
      try {
        const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/BussinessCategory/GetAll', {
          headers: { 'accept': '*/*' }
        });
        if (res.ok) {
          const data = await res.json();
          setApiCategories(Array.isArray(data) ? data : (data?.items || []));
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách ngành nghề:", err);
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialData?.operatingHours && initialData.operatingHours.length > 0) {
      const isFullWeek = initialData.operatingHours.length >= availableDays.length && availableDays.length > 0 && initialData.operatingHours.every((h: any, _i: number, arr: any[]) => h.openTime === arr[0].openTime && h.closeTime === arr[0].closeTime);
      if (isFullWeek) {
        setOperatingHourOption('full');
        setFullWeekOpen(initialData.operatingHours[0].openTime ? initialData.operatingHours[0].openTime.substring(0, 5) : '08:00');
        setFullWeekClose(initialData.operatingHours[0].closeTime ? initialData.operatingHours[0].closeTime.substring(0, 5) : '22:00');
      } else {
        setOperatingHourOption('custom');
      }

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
      setOperatingHours(mappedHours);
    } else {
      setOperatingHourOption('full');
      setOperatingHours(
        DAYS_OF_WEEK_CONFIG.map(day => ({
          dayOfWeek: day.id,
          enabled: availableDays.includes(day.id),
          openTime: '08:00',
          closeTime: '22:00',
        }))
      );
    }
  }, [initialData, availableDays]);

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

    if (!name || !name.trim()) {
      setError('Vui lòng nhập tên không gian.');
      return;
    }

    const numArea = Number(area);
    if (!area || isNaN(numArea) || numArea <= 0) {
      setError('Diện tích phải là số lớn hơn 0.');
      return;
    }

    if (!parentSpace || !parentSpace.id) {
      setError('Lỗi: Không tìm thấy ID của space gốc.');
      return;
    }
    
    // Validate against parent area
    const parentArea = Number(parentSpace.area);
    const availableArea = parentArea - existingPartsTotalArea;
    if (!isNaN(parentArea) && numArea > availableArea && !initialData) {
      setError(`Diện tích không gian con (${numArea}m²) không được vượt quá diện tích còn lại của không gian gốc (${availableArea}m²).`);
      return;
    } else if (!isNaN(parentArea) && numArea > parentArea) {
      setError(`Diện tích không gian con (${numArea}m²) không được vượt quá tổng diện tích không gian gốc (${parentArea}m²).`);
      return;
    }

    setIsLoading(true);

    const token = localStorage.getItem('portal_token');

    const customAmenities = customAmenityChecked
      ? customAmenityText
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
      : [];
    const allAmenities = [...selectedAmenities, ...customAmenities];

    const payload = {
      name: name,
      area: Number(area),
      isActive: true,
      latitude: parentSpace.latitude || 0,
      longitude: parentSpace.longitude || 0,
      amenities: allAmenities.map(am => ({
        name: am,
        quantity: 1,
        isActive: true
      })),
      operatingHours: operatingHourOption === 'full' 
        ? availableDays.map(dId => ({
            dayOfWeek: dId === 0 ? 0 : dId - 1,
            openTime: fullWeekOpen.length === 5 ? `${fullWeekOpen}:00` : fullWeekOpen,
            closeTime: fullWeekClose.length === 5 ? `${fullWeekClose}:00` : fullWeekClose
          }))
        : operatingHours.filter(h => h.enabled && availableDays.includes(h.dayOfWeek)).map(h => ({
            dayOfWeek: h.dayOfWeek === 0 ? 0 : h.dayOfWeek - 1,
            openTime: h.openTime.length === 5 ? `${h.openTime}:00` : h.openTime,
            closeTime: h.closeTime.length === 5 ? `${h.closeTime}:00` : h.closeTime
          })),
      spaceAllowedCategories: selectedCategoryId !== ''
        ? [{ bussinessCategoryId: selectedCategoryId }]
        : []
    };

    try {
      const isEditing = !!initialData;
      const url = isEditing
        ? `https://flexi-space-capstone-project.onrender.com/api/SpacePart/Update/${initialData.id}`
        : `https://flexi-space-capstone-project.onrender.com/api/SpacePart/Create/${parentSpace.id}`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        
        // Dịch lỗi API (ví dụ: Total area of active space parts (24) cannot exceed parent space area (13).)
        let errorMessage = errData.message || 'Có lỗi xảy ra, vui lòng thử lại.';
        if (errorMessage.includes('cannot exceed parent space area')) {
          errorMessage = 'Tổng diện tích các không gian chia nhỏ vượt quá diện tích không gian gốc.';
        }
        throw new Error(errorMessage);
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
              <h2 className="modal-title">{initialData ? 'Chỉnh sửa không gian' : 'Tạo không gian con'}</h2>
              <p className="modal-subtitle text-secondary">Thuộc không gian: {parentSpace?.name}</p>
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

            <div className="form-group">
              <label className="form-label">{t('spaceForm.formLabelArea') || 'Diện tích (m²)'}</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={`Nhập diện tích${!initialData ? ` (Tối đa ${parentSpace.area - existingPartsTotalArea}m²)` : ''}`}
                  value={area}
                  onChange={(e) => setArea(e.target.value.replace(/[^\d]/g, ''))}
                  className="form-input"
                  disabled={isLoading}
                  required
                />
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

                <label
                  className={`checkbox-item ${customAmenityChecked ? 'checkbox-item--checked' : ''}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type === 'text') {
                      e.stopPropagation();
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={customAmenityChecked}
                    onChange={() => setCustomAmenityChecked(prev => !prev)}
                    className="hidden-checkbox"
                    disabled={isLoading}
                  />
                  <span className="checkbox-indicator">{customAmenityChecked && <Check size={10} />}</span>
                  <input
                    type="text"
                    value={customAmenityText}
                    onChange={(e) => setCustomAmenityText(e.target.value)}
                    onFocus={() => !customAmenityChecked && setCustomAmenityChecked(true)}
                    placeholder="Tiện ích khác..."
                    disabled={isLoading}
                    className="checkbox-label"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'inherit',
                      width: '100%',
                      font: 'inherit'
                    }}
                  />
                </label>
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
                    disabled={isLoading || isCategoriesLoading}
                  >
                    <option value="">
                      {isCategoriesLoading ? 'Đang tải ngành nghề...' : 'Không (Không thiết lập)'}
                    </option>
                    {apiCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="section-desc text-secondary" style={{ marginTop: '8px' }}>
                Nếu chọn "Không", mặt bằng này sẽ không có ràng buộc ngành nghề.
              </p>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">{t('spaceForm.formSectionOperating')} (Tùy chọn)</h3>
            <p className="section-desc text-secondary">Tắt tất cả các ngày nếu bạn chưa muốn thiết lập giờ cố định</p>

            <div className="radio-group-horizontal" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
              <label className="radio-label">
                <input
                  type="radio"
                  name="operatingHourOption"
                  value="full"
                  checked={operatingHourOption === 'full'}
                  onChange={() => setOperatingHourOption('full')}
                />
                Áp dụng tất cả ngày khả dụng ({availableDays.length})
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="operatingHourOption"
                  value="custom"
                  checked={operatingHourOption === 'custom'}
                  onChange={() => setOperatingHourOption('custom')}
                />
                {t('spaceForm.customDays') !== 'spaceForm.customDays' ? t('spaceForm.customDays') : 'Tùy chỉnh theo ngày'}
              </label>
            </div>

            {operatingHourOption === 'full' && (
              <div className="full-week-time-picker" style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span className="text-secondary" style={{ fontSize: '0.9rem' }}>Áp dụng chung cho tất cả ngày khả dụng:</span>
                <div className="day-time-pickers" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div className="time-picker-group">
                    <Clock size={12} className="time-icon" />
                    <input
                      type="time"
                      value={fullWeekOpen}
                      onChange={(e) => setFullWeekOpen(e.target.value)}
                      className="time-input"
                    />
                  </div>
                  <span className="time-separator">-</span>
                  <div className="time-picker-group">
                    <Clock size={12} className="time-icon" />
                    <input
                      type="time"
                      value={fullWeekClose}
                      onChange={(e) => setFullWeekClose(e.target.value)}
                      className="time-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {operatingHourOption === 'custom' && (
            <div className="operating-hours-list">
              {operatingHours.filter(item => availableDays.includes(item.dayOfWeek) || (initialData && item.enabled)).map(item => (
                <div key={item.dayOfWeek} className={`operating-day-row ${item.enabled ? '' : 'day-disabled'}`}>
                  <label className={`day-toggle-label ${item.enabled ? 'checkbox-item--checked' : ''}`}>
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
            )}
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