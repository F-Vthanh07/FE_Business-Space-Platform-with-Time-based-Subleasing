/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, ShieldCheck, ShieldAlert, Plus, Trash2, Clock, Type } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditingListing = !!initialData;
  const [priorityLevels, setPriorityLevels] = useState<PriorityLevel[]>([]);
  const [priorityLevelId, setPriorityLevelId] = useState<number | ''>('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

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

  const [selectedAmenities, setSelectedAmenities] = useState<Record<number, { included: boolean; price: number }>>(
    () => {
      const init: Record<number, { included: boolean; price: number }> = {};
      (initialData?.shareSpaceDetailShareSpaceAmenities || []).forEach((a: any) => {
        init[a.amenityId] = { included: a.isIncluded, price: a.price };
      });
      return init;
    }
  );

  const [selectedCategories, setSelectedCategories] = useState<Record<number, { included: boolean; note: string }>>(
    () => {
      const init: Record<number, { included: boolean; note: string }> = {};
      (initialData?.shareSpaceDetailShareSpaceCategories || []).forEach((c: any) => {
        init[c.bussinessCategoryId] = { included: true, note: c.note || '' };
      });
      return init;
    }
  );

  const [availabilities, setAvailabilities] = useState<any[]>(
    initialData?.shareSpaceDetailAvailabilitiesTimes?.length
      ? initialData.shareSpaceDetailAvailabilitiesTimes.map((slot: any) => ({
          ...slot,
          specificdate: (slot.specificdate && String(slot.specificdate).startsWith('0001')) ? '' : slot.specificdate
        }))
      : [{ daysOfWeek: [], specificdate: '', startTime: '08:00', endTime: '12:00', validFrom: getSafeDateString(null), validTo: getSafeDateString(null) }]
  );

  const toggleAmenity = (amenityId: number) => {
    setSelectedAmenities(prev => ({
      ...prev,
      [amenityId]: prev[amenityId]?.included
        ? { ...prev[amenityId], included: false }
        : { included: true, price: prev[amenityId]?.price || 0 }
    }));
  };

  const setAmenityPrice = (amenityId: number, value: number) => {
    setSelectedAmenities(prev => ({ ...prev, [amenityId]: { ...prev[amenityId], price: value } }));
  };

  const toggleCategory = (catId: number) => {
    setSelectedCategories(prev => ({
      ...prev,
      [catId]: prev[catId]?.included
        ? { ...prev[catId], included: false }
        : { included: true, note: prev[catId]?.note || '' }
    }));
  };

  const setCategoryNote = (catId: number, value: string) => {
    setSelectedCategories(prev => ({ ...prev, [catId]: { ...prev[catId], note: value } }));
  };

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
      shareSpaceDetailMaxSubRenter: Number(maxSubRenter),
      shareSpaceDetailIsOwner: false, 
      shareSpaceDetailIsLegalCommitted: isLegalCommitted,
      shareSpaceDetailShareSpaceAmenities: Object.entries(selectedAmenities)
        .filter(([, v]) => v.included)
        .map(([amenityId, v]) => ({ amenityId: Number(amenityId), isIncluded: true, price: Number(v.price) || 0 })),
      shareSpaceDetailAvailabilitiesTimes: availabilities.map(slot => ({
        ...slot,
        specificdate: (slot.specificdate && !String(slot.specificdate).startsWith('0001')) ? slot.specificdate : null
      })),
      shareSpaceDetailShareSpaceCategories: Object.entries(selectedCategories)
        .filter(([, v]) => v.included)
        .map(([catId, v]) => ({ bussinessCategoryId: Number(catId), note: v.note || '' }))
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
        } catch(e) { /* empty */ }
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
                <input
                  type="number"
                  min="0"
                  className="form-input form-input--flat"
                  value={price === 0 ? '' : price}
                  onChange={e => setPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                  disabled={isLoading}
                  required
                />
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
                      label: `${p.name} — ${p.price.toLocaleString('vi-VN')} VNĐ`
                    }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số dư ví</label>
                  <div className="wallet-balance-display">
                    {walletBalance === null ? 'Đang tải...' : `${walletBalance.toLocaleString('vi-VN')} VNĐ`}
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
                  )})}
                </div>

                <div className="form-group">
                  <label className="form-label">Ngày cụ thể (tùy chọn)</label>
                  <input
                    type="date"
                    lang="vi-VN"
                    className="form-input"
                    value={slot.specificdate || ''}
                    onChange={e => updateSlotField(idx, 'specificdate', e.target.value)}
                    disabled={isLoading}
                  />
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

          {apiAmenities.length > 0 && (
            <div className="form-section">
              <h3 className="form-section-title">Tiện ích đi kèm</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {apiAmenities.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={!!selectedAmenities[a.id]?.included}
                      onChange={() => toggleAmenity(a.id)}
                      disabled={isLoading}
                    />
                    <span style={{ flex: 1 }}>{a.name}</span>
                    {selectedAmenities[a.id]?.included && (
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        style={{ width: 120 }}
                        placeholder="Phụ phí"
                        value={selectedAmenities[a.id]?.price || 0}
                        onChange={e => setAmenityPrice(a.id, Number(e.target.value))}
                        disabled={isLoading}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {apiCategories.length > 0 && (
            <div className="form-section">
              <h3 className="form-section-title">Ngành nghề được phép thuê chung</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {apiCategories.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={!!selectedCategories[c.id]?.included}
                      onChange={() => toggleCategory(c.id)}
                      disabled={isLoading}
                    />
                    <span style={{ flex: 1 }}>{c.name}</span>
                    {selectedCategories[c.id]?.included && (
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: 200 }}
                        placeholder="Ghi chú (tùy chọn)"
                        value={selectedCategories[c.id]?.note || ''}
                        onChange={e => setCategoryNote(c.id, e.target.value)}
                        disabled={isLoading}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
