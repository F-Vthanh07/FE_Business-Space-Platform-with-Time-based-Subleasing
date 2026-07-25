/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Clock, Check, ShieldAlert, Briefcase } from 'lucide-react';
import { useThemeLanguage } from '../../../../context/ThemeLanguageContext';
import { VerificationWarningBanner, useIdentityVerification } from '../../../identity-verification';
import '../../../shared/ModalShell.css';
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

// ĐỔI SANG EMAIL LIÊN HỆ THẬT CỦA BẠN — Nominatim dùng cái này để định danh app,
// không dùng được header User-Agent tự set (trình duyệt chặn header đó).
const NOMINATIM_CONTACT_EMAIL = 'contact@yourdomain.com';

export const SpaceForm: React.FC<SpaceFormProps> = ({ onClose, onSubmit, initialData }) => {
  const { t, language } = useThemeLanguage();
  const { isVerified } = useIdentityVerification();

  const [name, setName] = useState(initialData?.name || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [provinces, setProvinces] = useState<{ value: string; label: string }[]>([]);
  const [districts, setDistricts] = useState<{ value: string; label: string }[]>([]);
  const [wards, setWards] = useState<{ value: string; label: string }[]>([]);

  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [wardCode, setWardCode] = useState('');

  const [provinceLabel, setProvinceLabel] = useState(initialData?.city || '');
  const [districtLabel, setDistrictLabel] = useState('');
  const [wardLabel, setWardLabel] = useState('');

  const [area, setArea] = useState(initialData?.area?.toString().replace(/[^\d]/g, '') || '');

  const initialAmenities = (initialData?.amenities || []).map((a: any) => a.name || a);
  const initialCustomAmenities = initialAmenities.filter((a: string) => !AMENITIES_IDS.includes(a));
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialAmenities.filter((a: string) => AMENITIES_IDS.includes(a))
  );
  const [customAmenityChecked, setCustomAmenityChecked] = useState(initialCustomAmenities.length > 0);
  const [customAmenityText, setCustomAmenityText] = useState(initialCustomAmenities.join(', '));

  const [operatingHours, setOperatingHours] = useState<any[]>([]);

  const [apiCategories, setApiCategories] = useState<any[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const initialCat = initialData?.spaceAllowedCategories?.[0]?.bussinessCategoryId || '';
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>(initialCat);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Cảnh báo riêng cho việc geocode thất bại — KHÔNG chặn submit, chỉ để bạn biết chuyện gì đang xảy ra
  const [geoWarning, setGeoWarning] = useState('');

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch('https://flexi-space-capstone-project.onrender.com/api/Space/GetAddress', {
          headers: { 'accept': '*/*' }
        });
        if (res.ok) {
          const data = await res.json();
          setProvinces(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách tỉnh/thành:", err);
      }
    };
    fetchProvinces();
  }, []);

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

  const handleProvinceChange = async (value: string, label: string) => {
    setProvinceCode(value);
    setProvinceLabel(label);
    setDistrictCode('');
    setDistrictLabel('');
    setWardCode('');
    setWardLabel('');
    setDistricts([]);
    setWards([]);

    try {
      const res = await fetch(
        `https://flexi-space-capstone-project.onrender.com/api/Space/GetAddress?provinceCode=${encodeURIComponent(value)}`,
        { headers: { 'accept': '*/*' } }
      );
      if (res.ok) {
        const data = await res.json();
        setDistricts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách quận/huyện:", err);
    }
  };

  const handleDistrictChange = async (value: string, label: string) => {
    setDistrictCode(value);
    setDistrictLabel(label);
    setWardCode('');
    setWardLabel('');
    setWards([]);

    try {
      const res = await fetch(
        `https://flexi-space-capstone-project.onrender.com/api/Space/GetAddress?provinceCode=${encodeURIComponent(provinceCode)}&districtCode=${encodeURIComponent(value)}`,
        { headers: { 'accept': '*/*' } }
      );
      if (res.ok) {
        const data = await res.json();
        setWards(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách phường/xã:", err);
    }
  };

  const handleAmenityToggle = (id: string) => {
    setSelectedAmenities(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleDayToggle = (dayOfWeek: number) => {
    setOperatingHours(prev => prev.map(item => item.dayOfWeek === dayOfWeek ? { ...item, enabled: !item.enabled } : item));
  };

  const handleTimeChange = (dayOfWeek: number, type: 'openTime' | 'closeTime', value: string) => {
    setOperatingHours(prev => prev.map(item => item.dayOfWeek === dayOfWeek ? { ...item, [type]: value } : item));
  };

  const cleanAddress = (text: string) => {
    if (!text) return '';
    return text.replace(/(Xã|Phường|Thị trấn|Huyện|Quận|Thành phố|Tỉnh|TP\.?)\s+/gi, '').trim();
  };

  // Gọi Nominatim 1 lần, trả về {lat,lng} hoặc null. Log rõ status/lý do fail ra console.
  const tryGeocode = async (query: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=1&countrycodes=vn&email=${encodeURIComponent(NOMINATIM_CONTACT_EMAIL)}`;
      const geoRes = await fetch(url, {
        headers: { 'Accept-Language': 'vi' }
        // Lưu ý: KHÔNG set 'User-Agent' ở đây — trình duyệt luôn chặn/ghi đè header này,
        // set vào code cũ không có tác dụng gì và có thể khiến bạn lầm tưởng đã định danh app.
      });

      if (!geoRes.ok) {
        console.error(`[Geocode] HTTP ${geoRes.status} cho query: "${query}"`);
        return null;
      }

      const geoData = await geoRes.json();
      if (Array.isArray(geoData) && geoData.length > 0) {
        return { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) };
      }
      console.warn(`[Geocode] Không có kết quả cho query: "${query}"`);
      return null;
    } catch (err) {
      // Lỗi kiểu "Failed to fetch" ở đây thường là do CORS bị chặn hoặc mất mạng —
      // mở tab Network xem request tới nominatim.openstreetmap.org có màu đỏ không.
      console.error(`[Geocode] Fetch lỗi cho query: "${query}"`, err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGeoWarning('');

    if (!name || !address || !area) {
      setError('Vui lòng điền đủ tên, địa chỉ và diện tích cơ bản!');
      return;
    }

    setIsLoading(true);

    // 1. GEOCODING — lùi dần từ chi tiết đến tổng quát, log rõ từng bước
    let lat = 0;
    let lng = 0;
    const cleanWard = cleanAddress(wardLabel);
    const cleanDistrict = cleanAddress(districtLabel);
    const cleanProvince = cleanAddress(provinceLabel);

    const queriesToTry = [
      `${address}, ${cleanWard}, ${cleanDistrict}, ${cleanProvince}`,
      `${cleanWard}, ${cleanDistrict}, ${cleanProvince}`,
      `${cleanDistrict}, ${cleanProvince}`,
      cleanProvince
    ].filter(q => q && q.trim() !== ',' && q.replace(/,/g, '').trim() !== '');

    let found = false;
    for (let i = 0; i < queriesToTry.length; i++) {
      if (i > 0) await new Promise(resolve => setTimeout(resolve, 1000)); // tôn trọng rate-limit 1 req/s của Nominatim
      const result = await tryGeocode(queriesToTry[i]);
      if (result) {
        lat = result.lat;
        lng = result.lng;
        found = true;
        break;
      }
    }

    if (!found) {
      console.warn("[Geocode] Đã thử hết các mức, không ra được toạ độ. Lưu mặc định 0,0.");
      setGeoWarning(
        'Không xác định được toạ độ chính xác cho địa chỉ này (toạ độ sẽ lưu tạm là 0,0). ' +
        'Kiểm tra Console/Network (từ khoá "Geocode") để biết chi tiết lỗi.'
      );
    }

    // 2. "city" gộp từ Phường/Quận/Tỉnh đã chọn
    const city = [wardLabel, districtLabel, provinceLabel].filter(Boolean).join(', ');

    // 3. CHUẨN BỊ PAYLOAD
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
      address: address,
      city: city,
      area: Number(area),
      isActive: true,
      latitude: lat,
      longitude: lng,
      amenities: allAmenities.map(am => ({
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

    // 4. GỌI API TẠO / CẬP NHẬT SPACE
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
                <label className="form-label">Tỉnh/Thành</label>
                <select
                  className="form-select-input"
                  value={provinceCode}
                  onChange={(e) => {
                    const label = provinces.find(p => p.value === e.target.value)?.label || '';
                    handleProvinceChange(e.target.value, label);
                  }}
                  disabled={isLoading}
                  required
                >
                  <option value="">-- Chọn Tỉnh/Thành --</option>
                  {provinces.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quận/Huyện</label>
                <select
                  className="form-select-input"
                  value={districtCode}
                  onChange={(e) => {
                    const label = districts.find(d => d.value === e.target.value)?.label || '';
                    handleDistrictChange(e.target.value, label);
                  }}
                  disabled={isLoading || !provinceCode}
                  required
                >
                  <option value="">-- Chọn Quận/Huyện --</option>
                  {districts.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phường/Xã</label>
              <select
                className="form-select-input"
                value={wardCode}
                onChange={(e) => {
                  const label = wards.find(w => w.value === e.target.value)?.label || '';
                  setWardCode(e.target.value);
                  setWardLabel(label);
                }}
                disabled={isLoading || !districtCode}
                required
              >
                <option value="">-- Chọn Phường/Xã --</option>
                {wards.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('spaceForm.formLabelAddress')} (Số nhà, tên đường)</label>
              <div className="input-with-icon">
                <MapPin size={14} className="input-icon" />
                <input type="text" placeholder="Ví dụ: 120 Lê Lợi" value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" disabled={isLoading} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('spaceForm.formLabelArea') || 'Diện tích (m²)'}</label>
              <div className="input-with-icon">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ví dụ: 50"
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

          {geoWarning && (
            <div className="form-error-box" style={{ opacity: 0.85 }}>
              <ShieldAlert size={16} />
              <span>{geoWarning}</span>
            </div>
          )}

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