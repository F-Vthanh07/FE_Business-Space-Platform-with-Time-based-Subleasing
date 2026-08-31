/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Users, ShieldCheck, ShieldAlert, Plus, Trash2, Clock, Type, Wallet, CheckSquare, Briefcase } from 'lucide-react';
import "../../../shared/ModalShell.css";
import { Select } from '../../../../components/Select';
import { createShareListing, updateShareListing } from './shareListing.api';
import { fetchPriorityLevels, type PriorityLevel } from './priorityLevel.api';
import { fetchWalletAccount } from '../../../wallet/api/wallet.api';
import type { ShareListingPayload } from '../../types';
import { formatDateISOOnly } from '../../../../utils/dateUtils';

interface SpaceOption {
  id: number;
  name: string;
}

interface ShareListingFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  spaceOptions: SpaceOption[];
  apiCategories: { id: number; name: string }[];
  apiAmenities: { id: number; name: string }[];
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_LABEL_VI: Record<string, string> = {
  Monday: 'T2', Tuesday: 'T3', Wednesday: 'T4', Thursday: 'T5',
  Friday: 'T6', Saturday: 'T7', Sunday: 'CN'
};

const getValidDaysOfWeek = (validFrom?: string, validTo?: string) => {
  if (!validFrom || !validTo) return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const parseDate = (dStr: string) => {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0);
    }
    return new Date(dStr);
  };

  const start = parseDate(validFrom);
  const end = parseDate(validTo);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 6) {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  }

  const validDays = [];
  const current = new Date(start.getTime());
  const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (let i = 0; i <= diffDays; i++) {
    validDays.push(daysMap[current.getDay()]);
    current.setDate(current.getDate() + 1);
  }
  return [...new Set(validDays)];
};

const getSafeDateString = formatDateISOOnly;

export const ShareListingForm: React.FC<ShareListingFormProps> = ({
  onClose, onSuccess, initialData, spaceOptions, apiCategories, apiAmenities
}) => {
  void apiAmenities;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditingListing = !!initialData;
  const [priorityLevels, setPriorityLevels] = useState<PriorityLevel[]>([]);
  const [priorityLevelId, setPriorityLevelId] = useState<number | ''>('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const [categoriesList, setCategoriesList] = useState<{ id: number; name: string }[]>(apiCategories || []);
  useEffect(() => {
    if (categoriesList.length === 0) {
      fetch('https://flexi-space-capstone-project.onrender.com/api/BussinessCategory/GetAll', { headers: { accept: '*/*' } })
        .then(res => res.json())
        .then(data => {
          const list = Array.isArray(data) ? data : (data?.data || []);
          if (list.length > 0) {
            setCategoriesList(list.map((c: any) => ({ id: c.id || c.Id, name: c.name || c.Name })));
          }
        })
        .catch(() => { });
    }
  }, [apiCategories]);

  useEffect(() => {
    if (isEditingListing) return;
    const loadPriorityLevels = async () => {
      const levels = await fetchPriorityLevels();
      setPriorityLevels(levels);
      if (levels.length > 0) setPriorityLevelId(levels[0].id);
    };
    loadPriorityLevels();

    const loadWalletBalance = async () => {
      try {
        const token = localStorage.getItem('portal_token') || '';
        const wallet = await fetchWalletAccount(token);
        setWalletBalance(wallet?.balance ?? 0);
      } catch (err) {
        console.error("Lỗi lấy số dư ví:", err);
        setWalletBalance(0);
      }
    };
    loadWalletBalance();
  }, [isEditingListing]);

  const [spaceId, setSpaceId] = useState<number | ''>(initialData?.spaceId || '');
  const [timePolicy, setTimePolicy] = useState<any>(null);

  useEffect(() => {
    if (!spaceId) {
      setTimePolicy(null);
      return;
    }
    const fetchTimePolicy = async () => {
      try {
        const token = localStorage.getItem('portal_token') || '';
        const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Listing/ShareListing/TimePolicy/${spaceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTimePolicy(data);
          if (data && data.allowedStartTime) {
            setAllowedStartTime(getSafeDateString(data.allowedStartTime));
          }
          if (data && data.allowedEndTime) {
            setAllowedEndTime(getSafeDateString(data.allowedEndTime));
          }
        } else {
          setTimePolicy(null);
        }
      } catch (err) {
        setTimePolicy(null);
      }
    };
    fetchTimePolicy();
  }, [spaceId]);
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState<number>(initialData?.price || 0);
  const [priceUnit, setPriceUnit] = useState<string>(initialData?.priceUnit || 'PerHour');
  const [description, setDescription] = useState(initialData?.description || '');
  const [maxSubRenter, setMaxSubRenter] = useState<number>(initialData?.shareSpaceDetailMaxSubRenter || 1);
  const [isLegalCommitted, setIsLegalCommitted] = useState<boolean>(initialData?.shareSpaceDetailIsLegalCommitted ?? false);

  const [allowedStartTime, setAllowedStartTime] = useState(() => getSafeDateString(initialData?.allowedStartTime));
  const [allowedEndTime, setAllowedEndTime] = useState(() => {
    if (initialData?.allowedEndTime) return getSafeDateString(initialData.allowedEndTime);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return getSafeDateString(nextMonth);
  });

  const DEFAULT_SHARE_AMENITIES = [
    'Wifi tốc độ cao',
    'Điều hòa / Máy lạnh',
    'Bàn ghế làm việc',
    'Máy in / Photocopy',
    'Chỗ đỗ xe máy / Ô tô',
    'Phòng họp chung',
    'Máy chiếu / TV màn hình lớn',
    'Trà & Cà phê miễn phí',
    'Lễ tân / Nhận bưu phẩm',
    'Tủ locker cá nhân'
  ];

  const DEFAULT_SHARE_CATEGORIES = [
    'Văn phòng / Co-working',
    'Bán lẻ / Cửa hàng',
    'Showroom / Trưng bày sản phẩm',
    'Kho chứa hàng / Logistics nhỏ',
    'Lớp học / Đào tạo / Hội thảo',
    'Studio / Quay phim / Chụp ảnh',
    'Spa / Làm đẹp / Massage',
    'F&B / Quán cà phê'
  ];

  const [amenityItems, setAmenityItems] = useState<{ name: string; quantity: number; isIncluded: boolean; price: number; selected: boolean }[]>(() => {
    const initFromExisting = initialData?.shareSpaceDetailShareSpaceAmenities;
    if (Array.isArray(initFromExisting) && initFromExisting.length > 0) {
      const existingNames = new Set(initFromExisting.map((a: any) => (a.name || '').toLowerCase()));
      const mappedExisting = initFromExisting.map((a: any) => ({
        name: a.name || '',
        quantity: a.quantity || 1,
        isIncluded: a.isIncluded ?? true,
        price: a.price || 0,
        selected: true
      }));
      const remainingDefaults = DEFAULT_SHARE_AMENITIES
        .filter(name => !existingNames.has(name.toLowerCase()))
        .map(name => ({ name, quantity: 1, isIncluded: true, price: 0, selected: false }));
      return [...mappedExisting, ...remainingDefaults];
    }
    return DEFAULT_SHARE_AMENITIES.map(name => ({
      name,
      quantity: 1,
      isIncluded: true,
      price: 0,
      selected: false
    }));
  });

  const [newAmenityName, setNewAmenityName] = useState('');

  const handleAddCustomAmenity = () => {
    if (!newAmenityName.trim()) return;
    setAmenityItems(prev => [
      ...prev,
      { name: newAmenityName.trim(), quantity: 1, isIncluded: true, price: 0, selected: true }
    ]);
    setNewAmenityName('');
  };

  const [categoryItems, setCategoryItems] = useState<{ name: string; note: string; selected: boolean }[]>(() => {
    const initFromExisting = initialData?.shareSpaceDetailShareSpaceCategories;
    if (Array.isArray(initFromExisting) && initFromExisting.length > 0) {
      const existingNames = new Set(initFromExisting.map((c: any) => (c.name || '').toLowerCase()));
      const mappedExisting = initFromExisting.map((c: any) => ({
        name: c.name || '',
        note: c.note || '',
        selected: true
      }));
      const remainingDefaults = DEFAULT_SHARE_CATEGORIES
        .filter(name => !existingNames.has(name.toLowerCase()))
        .map(name => ({ name, note: '', selected: false }));
      return [...mappedExisting, ...remainingDefaults];
    }
    return DEFAULT_SHARE_CATEGORIES.map(name => ({
      name,
      note: '',
      selected: false
    }));
  });

  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    setCategoryItems(prev => [
      ...prev,
      { name: newCategoryName.trim(), note: '', selected: true }
    ]);
    setNewCategoryName('');
  };

  const [showCustomAmenityInput, setShowCustomAmenityInput] = useState(false);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);

  const [availabilities, setAvailabilities] = useState<any[]>(
    initialData?.shareSpaceDetailAvailabilitiesTimes?.length
      ? initialData.shareSpaceDetailAvailabilitiesTimes.map((slot: any) => ({
        ...slot,
        daysOfWeek: slot.daysOfWeek || [],
        specificdate: (slot.specificdate && String(slot.specificdate).startsWith('0001')) ? '' : (slot.specificdate || '')
      }))
      : [{ daysOfWeek: [], specificdate: '', startTime: '08:00', endTime: '12:00', validFrom: getSafeDateString(null), validTo: getSafeDateString(null) }]
  );

  const toggleDayInSlot = (slotIndex: number, day: string) => {
    setAvailabilities(prev => prev.map((slot, i) => {
      if (i !== slotIndex) return slot;
      const days = slot.daysOfWeek.includes(day)
        ? slot.daysOfWeek.filter((d: string) => d !== day)
        : [...slot.daysOfWeek, day];
      return { ...slot, daysOfWeek: days };
    }));
  };

  const updateSlotField = (slotIndex: number, field: string, value: string) => {
    setAvailabilities(prev => prev.map((slot, i) => {
      if (i !== slotIndex) return slot;
      const newSlot = { ...slot, [field]: value };
      if (field === 'validFrom' || field === 'validTo') {
        const validDays = getValidDaysOfWeek(newSlot.validFrom, newSlot.validTo);
        newSlot.daysOfWeek = newSlot.daysOfWeek.filter((d: string) => validDays.includes(d));
      }
      return newSlot;
    }));
  };

  const addSlot = () => {
    setAvailabilities(prev => [...prev, {
      daysOfWeek: [], specificdate: '', startTime: '08:00', endTime: '12:00',
      validFrom: getSafeDateString(null), validTo: getSafeDateString(null)
    }]);
  };

  const removeSlot = (slotIndex: number) => {
    setAvailabilities(prev => prev.filter((_, i) => i !== slotIndex));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (spaceId === '') {
      setError('Vui lòng chọn mặt bằng đang thuê để chia sẻ!');
      return;
    }

    if (!name.trim()) {
      setError('Vui lòng nhập tên bài đăng!');
      return;
    }

    if (!description.trim()) {
      setError('Vui lòng nhập mô tả!');
      return;
    }

    if (!price || price <= 0) {
      setError('Đơn giá phải lớn hơn 0!');
      return;
    }

    // Bỏ validation ngày quá khứ theo yêu cầu mới

    if (new Date(allowedEndTime) <= new Date(allowedStartTime)) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu!');
      return;
    }

    if (!maxSubRenter || maxSubRenter < 1) {
      setError('Số người thuê chung tối đa phải từ 1 trở lên!');
      return;
    }

    if (availabilities.some(slot => slot.daysOfWeek.length === 0 && !slot.specificdate)) {
      setError('Vui lòng chọn ít nhất 1 ngày hoặc ngày cụ thể cho mỗi khung giờ chia sẻ!');
      return;
    }

    const badTimeSlot = availabilities.find(slot => slot.startTime >= slot.endTime);
    if (badTimeSlot) {
      setError('Giờ kết thúc khung giờ chia sẻ phải sau giờ bắt đầu!');
      return;
    }

    const badRangeSlot = availabilities.find(slot => new Date(slot.validFrom) > new Date(slot.validTo));
    if (badRangeSlot) {
      setError('"Áp dụng từ" phải trước hoặc bằng "Áp dụng đến"!');
      return;
    }

    const minTime = new Date(allowedStartTime);
    const maxTime = new Date(allowedEndTime);
    minTime.setHours(0, 0, 0, 0);
    maxTime.setHours(23, 59, 59, 999);

    const outOfBoundsRange = availabilities.find(slot => {
      if (!slot.validFrom || !slot.validTo) return false;
      const vFrom = new Date(slot.validFrom);
      const vTo = new Date(slot.validTo);
      vFrom.setHours(0, 0, 0, 0);
      vTo.setHours(23, 59, 59, 999);
      return vFrom < minTime || vTo > maxTime;
    });

    if (outOfBoundsRange) {
      setError('Khung giờ chia sẻ (Áp dụng từ / đến) phải nằm trong khoảng thời gian hiệu lực bài chia sẻ!');
      return;
    }

    const outOfBoundsSpecific = availabilities.find(slot => {
      if (slot.specificdate && slot.specificdate.trim() !== '' && !slot.specificdate.startsWith('0001')) {
        const sDate = new Date(slot.specificdate);
        if (!isNaN(sDate.getTime())) {
          sDate.setHours(0, 0, 0, 0);
          return sDate < minTime || sDate > maxTime;
        }
      }
      return false;
    });

    if (outOfBoundsSpecific) {
      setError('Ngày cụ thể của khung giờ chia sẻ phải nằm trong khoảng thời gian hiệu lực bài chia sẻ!');
      return;
    }

    if (!isLegalCommitted) {
      setError('Vui lòng tích "Cam kết pháp lý" để xác nhận thỏa thuận!');
      return;
    }

    if (!isEditingListing && priorityLevelId === '') {
      setError('Vui lòng chọn gói bài đăng!');
      return;
    }

    const selectedPriorityLevel = priorityLevels.find(p => p.id === priorityLevelId);
    const chosenPackagePrice = selectedPriorityLevel?.price ?? 0;
    const durationInDays = selectedPriorityLevel?.durationInDays ?? 0;
    if (!isEditingListing && walletBalance !== null && walletBalance < chosenPackagePrice) {
      setError(`Số dư ví không đủ để đăng tin! Cần ${chosenPackagePrice.toLocaleString('vi-VN')} VNĐ, ví hiện có ${walletBalance.toLocaleString('vi-VN')} VNĐ.`);
      return;
    }

    setIsLoading(true);

    const payload: ShareListingPayload = {
      spaceId: Number(spaceId),
      name,
      allowedStartTime,
      allowedEndTime,
      description,
      price: Number(price),
      priceUnit,
      shareSpaceDetailMaxSubRenter: Number(maxSubRenter),
      shareSpaceDetailIsOwner: true,
      shareSpaceDetailIsLegalCommitted: isLegalCommitted,
      shareSpaceDetailShareSpaceAmenities: amenityItems
        .filter(a => a.selected && a.name.trim())
        .map(a => ({
          name: a.name.trim(),
          quantity: Number(a.quantity) || 1,
          isIncluded: a.isIncluded,
          price: a.isIncluded ? 0 : (Number(a.price) || 0)
        })),
      shareSpaceDetailAvailabilitiesTimes: availabilities.map(slot => {
        const hasDays = Array.isArray(slot.daysOfWeek) && slot.daysOfWeek.length > 0;
        const hasSpecificDate = slot.specificdate && !String(slot.specificdate).startsWith('0001') && slot.specificdate.trim() !== '';

        if (hasSpecificDate) {
          return {
            daysOfWeek: null,
            specificdate: slot.specificdate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            validFrom: null,
            validTo: null
          };
        } else {
          return {
            daysOfWeek: hasDays ? slot.daysOfWeek : null,
            specificdate: null,
            startTime: slot.startTime,
            endTime: slot.endTime,
            validFrom: slot.validFrom || null,
            validTo: slot.validTo || null
          };
        }
      }),
      shareSpaceDetailShareSpaceCategories: categoryItems
        .filter(c => c.selected && c.name.trim())
        .map(c => ({
          name: c.name.trim(),
          note: c.note ? c.note.trim() : ''
        }))
    };

    try {
      if (initialData) {
        await updateShareListing(initialData.id || initialData.Id, payload);
      } else {
        await createShareListing(payload, chosenPackagePrice, durationInDays);
      }
      onSuccess();
    } catch (err: any) {
      let errorMsg = err.message || 'Lỗi xử lý hệ thống';
      try {
        const parsed = JSON.parse(errorMsg);
        errorMsg = parsed.message || parsed.title || parsed.detail || errorMsg;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) { /* empty */ }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    // Đã xóa inline styles
    <div className="modal-backdrop">
      <div className="modal-shell modal-shell--wide">

        <div className="modal-header">
          <div className="modal-title-area">
            <div className="modal-icon-wrap modal-icon-wrap--green"><Users size={16} /></div>
            <div>
              <h2 className="modal-title">
                {initialData ? 'Cập nhật mặt bằng chia sẻ' : 'Chia sẻ lại mặt bằng đang thuê'}
              </h2>
              <p className="modal-subtitle text-secondary">Chia sẻ khung giờ hoặc diện tích dư cho người thuê khác</p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} disabled={isLoading}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">

          {/* AI Image Editor Promo Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }}></div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', zIndex: 1 }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                boxShadow: '0 4px 10px rgba(168,85,247,0.3)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" /><path d="m14 7 3 3" /><path d="M5 6v4" /><path d="M19 14v4" /><path d="M10 2v2" /><path d="M7 8H3" /><path d="M21 16h-4" /><path d="M11 3H9" /></svg>
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>
                  Làm đẹp ảnh mặt bằng bằng AI <span style={{ backgroundColor: '#fef08a', color: '#854d0e', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '4px' }}>MỚI</span>
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Xóa rác, làm sáng, thêm đồ nội thất ảo... Giúp mặt bằng nổi bật và cho thuê nhanh hơn!
                </p>
              </div>
            </div>

            <a
              href="http://localhost:5173/ai-image-editor"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                zIndex: 1,
                padding: '8px 16px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#ec4899',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.15)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)'; }}
            >
              Trải nghiệm ngay <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </a>
          </div>
          <div className="form-section">
            <h3 className="form-section-title">Thông tin cơ bản</h3>

            <div className="form-group">
              <label className="form-label">
                <Type size={14} /> Tên bài đăng <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                className="form-input form-input--flat"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  Mặt bằng đang thuê <span className="required-mark">*</span>
                </label>
                <select
                  className="form-select-input form-select-input--flat"
                  value={spaceId}
                  onChange={(e) => setSpaceId(Number(e.target.value))}
                  required
                  disabled={isLoading || !!initialData}
                >
                  <option value="">-- Chọn mặt bằng --</option>
                  {spaceOptions.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Đơn giá chia sẻ (VNĐ) <span className="required-mark">*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    min="0"
                    className="form-input form-input--flat"
                    value={price === 0 ? '' : price}
                    onChange={e => setPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                    disabled={isLoading}
                    required
                    style={{ flex: 2 }}
                  />
                  <select
                    className="form-input form-input--flat"
                    value={priceUnit}
                    onChange={e => setPriceUnit(e.target.value)}
                    disabled={isLoading}
                    style={{ flex: 1, backgroundColor: 'var(--color-bg-secondary)' }}
                  >
                    <option value="PerHour">/ Giờ</option>
                    <option value="PerDay">/ Ngày</option>
                    <option value="PerWeek">/ Tuần</option>
                    <option value="PerMonth">/ Tháng</option>
                    <option value="PerYear">/ Năm</option>
                  </select>
                </div>
              </div>
            </div>

            {!isEditingListing && (
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Gói bài đăng <span className="required-mark">*</span>
                  </label>
                  <Select
                    value={priorityLevelId}
                    onChange={(v) => setPriorityLevelId(Number(v))}
                    disabled={isLoading}
                    placeholder="-- Chọn gói bài đăng --"
                    options={priorityLevels.map(p => ({
                      value: p.id,
                      label: `${p.name} — ${p.price.toLocaleString('vi-VN')} VNĐ${p.durationInDays ? ` (${p.durationInDays} ngày)` : ''}`
                    }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số dư ví</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="wallet-balance-display" style={{ flex: 1 }}>
                      {walletBalance === null ? 'Đang tải...' : `${walletBalance.toLocaleString('vi-VN')} VNĐ`}
                    </div>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ height: 42, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                      onClick={() => navigate('/user/wallet-deposit')}
                    >
                      <Wallet size={14} /> Nạp tiền
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label"><Users size={14} /> Số người được thuê chung tối đa</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={maxSubRenter}
                  onChange={e => setMaxSubRenter(Number(e.target.value))}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isLegalCommitted}
                    onChange={e => setIsLegalCommitted(e.target.checked)}
                    disabled={isLoading}
                  />
                  <ShieldCheck size={14} style={{ flexShrink: 0 }} />
                  <span style={{ textAlign: 'left', lineHeight: '1.4' }}>
                    Tôi cam kết khoảng thời gian được chia sẻ hoàn toàn dựa trên cơ sở pháp lý và quy định của hợp đồng. <span className="required-mark">*</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Thời gian hiệu lực bài chia sẻ</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Bắt đầu</label>
                <input
                  type="date"
                  lang="vi-VN"
                  className="form-input"
                  value={allowedStartTime}
                  onChange={e => setAllowedStartTime(e.target.value)}
                  disabled={isLoading || !!(timePolicy && timePolicy.allowedStartTime)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kết thúc</label>
                <input
                  type="date"
                  lang="vi-VN"
                  className="form-input"
                  value={allowedEndTime}
                  onChange={e => setAllowedEndTime(e.target.value)}
                  disabled={isLoading || !!(timePolicy && timePolicy.allowedEndTime)}
                  min={allowedStartTime}
                />
              </div>
            </div>
            {timePolicy && timePolicy.message && (
              <p style={{ fontSize: '13px', color: '#059669', marginTop: '8px', fontStyle: 'italic' }}>
                * {timePolicy.message}
              </p>
            )}
          </div>

          <div className="form-section">
            <h3 className="form-section-title">
              <Clock size={14} /> Khung giờ chia sẻ
            </h3>
            {availabilities.map((slot, idx) => {
              const validDays = getValidDaysOfWeek(slot.validFrom, slot.validTo);
              return (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '14px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {DAYS_OF_WEEK.map(day => {
                      const isDayValid = validDays.includes(day);
                      return (
                        <button
                          type="button" key={day}
                          className={`filter-tab ${slot.daysOfWeek.includes(day) ? 'filter-tab--active' : ''}`}
                          onClick={() => toggleDayInSlot(idx, day)}
                          disabled={isLoading || !isDayValid}
                          style={{ opacity: isDayValid ? 1 : 0.5 }}
                        >
                          {DAYS_LABEL_VI[day]}
                        </button>
                      )
                    })}
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Giờ bắt đầu</label>
                      <input type="time" className="form-input" value={slot.startTime}
                        onChange={e => updateSlotField(idx, 'startTime', e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Giờ kết thúc</label>
                      <input type="time" className="form-input" value={slot.endTime}
                        onChange={e => updateSlotField(idx, 'endTime', e.target.value)} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Áp dụng từ</label>
                      <input type="date" lang="vi-VN" className="form-input" value={slot.validFrom}
                        onChange={e => updateSlotField(idx, 'validFrom', e.target.value)} disabled={isLoading} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Áp dụng đến</label>
                      <input type="date" lang="vi-VN" className="form-input" value={slot.validTo}
                        onChange={e => updateSlotField(idx, 'validTo', e.target.value)} disabled={isLoading}
                        min={slot.validFrom} />
                    </div>
                  </div>
                  {availabilities.length > 1 && (
                    <button type="button" className="btn-ghost" style={{ color: 'var(--color-negative)' }} onClick={() => removeSlot(idx)}>
                      <Trash2 size={13} /> Xóa khung giờ này
                    </button>
                  )}
                </div>
              );
            })}
            <button type="button" className="btn-ghost" onClick={addSlot} disabled={isLoading}>
              <Plus size={14} /> Thêm khung giờ khác
            </button>
          </div>

          {/* TIỆN ÍCH MẶT BẰNG CHIA SẺ */}
          <div className="form-section">
            <h3 className="form-section-title">
              <CheckSquare size={14} /> Tiện ích mặt bằng chia sẻ
            </h3>

            {/* Dropdown chọn tiện ích */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <select
                className="form-select-input form-select-input--flat"
                style={{ flex: 1 }}
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__custom__') {
                    setShowCustomAmenityInput(true);
                  } else if (val) {
                    setAmenityItems(prev => prev.map(a => a.name === val ? { ...a, selected: true } : a));
                  }
                }}
                disabled={isLoading}
              >
                <option value="">-- Chọn tiện ích để thêm vào bài đăng --</option>
                {amenityItems.filter(a => !a.selected).map((a, i) => (
                  <option key={i} value={a.name}>+ {a.name}</option>
                ))}
                <option value="__custom__">+ Thêm tiện ích khác...</option>
              </select>
            </div>

            {/* Ô nhập tiện ích tùy chỉnh */}
            {showCustomAmenityInput && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên tiện ích tùy chỉnh..."
                  value={newAmenityName}
                  onChange={e => setNewAmenityName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newAmenityName.trim()) {
                        handleAddCustomAmenity();
                        setShowCustomAmenityInput(false);
                      }
                    }
                  }}
                  disabled={isLoading}
                  style={{ flex: 1 }}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (newAmenityName.trim()) {
                      handleAddCustomAmenity();
                      setShowCustomAmenityInput(false);
                    }
                  }}
                  disabled={isLoading || !newAmenityName.trim()}
                  style={{ height: 38, padding: '0 14px', fontSize: 13 }}
                >
                  Thêm
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowCustomAmenityInput(false)}
                  style={{ height: 38, padding: '0 12px', fontSize: 13 }}
                >
                  Hủy
                </button>
              </div>
            )}

            {/* Danh sách tiện ích đã chọn */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {amenityItems.filter(a => a.selected).length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: '4px 0' }}>
                  Chưa chọn tiện ích nào. Chọn từ danh sách thả xuống ở trên.
                </p>
              )}

              {amenityItems.filter(a => a.selected).map((item) => {
                const idx = amenityItems.findIndex(a => a.name === item.name);
                return (
                  <div
                    key={item.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      background: 'rgba(0, 212, 160, 0.04)',
                      border: '1px solid var(--color-primary)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)', flex: 1, minWidth: '140px' }}>
                      ✓ {item.name}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {/* Số lượng */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>SL:</span>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          style={{ width: '55px', padding: '2px 6px', fontSize: '12px', textAlign: 'center' }}
                          value={item.quantity}
                          onChange={e => {
                            const q = Number(e.target.value);
                            setAmenityItems(prev => prev.map((a, i) => i === idx ? { ...a, quantity: q < 1 ? 1 : q } : a));
                          }}
                          disabled={isLoading}
                        />
                      </div>

                      {/* Phụ phí */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`amenity-price-type-${idx}`}
                            checked={item.isIncluded}
                            onChange={() => {
                              setAmenityItems(prev => prev.map((a, i) => i === idx ? { ...a, isIncluded: true, price: 0 } : a));
                            }}
                            disabled={isLoading}
                          />
                          <span>Miễn phí</span>
                        </label>
                        <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`amenity-price-type-${idx}`}
                            checked={!item.isIncluded}
                            onChange={() => {
                              setAmenityItems(prev => prev.map((a, i) => i === idx ? { ...a, isIncluded: false } : a));
                            }}
                            disabled={isLoading}
                          />
                          <span>Phụ phí</span>
                        </label>
                      </div>

                      {!item.isIncluded && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            min="0"
                            placeholder="Phụ phí"
                            className="form-input"
                            style={{ width: '100px', padding: '2px 6px', fontSize: '12px' }}
                            value={item.price === 0 ? '' : item.price}
                            onChange={e => {
                              const p = Number(e.target.value);
                              setAmenityItems(prev => prev.map((a, i) => i === idx ? { ...a, price: p } : a));
                            }}
                            disabled={isLoading}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>VNĐ</span>
                        </div>
                      )}

                      <button
                        type="button"
                        className="btn-icon"
                        style={{ color: '#ef4444', padding: '4px' }}
                        onClick={() => {
                          setAmenityItems(prev => prev.map((a, i) => i === idx ? { ...a, selected: false } : a));
                        }}
                        disabled={isLoading}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NGÀNH NGHỀ ĐƯỢC PHÉP THUÊ CHUNG */}
          <div className="form-section">
            <h3 className="form-section-title">
              <Briefcase size={14} /> Ngành nghề / Mô hình phù hợp thuê chung
            </h3>

            {/* Dropdown chọn ngành nghề */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <select
                className="form-select-input form-select-input--flat"
                style={{ flex: 1 }}
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__custom__') {
                    setShowCustomCategoryInput(true);
                  } else if (val) {
                    setCategoryItems(prev => prev.map(c => c.name === val ? { ...c, selected: true } : c));
                  }
                }}
                disabled={isLoading}
              >
                <option value="">-- Chọn ngành nghề / mô hình để thêm vào bài đăng --</option>
                {categoryItems.filter(c => !c.selected).map((c, i) => (
                  <option key={i} value={c.name}>+ {c.name}</option>
                ))}
                <option value="__custom__">+ Thêm ngành nghề khác...</option>
              </select>
            </div>

            {/* Ô nhập ngành nghề tùy chỉnh */}
            {showCustomCategoryInput && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên ngành nghề tùy chỉnh..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newCategoryName.trim()) {
                        handleAddCustomCategory();
                        setShowCustomCategoryInput(false);
                      }
                    }
                  }}
                  disabled={isLoading}
                  style={{ flex: 1 }}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (newCategoryName.trim()) {
                      handleAddCustomCategory();
                      setShowCustomCategoryInput(false);
                    }
                  }}
                  disabled={isLoading || !newCategoryName.trim()}
                  style={{ height: 38, padding: '0 14px', fontSize: 13 }}
                >
                  Thêm
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowCustomCategoryInput(false)}
                  style={{ height: 38, padding: '0 12px', fontSize: 13 }}
                >
                  Hủy
                </button>
              </div>
            )}

            {/* Danh sách các ngành nghề đã chọn */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categoryItems.filter(c => c.selected).length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: '4px 0' }}>
                  Chưa chọn ngành nghề nào. Chọn từ danh sách thả xuống ở trên.
                </p>
              )}

              {categoryItems.filter(c => c.selected).map((item) => {
                const idx = categoryItems.findIndex(c => c.name === item.name);
                return (
                  <div
                    key={item.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      background: 'rgba(0, 212, 160, 0.04)',
                      border: '1px solid var(--color-primary)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)', flex: 1, minWidth: '150px' }}>
                      ✓ {item.name}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 2, minWidth: '200px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ghi chú / Yêu cầu riêng (tùy chọn)..."
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                        value={item.note}
                        onChange={e => {
                          const val = e.target.value;
                          setCategoryItems(prev => prev.map((c, i) => i === idx ? { ...c, note: val } : c));
                        }}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ color: '#ef4444', padding: '4px' }}
                        onClick={() => {
                          setCategoryItems(prev => prev.map((c, i) => i === idx ? { ...c, selected: false } : c));
                        }}
                        disabled={isLoading}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Mô tả</h3>
            <div className="form-group">
              <label className="form-label">
                Nội dung mô tả <span className="required-mark">*</span>
              </label>
              <textarea
                className="form-textarea form-textarea--flat"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {error && (
            <div className="form-error-box">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions-footer">
            <button type="button" className="btn-ghost cancel-btn" onClick={onClose} disabled={isLoading}>Hủy</button>
            <button type="submit" className="btn-primary submit-btn" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : (initialData ? 'Lưu thay đổi' : 'Đăng chia sẻ')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
